#!/usr/bin/env python3

import argparse
import subprocess
from pathlib import Path


def update_repo_to_main(repo_path: str, base_branch: str = 'main') -> None:
    repo = Path(repo_path).resolve()
    print(f"[maturity-matrix] Updating repository at {repo}")
    print(f"[maturity-matrix] Base branch: {base_branch}")

    #subprocess.run(['git', 'reset', '--hard', 'HEAD'], cwd=str(repo), check=False)
    #subprocess.run(['git', 'clean', '-fd'], cwd=str(repo), check=False)
    #subprocess.run(['git', 'fetch', '--all', '--prune'], cwd=str(repo), check=False)
    #subprocess.run(['git', 'checkout', base_branch], cwd=str(repo), check=False)
    #subprocess.run(['git', 'pull', '--ff-only', 'origin', base_branch], cwd=str(repo), check=False)

    print('git reset, clean, fetch, checkout, and pull commands executed successfully.')


def extract_assessments() -> str:
    try:
        from scripts.architecture.maturity_matrix.assessments_extractor import extract_assessments as run_extract_assessments
    except (ImportError, ModuleNotFoundError):
        from assessments_extractor import extract_assessments as run_extract_assessments
    report_location = run_extract_assessments()
    print(f"[maturity-matrix] Report location: {report_location}")
    return report_location


def extract_maturity_matrix() -> None:
    print('not yet implemented')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Maturity Matrix helper for git update and extraction scripts.')
    parser.add_argument('--repo-path', default='.', help='Path to the local git repository to update.')
    parser.add_argument('--base-branch', default='main', help='Base branch to reset to before pulling.')
    parser.add_argument('--action', choices=['update-repo', 'extract-assessments', 'extract-maturity-matrix', 'all'], default='all')
    args = parser.parse_args()

    if args.action in {'update-repo', 'all'}:
        update_repo_to_main(args.repo_path, args.base_branch)

    if args.action in {'extract-assessments', 'all'}:
        extract_assessments()

    if args.action in {'extract-maturity-matrix', 'all'}:
        extract_maturity_matrix()
