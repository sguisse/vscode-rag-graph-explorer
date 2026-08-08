#!/usr/bin/env python3
"""path_check.py

Verification helpers for files/folders used by the jqassistant/graph-rag
installer and verifier scripts.

This is a port of the original ``util-verify-install.py`` into the
``_common`` package so the helpers are importable as modules instead of
being dynamically loaded from a hyphenated filename.
"""

from __future__ import annotations

import os
import fnmatch
from pathlib import Path
from xml.sax.saxutils import escape, quoteattr
from pathlib import Path
from typing import Any, Dict, List
import sys

from .util import check_icon, check_result


def check_file_exists(
    path: Path | str,
    expected: bool = True,
    ok_message: str | None = None,
    fail_message: str | None = None,
) -> Dict[str, Any]:
    p = Path(path)
    exists = p.exists()
    if expected:
        if exists:
            msg = ok_message or f"{check_icon(True)}  OK: 📝 file exists: {p}"
            return check_result(True, msg, {"path": str(p)})
        msg = fail_message or f"{check_icon(False)}  ERROR: 📝 file not found: {p}"
        return check_result(False, msg, {"path": str(p)})
    else:
        if exists:
            msg = fail_message or f"{check_icon(False)}  ERROR: 📝 file exists but expected absent: {p}"
            return check_result(False, msg, {"path": str(p)})
        msg = ok_message or f"{check_icon(True)}  OK: 📝 file absent as expected: {p}"
        return check_result(True, msg, {"path": str(p)})


def check_folder_exists(
    path: Path | str,
    expected: bool = True,
    ok_message: str | None = None,
    fail_message: str | None = None,
) -> Dict[str, Any]:
    p = Path(path)
    exists = p.exists() and p.is_dir()
    if expected:
        if exists:
            msg = ok_message or f"{check_icon(True)}  OK: 📂 folder exists: {p}"
            return check_result(True, msg, {"path": str(p)})
        msg = fail_message or f"{check_icon(False)}  ERROR: 📂 folder not found: {p}"
        return check_result(False, msg, {"path": str(p)})
    else:
        if exists:
            msg = fail_message or f"{check_icon(False)}  ERROR: 📂 folder exists but expected absent: {p}"
            return check_result(False, msg, {"path": str(p)})
        msg = ok_message or f"{check_icon(True)}  OK: 📂 folder absent as expected: {p}"
        return check_result(True, msg, {"path": str(p)})


def check_file_contains(
    path: Path | str,
    substring: str,
    expected: bool = True,
    ok_message: str | None = None,
    fail_message: str | None = None,
    encoding: str = "utf-8",
) -> Dict[str, Any]:
    p = Path(path)
    if not p.exists():
        if expected:
            msg = fail_message or f"{check_icon(False)}  ERROR: 📝 file not found: {p}"
            return check_result(False, msg, {"path": str(p)})
        # file missing implies it does not contain substring => OK for expected=False
        msg = ok_message or f"{check_icon(True)}  OK: 📝 file missing and does not contain substring: {p}"
        return check_result(True, msg, {"path": str(p)})
    try:
        content = p.read_text(encoding=encoding)
    except Exception as exc:
        msg = fail_message or f"{check_icon(False)}  ERROR: 📝 could not read {p}: {exc}"
        return check_result(False, msg, {"path": str(p), "error": str(exc)})

    found = substring in content
    if expected:
        if found:
            msg = ok_message or f"{check_icon(True)}  OK: 📝 file {p} contains requested '{substring}' string"
            return check_result(True, msg, {"path": str(p)})
        msg = fail_message or f"{check_icon(False)}  ERROR: 📝 file {p} does not contain requested '{substring}' string"
        return check_result(False, msg, {"path": str(p)})
    else:
        if found:
            msg = fail_message or f"{check_icon(False)}  ERROR: 📝 file {p} contains forbidden '{substring}' string"
            return check_result(False, msg, {"path": str(p)})
        msg = ok_message or f"{check_icon(True)}  OK: 📝 file {p} does not contain '{substring}' string"
        return check_result(True, msg, {"path": str(p)})


def check_folder_has_files(
    path: Path | str,
    pattern: str = "*",
    expected: bool = True,
    ok_message: str | None = None,
    fail_message: str | None = None,
) -> Dict[str, Any]:
    p = Path(path)
    if not p.exists() or not p.is_dir():
        if expected:
            msg = fail_message or f"{check_icon(False)}  ERROR: 📂 folder not found: {p}"
            return check_result(False, msg, {"path": str(p), "matches": []})
        msg = ok_message or f"{check_icon(True)}  OK: 📂 folder absent as expected: {p}"
        return check_result(True, msg, {"path": str(p), "matches": []})

    matches = list(p.glob(pattern))
    has = len(matches) > 0
    if expected:
        if has:
            msg = ok_message or f"{check_icon(True)}  OK: found {len(matches)} 📝 file(s) matching '{pattern}' in 📂 {p}"
            return check_result(True, msg, {"path": str(p), "matches": [str(m) for m in matches]})
        msg = fail_message or f"{check_icon(False)}  ERROR: no 📝 files matching '{pattern}' in 📂 {p}"
        return check_result(False, msg, {"path": str(p), "matches": []})
    else:
        if has:
            msg = fail_message or f"{check_icon(False)}  ERROR: found unexpected 📝 files matching '{pattern}' in 📂 {p}"
            return check_result(False, msg, {"path": str(p), "matches": [str(m) for m in matches]})
        msg = ok_message or f"{check_icon(True)}  OK: no 📝 files matching '{pattern}' in {p}"
        return check_result(True, msg, {"path": str(p), "matches": []})


def print_verification_results(results: Dict[str, Any], title: str | None = None, stream=None) -> None:
    """Pretty-print an aggregated verification `results` dict.

    The function prints a concise human summary followed by the full JSON
    representation. It understands a nested `graph_rag` key and a
    `_summary` entry if present.
    """
    import json

    if stream is None:
        stream = sys.stdout

    # Print the full JSON representation for programmatic consumption
    try:
        print("\n" + json.dumps(results, indent=2, ensure_ascii=False), file=stream)
    except Exception:
        # Fallback
        import json as _j

        print("\n" + _j.dumps(results, indent=2, ensure_ascii=False), file=stream)

    return None


def find_parent_folder(start: Path, folderToFind: str, max_levels: int = 8) -> Path:
    """
    ------------------------------------------------------------------------
    """
    cwd = (start or Path.cwd()).resolve()
    if (cwd / folderToFind).exists():
        return cwd
    p = cwd
    for _ in range(max_levels):
        if (p / folderToFind).exists():
            return p
        if p.parent == p:
            break
        p = p.parent
    return cwd


__all__ = [
    "find_parent_folder",
    "check_file_exists",
    "check_folder_exists",
    "check_file_contains",
    "check_folder_has_files",
    "print_verification_results",
]


# --------------------------------------------------------------------------------
# Sample external call from root workspace :
# py -c "import sys; sys.path.append('.github/skills/rvng-jqassistant-analysis/scripts'); from _common.paths import count_files; print(count_files('./src/main/java', '*.java'))"
#
def count_files(folder: str, file_pattern: str = "*", max_levels: int = 5) -> int:
    """Count the number of files recursively from a folder matching a given pattern.
    If max_levels is > 0, the search stops going deeper once that depth is reached.
    If file_pattern is empty or '*', all files are counted, including folders.
    If file_pattern is like '*.*', only files are counted.
    If file_pattern is like '*.java', only files matching that pattern are counted.
    """
    p = Path(folder)
    if not p.exists() or not p.is_dir():
        return -1

    # If 0 or negative, do a full recursive search (rglob is the fastest way)
    if max_levels <= 0:
        return len(list(p.rglob(file_pattern)))

    count = 0

    # Get the baseline depth of the starting folder
    base_depth = len(p.resolve().parts)

    for root, dirs, files in os.walk(p):
        # Calculate how deep we currently are relative to the start folder
        current_depth = len(Path(root).resolve().parts) - base_depth

        # If we have reached the max level, clear the 'dirs' list.
        # This is a cool os.walk trick that forces it to stop descending!
        if current_depth >= max_levels:
            dirs.clear()

        # Count matching files in this specific directory
        for file in files:
            if fnmatch.fnmatch(file, file_pattern):
                count += 1

    return count


# --------------------------------------------------------------------------------
# Sample external call from root workspace :
# py -c "import sys; sys.path.append('.github/skills/rvng-jqassistant-analysis/scripts'); from _common.paths import report_files_extentions_count; print(report_files_extentions_count('./src/main/java', ['*.java', '*.xml'], 'include', 5))"
#
def report_files_extentions_count(
    from_folder: str, file_pattern: List[str] = ["*"], pattern_mode: str = "include", max_levels: int = 5
) -> Dict[str, Any]:
    """Report the count of files for each extension in the specified folder.
    The function returns a dict containing the number of scanned folders and the extension counts.
    If max_levels is > 0, the search stops going deeper once that depth is reached.
    The `pattern_mode` parameter determines whether to include or exclude files based on the provided patterns ("include" or "exclude").
    """
    p = Path(from_folder)

    if not p.exists() or not p.is_dir():
        print(f"❌  Source folder does not exist: {from_folder}")
        return {"folders_scanned": 0, "extensions": {}}

    if pattern_mode.lower() not in ("include", "exclude"):
        print(f"❌  Invalid pattern_mode: {pattern_mode}. Must be 'include' or 'exclude'.")
        return {"folders_scanned": 0, "extensions": {}}

    extension_counts: Dict[str, int] = {}
    folder_count = 0

    # Get the baseline depth of the starting folder
    base_depth = len(p.resolve().parts)

    for root, dirs, files in os.walk(p):
        folder_count += 1  # Increment for every directory we enter

        # Calculate how deep we currently are relative to the start folder
        if max_levels > 0:
            current_depth = len(Path(root).resolve().parts) - base_depth
            if current_depth >= max_levels:
                dirs.clear()

        for file in files:
            # Check if the file matches any of our patterns
            matches_pattern = any(fnmatch.fnmatch(file, pattern) for pattern in file_pattern)

            # Apply the pattern_mode logic
            if pattern_mode.lower() == "include":
                is_valid = matches_pattern
            else:
                is_valid = not matches_pattern

            if is_valid:
                # Get extension (e.g., '.java'). If no extension (like a Makefile), group it under '<no_ext>'
                ext = Path(file).suffix.lower() or "<no_ext>"
                extension_counts[ext] = extension_counts.get(ext, 0) + 1

    return {"folders_scanned": folder_count, "extensions": extension_counts}


# --------------------------------------------------------------------------------
# Sample external call from root workspace :
# py -c "import sys; sys.path.append('.github/skills/rvng-jqassistant-analysis/scripts'); from _common.paths import merge_files_in_single_file; merge_files_in_single_file('./src/main/java', 'merged_output.xml', ['*.java'], [], 'include', 5)"
#
def merge_files_in_single_file(
    source_folder: str,
    output_xml_file: str,
    include_patterns: list[str],
    exclude_patterns: list[str],
    pattern_priority: str = "include",
    max_levels: int = 5,
) -> None:
    """Merge the content of all files matching `include_patterns` in `source_folder` into a single `output_file`.
    - Output format is an XML file containing <files><file name="..."><path>...</path><content><![CDATA[...]]></content></file></files>.
    - `include_patterns` and `exclude_patterns` are lists of glob patterns to include or exclude folders or files.
    - `pattern_priority` determines whether to apply include or exclude patterns first when both are provided ("include" or "exclude").
    - `max_levels` limits how deep the search goes into subdirectories (0 or negative means no limit).
    """
    src_path = Path(source_folder)
    out_path = Path(output_xml_file)

    if not src_path.exists() or not src_path.is_dir():
        print(f"❌  Source folder does not exist: {src_path}")
        return

    if not output_xml_file.endswith(".xml"):
        print(f"❌  Output file must have a .xml extension: {output_xml_file}")
        return

    if pattern_priority.lower() not in ("include", "exclude"):
        print(f"❌  Invalid pattern_priority: {pattern_priority}. Must be 'include' or 'exclude'.")
        return

    # Ensure the directory for the output file exists
    out_path.parent.mkdir(parents=True, exist_ok=True)

    merged_count = 0
    base_depth = len(src_path.resolve().parts)

    with open(out_path, "w", encoding="utf-8") as outfile:
        # Write the XML declaration and open the root tag
        outfile.write('<?xml version="1.0" encoding="UTF-8"?>\n')
        outfile.write('<files>\n')

        for root, dirs, files in os.walk(src_path):

            # Handle max_levels depth limiting
            if max_levels > 0:
                current_depth = len(Path(root).resolve().parts) - base_depth
                if current_depth >= max_levels:
                    dirs.clear()  # Stop traversing deeper directories

            for file in files:
                file_path = Path(root) / file
                rel_path_str = str(file_path.relative_to(src_path))

                # Prevent the script from accidentally reading its own output file
                if file_path.resolve() == out_path.resolve():
                    continue

                # 1. Evaluate inclusion and exclusion matches
                is_included = False
                is_excluded = False

                if include_patterns:
                    is_included = any(fnmatch.fnmatch(rel_path_str, p) or fnmatch.fnmatch(file, p) for p in include_patterns)
                else:
                    is_included = True

                if exclude_patterns:
                    is_excluded = any(fnmatch.fnmatch(rel_path_str, p) or fnmatch.fnmatch(file, p) for p in exclude_patterns)

                # 2. Apply pattern priority logic
                if pattern_priority.lower() == "exclude":
                    if is_excluded:
                        continue  # Exclude wins immediately
                    if not is_included:
                        continue  # Drop if it wasn't explicitly included
                else:
                    if include_patterns and is_included:
                        pass  # Include wins immediately (bypass exclude)
                    elif is_excluded:
                        continue  # Drop if excluded and wasn't explicitly included
                    elif not is_included:
                        continue  # Drop if it simply didn't match include patterns

                # 3. Read and format the file content for XML
                try:
                    with open(file_path, "r", encoding="utf-8") as infile:
                        content = infile.read()

                        # XML Escaping for attributes and elements
                        safe_name = quoteattr(file)  # Safely quotes the attribute (e.g. name="MyFile.java")
                        safe_path = escape(str(file_path.resolve()))

                        # CDATA sections cannot contain the literal string "]]>".
                        # If the source code has it, we must escape it by splitting the CDATA block.
                        safe_content = content.replace("]]>", "]]]]><![CDATA[>")

                        # Write the structured XML for this file
                        outfile.write(f'  <file name={safe_name}>\n')
                        outfile.write(f'    <path>{safe_path}</path>\n')
                        outfile.write(f'    <content><![CDATA[\n{safe_content}\n]]></content>\n')
                        outfile.write(f'  </file>\n')

                        merged_count += 1

                except UnicodeDecodeError:
                    # Silently skip binary files (like .png, .class, .zip)
                    pass
                except Exception as exc:
                    print(f"⚠️  Failed to read {rel_path_str}: {exc}")

        # Close the root tag
        outfile.write('</files>\n')

    print(f"✅  Successfully merged {merged_count} files into '{out_path.name}' (XML format)")
