import argparse
import os


def add_neo4j_args(parser: argparse.ArgumentParser):
    """Adds Neo4j connection arguments to the parser."""
    group = parser.add_argument_group("Neo4j Connection")
    group.add_argument(
        "--uri",
        default=os.getenv("NEO4J_URI", "bolt://localhost:7687"),
        help="Neo4j connection URI (default: bolt://localhost:7687 or NEO4J_URI env var)",
    )
    group.add_argument(
        "--user",
        default=os.getenv("NEO4J_USER", "neo4j"),
        help="Neo4j username (default: neo4j or NEO4J_USER env var)",
    )
    group.add_argument(
        "--password",
        default=os.getenv("NEO4J_PASSWORD", "neo4j"),
        help="Neo4j password (default: neo4j or NEO4J_PASSWORD env var)",
    )


def add_logging_args(parser: argparse.ArgumentParser):
    """Adds logging related arguments to the parser."""
    group = parser.add_argument_group("Logging Configuration")
    group.add_argument(
        "--log-level",
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
        help="Set the console logging level (default: INFO)",
    )
    group.add_argument(
        "--log-file",
        default="debug.log",
        help="Set the file for debug logging (default: debug.log). Only DEBUG messages are written here.",
    )


def add_rag_args(parser: argparse.ArgumentParser):
    """Adds arguments related to RAG (summary and embedding) generation."""
    rag_group = parser.add_argument_group("RAG Generation (Optional)")
    rag_group.add_argument(
        "--generate-summary",
        action="store_true",
        help="Generate AI summaries and embeddings for the code graph.",
    )
    rag_group.add_argument(
        "--llm-api",
        choices=["cli", "openai", "deepseek", "ollama", "fake"],
        default="fake",
        help="The LLM API to use for summarization. (default fake)",
    )
    rag_group.add_argument(
        "--repo-root",
        default=os.getenv("PROJECT_ROOT", ""),
        help="Absolute path to the repository root (pom.xml directory). "
        "Used to name the :Project node correctly. Falls back to PROJECT_ROOT env var "
        "or auto-detection from the graph.",
    )
    rag_group.add_argument(
        "--min-cyclomatic",
        type=int,
        default=int(os.getenv("JQA_METHOD_MIN_CYCLOMATIC", "6")),
        help="Only generate method code_analysis for methods with cyclomatic complexity > MIN (default: 6). Set 0 to disable.",
    )


def add_audit_args(parser: argparse.ArgumentParser):
    """Adds the optional audit overlay inputs (all default to None = overlay disabled for that input)."""
    group = parser.add_argument_group("Audit Overlay (Optional)")
    group.add_argument(
        "--audit-dir",
        default=None,
        help="Directory with audit markdown files (compliance matrix, report FID/SF rows, EPIC backlog).",
    )
    group.add_argument(
        "--jqa-report",
        default=None,
        help="Path to jqassistant-report.xml. A missing, empty or partial report is tolerated.",
    )
    group.add_argument(
        "--audit-rule-map",
        default=None,
        help="Path to audit-rule-map.yaml mapping audit IDs to covering jQA rules (e.g. SF-14: [sam-sec:RhinoForbidden]).",
    )
    group.add_argument(
        "--jacoco-xml",
        default=None,
        help="Path to a JaCoCo XML report (e.g. target/site/jacoco/jacoco.xml) to import and bridge to methods.",
    )
    group.add_argument(
        "--surefire-dir",
        default=None,
        help="Directory with surefire/failsafe TEST-*.xml reports (e.g. target/surefire-reports).",
    )
