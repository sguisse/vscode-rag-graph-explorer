import argparse
import json
import sys
import shutil
from discovery import PathFilter, WorkspaceScanner
from graph_engine import GraphEngine
from orchestrator import ParallelOrchestrator
from reconciler import PolyglotReconciler
from utils import debug, info, warn, error, success, configure_logger

def main():
    parser = argparse.ArgumentParser(description="Graph RAG Explorer - Core Engine Entrypoint")
    parser.add_argument("--workspace", required=True)
    parser.add_argument("--output", default=".graph-rag-explorer/code-graph")
    args = parser.parse_args()

    try:
        config = json.loads(sys.stdin.read())
    except Exception:
        config = {}

    configure_logger(
        workspace_root=args.workspace,
        enabled=config.get("logFileEnabled", True),
        max_size=config.get("logFileMaxSize", 5),
        retention=config.get("logFileMaxCountRetension", 5)
    )

    info("Point d'entrée exécutable du moteur Graph RAG activé.", component="Main")
    debug(f"Arguments reçus -> Workspace: {args.workspace} | Target: {args.output}", component="Main")
    debug(f"Configuration injectée par VS Code : {json.dumps(config)}", component="Main")

    # Mappage strict des nouvelles clés de configuration en expressions régulières (Regex)
    path_filter = PathFilter(
        include_paths=config.get("includePathsRegex", ".*"),
        exclude_paths=config.get("excludePathsRegex", ""),
        include_exts=config.get("includeExtensionsRegex", ""),
        exclude_exts=config.get("excludeExtensionsRegex", "")
    )

    scanner = WorkspaceScanner(args.workspace, path_filter)
    graph_engine = GraphEngine()
    orchestrator = ParallelOrchestrator(graph_engine)

    partitions = scanner.scan_and_partition()
    if partitions.get("JAVA") and not shutil.which("mvn"):
        warn("Maven (mvn) absent des variables d'environnement locales.", component="Main")
    if partitions.get("TS_JS") and not shutil.which("npm"):
        warn("npm/NodeJS absent des variables d'environnement locales.", component="Main")

    orchestrator.execute_analysis_pool(partitions)
    PolyglotReconciler.reconcile_api_routes(graph_engine)
    graph_engine.save_to_workspace(args.output)
    success("Processus d'indexation structurelle terminé.", component="Main")

if __name__ == "__main__":
    main()
