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
from pathlib import Path
from typing import Any
from _common import check_icon, check_result


def _ensure_ssl(py: Path) -> None:
    """Try to configure certifi as the SSL CA bundle."""
    try:
        result = subprocess.run([str(py), "-m", "certifi"], capture_output=True, text=True, check=True)
        cert_path = result.stdout.strip()
        if cert_path:
            os.environ["SSL_CERT_FILE"] = cert_path
            os.environ["REQUESTS_CA_BUNDLE"] = cert_path
            print(f"  SSL_CERT_FILE → {cert_path}")
    except Exception:
        pass


def _check_git_lfs() -> bool:
    """Return True if git-lfs is installed."""
    try:
        subprocess.run(["git", "lfs", "version"], capture_output=True, check=True)
        return True
    except (FileNotFoundError, subprocess.CalledProcessError):
        return False


def download_via_sentence_transformers(py: Path, model_dir: Path, hf_repo: str) -> bool:
    """Download model using the sentence_transformers library (preferred, no git-lfs needed)."""
    print(f"\n▶  Downloading via sentence_transformers …")
    script = (
        "from sentence_transformers import SentenceTransformer\n"
        f"m = SentenceTransformer('{hf_repo}')\n"
        f"m.save('{model_dir}')\n"
        f"print('✅ Model saved to {model_dir}')\n"
    )
    result = subprocess.run([str(py), "-c", script])
    return result.returncode == 0


def download_via_git_clone(model_dir: Path, hf_repo: str) -> bool:
    """Download model via git-lfs clone (fallback)."""
    print(f"\n▶  Downloading via git clone + lfs …")
    if not _check_git_lfs():
        print(f"  ⚠️  git-lfs not found. Installing via Homebrew …")
        brew = subprocess.run(["brew", "install", "git-lfs"])
        if brew.returncode != 0:
            print(f"  ❌  brew install git-lfs failed. Install it manually.")
            return False
        subprocess.run(["git", "lfs", "install"])

    model_dir.parent.mkdir(parents=True, exist_ok=True)
    clone_url = f"https://huggingface.co/{hf_repo}"
    clone_result = subprocess.run(["git", "clone", clone_url, str(model_dir)])
    if clone_result.returncode != 0:
        return False
    subprocess.run(["git", "lfs", "fetch", "--all"], cwd=str(model_dir))
    subprocess.run(["git", "lfs", "pull"], cwd=str(model_dir))
    return True


def download_graph_rag_llm_model(python: Path, graph_rag_dir: Path) -> tuple[str, str]:
    model_uri = os.environ.get("SENTENCE_TRANSFORMER_LOCAL_MODEL", "models/all-MiniLM-L6-v2")
    model_dest_path = graph_rag_dir / model_uri
    hugging_face_repo = os.environ.get("SENTENCE_TRANSFORMER_HF_REPO", "sentence-transformers/all-MiniLM-L6-v2")

    # Ensure SSL certs are configured for subprocesses (e.g. git clone or python requests)
    _ensure_ssl(python)

    # Try via sentence_transformers first
    # ok = download_via_sentence_transformers(python, model_dest_path, hugging_face_repo). --- IGNORE ---
    ok = False
    if not ok:
        print(f"\n  ⚠️  sentence_transformers download failed — trying git clone …")
        ok = download_via_git_clone(model_dest_path, hugging_face_repo)

    if ok and model_dest_path.exists() and any(model_dest_path.iterdir()):
        return "OK", f"Model ready at {model_dest_path}."
    else:
        return (
            "ERROR",
            f"Download failed. Check network/SSL and retry.\n  Tip: export SSL_CERT_FILE=$(python3 -m certifi) and retry.",
        )
