#!/usr/bin/env python3
"""
generate_mermaid.py — Stable Mermaid DSL generator from jQAssistant Cypher JSON output.

Replaces fragile Cypher string concatenation (id(n)-based, no character escaping).
Produces validated Mermaid DSL with:
- Sanitized node IDs derived from names (not volatile Neo4j internal ids).
- Escaped Mermaid-invalid characters in node labels.
- Supported diagram types: component (graph TD), sequence.

Usage:
    python generate_mermaid.py --input result.json --diagram-type component \
        --output documentation/technical/arc42/05_building_block_view.md

Input JSON format (from Cypher RETURN b.name AS source, dep.name AS target):
    [{"source": "OrderService", "target": "PaymentService", "rel_type": "DEPENDS_ON"}, ...]
"""

import argparse
import json
import re
import sys
from pathlib import Path


_MERMAID_INVALID = re.compile(r'[\[\](){}<>:;,|&\-\+\*\/\\"\'\`\n\r]')


def sanitize_id(name: str) -> str:
    """Produce a stable Mermaid node ID from a node name."""
    if not name:
        return "unknown"
    return re.sub(r"[^a-zA-Z0-9_]", "_", name)


def sanitize_label(name: str) -> str:
    """Escape characters that would break Mermaid label syntax."""
    if not name:
        return "unknown"
    return _MERMAID_INVALID.sub("_", name)


def build_component_diagram(edges: list[dict]) -> str:
    """Build a Mermaid graph TD diagram from edge list."""
    nodes: set[str] = set()
    lines: list[str] = ["graph TD"]

    for edge in edges:
        source = edge.get("source") or edge.get("component")
        target = edge.get("target") or edge.get("dependency")

        if not source:
            continue

        src_id = sanitize_id(source)
        src_label = sanitize_label(source)
        nodes.add(f'  {src_id}["{src_label}"]')

        if target:
            tgt_id = sanitize_id(target)
            tgt_label = sanitize_label(target)
            nodes.add(f'  {tgt_id}["{tgt_label}"]')
            lines.append(f"  {src_id} --> {tgt_id}")

    result = [lines[0]] + sorted(nodes) + lines[1:]
    return "\n".join(result)


def build_sequence_diagram(edges: list[dict]) -> str:
    """Build a Mermaid sequenceDiagram from edge list."""
    lines = ["sequenceDiagram"]
    for edge in edges:
        source = sanitize_label(edge.get("source", ""))
        target = sanitize_label(edge.get("target", ""))
        label = sanitize_label(edge.get("rel_type", "calls"))
        if source and target:
            lines.append(f"  {source}->>{target}: {label}")
    return "\n".join(lines)


BUILDERS = {
    "component": build_component_diagram,
    "sequence": build_sequence_diagram,
}


def wrap_in_markdown(diagram_type: str, dsl: str) -> str:
    return f"```mermaid\n{dsl}\n```\n"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate validated Mermaid DSL from Cypher JSON output."
    )
    parser.add_argument(
        "--input", required=True, help="Path to JSON file from Cypher query."
    )
    parser.add_argument(
        "--diagram-type",
        required=True,
        choices=list(BUILDERS.keys()),
        help="Diagram type to generate.",
    )
    parser.add_argument("--output", required=True, help="Output Markdown file path.")
    parser.add_argument(
        "--append",
        action="store_true",
        help="Append the diagram block to an existing file instead of overwriting.",
    )
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"❌  ERROR: Input file not found: {input_path}", file=sys.stderr)
        return 1

    with input_path.open(encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, list):
        print("❌  ERROR: Input JSON must be a list of edge objects.", file=sys.stderr)
        return 1

    builder = BUILDERS[args.diagram_type]
    dsl = builder(data)
    markdown_block = wrap_in_markdown(args.diagram_type, dsl)

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    mode = "a" if args.append else "w"
    with output_path.open(mode, encoding="utf-8") as f:
        f.write(markdown_block)

    print(f"✅ Mermaid diagram written to {output_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
