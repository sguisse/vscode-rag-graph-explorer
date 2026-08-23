import argparse
import logging
import sys
from pathlib import Path

from input_params import add_neo4j_args, add_logging_args, add_rag_args
from neo4j_manager import Neo4jManager
from log_manager import init_logging
from graph_orchestrator import GraphOrchestrator
from rag_orchestrator import RagOrchestrator

logger = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(
        description="jQAssistant Graph RAG enrichment and analysis tool."
    )

    add_neo4j_args(parser)
    add_logging_args(parser)
    add_rag_args(parser)

    args = parser.parse_args()

    init_logging(log_file=args.log_file, console_level=args.log_level.upper())

    logger.info("🚀 Starting main.py execution...")
    logger.info(
        f"Parsed arguments: generate_summary={args.generate_summary}, "
        f"llm_api='{args.llm_api}', repo_root='{args.repo_root}', uri='{args.uri}', user='{args.user}'"
    )

    uri, user, password = args.uri, args.user, args.password

    try:
        with Neo4jManager(uri=uri, user=user, password=password) as neo4j_mgr:
            if not neo4j_mgr.check_connection():
                logger.critical("❌ Failed to connect to Neo4j. Exiting.")
                sys.exit(1)

            logger.info("✅ Neo4j connection verified.")

            graph_orchestrator = None
            try:
                logger.info("▶ Initializing GraphOrchestrator...")
                graph_orchestrator = GraphOrchestrator(
                    neo4j_mgr, repo_root=args.repo_root
                )
                logger.info("▶ Running GraphOrchestrator enrichment passes...")
                graph_orchestrator.run_enrichment_passes()
                logger.info("✅ GraphOrchestrator enrichment passes completed.")
            except Exception as e:
                logger.error(f"⚠️ Exception during graph enrichment passes: {e}", exc_info=True)

            project_path = getattr(graph_orchestrator, "project_path", None)
            if not project_path:
                logger.warning("⚠️ graph_orchestrator.project_path is None or unset. Resolving fallback path...")
                project_path = Path(args.repo_root).resolve() if args.repo_root else Path.cwd().resolve()
                if graph_orchestrator:
                    graph_orchestrator.project_path = project_path

            logger.info(f"📍 Confirmed project path: {project_path}")

            if args.generate_summary:
                logger.info("▶ Flag --generate-summary is TRUE. Initializing RagOrchestrator...")
                try:
                    rag_orchestrator = RagOrchestrator(
                        neo4j_mgr,
                        project_path,
                        args.llm_api,
                        min_cyclomatic=args.min_cyclomatic,
                    )
                    logger.info("▶ Calling RagOrchestrator.run_rag_passes()...")
                    rag_orchestrator.run_rag_passes()
                    logger.info("✅ RagOrchestrator passes completed.")
                except Exception as e:
                    logger.critical(f"❌ Failed during RagOrchestrator execution: {e}", exc_info=True)
                    sys.exit(1)
            else:
                logger.info("ℹ️ Flag --generate-summary is FALSE. Skipping RAG summarization passes.")

    except ValueError as e:
        logger.error(f"Configuration Error: {e}")
        sys.exit(1)
    except Exception as e:
        logger.critical(f"An unexpected error occurred: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
