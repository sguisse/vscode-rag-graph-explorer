import json
import os
import sys
from typing import Dict, Any, Optional
from concurrent.futures import ThreadPoolExecutor

current_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, os.path.abspath(os.path.join(current_dir, "..")))
sys.path.insert(0, os.path.abspath(os.path.join(current_dir, "..", "..")))

from analyser.tools.neo4j.neo4j_client import Neo4jClient
from analyser.registry import AnalyserRegistry
from core.VsCodeSettings_gen import vsCodeSettings
from core.context import EnvironmentContext
from analyser.base import BaseAnalyser
from core.utils import info, success, error
from analyser.tools.neo4j.neo4j_statistics_extractor import build_statistics

def run_analysis_pipeline():
    info("Launching background data parsing threads targeting embedded storage context...", component="AnalyserRunner")

    context = EnvironmentContext()

    neo4j_client = Neo4jClient(
        uri=vsCodeSettings.graphRagExplorer.neo4j.uri,
        auth=(vsCodeSettings.graphRagExplorer.neo4j.username, vsCodeSettings.graphRagExplorer.neo4j.password)
    )
    info(f"Neo4j connection established: {neo4j_client._connected}", component="AnalyserRunner")

    analyser_dir = os.path.dirname(os.path.abspath(__file__))
    AnalyserRegistry.discover_and_load_analysers(analyser_dir)
    analysers : Dict[str, BaseAnalyser] = {cls(context).name: cls(context) for cls in AnalyserRegistry.get_analysers()}

    info(f"Discovered these {len(analysers)} Analyzers (Registered) :", component="AnalyserRunner")
    for name in sorted(analysers):
        info(f"   - {name}", component="AnalyserRunner")

    info(f"Spawning {len(analysers)} background workers to feed the knowledge graph container context.", component="AnalyserRunner")
    with ThreadPoolExecutor(max_workers=len(analysers)) as executor:
        futures = []
        for cls in analysers:
            analyzer = analysers[cls]
            info(f"Allocating execution thread targeting analytics worker node: [{analyzer.name}]", component="AnalyserRunner")
            futures.append(executor.submit(analyzer.run_analysis, neo4j_client))

        for future in futures:
            try:
                future.result()
            except Exception as e:
                error(f"Background thread ingestion crash details: {e}", component="AnalyserRunner")

    try:
        build_statistics(neo4j_client, vsCodeSettings.workspaceRoot)
    except Exception as err:
        error(f"Failed executing database node summary verification query: {err}", component="AnalyserRunner")

    neo4j_client.close()
