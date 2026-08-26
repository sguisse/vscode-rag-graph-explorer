#!/usr/bin/env python3
"""
check_graph.py — Graph health checker for jqassistant-graph-rag
================================================================
Check modes:

  java     Java type analysis, Spring stereotypes, layer labels,
           architecture constraint checks, enrichment state.

  config   Graph configuration: APOC, label/relationship inventory,
           node counts, embedding state, constraints.

  jpa      JPA/Hibernate persistence checks: @Entity, @Repository,
           relationship mappings, transaction usage.

  testing  Test coverage indicators: JUnit/Spring test classes,
           @MockBean, Testcontainers, assertion library presence.

Configuration is loaded from skill.env (same directory) and can be
overridden with CLI flags or environment variables.

Usage
-----
  python3 check_graph.py [--mode java|config|jpa|testing] [--uri bolt://...] \\
                         [--user USER] [--password PWD]

Exit codes
----------
  0  All checks passed
  1  One or more checks failed
  2  Cannot connect to Neo4j
"""

import argparse
import logging
import os
import sys
from pathlib import Path

# ── Load skill.env ─────────────────────────────────────────────────────
import sys as _sys

_sys.path.insert(0, str(Path(__file__).parent))
from _common import load_skill_env_vars  # noqa: E402

load_skill_env_vars()

# Silence the verbose Neo4j server notification messages
logging.getLogger("neo4j").setLevel(logging.ERROR)
logging.getLogger("neo4j.notifications").setLevel(logging.ERROR)

# ── ANSI colours — delegated to _common ──────────────────────────────────────
from _common import GREEN, YELLOW, RED, CYAN, BOLD, RESET  # noqa: E402


def _ok(label: str, detail: str = "") -> None:
    suffix = f"  ({detail})" if detail else ""
    print(f"  {GREEN}✅  {label}{RESET}{suffix}")


def _warn(label: str, detail: str = "") -> None:
    suffix = f"  ({detail})" if detail else ""
    print(f"  {YELLOW}⚠️   {label}{RESET}{suffix}")


def _fail(label: str, detail: str = "") -> None:
    suffix = f"  ({detail})" if detail else ""
    print(f"  {RED}❌  {label}{RESET}{suffix}")


def _info(label: str, detail: str = "") -> None:
    suffix = f"  ({detail})" if detail else ""
    print(f"  {CYAN}ℹ️   {label}{RESET}{suffix}")


def _header(title: str) -> None:
    print(f"\n{BOLD}{title}{RESET}")
    print("─" * (len(title) + 4))


def _count(session, cypher: str, param: str = "n") -> int:
    return session.run(cypher).single()[param]


# ── Neo4j connection ──────────────────────────────────────────────────────────


def connect(uri: str, user: str, password: str):
    try:
        from neo4j import GraphDatabase  # type: ignore
        import warnings as _warnings

        try:
            from neo4j import warnings as neo4j_warnings  # type: ignore

            _warnings.filterwarnings("ignore", category=neo4j_warnings.Neo4jWarning)
        except Exception:
            pass
    except ImportError:
        print(f"{RED}❌  neo4j Python driver not installed.{RESET}")
        print("    Run:  pip install neo4j")
        sys.exit(2)
    try:
        driver = GraphDatabase.driver(uri, auth=(user, password))
        with driver.session() as s:
            s.run("RETURN 1").single()
        return driver
    except Exception as exc:
        print(f"{RED}❌  Cannot connect to Neo4j at {uri}: {exc}{RESET}")
        sys.exit(2)


# ── Mode: java ────────────────────────────────────────────────────────────────


def _annot_count(session, fqn: str, node_label: str = "Class") -> int:
    """Count nodes of *node_label* annotated with the given annotation FQN."""
    return _count(
        session,
        f"MATCH (c:{node_label})-[:ANNOTATED_BY]->()-[:OF_TYPE]->(t:Type) "
        f"WHERE t.fqn = '{fqn}' RETURN count(DISTINCT c) AS n",
    )


def _pkg_class_count(session, suffix: str) -> int:
    """Count distinct classes in packages whose fqn ends with *suffix*."""
    return _count(
        session,
        "MATCH (p:Package)-[:CONTAINS]->(c:Class) " f"WHERE p.fqn ENDS WITH '{suffix}' RETURN count(DISTINCT c) AS n",
    )


def check_java(session) -> bool:
    passed = True

    # ── Java Type Analysis ────────────────────────────────────────────────────
    _header("🔍  Java Type Analysis")

    n_class = _count(session, "MATCH (c:Java:Type:Class) RETURN count(c) AS n")
    if n_class > 0:
        _ok(":Java:Type:Class nodes present", f"{n_class} classes")
    else:
        _fail(
            ":Java:Type:Class = 0  →  bytecode not scanned",
            "run: mvn -Pjqassistant jqassistant:scan jqassistant:analyze",
        )
        passed = False

    n_iface = _count(session, "MATCH (t:Java:Type:Interface) RETURN count(t) AS n")
    if n_iface > 0:
        _ok(":Interface nodes present", f"{n_iface} interfaces")
    else:
        _warn(":Interface = 0  →  no interfaces found or scan not run")

    n_enum = _count(session, "MATCH (t:Java:Type:Enum) RETURN count(t) AS n")
    if n_enum > 0:
        _ok(":Enum nodes present", f"{n_enum} enums")
    else:
        _warn(":Enum = 0  →  no enums found or scan not run")

    n_abstract = _count(
        session,
        "MATCH (c:Java:Type:Class) WHERE c.abstract = true RETURN count(c) AS n",
    )
    if n_abstract > 0:
        _ok("Abstract classes present", f"{n_abstract} abstract classes")
    else:
        _warn("Abstract class count = 0  →  no abstract classes found or scan not run")

    n_annot_type = _count(session, "MATCH (t:Java:Type:Annotation) RETURN count(t) AS n")
    if n_annot_type > 0:
        _ok(":Annotation type nodes present", f"{n_annot_type} annotation types")
    else:
        _warn(":Annotation type = 0  →  no annotation types found or scan not run")

    n_method = _count(session, "MATCH (m:Method) RETURN count(m) AS n")
    if n_method > 0:
        _ok(":Method nodes present", str(n_method))
    else:
        _warn(":Method = 0  →  may indicate incomplete scan")

    n_field = _count(session, "MATCH (f:Field) RETURN count(f) AS n")
    if n_field > 0:
        _ok(":Field nodes present", str(n_field))
    else:
        _warn(":Field = 0  →  no fields found or scan not run")

    n_pkg = _count(session, "MATCH (p:Package) RETURN count(p) AS n")
    if n_pkg > 0:
        _ok(":Package nodes present", str(n_pkg))
    else:
        _warn(":Package = 0")

    n_sf = _count(
        session,
        "MATCH (f:SourceFile) WHERE f.absolute_path ENDS WITH '.java' RETURN count(f) AS n",
    )
    if n_sf > 0:
        _ok(":SourceFile (.java) nodes present", f"{n_sf} files")
    else:
        _fail(
            ":SourceFile (.java) = 0  →  src/main/java not scanned or enrichment not run",
            "check .jqassistant.yml scan.directories and run main.py",
        )
        passed = False

    # ── Relationship Counts ───────────────────────────────────────────────────
    _header("🔗  Relationship Counts")

    n_extends = _count(session, "MATCH ()-[r:EXTENDS]->() RETURN count(r) AS n")
    if n_extends > 0:
        _ok(":EXTENDS relationships present", str(n_extends))
    else:
        _warn(":EXTENDS = 0  →  no inheritance found or scan not run")

    n_implements = _count(session, "MATCH ()-[r:IMPLEMENTS]->() RETURN count(r) AS n")
    if n_implements > 0:
        _ok(":IMPLEMENTS relationships present", str(n_implements))
    else:
        _warn(":IMPLEMENTS = 0  →  no interface implementations found or scan not run")

    n_annotated_by = _count(session, "MATCH ()-[r:ANNOTATED_BY]->() RETURN count(r) AS n")
    if n_annotated_by > 0:
        _ok(":ANNOTATED_BY relationships present", str(n_annotated_by))
    else:
        _warn(":ANNOTATED_BY = 0  →  annotation usage not scanned")

    n_inv = _count(session, "MATCH ()-[r:INVOKES]->() RETURN count(r) AS n")
    if n_inv > 0:
        _ok(":INVOKES relationships present", str(n_inv))
    else:
        _warn(":INVOKES = 0  →  call graph not available")

    n_ws = _count(session, "MATCH ()-[r:WITH_SOURCE]->() RETURN count(r) AS n")
    if n_ws > 0:
        _ok(":WITH_SOURCE relationships present", str(n_ws))
    else:
        _warn(":WITH_SOURCE = 0  →  enrichment (main.py) not yet run")

    # ── Spring Stereotype Labels ──────────────────────────────────────────────
    _header("🌱  Spring Stereotype Labels  (concept-applied)")

    for label, hint in [
        ("Controller", "@RestController / @Controller"),
        ("Service", "@Service"),
        ("Repository", "@Repository"),
    ]:
        n = _count(session, f"MATCH (c:{label}) RETURN count(c) AS n")
        if n > 0:
            _ok(f":{label} nodes present", str(n))
        else:
            _warn(f":{label} = 0  →  {hint} classes not found or concepts not applied")

    _header("🌱  Spring Stereotype Annotations  (detected via ANNOTATED_BY)")

    _CLASS_ANNOTS = {
        "@Component": "org.springframework.stereotype.Component",
        "@Configuration": "org.springframework.context.annotation.Configuration",
        "@SpringBootApplication": "org.springframework.boot.autoconfigure.SpringBootApplication",
        "@Aspect (AOP)": "org.aspectj.lang.annotation.Aspect",
    }
    for display, fqn in _CLASS_ANNOTS.items():
        n = _annot_count(session, fqn, "Class")
        if n > 0:
            _ok(f"{display} classes detected", str(n))
        else:
            _info(f"{display} = 0  →  none found or ANNOTATED_BY not scanned")

    _METHOD_ANNOTS = {
        "@EventListener": "org.springframework.context.event.EventListener",
        "@Scheduled": "org.springframework.scheduling.annotation.Scheduled",
        "@Transactional": "org.springframework.transaction.annotation.Transactional",
        "@ExceptionHandler": "org.springframework.web.bind.annotation.ExceptionHandler",
    }
    for display, fqn in _METHOD_ANNOTS.items():
        n = _annot_count(session, fqn, "Method")
        if n > 0:
            _ok(f"{display} methods detected", str(n))
        else:
            _info(f"{display} = 0  →  none found or ANNOTATED_BY not scanned")

    _header("🌱  Additional Spring Stereotypes  (generic / cross-project)")

    _GENERIC_CLASS_ANNOTS = {
        "@RestControllerAdvice": "org.springframework.web.bind.annotation.RestControllerAdvice",
        "@ControllerAdvice": "org.springframework.web.bind.annotation.ControllerAdvice",
        "@FeignClient": "org.springframework.cloud.openfeign.FeignClient",
        "@MessageMapping (WS)": "org.springframework.messaging.handler.annotation.MessageMapping",
        "@KafkaListener": "org.springframework.kafka.annotation.KafkaListener",
        "@RabbitListener": "org.springframework.amqp.rabbit.annotation.RabbitListener",
        "@EnableAsync": "org.springframework.scheduling.annotation.EnableAsync",
        "@EnableScheduling": "org.springframework.scheduling.annotation.EnableScheduling",
        "@ConfigurationProperties": "org.springframework.boot.context.properties.ConfigurationProperties",
        "@Profile": "org.springframework.context.annotation.Profile",
        "@ConditionalOnProperty": "org.springframework.boot.autoconfigure.condition.ConditionalOnProperty",
    }
    for display, fqn in _GENERIC_CLASS_ANNOTS.items():
        n = _annot_count(session, fqn, "Class")
        if n > 0:
            _ok(f"{display} classes detected", str(n))
        else:
            _info(f"{display} = 0")

    _GENERIC_METHOD_ANNOTS = {
        "@Bean": "org.springframework.context.annotation.Bean",
        "@PreAuthorize (Security)": "org.springframework.security.access.prepost.PreAuthorize",
        "@PostAuthorize (Security)": "org.springframework.security.access.prepost.PostAuthorize",
        "@Secured": "org.springframework.security.access.annotation.Secured",
        "@CircuitBreaker": "io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker",
        "@Retry": "io.github.resilience4j.retry.annotation.Retry",
        "@Timed (Micrometer)": "io.micrometer.core.annotation.Timed",
        "@Cacheable": "org.springframework.cache.annotation.Cacheable",
        "@CacheEvict": "org.springframework.cache.annotation.CacheEvict",
        "@Value": "org.springframework.beans.factory.annotation.Value",
    }
    for display, fqn in _GENERIC_METHOD_ANNOTS.items():
        n = _annot_count(session, fqn, "Method")
        if n > 0:
            _ok(f"{display} usages detected", str(n))
        else:
            _info(f"{display} = 0")

    _header("🔧  Lombok Annotations  (detected via ANNOTATED_BY)")

    _LOMBOK_ANNOTS = {
        "@Data": "lombok.Data",
        "@Builder": "lombok.Builder",
        "@NoArgsConstructor": "lombok.NoArgsConstructor",
        "@AllArgsConstructor": "lombok.AllArgsConstructor",
        "@RequiredArgsConstructor": "lombok.RequiredArgsConstructor",
        "@Slf4j": "lombok.extern.slf4j.Slf4j",
        "@EqualsAndHashCode": "lombok.EqualsAndHashCode",
    }
    for display, fqn in _LOMBOK_ANNOTS.items():
        n = _annot_count(session, fqn, "Class")
        if n > 0:
            _ok(f"{display} classes detected", str(n))
        else:
            _info(f"{display} = 0")

    _header("🩺  Code Smell Indicators")

    # Classes with no declared methods (excluding interfaces/enums/annotations)
    n_no_methods = _count(
        session,
        "MATCH (c:Class) WHERE NOT (c)-[:DECLARES]->(:Method) " "AND NOT c:Enum AND NOT c:Annotation RETURN count(c) AS n",
    )
    if n_no_methods == 0:
        _ok("All classes declare at least one method")
    else:
        _info("Classes with no declared methods", str(n_no_methods))

    # Methods never invoked (dead-method smell) — only within scanned types
    n_never_invoked = _count(
        session,
        "MATCH (m:Method) "
        "WHERE NOT ()-[:INVOKES]->(m) "
        "AND NOT m.name IN ['main', '<init>', '<clinit>'] "
        "RETURN count(m) AS n",
    )
    if n_never_invoked == 0:
        _ok("No potentially dead methods detected")
    else:
        _info("Methods never invoked (potential dead code)", str(n_never_invoked))

    # Inner / nested classes
    n_inner = _count(
        session,
        "MATCH (outer:Class)-[:DECLARES]->(inner:Class) RETURN count(inner) AS n",
    )
    if n_inner > 0:
        _info("Inner / nested classes", str(n_inner))
    else:
        _info("Inner / nested classes = 0")

    # Types depending on >20 other types (God-class smell)
    n_god = _count(
        session,
        "MATCH (c:Class)-[:DEPENDS_ON]->(dep:Type) " "WITH c, count(dep) AS deps WHERE deps > 20 " "RETURN count(c) AS n",
    )
    if n_god == 0:
        _ok("No God-class candidates (>20 type dependencies)")
    else:
        _warn(f"{n_god} class(es) depend on >20 types  →  consider refactoring")

    # ── Layer Labels (concept-applied) ────────────────────────────────────────
    _header("🗂️   Layer Labels  (concept-applied)")

    for label in ("ApiLayer", "DomainLayer", "InfrastructureLayer"):
        n = _count(session, f"MATCH (c:{label}) RETURN count(c) AS n")
        if n > 0:
            _ok(f":{label} nodes present", str(n))
        else:
            _warn(f":{label} = 0")

    # ── Package Layer Patterns (detected via fqn) ─────────────────────────────
    _header("📦  Package Layer Patterns  (detected via package fqn suffix)")

    _PKG_PATTERNS = [
        ("application layer", ".application"),
        ("config / configuration", ".config"),
        ("DTO / model", ".dto"),
        ("request / response", ".request"),
        ("mapper / adapter", ".mapper"),
        ("exception / handler", ".exception"),
        ("security", ".security"),
        ("util / helper", ".util"),
        ("event", ".event"),
        ("listener", ".listener"),
        ("scheduler / job", ".scheduler"),
        ("client / feign", ".client"),
        ("enums", ".enums"),
        ("constants", ".constant"),
        ("filter", ".filter"),
        ("interceptor", ".interceptor"),
    ]
    for display, suffix in _PKG_PATTERNS:
        n = _pkg_class_count(session, suffix)
        if n > 0:
            _ok(f"{display} classes found  (pkg *{suffix})", str(n))
        else:
            _info(f"{display} = 0  →  no package ending in '{suffix}'")

    # ── Architecture Constraint Checks ────────────────────────────────────────
    _header("⚖️   Architecture Constraint Checks")

    n_ctrl_repo = _count(
        session,
        "MATCH (ctrl:Controller)-[:DEPENDS_ON]->(repo:Repository) RETURN count(*) AS n",
    )
    if n_ctrl_repo == 0:
        _ok("No Controller → Repository direct dependencies")
    else:
        _fail(
            "Controller → Repository violations",
            f"{n_ctrl_repo} controllers bypass the service layer",
        )
        passed = False

    n_domain_infra = _count(
        session,
        "MATCH (d:DomainLayer)-[:DEPENDS_ON]->(i:InfrastructureLayer) RETURN count(*) AS n",
    )
    if n_domain_infra == 0:
        _ok("No Domain → Infrastructure direct dependencies")
    else:
        _fail("Domain → Infrastructure violations", str(n_domain_infra))
        passed = False

    n_api_infra = _count(
        session,
        "MATCH (a:ApiLayer)-[:DEPENDS_ON]->(i:InfrastructureLayer) RETURN count(*) AS n",
    )
    if n_api_infra == 0:
        _ok("No API → Infrastructure direct dependencies")
    else:
        _fail("API → Infrastructure violations", str(n_api_infra))
        passed = False

    n_cycles = _count(
        session,
        """
        MATCH (p1:Package)-[:DEPENDS_ON]->(p2:Package)-[:DEPENDS_ON]->(p1)
        WHERE p1.fqn STARTS WITH 'com.ent.smarttopic'
          AND p2.fqn STARTS WITH 'com.ent.smarttopic'
          AND p1 <> p2
        RETURN count(*) AS n
        """,
    )
    if n_cycles == 0:
        _ok("No cyclic package dependencies detected")
    else:
        _fail("Cyclic package dependencies", f"{n_cycles} cycles detected")
        passed = False

    # ── Graph Enrichment State ────────────────────────────────────────────────
    _header("🧠  Graph Enrichment State")

    n_entity = _count(session, "MATCH (n:Entity) RETURN count(n) AS n")
    if n_entity > 0:
        _ok(":Entity nodes present", str(n_entity))
    else:
        _warn(":Entity = 0  →  run main.py enrichment first")

    n_summary_emb = _count(
        session,
        "MATCH (n) WHERE n.summaryEmbedding IS NOT NULL RETURN count(n) AS n",
    )
    if n_summary_emb > 0:
        _ok("summaryEmbedding vectors present", f"{n_summary_emb} nodes")
    else:
        _warn("No summaryEmbedding vectors  →  run: python3 main.py --generate-summary")

    # ── MethodAnalyzer results check & summarize ───────────────────────────
    # Count methods that have been processed by MethodAnalyzer (code_analysis written)
    try:
        n_method_analyzed = _count(
            session,
            "MATCH (m:Method) WHERE m.code_analysis IS NOT NULL RETURN count(m) AS n",
        )
    except Exception:
        n_method_analyzed = 0

    if n_method_analyzed > 0:
        # n_method defined earlier in this function
        try:
            pct = (n_method_analyzed * 100.0) / n_method if n_method > 0 else 100.0
        except Exception:
            pct = 0.0
        _ok(
            "MethodAnalyzer results present",
            f"{n_method_analyzed}/{n_method} methods analyzed ({pct:.1f}%)",
        )

        # Summarize top classes by number of analyzed methods
        try:
            rows = session.run(
                "MATCH (c:Class)-[:DECLARES]->(m:Method) "
                "WHERE m.code_analysis IS NOT NULL "
                "RETURN c.fqn AS class, count(m) AS cnt ORDER BY cnt DESC LIMIT 10"
            )
            items = [f"{r['class']} ({r['cnt']})" for r in rows]
            if items:
                _info("Top classes by analyzed methods", "\n ".join(items))
        except Exception:
            pass
    else:
        _warn(
            "MethodAnalyzer appears not to have written 'code_analysis' properties",
            "run the MethodAnalyzer pass (check logs) or inspect MethodAnalyzer configuration",
        )

    return passed


# ── Mode: jacoco ─────────────────────────────────────────────────────────────────


def check_jacoco(session) -> bool:
    """Analyzes JaCoCo coverage statistics directly from Java nodes."""
    passed = True
    _header("📊   JaCoCo Coverage Analysis")

    # 1. Verification of enrichment
    n_enriched = _count(session, "MATCH (m:Method) WHERE m.jacoco_instruction_total IS NOT NULL RETURN count(m) AS n")
    if n_enriched == 0:
        _fail("No enriched JaCoCo data found", "Run jacoco_manager.py to link data.")
        return False
    else:
        _ok("Enriched JaCoCo data", f"{n_enriched} Java methods contain counters.")

    # 2. Global Statistics
    stats_query = """
    MATCH (m:Method)
    WHERE m.jacoco_instruction_total IS NOT NULL
    RETURN sum(m.jacoco_instruction_covered) AS covered, sum(m.jacoco_instruction_total) AS total
    """
    res = session.run(stats_query).single()
    covered, total = (res["covered"] or 0), (res["total"] or 0)

    if total > 0:
        pct = (covered / total) * 100
        color = _ok if pct > 80 else (_warn if pct > 40 else _fail)
        color(f"Global Coverage (Instructions)", f"{pct:.1f}% [{covered}/{total}]")
    else:
        _warn("Cannot calculate coverage", "Total instructions are 0.")

    # 3. Branch Coverage
    branch_query = """
    MATCH (m:Method)
    WHERE m.jacoco_branch_total IS NOT NULL
    RETURN sum(m.jacoco_branch_covered) AS covered, sum(m.jacoco_branch_total) AS total
    """
    b_res = session.run(branch_query).single()
    b_covered, b_total = (b_res["covered"] or 0), (b_res["total"] or 0)

    if b_total > 0:
        b_pct = (b_covered / b_total) * 100
        _info(f"Branch coverage (Logic)", f"{b_pct:.1f}% [{b_covered}/{b_total}]")

    # 4. Top 10 critical methods
    _header("🚨 Top 10 critical methods not covered")

    # On utilise :Type pour inclure les Class, Interfaces et Enums
    uncovered_query = """
    MATCH (t:Type)-[:DECLARES]->(m:Method)
    WHERE m.jacoco_instruction_covered = 0
      AND m.jacoco_instruction_missed > 10
    RETURN DISTINCT
        t.fqn AS typeFqn,
        m.name AS methodName,
        m.signature AS signature,
        m.jacoco_instruction_missed AS missed
    ORDER BY missed DESC
    LIMIT 10
    """

    rows = session.run(uncovered_query)
    found = False

    for r in rows:
        found = True
        type_fqn = r['typeFqn'] or ""
        method_name = r['methodName'] or ""
        missed = int(r['missed'])

        if type_fqn:
            parts = type_fqn.split('.')
            class_name = parts[-1]
            package_name = ".".join(parts[:-1]) if len(parts) > 1 else ""
            detail = f"{package_name}.{BOLD}{class_name}.{method_name}{RESET}  ({r['signature']})"
        else:
            detail = f"{method_name} ({r['signature']})"

        _fail(f"{missed:>4} instructions without test", detail)

    if not found:
        _ok("No complex method has 0% coverage")

    return passed


# ── Mode: jpa ─────────────────────────────────────────────────────────────────


def check_jpa(session) -> bool:
    """JPA / Hibernate persistence checks — generic, works on any Spring Data project."""
    passed = True

    _header("🗄️   JPA / Persistence Annotations")

    # @Entity (both javax and jakarta namespaces)
    n_entity_javax = _annot_count(session, "javax.persistence.Entity", "Class")
    n_entity_jakarta = _annot_count(session, "jakarta.persistence.Entity", "Class")
    n_entity = n_entity_javax + n_entity_jakarta
    if n_entity > 0:
        _ok("@Entity classes detected", str(n_entity))
    else:
        _info("@Entity = 0  →  no JPA entities or JPA not used")

    _JPA_CLASS = [
        ("@Table", ["javax.persistence.Table", "jakarta.persistence.Table"]),
        (
            "@Embeddable",
            ["javax.persistence.Embeddable", "jakarta.persistence.Embeddable"],
        ),
        (
            "@MappedSuperclass",
            [
                "javax.persistence.MappedSuperclass",
                "jakarta.persistence.MappedSuperclass",
            ],
        ),
    ]
    for display, fqns in _JPA_CLASS:
        n = sum(_annot_count(session, fqn, "Class") for fqn in fqns)
        if n > 0:
            _ok(f"{display} classes detected", str(n))
        else:
            _info(f"{display} = 0")

    _header("🗄️   JPA Relationship Mappings  (on fields/methods)")

    _JPA_RELS = [
        (
            "@OneToMany",
            ["javax.persistence.OneToMany", "jakarta.persistence.OneToMany"],
        ),
        (
            "@ManyToOne",
            ["javax.persistence.ManyToOne", "jakarta.persistence.ManyToOne"],
        ),
        (
            "@ManyToMany",
            ["javax.persistence.ManyToMany", "jakarta.persistence.ManyToMany"],
        ),
        ("@OneToOne", ["javax.persistence.OneToOne", "jakarta.persistence.OneToOne"]),
    ]
    for display, fqns in _JPA_RELS:
        n = sum(_annot_count(session, fqn, "Field") for fqn in fqns)
        if n > 0:
            _ok(f"{display} field mappings detected", str(n))
        else:
            _info(f"{display} = 0")

    _header("🗄️   Spring Data Repositories")

    # Spring Data repo interfaces (extend JpaRepository / CrudRepository / etc.)
    _REPO_SUPERTYPES = [
        "org.springframework.data.jpa.repository.JpaRepository",
        "org.springframework.data.repository.CrudRepository",
        "org.springframework.data.repository.PagingAndSortingRepository",
        "org.springframework.data.jpa.repository.JpaSpecificationExecutor",
    ]
    n_spring_repos = _count(
        session,
        "MATCH (i:Interface)-[:EXTENDS]->(parent:Type) "
        f"WHERE parent.fqn IN {_REPO_SUPERTYPES} "
        "RETURN count(DISTINCT i) AS n",
    )
    if n_spring_repos > 0:
        _ok("Spring Data repository interfaces detected", str(n_spring_repos))
    else:
        _info("Spring Data repository interfaces = 0")

    # @Transactional on classes (service layer boundary)
    n_tx_class = _annot_count(session, "org.springframework.transaction.annotation.Transactional", "Class")
    n_tx_method = _annot_count(session, "org.springframework.transaction.annotation.Transactional", "Method")
    if n_tx_class + n_tx_method > 0:
        _ok(
            "@Transactional usages detected",
            f"{n_tx_class} classes, {n_tx_method} methods",
        )
    else:
        _info("@Transactional = 0  →  no explicit transaction boundaries")

    # @Query (custom JPQL/HQL)
    n_query = _annot_count(session, "org.springframework.data.jpa.repository.Query", "Method")
    if n_query > 0:
        _ok("@Query (custom JPQL) methods detected", str(n_query))
    else:
        _info("@Query = 0  →  no custom JPQL queries or JPA not used")

    return passed


# ── Mode: testing ─────────────────────────────────────────────────────────────


def check_testing(session) -> bool:
    """Test coverage indicators — generic JUnit 5 / Spring Boot Test checks."""
    passed = True

    _header("🧪  JUnit 5 / Test Classes")

    # Classes annotated with @SpringBootTest
    n_sbt = _annot_count(session, "org.springframework.boot.test.context.SpringBootTest", "Class")
    if n_sbt > 0:
        _ok("@SpringBootTest classes detected", str(n_sbt))
    else:
        _warn("@SpringBootTest = 0  →  no integration tests or test classes not scanned")
        passed = False

    # @WebMvcTest
    n_wmt = _annot_count(
        session,
        "org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest",
        "Class",
    )
    if n_wmt > 0:
        _ok("@WebMvcTest classes detected", str(n_wmt))
    else:
        _info("@WebMvcTest = 0")

    # @DataJpaTest
    n_djt = _annot_count(
        session,
        "org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest",
        "Class",
    )
    if n_djt > 0:
        _ok("@DataJpaTest classes detected", str(n_djt))
    else:
        _info("@DataJpaTest = 0")

    # @ExtendWith(MockitoExtension) — pure unit tests
    n_mockito_ext = _count(
        session,
        "MATCH (c:Class)-[:ANNOTATED_BY]->(a)-[:OF_TYPE]->(t:Type) "
        "WHERE t.fqn = 'org.junit.jupiter.api.extension.ExtendWith' "
        "RETURN count(DISTINCT c) AS n",
    )
    if n_mockito_ext > 0:
        _ok("@ExtendWith classes detected (unit tests)", str(n_mockito_ext))
    else:
        _info("@ExtendWith = 0")

    _header("🧪  Test Doubles & Mocking")

    n_mockbean = _annot_count(session, "org.springframework.boot.test.mock.mockito.MockBean", "Field")
    if n_mockbean > 0:
        _ok("@MockBean usages detected", str(n_mockbean))
    else:
        _info("@MockBean = 0")

    n_mock = _annot_count(session, "org.mockito.Mock", "Field")
    if n_mock > 0:
        _ok("@Mock (Mockito) usages detected", str(n_mock))
    else:
        _info("@Mock = 0")

    n_spy = _annot_count(session, "org.mockito.Spy", "Field")
    if n_spy > 0:
        _ok("@Spy (Mockito) usages detected", str(n_spy))
    else:
        _info("@Spy = 0")

    n_captor = _annot_count(session, "org.mockito.Captor", "Field")
    if n_captor > 0:
        _ok("@Captor (Mockito) usages detected", str(n_captor))
    else:
        _info("@Captor = 0")

    _header("🧪  Testcontainers")

    n_tc = _count(
        session,
        "MATCH (c:Class)-[:ANNOTATED_BY]->(a)-[:OF_TYPE]->(t:Type) "
        "WHERE t.fqn = 'org.testcontainers.junit.jupiter.Testcontainers' "
        "RETURN count(DISTINCT c) AS n",
    )
    if n_tc > 0:
        _ok("@Testcontainers classes detected", str(n_tc))
    else:
        _info("@Testcontainers = 0  →  no container-based tests")

    _header("🧪  Test Method Counts")

    n_test_methods = _count(
        session,
        "MATCH (m:Method)-[:ANNOTATED_BY]->(a)-[:OF_TYPE]->(t:Type) "
        "WHERE t.fqn = 'org.junit.jupiter.api.Test' "
        "RETURN count(DISTINCT m) AS n",
    )
    if n_test_methods > 0:
        _ok("@Test methods detected", str(n_test_methods))
    else:
        _warn("@Test methods = 0  →  no test methods or test classes not scanned")
        passed = False

    n_param_test = _count(
        session,
        "MATCH (m:Method)-[:ANNOTATED_BY]->(a)-[:OF_TYPE]->(t:Type) "
        "WHERE t.fqn IN ["
        "  'org.junit.jupiter.params.ParameterizedTest',"
        "  'org.junit.jupiter.api.RepeatedTest'"
        "] RETURN count(DISTINCT m) AS n",
    )
    if n_param_test > 0:
        _ok("@ParameterizedTest / @RepeatedTest methods detected", str(n_param_test))
    else:
        _info("@ParameterizedTest / @RepeatedTest = 0")

    # Source files under src/test
    n_test_sf = _count(
        session,
        "MATCH (f:SourceFile) " "WHERE f.absolute_path CONTAINS '/src/test/' " "RETURN count(f) AS n",
    )
    if n_test_sf > 0:
        _ok("Test source files found", str(n_test_sf))
    else:
        _warn("No source files under src/test/  →  test directory not scanned")
        passed = False

    return passed


# ── Mode: config ──────────────────────────────────────────────────────────────


def check_config(session) -> bool:
    passed = True
    _header("⚙️   Configuration & Schema Check")

    try:
        session.run("RETURN apoc.version() AS v").single()
        _ok("APOC plugin loaded")
    except Exception:
        _warn(
            "APOC plugin not available  →  some enrichment steps will fail",
            "add apoc-core to .jqassistant.yml neo4j-plugins",
        )

    labels = [r["label"] for r in session.run("CALL db.labels() YIELD label RETURN label ORDER BY label")]
    _info(f"Labels in graph ({len(labels)} total)", ", ".join(labels))

    required_labels = {"Java", "Type", "Class", "Method", "Package", "Artifact"}
    missing = required_labels - set(labels)
    if not missing:
        _ok("All required base labels present")
    else:
        _fail(f"Missing base labels: {missing}  →  run jqassistant scan+analyze")
        passed = False

    enriched_labels = {"SourceFile", "Entity"}
    missing_enriched = enriched_labels - set(labels)
    if not missing_enriched:
        _ok("Graph-rag enrichment labels present (SourceFile, Entity)")
    else:
        _warn(f"Enrichment labels missing: {missing_enriched}  →  run main.py")

    rel_types = [
        r["relationshipType"]
        for r in session.run(
            "CALL db.relationshipTypes() YIELD relationshipType " "RETURN relationshipType ORDER BY relationshipType"
        )
    ]
    _info(f"Relationship types ({len(rel_types)} total)", ", ".join(rel_types))

    required_rels = {"INVOKES", "DECLARES", "DEPENDS_ON"}
    missing_rels = required_rels - set(rel_types)
    if not missing_rels:
        _ok("Required relationship types present")
    else:
        _warn(f"Missing relationship types: {missing_rels}")

    enrichment_rels = {"WITH_SOURCE", "SIMILAR_TO"}
    missing_enrich_rels = enrichment_rels - set(rel_types)
    if not missing_enrich_rels:
        _ok("Enrichment relationship types present (WITH_SOURCE, SIMILAR_TO)")
    else:
        _warn(f"Enrichment relationships missing: {missing_enrich_rels}  →  run main.py")

    _header("📊  Node & Relationship Counts")
    total_nodes = _count(session, "MATCH (n) RETURN count(n) AS n")
    total_rels = _count(session, "MATCH ()-[r]->() RETURN count(r) AS n")
    _info("Total nodes", str(total_nodes))
    _info("Total relationships", str(total_rels))
    if total_nodes == 0:
        _fail("Graph is empty  →  run jqassistant scan first")
        passed = False
    elif total_nodes < 100:
        _warn(f"Only {total_nodes} nodes  →  scan may be incomplete")

    _header("🔢  Embedding State")
    n_emb = _count(session, "MATCH (n) WHERE n.embedding IS NOT NULL RETURN count(n) AS n")
    if n_emb > 0:
        _ok("Embedding vectors present", f"{n_emb} nodes")
    else:
        _warn("No embeddings found  →  run: python3 main.py --generate-summary")

    n_sum = _count(session, "MATCH (n) WHERE n.summary IS NOT NULL RETURN count(n) AS n")
    if n_sum > 0:
        _ok("Summary properties present", f"{n_sum} nodes")
    else:
        _warn("No summaries found  →  run main.py --generate-summary with an LLM backend")

    _header("🔒  Constraints & Indexes")
    try:
        constraints = list(session.run("SHOW CONSTRAINTS YIELD name RETURN name"))
        indexes = list(session.run("SHOW INDEXES YIELD name RETURN name"))
        _info("Constraints defined", str(len(constraints)))
        _info("Indexes defined", str(len(indexes)))
    except Exception:
        _warn("Could not query constraints/indexes (requires Neo4j 4.4+)")

    return passed


def check_paths(session, project_name) -> bool:
    passed = True

    # ── Absolute Path Analysis ─────────────────────────────────────────────
    _header("🗃️  SourceFile nodes --> Absolute Path Analysis")
    n_paths = _count(
        session,
        f"""
        MATCH (f:SourceFile)
        WHERE (size(split(f.absolute_path, "{project_name}")) - 1 >= 2)
        RETURN count(f) AS n
        """,
    )
    if n_paths > 0:
        _warn("Total duplicate absolute paths for SourceFile nodes", str(n_paths))
    else:
        _ok("No duplicate absolute paths for SourceFile nodes")

    n_paths = _count(
        session,
        f"""
        MATCH (f:SourceFile)
        WHERE (size(split(f.absolute_path, "{project_name}")) - 1 < 2)
        RETURN count(f) AS n
        """,
    )
    _info("Total standard absolute paths for SourceFile nodes", str(n_paths))

    return passed


# ── Entry point ─────────────────────────────────────────────────────────────


def main():
    parser = argparse.ArgumentParser(
        description="Graph health checker for jqassistant-graph-rag.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--project_name",
        default=os.environ.get("PROJECT_NAME", "define project name"),
        help="Project name to search eventual mismatches paths.",
    )
    parser.add_argument(
        "--mode",
        choices=["java", "config", "jpa", "testing", "paths", "all"],
        default="all",
        help="Check mode: java | config | jpa | testing | paths | all.",
    )
    parser.add_argument("--uri", default=os.environ.get("NEO4J_URI", "bolt://localhost:7688"))
    parser.add_argument("--user", default=os.environ.get("NEO4J_USER", ""))
    parser.add_argument("--password", default=os.environ.get("NEO4J_PASSWORD", ""))
    args = parser.parse_args()

    if not args.project_name:
        print(f"{RED}❌  Project name not specified. Use --project_name or set the PROJECT_NAME environment variable.{RESET}")
        sys.exit(2)

    print(f"\n{BOLD}jqassistant-graph-rag  —  Graph Health Check  [{args.mode.upper()}]{RESET}")
    print(f"Neo4j: {args.uri}\n")

    driver = connect(args.uri, args.user, args.password)
    with driver.session() as session:
        if args.mode == "java":
            ok = check_java(session)
        elif args.mode == "jpa":
            ok = check_jpa(session)
        elif args.mode == "testing":
            ok = check_testing(session)
        elif args.mode == "paths":
            ok = check_paths(session, args.project_name)
        elif args.mode == "config":
            ok = check_config(session)
        elif args.mode == "jacoco":
            ok = check_jacoco(session)
        else:
            ok = check_config(session)
            ok = check_java(session)
            ok = check_paths(session, args.project_name)
            ok = check_jacoco(session)
            ok = check_testing(session)
            ok = check_jpa(session)

    driver.close()

    print()
    if ok:
        print(f"{GREEN}{BOLD}✅  All checks passed.{RESET}\n")
        sys.exit(0)
    else:
        print(f"{RED}{BOLD}❌  One or more checks failed — review the output above.{RESET}\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
