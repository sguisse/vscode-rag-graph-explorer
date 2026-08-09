import os
import sys
from typing import Dict, List, Tuple
from concurrent.futures import ThreadPoolExecutor

current_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, os.path.abspath(os.path.join(current_dir, "..")))
sys.path.insert(0, os.path.abspath(os.path.join(current_dir, "..", "..")))

from analyser.tools.neo4j.neo4j_client import Neo4jClient
from analyser.registry import AnalyserRegistry
from core.VsCodeSettings_gen import vsCodeSettings
from core.context import EnvironmentContext
from analyser.base import BaseAnalyser
from core.utils import info, error
from analyser.tools.neo4j.neo4j_statistics_extractor import build_statistics


def initialize_analysers() -> Tuple[Neo4jClient, Dict[str, BaseAnalyser], List[str]]:
    """Establishes Neo4j connection and loads registered analysers."""
    info("Launching background data parsing threads targeting embedded storage context...", component="AnalyserRunner")

    context = EnvironmentContext()
    neo4j_client = Neo4jClient(
        uri=vsCodeSettings.graphRagExplorer.neo4j.uri,
        auth=(vsCodeSettings.graphRagExplorer.neo4j.username, vsCodeSettings.graphRagExplorer.neo4j.password)
    )
    info(f"Neo4j connection established: {neo4j_client._connected}", component="AnalyserRunner")

    analyser_dir = os.path.dirname(os.path.abspath(__file__))
    AnalyserRegistry.discover_and_load_analysers(analyser_dir)
    analysers: Dict[str, BaseAnalyser] = {cls(context).name: cls(context) for cls in AnalyserRegistry.get_analysers()}

    sorted_names = sorted(analysers)

    info(f"Discovered these {len(analysers)} Analyzers (Registered) :", component="AnalyserRunner")
    for name in sorted_names:
        info(f"   - {name}", component="AnalyserRunner")

    return neo4j_client, analysers, sorted_names


def execute_single_analyser(analyzer: BaseAnalyser, neo4j_client: Neo4jClient) -> None:
    """Executes a single analyser instance with error handling."""
    info(f"Allocating execution thread targeting analytics worker node: [{analyzer.name}]", component="AnalyserRunner")
    try:
        analyzer.run_analysis(neo4j_client)
    except Exception as e:
        error(f"Background thread ingestion crash details: {e}", component="AnalyserRunner")


def finalize_analysis(neo4j_client: Neo4jClient) -> None:
    """Builds statistics and closes database connection."""
    try:
        build_statistics(neo4j_client, vsCodeSettings.workspaceRoot)
    except Exception as err:
        error(f"Failed executing database node summary verification query: {err}", component="AnalyserRunner")

    neo4j_client.close()


def run_analysis_pipeline_concurrent() -> None:
    """Executes all analysers concurrently using a thread pool."""
    neo4j_client, analysers, sorted_names = initialize_analysers()

    info(f"Spawning {len(analysers)} background workers to feed the knowledge graph container context.", component="AnalyserRunner")
    with ThreadPoolExecutor(max_workers=len(analysers)) as executor:
        futures = [
            executor.submit(execute_single_analyser, analysers[name], neo4j_client)
            for name in sorted_names
        ]
        for future in futures:
            future.result()

    finalize_analysis(neo4j_client)


def run_analysis_pipeline_sequential() -> None:
    """Executes all analysers sequentially in sorted order."""
    neo4j_client, analysers, sorted_names = initialize_analysers()

    info(f"Executing {len(analysers)} workers sequentially in sorted order.", component="AnalyserRunner")
    for name in sorted_names:
        execute_single_analyser(analysers[name], neo4j_client)

    finalize_analysis(neo4j_client)


def run_analysis_pipeline() -> None:
    """Default entry point."""
    run_analysis_pipeline_sequential()
