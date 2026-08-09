#!/usr/bin/env python3
"""jacoco_importer.py
JaCoCo XML -> Neo4j importer that mirrors the kontext-e jqassistant JaCoCo
scanner plugin (JacocoScannerPlugin.java).

Usage:
  python3 jacoco_importer.py --xml target/site/jacoco/jacoco.xml --uri bolt://localhost:7688

Node structure matches the kontext-e plugin:
  :Jacoco:Class  { name (slash-format), fqn (dot-format), package, sourcefile }
  :Jacoco:Method { name, signature (Java-format via SignatureHelper), line, sourcefile }
  :Jacoco:Counter{ type, missed, covered }

Method signatures are stored in the same format produced by
``SignatureHelper.getMethodSignature(name, desc)`` from the jqassistant Java
plugin, e.g. ``"void <init>(java.lang.String, int)"``.  This allows
``jacoco_manager.bridge_jacoco_to_methods()`` to match them against :Method
nodes using an exact signature comparison (``j.signature = m.signature``),
exactly as the kontext-e Cypher rules do.
"""

import argparse
import logging
import sys
from xml.etree import ElementTree as ET
from pathlib import Path

from neo4j_manager import Neo4jManager

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# JVM descriptor → Java type name conversion
# Mirrors org.objectweb.asm.Type logic used by SignatureHelper in jqassistant
# ---------------------------------------------------------------------------

_JVM_PRIMITIVES: dict[str, str] = {
    'B': 'byte',
    'C': 'char',
    'D': 'double',
    'F': 'float',
    'I': 'int',
    'J': 'long',
    'S': 'short',
    'V': 'void',
    'Z': 'boolean',
}


def _parse_jvm_type(descriptor: str, pos: int) -> tuple[str, int]:
    """Parse one JVM type descriptor token starting at *pos*.

    Returns ``(java_type_name, next_pos)`` where *next_pos* is the index
    immediately after the consumed token.
    """
    c = descriptor[pos]
    if c in _JVM_PRIMITIVES:
        return _JVM_PRIMITIVES[c], pos + 1
    if c == 'L':
        end = descriptor.index(';', pos)
        return descriptor[pos + 1 : end].replace('/', '.'), end + 1
    if c == '[':
        inner, next_pos = _parse_jvm_type(descriptor, pos + 1)
        return inner + '[]', next_pos
    # Unknown token — advance by 1 to avoid infinite loop
    return descriptor[pos], pos + 1


def jvm_to_java_signature(method_name: str, jvm_desc: str) -> str:
    """Convert a JVM method descriptor to a jqassistant-compatible Java signature.

    Mirrors ``SignatureHelper.getMethodSignature(name, desc)`` so that Jacoco
    method nodes carry the exact same ``signature`` value as code :Method nodes
    scanned by the jQAssistant Java plugin.

    Examples::

        jvm_to_java_signature("<init>", "(Ljava/lang/String;I)V")
        # -> "void <init>(java.lang.String, int)"

        jvm_to_java_signature("getName", "()Ljava/lang/String;")
        # -> "java.lang.String getName()"
    """
    if not jvm_desc or '(' not in jvm_desc:
        return method_name
    try:
        paren_close = jvm_desc.rindex(')')
        params_str = jvm_desc[1:paren_close]  # strip leading '('
        return_str = jvm_desc[paren_close + 1 :]

        return_type, _ = _parse_jvm_type(return_str, 0) if return_str else ('void', 0)

        params: list[str] = []
        pos = 0
        while pos < len(params_str):
            java_type, pos = _parse_jvm_type(params_str, pos)
            params.append(java_type)

        return f"{return_type} {method_name}({', '.join(params)})"
    except Exception:
        logger.debug("Cannot parse JVM descriptor '%s' for '%s' — keeping raw form", jvm_desc, method_name)
        return f"{method_name}{jvm_desc}"


def parse_args():
    p = argparse.ArgumentParser(description="Import JaCoCo XML report into Neo4j as Jacoco nodes")
    p.add_argument("--xml", required=False, default="target/site/jacoco/jacoco.xml", help="Path to jacoco XML report")
    p.add_argument("--uri", default="bolt://localhost:7688", help="Neo4j Bolt URI")
    p.add_argument("--user", default="", help="Neo4j user")
    p.add_argument("--password", default="", help="Neo4j password")
    return p.parse_args()


def import_jacoco(xml_path: str, neo4j_uri: str, user: str, password: str):
    xml_file = Path(xml_path)
    if not xml_file.exists():
        logger.error("Jacoco XML file not found: %s", xml_file)
        sys.exit(2)

    tree = ET.parse(str(xml_file))
    root = tree.getroot()

    # JaCoCo XML layout: report/package/class/method/counter
    with Neo4jManager(neo4j_uri, user, password) as nm:
        for pkg in root.findall("package"):
            pkg_name = pkg.get("name") or ""
            for cls in pkg.findall("class"):
                # cls_name  — slash-separated bytecode name: com/example/MyClass
                # cls_fqn   — dot-separated FQN:             com.example.MyClass
                # (mirrors JacocoScannerPlugin.java: setFullQualifiedName(name.replaceAll("/", ".")))
                cls_name = cls.get("name") or ""
                cls_fqn = cls_name.replace('/', '.')
                sourcefile = cls.get("sourcefilename")

                cy = "MERGE (jc:Jacoco:Class {name: $name}) " "SET jc.fqn = $fqn, jc.package = $pkg, jc.sourcefile = $sf"
                nm.execute_write_query(
                    cy,
                    params={
                        "name": cls_name,
                        "fqn": cls_fqn,
                        "pkg": pkg_name,
                        "sf": sourcefile,
                    },
                )

                for method in cls.findall("method"):
                    m_name = method.get("name") or ""
                    m_desc = method.get("desc") or ""
                    m_line = method.get("line")

                    # Convert JVM descriptor to Java-format signature, mirroring:
                    #   SignatureHelper.getMethodSignature(name, desc)
                    # so that j.signature matches m.signature on :Method nodes
                    # scanned by the jQAssistant Java plugin (exact equality).
                    signature = jvm_to_java_signature(m_name, m_desc)

                    cy_m = "MERGE (jm:Jacoco:Method {name: $mname, signature: $sig}) " "SET jm.line = $line, jm.sourcefile = $sf"
                    nm.execute_write_query(
                        cy_m,
                        params={
                            "mname": m_name,
                            "sig": signature,
                            "line": m_line,
                            "sf": sourcefile,
                        },
                    )

                    # Link class -> method (separate MATCH to avoid CartesianProduct warning)
                    cy_link = (
                        "MATCH (jc:Jacoco:Class {name: $cname})\n"
                        "MATCH (jm:Jacoco:Method {name: $mname, signature: $sig})\n"
                        "MERGE (jc)-[:DECLARES]->(jm)"
                    )
                    nm.execute_write_query(
                        cy_link,
                        params={
                            "cname": cls_name,
                            "mname": m_name,
                            "sig": signature,
                        },
                    )

                    for counter in method.findall("counter"):
                        ctype = counter.get("type")
                        missed = int(counter.get("missed") or 0)
                        covered = int(counter.get("covered") or 0)

                        cy_cnt = "MERGE (c:Jacoco:Counter {type: $type, missed: $missed, covered: $covered})"
                        nm.execute_write_query(
                            cy_cnt,
                            params={
                                "type": ctype,
                                "missed": missed,
                                "covered": covered,
                            },
                        )

                        # Link method -> counter (separate MATCH to avoid CartesianProduct warning)
                        cy_jmc = (
                            "MATCH (jm:Jacoco:Method {name: $mname, signature: $sig})\n"
                            "MATCH (c:Jacoco:Counter {type: $type, missed: $missed, covered: $covered})\n"
                            "MERGE (jm)-[:HAS_COUNTER]->(c)"
                        )
                        nm.execute_write_query(
                            cy_jmc,
                            params={
                                "mname": m_name,
                                "sig": signature,
                                "type": ctype,
                                "missed": missed,
                                "covered": covered,
                            },
                        )

        logger.info("Jacoco import complete: %s", xml_file)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    args = parse_args()
    import_jacoco(args.xml, args.uri, args.user, args.password)
