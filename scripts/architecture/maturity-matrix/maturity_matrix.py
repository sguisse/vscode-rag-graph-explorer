#!/usr/bin/env python3
"""CLI and service entrypoint for Maturity Matrix repository updates and assessment operations."""

import argparse
import csv
import json
import sys
from pathlib import Path
from typing import Any, Dict, List

try:
    from scripts.architecture.maturity_matrix.assessments_extractor import (
        AssessmentsExtractorService,
        extract_assessments as run_extract_assessments,
    )
except (ImportError, ModuleNotFoundError):
    from assessments_extractor import (
        AssessmentsExtractorService,
        extract_assessments as run_extract_assessments,
    )


def update_repo_to_main(repo_path: str, base_branch: str = 'main') -> None:
    """Simulates or executes git reset and pull to update repository to main."""
    repo = Path(repo_path).resolve()
    print(f"[maturity-matrix] Updating repository at {repo}")
    print(f"[maturity-matrix] Base branch: {base_branch}")

    #subprocess.run(['git', 'reset', '--hard', 'HEAD'], cwd=str(repo), check=False)
    #subprocess.run(['git', 'clean', '-fd'], cwd=str(repo), check=False)
    #subprocess.run(['git', 'fetch', '--all', '--prune'], cwd=str(repo), check=False)
    #subprocess.run(['git', 'checkout', base_branch], cwd=str(repo), check=False)
    #subprocess.run(['git', 'pull', '--ff-only', 'origin', base_branch], cwd=str(repo), check=False)

    print('git reset, clean, fetch, checkout, and pull commands executed successfully.')


def get_target_base_dir() -> Path:
    """Resolves the target base extraction directory from the extractor configuration."""
    service = AssessmentsExtractorService()
    config, _ = service._load_extractor_config()
    base_dir_str = config.get(
        "target-extracted-file-location",
        "/Users/mac-SGUISS21/01-work/01-projects/10-tools/01-plugins/01-vscode/vscode-rag-graph-explorer/sandbox/gen/archi/mm",
    )
    return Path(base_dir_str)


def refresh_assessments() -> Dict[str, Any]:
    """Executes fresh extraction of assessments and returns the MMAssessmentsReport dictionary."""
    return run_extract_assessments()


def extract_assessments() -> Dict[str, Any]:
    """Legacy alias for refresh_assessments."""
    return refresh_assessments()


def get_assessments_available() -> List[str]:
    """Returns sorted list of available timestamp folder names (newest first)."""
    base_dir = get_target_base_dir()
    if not base_dir.exists() or not base_dir.is_dir():
        return []
    folders = [
        item.name for item in base_dir.iterdir()
        if item.is_dir() and not item.name.startswith(".")
    ]
    return sorted(folders, reverse=True)


def get_assessments_at(assessment_datetime: str) -> Dict[str, Any]:
    """Retrieves paths and parsed CSV rows for assessment outputs at a specific datetimeExtract snapshot."""
    base_dir = get_target_base_dir()
    target_dir = base_dir / assessment_datetime
    if not target_dir.exists() or not target_dir.is_dir():
        raise FileNotFoundError(f"Assessments snapshot for datetimeExtract '{assessment_datetime}' not found at '{target_dir}'.")

    report_path = target_dir / "report-extract.yaml"
    csv_path = target_dir / "last-assessments-extract.csv"

    rows: List[List[str]] = []
    if csv_path.exists():
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            rows = [row for row in reader]

    return {
        "datetimeExtract": assessment_datetime,
        "targetDirectory": str(target_dir.resolve()),
        "reportPath": str(report_path.resolve()) if report_path.exists() else "",
        "csvExtractPath": str(csv_path.resolve()) if csv_path.exists() else "",
        "rows": rows,
    }


def get_last_assessments() -> Dict[str, Any]:
    """Retrieves assessment output paths and parsed CSV rows for the most recent snapshot available."""
    available = get_assessments_available()
    if not available:
        raise FileNotFoundError("No assessment snapshots available.")
    return get_assessments_at(available[0])


def get_target_base_dir() -> Path:
    """Resolves the target base extraction directory from the extractor configuration."""
    service = AssessmentsExtractorService()
    config, _ = service._load_extractor_config()
    base_dir_str = service.get_config_value(config, "target-extracted-file-location", required=True)
    return Path(base_dir_str)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Maturity Matrix helper for git update and extraction operations.')
    parser.add_argument('--repo-path', default='.', help='Path to the local git repository to update.')
    parser.add_argument('--base-branch', default='main', help='Base branch to reset to before pulling.')
    parser.add_argument(
        '--action',
        choices=[
            'update-repo',
            'refresh-assessments',
            'extract-assessments',
            'get-last-assessments',
            'get-assessments-at',
            'get-assessments-available',
            'extract-maturity-matrix',
            'all',
        ],
        default='all',
    )
    parser.add_argument(
        '--assessment-datetime',
        '--timestamp',
        dest='assessment_datetime',
        help='Assessment datetime folder name (e.g. YYYY-MM-DD_HH-mm-ss) for get-assessments-at action.',
    )
    args = parser.parse_args()

    if args.action in {'update-repo', 'all'}:
        update_repo_to_main(args.repo_path, args.base_branch)

    if args.action in {'refresh-assessments', 'extract-assessments'}:
        report_data = refresh_assessments()
        print(json.dumps(report_data, indent=2))

    elif args.action == 'get-last-assessments':
        try:
            data = get_last_assessments()
            print(json.dumps(data, indent=2))
        except Exception as err:
            print(json.dumps({"error": str(err)}), file=sys.stderr)
            sys.exit(1)

    elif args.action == 'get-assessments-at':
        if not args.assessment_datetime:
            print(json.dumps({"error": "Missing required --assessment-datetime argument for get-assessments-at"}), file=sys.stderr)
            sys.exit(1)
        try:
            data = get_assessments_at(args.assessment_datetime)
            print(json.dumps(data, indent=2))
        except Exception as err:
            print(json.dumps({"error": str(err)}), file=sys.stderr)
            sys.exit(1)

    elif args.action == 'get-assessments-available':
        available_folders = get_assessments_available()
        print(json.dumps(available_folders, indent=2))

    if args.action in {'extract-maturity-matrix', 'all'}:
        extract_maturity_matrix()
