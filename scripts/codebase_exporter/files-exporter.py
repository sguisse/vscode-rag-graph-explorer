#!/usr/bin/env python3
import argparse
import os
import re
import json
import sys
from collections import defaultdict
from datetime import datetime, timezone

for stream in (sys.stdout, sys.stderr):
    if hasattr(stream, "reconfigure"):
        stream.reconfigure(encoding="utf-8", errors="replace")

DEST_DIR = None
OUTPUT_FORMAT = "yaml"
MAX_OUTPUT_SIZE_BYTES = 0
GROUP_BY_EXT = False
GENERATE_LOG_CONSOLE = True
GENERATE_LOG_FILE = False
GENERATE_TREE_VIEW = False
TIMESTAMP = None
LOG_FILE_HANDLE = None

GENERATED_FILES = {
    "codebase": {"exports": [], "reports": []},
    "reference": {"exports": [], "reports": []},
    "logs": [],
    "prompt": []
}

HARDCODED_DEFAULTS = {
    'codebase_src': [os.getcwd()],
    'reference_src': [],
    'prompt': '',
    'dest': os.path.join(os.getcwd(), "exported_files"),
    'format': 'yaml',
    'max_chunk': 0.0,
    'log_console': True,
    'log_file': False,
    'group_ext': False,
    'codebase_inc_paths': '.*',
    'codebase_exc_paths': "\n".join([
        ".*/node_modules/.*", ".*/target/.*", ".*/out/.*", ".*/\\.git/.*",
        ".*/dist/.*", ".*/build/.*", ".*/\\.turbo/.*", ".*/\\.next/.*",
        ".*/coverage/.*", ".*/\\.cache/.*", ".*\\.history/.*"
    ]),
    'codebase_inc_ext': '',
    'codebase_exc_ext': "\n".join([
        ".*\\.(log|tmp)$", ".*\\.lock$", ".*\\.zip$", ".*\\.tar$",
        ".*\\.(png|jpg|jpeg|gif|bmp|svg|webp|ico)$", ".*\\.DS_Store$", ".*\\.pyc$"
    ]),
    'codebase_max_file': 50.0,
    'reference_inc_paths': '.*',
    'reference_exc_paths': "\n".join([
        ".*/node_modules/.*", ".*/target/.*", ".*/out/.*", ".*/\\.git/.*",
        ".*/dist/.*", ".*/build/.*", ".*/\\.turbo/.*", ".*/\\.next/.*",
        ".*/coverage/.*", ".*/\\.cache/.*", ".*\\.history/.*"
    ]),
    'reference_inc_ext': '',
    'reference_exc_ext': "\n".join([
        ".*\\.(log|tmp)$", ".*\\.lock$", ".*\\.zip$", ".*\\.tar$",
        ".*\\.(png|jpg|jpeg|gif|bmp|svg|webp|ico)$", ".*\\.DS_Store$", ".*\\.pyc$"
    ]),
    'reference_max_file': 50.0,
}

def log(msg, emoji="", add_ts=True, force_console=False):
    global GENERATE_LOG_FILE, LOG_FILE_HANDLE, GENERATE_LOG_CONSOLE

    if GENERATE_LOG_FILE and LOG_FILE_HANDLE:
        if add_ts:
            ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            full_msg = f"{ts} {emoji} {msg}" if emoji else f"{ts} {msg}"
        else:
            full_msg = f"{emoji} {msg}" if emoji else msg
        try:
            LOG_FILE_HANDLE.write(full_msg + "\n")
            LOG_FILE_HANDLE.flush()
        except Exception:
            pass

    if force_console or GENERATE_LOG_CONSOLE:
        print(f"{emoji} {msg}" if emoji else msg)

def compile_regexes(name, patterns):
    if not patterns:
        return []
    try:
        if isinstance(patterns, str):
            patterns = re.split(r'[\n,;]', patterns)
        patterns = [p.strip() for p in patterns if p.strip()]
        return [re.compile(p) for p in patterns]
    except re.error as e:
        log("Invalid regex in " + name + ": " + str(e), emoji="❗")
        sys.exit(2)

def format_size(num_bytes):
    if num_bytes >= 1024 * 1024:
        return f"{num_bytes / (1024 * 1024):.1f}MB"
    return f"{num_bytes / 1024:.1f}KB"

def matches_any(text, compiled_regexes):
    if not compiled_regexes:
        return False
    return any(r.search(text) for r in compiled_regexes)

def is_file_allowed(rel_filepath, filename, filters):
    if filters['inc_paths'] and not matches_any(rel_filepath, filters['inc_paths']):
        return False
    if filters['exc_paths'] and matches_any(rel_filepath, filters['exc_paths']):
        return False
    if filters['inc_ext'] and not matches_any(filename, filters['inc_ext']):
        return False
    if filters['exc_ext'] and matches_any(filename, filters['exc_ext']):
        return False
    return True

class StreamExporter:
    def __init__(self, fmt, out_file):
        self.fmt = fmt
        self.out_file = out_file
        self.first_file = True

    def start(self):
        if self.fmt == 'json':
            self.out_file.write('{\n  "files": [\n')
        elif self.fmt == 'xml':
            self.out_file.write('<?xml version="1.0" encoding="UTF-8"?>\n<export>\n  <files>\n')
        elif self.fmt in ['yaml', 'yml']:
            self.out_file.write('files:\n')

    def write_file(self, fname, ext, folder, content, rel_path):
        if self.fmt == 'txt':
            self.out_file.write(f"{'=' * 162}\n{rel_path}\n--->\n\n{content}\n<---\n\n")
        elif self.fmt == 'json':
            if not self.first_file:
                self.out_file.write(',\n')
            obj = {"filename": fname, "extension": ext, "path": folder, "content": content}
            self.out_file.write("    " + json.dumps(obj).replace('\n', '\n    '))
        elif self.fmt == 'xml':
            safe_content = content.replace(']]>', ']]]]><![CDATA[>')
            self.out_file.write(f"    <file>\n      <filename>{fname}</filename>\n")
            self.out_file.write(f"      <extension>{ext}</extension>\n      <path>{folder}</path>\n")
            self.out_file.write(f"      <content><![CDATA[{safe_content}]]></content>\n    </file>\n")
        elif self.fmt in ['yaml', 'yml']:
            self.out_file.write(f"  - filename: {json.dumps(fname)}\n    extension: {json.dumps(ext)}\n")
            self.out_file.write(f"    path: {json.dumps(folder)}\n    content: |-\n")
            for line in content.splitlines():
                self.out_file.write(f"      {line}\n")
            self.out_file.write("\n")
        self.first_file = False

    def end(self):
        if self.fmt == 'json':
            self.out_file.write('\n  ]\n}\n')
        elif self.fmt == 'xml':
            self.out_file.write('  </files>\n</export>\n')

class FileScanner:
    def __init__(self, scope_name, target_sources, filters, max_file_kb=50.0):
        self.scope_name = scope_name
        self.target_sources = target_sources
        self.filters = filters
        self.max_file_bytes = max_file_kb * 1024
        self.exporters = {}
        self.g_fold = set()
        self.g_exts = defaultdict(int)
        self.g_rej = defaultdict(int)
        self.g_exc = defaultdict(int)
        self.g_bnd = defaultdict(lambda: {'min': float('inf'), 'max': 0})
        self.processed_manifest = []

    def _open_new_chunk(self, index, ext=""):
        ext_part = f"_{ext}" if GROUP_BY_EXT and ext else ""
        out_filename = f"export-{TIMESTAMP}-{self.scope_name}{ext_part}_{index:02d}.{OUTPUT_FORMAT}"
        out_filepath = os.path.join(DEST_DIR, out_filename)
        out_file = open(out_filepath, "w", encoding="utf-8")

        GENERATED_FILES[self.scope_name]["exports"].append(out_filepath)

        exporter = StreamExporter(OUTPUT_FORMAT, out_file)
        exporter.start()
        return out_file, exporter

    def _get_exporter(self, ext):
        ext_key = ext if GROUP_BY_EXT else "default"
        if ext_key not in self.exporters:
            out_file, exporter = self._open_new_chunk(1, ext_key if GROUP_BY_EXT else "")
            self.exporters[ext_key] = {'file': out_file, 'exporter': exporter, 'idx': 1}
        return self.exporters[ext_key]

    def process_file(self, fp, rel_fp, file_name, abs_f):
        fname, ext_dot = os.path.splitext(file_name)
        ext = ext_dot.lstrip('.')

        if self.max_file_bytes > 0:
            try:
                sz = os.path.getsize(fp)
                if sz > self.max_file_bytes:
                    self.g_rej[ext] += 1
                    self.g_bnd[ext]['min'] = min(self.g_bnd[ext]['min'], sz)
                    self.g_bnd[ext]['max'] = max(self.g_bnd[ext]['max'], sz)
                    return
            except OSError:
                return

        if not is_file_allowed(rel_fp, file_name, self.filters):
            self.g_exc[ext] += 1
            return

        ext_key = ext if GROUP_BY_EXT else "default"
        exp_data = self._get_exporter(ext)

        try:
            with open(fp, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()
            self.exporters[ext_key]['exporter'].write_file(fname, ext, abs_f, content, rel_fp)

            self.g_exts[ext] += 1
            self.g_fold.add(abs_f)
            self.processed_manifest.append(os.path.abspath(fp))
        except Exception as e:
            log(f"[{self.scope_name}] Failed to read {rel_fp}: {e}", emoji="⚠️")

    def run_scan(self):
        for source_path in self.target_sources:
            abs_src = os.path.abspath(os.path.expanduser(source_path))
            if os.path.isfile(abs_src):
                abs_f = os.path.dirname(abs_src)
                rel_fp = "./" + os.path.basename(abs_src)
                self.process_file(abs_src, rel_fp, os.path.basename(abs_src), abs_f)
            elif os.path.isdir(abs_src):
                for root, dirs, files in os.walk(abs_src):
                    abs_f = os.path.abspath(root)
                    rel_root = "./" + os.path.relpath(root, abs_src).replace("\\", "/")
                    if rel_root == "./.": rel_root = "."
                    if self.filters['exc_paths']:
                        dirs[:] = [d for d in dirs if not matches_any(f"{rel_root}/{d}", self.filters['exc_paths'])]
                    for file in files:
                        fp = os.path.join(root, file)
                        rel_fp = f"{rel_root}/{file}"
                        self.process_file(fp, rel_fp, file, abs_f)

    def finalize(self):
        chunks = 0
        for exp_data in self.exporters.values():
            exp_data['exporter'].end()
            exp_data['file'].close()
            chunks += exp_data['idx']
        return len(self.g_fold), dict(self.g_exts), dict(self.g_rej), dict(self.g_bnd), dict(self.g_exc), chunks

def create_tree_manifest(scope_name, processed_manifest):
    if not processed_manifest:
        return None, None
    try:
        common = os.path.commonpath(processed_manifest)
        if os.path.isfile(common):
            common = os.path.dirname(common)

        root_node = {
            "name": os.path.basename(common) or common,
            "type": "directory",
            "absolute_path": common,
            "children": {}
        }

        for path in processed_manifest:
            rel = os.path.relpath(path, common)
            if rel == ".": continue
            parts = rel.split(os.sep)
            current = root_node

            for i, part in enumerate(parts):
                if i == len(parts) - 1:
                    fname, ext_dot = os.path.splitext(part)
                    current["children"][part] = {
                        "name": fname, "extension": ext_dot.lstrip('.'),
                        "type": "file", "absolute_path": path
                    }
                else:
                    if part not in current["children"]:
                        current["children"][part] = {
                            "name": part, "type": "directory",
                            "absolute_path": os.path.join(current["absolute_path"], part), "children": {}
                        }
                    current = current["children"][part]

        tree_path = os.path.join(DEST_DIR, f"export-{TIMESTAMP}-{scope_name}-tree.json")
        with open(tree_path, "w", encoding="utf-8") as f:
            json.dump({"timestamp": TIMESTAMP, "scope": scope_name, "root": root_node}, f, indent=4)

        GENERATED_FILES[scope_name]["reports"].append(tree_path)
        log(f"[{scope_name}] Tree manifest generated: {tree_path}", emoji="🌲")
        return tree_path, {"timestamp": TIMESTAMP, "root": root_node}
    except Exception as e:
        log(f"[{scope_name}] Tree manifest bypassed: {str(e)}", emoji="⚠️")
        return None, None

def export_prompt_file(prompt_text):
    if not prompt_text or not prompt_text.strip():
        return None
    prompt_filepath = os.path.join(DEST_DIR, f"export-{TIMESTAMP}-prompt.{OUTPUT_FORMAT}")
    with open(prompt_filepath, "w", encoding="utf-8") as f:
        if OUTPUT_FORMAT in ['yaml', 'yml']:
            f.write("prompt: |-\n")
            for line in prompt_text.splitlines():
                f.write(f"  {line}\n")
        elif OUTPUT_FORMAT == 'json':
            json.dump({"prompt": prompt_text}, f, indent=2)
        elif OUTPUT_FORMAT == 'xml':
            safe_content = prompt_text.replace(']]>', ']]]]><![CDATA[>')
            f.write(f"<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<prompt><![CDATA[{safe_content}]]></prompt>\n")
        else:
            f.write(prompt_text)
    GENERATED_FILES["prompt"].append(prompt_filepath)
    log(f"Prompt exported to file: {prompt_filepath}", emoji="📝")
    return prompt_filepath

def parse_arguments():
    parser = argparse.ArgumentParser(description="CLI tool for exporting codebase and reference files.")
    parser.add_argument("--mode", choices=["standard", "filter-check", "paths-export"], default="standard")

    # Codebase arguments
    parser.add_argument("--codebase-src", "--src", nargs="+", default=HARDCODED_DEFAULTS['codebase_src'])
    parser.add_argument("--codebase-inc-paths", "--inc-paths", default=HARDCODED_DEFAULTS['codebase_inc_paths'])
    parser.add_argument("--codebase-exc-paths", "--exc-paths", default=HARDCODED_DEFAULTS['codebase_exc_paths'])
    parser.add_argument("--codebase-inc-ext", "--inc-ext", default=HARDCODED_DEFAULTS['codebase_inc_ext'])
    parser.add_argument("--codebase-exc-ext", "--exc-ext", default=HARDCODED_DEFAULTS['codebase_exc_ext'])
    parser.add_argument("--codebase-max-file", "--max-file", type=float, default=HARDCODED_DEFAULTS['codebase_max_file'])

    # Reference arguments
    parser.add_argument("--reference-src", nargs="+", default=HARDCODED_DEFAULTS['reference_src'])
    parser.add_argument("--reference-inc-paths", default=HARDCODED_DEFAULTS['reference_inc_paths'])
    parser.add_argument("--reference-exc-paths", default=HARDCODED_DEFAULTS['reference_exc_paths'])
    parser.add_argument("--reference-inc-ext", default=HARDCODED_DEFAULTS['reference_inc_ext'])
    parser.add_argument("--reference-exc-ext", default=HARDCODED_DEFAULTS['reference_exc_ext'])
    parser.add_argument("--reference-max-file", type=float, default=HARDCODED_DEFAULTS['reference_max_file'])

    parser.add_argument("--prompt", default=HARDCODED_DEFAULTS['prompt'])
    parser.add_argument("--dest", default=HARDCODED_DEFAULTS['dest'])
    parser.add_argument("--format", default=HARDCODED_DEFAULTS['format'])
    parser.add_argument("--max-chunk", type=float, default=HARDCODED_DEFAULTS['max_chunk'])
    parser.add_argument("--group-ext", action="store_true", default=HARDCODED_DEFAULTS['group_ext'])
    parser.add_argument("--log-console", action="store_true", default=HARDCODED_DEFAULTS['log_console'])
    parser.add_argument("--log-file", action="store_true", default=HARDCODED_DEFAULTS['log_file'])
    parser.add_argument("--tree-view", action="store_true", default=False)
    parser.add_argument("--timestamp", default=None)
    return parser.parse_args()

def run_scope_export(scope_name, sources, filters, max_file_kb):
    if not sources:
        return None

    split_sources = []
    for src in sources:
        if src:
            for part in re.split(r'[\n,;]', src):
                cleaned = part.strip().strip("'\"").strip()
                if cleaned: split_sources.append(cleaned)

    if not split_sources:
        return None

    log(f"\n--- Scanning Scope: {scope_name.upper()} ---", emoji="🚀")
    scanner = FileScanner(scope_name, split_sources, filters, max_file_kb=max_file_kb)
    scanner.run_scan()
    folders_cnt, ext_cnts, rej_cnts, bounds, exc_cnts, chunks = scanner.finalize()

    tree_path, tree_manifest_data = None, None
    if GENERATE_TREE_VIEW:
        tree_path, tree_manifest_data = create_tree_manifest(scope_name, scanner.processed_manifest)

    scope_report_data = {
        "summary": {
            "folders_scanned": folders_cnt,
            "chunks_generated": chunks,
            "total_exported": sum(ext_cnts.values()),
            "total_size_rejected": sum(rej_cnts.values()),
            "total_regex_excluded": sum(exc_cnts.values()),
        },
        "metrics_per_extension": {
            ext: {
                "exported": ext_cnts.get(ext, 0),
                "size_rejected": {
                    "count": rej_cnts.get(ext, 0),
                    "min": format_size(bounds[ext]['min']) if rej_cnts.get(ext, 0) > 0 else "0KB",
                    "max": format_size(bounds[ext]['max']) if rej_cnts.get(ext, 0) > 0 else "0KB",
                },
                "regex_excluded": exc_cnts.get(ext, 0),
            }
            for ext in (set(ext_cnts.keys()) | set(rej_cnts.keys()) | set(exc_cnts.keys()))
        },
        "generated_files": {
            "exports": GENERATED_FILES[scope_name]["exports"],
            "reports": GENERATED_FILES[scope_name]["reports"]
        },
        "tree_manifest": tree_manifest_data
    }

    scope_report_path = os.path.join(DEST_DIR, f"export-{TIMESTAMP}-{scope_name}-report.json")
    try:
        with open(scope_report_path, "w", encoding="utf-8") as f:
            json.dump({"timestamp": TIMESTAMP, "scope": scope_name, "results": scope_report_data}, f, indent=4)
        GENERATED_FILES[scope_name]["reports"].append(scope_report_path)
        log(f"[{scope_name}] Scope report generated: {scope_report_path}", emoji="📝")
    except Exception as e:
        log(f"[{scope_name}] Failed to save scope report: {e}", emoji="❌")

    return scope_report_data

def main():
    global DEST_DIR, OUTPUT_FORMAT, MAX_OUTPUT_SIZE_BYTES, GROUP_BY_EXT, GENERATE_LOG_CONSOLE, GENERATE_LOG_FILE, GENERATE_TREE_VIEW, TIMESTAMP, LOG_FILE_HANDLE

    args = parse_arguments()

    codebase_filters = {
        'inc_paths': compile_regexes("CODEBASE_INC_PATHS", args.codebase_inc_paths),
        'exc_paths': compile_regexes("CODEBASE_EXC_PATHS", args.codebase_exc_paths),
        'inc_ext': compile_regexes("CODEBASE_INC_EXT", args.codebase_inc_ext),
        'exc_ext': compile_regexes("CODEBASE_EXC_EXT", args.codebase_exc_ext),
    }

    reference_filters = {
        'inc_paths': compile_regexes("REFERENCE_INC_PATHS", args.reference_inc_paths),
        'exc_paths': compile_regexes("REFERENCE_EXC_PATHS", args.reference_exc_paths),
        'inc_ext': compile_regexes("REFERENCE_INC_EXT", args.reference_inc_ext),
        'exc_ext': compile_regexes("REFERENCE_EXC_EXT", args.reference_exc_ext),
    }

    DEST_DIR = os.path.abspath(os.path.expanduser(args.dest))
    os.makedirs(DEST_DIR, exist_ok=True)

    OUTPUT_FORMAT = args.format.lower()
    MAX_OUTPUT_SIZE_BYTES = args.max_chunk * 1024
    GROUP_BY_EXT = args.group_ext
    GENERATE_LOG_CONSOLE = args.log_console
    GENERATE_LOG_FILE = args.log_file
    GENERATE_TREE_VIEW = args.tree_view

    TIMESTAMP = args.timestamp if args.timestamp else datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
    LOG_FILE_PATH = os.path.join(DEST_DIR, f"export-{TIMESTAMP}-log.log")
    if GENERATE_LOG_FILE:
        LOG_FILE_HANDLE = open(LOG_FILE_PATH, 'w', encoding='utf-8')
        GENERATED_FILES["logs"].append(LOG_FILE_PATH)

    # 1. Run Codebase Scope Export
    codebase_report_data = run_scope_export('codebase', args.codebase_src, codebase_filters, args.codebase_max_file)

    # 2. Run Reference Scope Export
    reference_report_data = run_scope_export('reference', args.reference_src, reference_filters, args.reference_max_file)

    # 3. Export Prompt File if provided
    if args.prompt:
        export_prompt_file(args.prompt)

    # 4. Generate Master JSON Report
    master_report_path = os.path.join(DEST_DIR, f"export-{TIMESTAMP}-report.json")
    try:
        master_report_data = {
            "timestamp": TIMESTAMP,
            "configuration": {
                "dest_dir": DEST_DIR,
                "format": OUTPUT_FORMAT,
            },
            "results": {
                "summary": codebase_report_data["summary"] if codebase_report_data else {},
                "metrics_per_extension": codebase_report_data["metrics_per_extension"] if codebase_report_data else {},
                "generated_files": GENERATED_FILES,
                "codebase": codebase_report_data,
                "reference": reference_report_data,
            }
        }
        with open(master_report_path, "w", encoding="utf-8") as f:
            json.dump(master_report_data, f, indent=4)
        log(f"Master JSON report generated: {master_report_path}", emoji="📊")
    except Exception as e:
        log(f"Failed to generate master JSON report: {e}", emoji="❌")

    log("Export complete!", emoji="✅")
    print(TIMESTAMP)

if __name__ == "__main__":
    try:
        main()
    finally:
        if LOG_FILE_HANDLE:
            LOG_FILE_HANDLE.close()
