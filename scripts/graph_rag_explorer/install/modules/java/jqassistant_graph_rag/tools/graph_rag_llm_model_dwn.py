#!/usr/bin/env python3
"""
graph_rag_llm_model_dwn.py — Download / cache the sentence-transformer model locally
=================================================================================
Downloads the configured sentence-transformer model from HuggingFace into
a local directory so the MCP server and enrichment pipeline can run offline
(avoids SSL/corporate-network failures on every start).

"""

import os
import subprocess
import sys
import time
from pathlib import Path
from core.utils import info

LLM_MODEL_SIZE = 2 * 1024 * 1024 * 1024  # 2 GB in bytes


def _get_folder_size(path: Path) -> int:
    """Calculates total size of all files inside a directory."""
    if not path.exists():
        return 0
    total_size = 0
    for file in path.rglob("*"):
        if file.is_file():
            total_size += file.stat().st_size
    return total_size


def _download_progress_bar(download_target_path: Path, last_reported_percent: int) -> int:
    """Calculates progress based on folder size vs LLM_MODEL_SIZE and logs progress."""
    current_size = _get_folder_size(download_target_path)
    percent = min(100, int(current_size * 100 / LLM_MODEL_SIZE))

    if percent - last_reported_percent >= 5 or (percent == 100 and last_reported_percent < 100):
        info(f"Downloading graph RAG LLM model: {percent}%", component="graph_rag_llm_model_dwn")
        return percent

    return last_reported_percent


def download_graph_rag_llm_model(download_url: str, downloadTargetPath: Path) -> None:
    """
    Downloads a model to the specified target path with progress monitoring.
    """
    git_url = download_url if download_url.endswith(".git") else f"{download_url}.git"
    env = os.environ.copy()
    env["GIT_TERMINAL_PROMPT"] = "0"

    cmd = ["git", "clone", "--depth", "1", git_url, str(downloadTargetPath)]

    process = subprocess.Popen(cmd, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

    last_reported_percent = 0
    while process.poll() is None:
        last_reported_percent = _download_progress_bar(downloadTargetPath, last_reported_percent)
        time.sleep(1)

    _, stderr = process.communicate()

    if process.returncode != 0:
        raise RuntimeError(
            f"Failed to download model from {download_url}.\n"
            f"Git Error: {stderr.strip()}"
        )

    # Ensure 100% progress log upon completion
    _download_progress_bar(downloadTargetPath, 95)
