import argparse
import sys
import json
from orchestrator import ParallelOrchestrator
from utils import configure_logger

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--workspace", required=True)
    parser.add_argument("--output", required=False, default=".graph-rag-explorer/code-graph")
    parser.add_argument("--file", required=False) # Toléré pour le mode Delta Scan
    args = parser.parse_args()

    try: config = json.loads(sys.stdin.read())
    except Exception: config = {}

    configure_logger(
        workspace_root=args.workspace,
        enabled=config.get("logFileEnabled", True),
        max_size=config.get("logFileMaxSize", 5),
        retention=config.get("logFileMaxCountRetension", 5)
    )

    # Transmission du dossier de sortie (args.output) à l'orchestrateur
    orchestrator = ParallelOrchestrator(args.workspace, args.output, config)
    orchestrator.execute_analysis_pool()

if __name__ == "__main__":
    main()
