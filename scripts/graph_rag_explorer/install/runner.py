import os
import sys

current_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, os.path.abspath(os.path.join(current_dir, "..")))
sys.path.insert(0, os.path.abspath(os.path.join(current_dir, "..", "..")))

from core.installer.runner import run_installation_pipeline as core_run_installation_pipeline
from graph_rag_explorer.install.context import GraphRagExplorerContext, GRAPH_RAG_EXPLORER_TOOL_NAME


def run_installation_pipeline():
    install_dir = os.path.dirname(os.path.abspath(__file__))
    context = GraphRagExplorerContext(tool_name=GRAPH_RAG_EXPLORER_TOOL_NAME)
    core_run_installation_pipeline(
        tool_name=GRAPH_RAG_EXPLORER_TOOL_NAME,
        install_dir=install_dir,
        context=context,
    )