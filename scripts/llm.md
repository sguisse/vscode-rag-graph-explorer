# `scripts/` — LLM Context Map

> Read this file first. It tells you what lives where, how the pieces run, which conventions are mandatory, and what silently breaks things.
> Paths are relative to `scripts/` unless prefixed with `./` (repo root). Facts below were verified against the code; if you change the architecture, update this file.

## 1. What this folder is

Python backend of the **Token Razor** VS Code extension. The TypeScript extension host copies `scripts/` into the user's workspace (`<workspace>/.token-razor/scripts/`) and spawns Python processes from there. There is **no Python test suite**.

Four independent script groups share this folder:

| Group | Purpose | Launched by |
|---|---|---|
| `graph_rag_explorer/` + `core/` + `config/` | GraphRAG pipeline: install tools → analyse codebase → load Neo4j → emit UI payload | `./backend/src/extension.ts` → `runPythonScan()` (stdin JSON, cwd = workspace root) |
| `codebase_exporter/` | File exporter, clipboard copy, error parser | `./backend/src/services/_python-scripts/*-py.service.ts` via `PythonScriptExecutionManager.executeScript` |
| `architecture/maturity-matrix/` | Maturity-matrix CSV extraction (`--action ...`) | `maturity-matrix-py.service.ts` (plain `python3 <script>`) |
| `dev-tools/` | Manual developer CLIs (apply YAML/git-diff manifests to the codebase) | Humans / LLM workflows; see `dev-tools/dev-tools.readme.md` |

Everything below (sections 2–9) concerns the **GraphRAG pipeline** (`graph_rag_explorer/`, `core/`, `config/`) unless stated otherwise.

## 2. Quick "where is X?" index

| I need to… | Go to |
|---|---|
| See the end-to-end flow / phases | `graph_rag_explorer/main.py` |
| Add/modify a **tool installer** (checker + installer) | `graph_rag_explorer/install/modules/<category>/<tool>/` (+ skill `.github/skills/py-module-installer/SKILL.md`) |
| Change installer pipeline logic (check → install → re-check) | `core/installer/runner.py` |
| Change module discovery (`check.py` / `install.py` scan) | `core/installer/registry.py` |
| Change check/install base classes | `core/installer/check.py`, `core/installer/install.py` (generic) · `graph_rag_explorer/install/check.py`, `install.py` (tool-specific thin subclasses) |
| Change paths/dirs (`target_dir`, `tools_dir`, `raw_outputs_dir`, …) | `core/installer/context.py` (generic) · `graph_rag_explorer/install/context.py` (`GraphRagExplorerContext`) |
| Change install reports (`final-status.json`, …) | `core/installer/report_handler.py` |
| Add/modify an **analyser** (fills Neo4j) | `graph_rag_explorer/analyser/tools/<lang>/<tool>/analyzer.py` · orchestration: `analyser/runner.py`, `analyser/registry.py`, `analyser/base.py` |
| Neo4j access / stats | `analyser/tools/neo4j/neo4j_client.py`, `neo4j_statistics_extractor.py` |
| UI graph payload (`graph-ui-payload.json`) | `graph_rag_explorer/services/neo4j_extractor.py` (`UIExtractor`, `run_ui_extractor_pipeline`) |
| Which source files get scanned | `graph_rag_explorer/services/sources_discovery.py` |
| Logging helpers, tracked subprocesses, PID cleanup | `core/utils.py` |
| Central configuration (YAML layers, interpolation) | `config/loader.py`, `config/tags.py`, `config/application.yaml` |
| VS Code settings as Python dataclasses | `core/VsCodeSettings_gen.py` (**generated — never edit**) |
| Target-folder cleanup at startup | `core/clean_target.py` |
| Python venv creation for a tool | `core/installer/utils/py_venv_install.py` |
| Python deps of the shared scripts | `requirements.txt` (PyYAML only) |
| Remove `__pycache__` / `.pyc` | `clean_pyc.sh` |

## 3. Directory map

```text
scripts/
├── llm.md                         # this file
├── requirements.txt               # deps of the shared runtime venv (PyYAML)
├── clean_pyc.sh
├── config/                        # CENTRAL CONFIG engine (Spring-Boot-like layering)
│   ├── __init__.py                #   builds `config` at import; `reload_config()`
│   ├── loader.py                  #   ConfigEngine, ConfigDictWrapper (frozen, dot access)
│   ├── tags.py                    #   YAML tags !replace / !extend / !merge_by_key
│   └── application.yaml           #   defaults (see gap in §8)
├── core/                          # shared, tool-agnostic code (NAMESPACE package: no __init__.py)
│   ├── VsCodeSettings_gen.py      #   GENERATED from ./package.json
│   ├── utils.py                   #   info/success/warn/error/debug, execute_tracked_command, PID mgmt
│   ├── clean_target.py            #   startup cleanup of .token-razor/target
│   └── installer/                 # generic installer framework (regular package)
│       ├── context.py  check.py  install.py  registry.py  runner.py  report_handler.py
│       └── utils/py_venv_install.py
├── graph_rag_explorer/            # the GraphRAG tool (NO __init__.py; see import rules §5)
│   ├── main.py                    #   entry point
│   ├── install/                   #   Phase 1
│   │   ├── runner.py  context.py  check.py  install.py
│   │   └── modules/<category>/<tool>/{check,install,context,constants}.py
│   ├── initialization/runner.py   #   Phase 2 (currently a no-op)
│   ├── analyser/                  #   Phase 3
│   │   ├── runner.py registry.py base.py
│   │   └── tools/<lang>/<tool>/analyzer.py
│   └── services/                  #   Phase 4 + helpers (neo4j_extractor, sources_discovery)
├── codebase_exporter/             # exporter scripts (+ user-guide.md, files-exporter-py-workflow.md)
├── architecture/maturity-matrix/  # maturity matrix extractor
└── dev-tools/                     # manual CLIs (+ dev-tools.readme.md)
```

`install/modules/**/git-clone/` (jqassistant_graph_rag) is a vendored third-party-style tool (own `requirements.txt`, own venv, FastAPI/MCP, torch/sentence-transformers). It is copied to `target/.../tools` at install time. **Do not apply shared-code refactors/style rules to it.** `to-copy/` dirs (neo4j, postgresql16) contain `service.py` files copied into the sandbox verbatim.

## 4. Runtime workflow (`graph_rag_explorer/main.py`)

1. TS builds a JSON payload `{ "tokenRazor": { ...settings, "workspaceRoot": "<abs path>" } }` and writes it to the process **stdin**; cwd = workspace root. Interpreter = workspace venv `<ws>/.token-razor/python-runtime` (created by `PythonScriptExecution.manager.ts` from `requirements.txt`).
2. `load_vscode_settings()` → `vsCodeSettings.inject_vscode_settings(payload)` → `config_module.reload_config()`. `initialize_logger()` sets up the file log.
3. `clean_target_workspace()`, `cleanup_orphan_pids()`.
4. **Phase 1 – Install** `install/runner.py` → `core/installer/runner.py`: discover modules, for each (sorted by `name`): `execute_all_checks()` → if summary ≠ `✅` and an installer exists → `execute_all_installations(status)` → re-check → write snapshots. Then compile reports.
5. **Phase 2 – Initialization** (no-op placeholder).
6. **Phase 3 – Analysis** `analyser/runner.py`: connect Neo4j, discover `analyzer.py` files, run **sequentially** by sorted `name` (a concurrent runner exists but `run_analysis_pipeline()` calls the sequential one), then `build_statistics`.
7. **Phase 4 – UI payload** `services/neo4j_extractor.py` → `<target>/ui_outputs/graph-ui-payload.json`.
8. Any exception in phases 1–4 → `error(...)` + traceback → `sys.exit(1)`. Exceptions in step 3 (before the `try`) are not caught.

Install module order (alphabetical on `name`, so the `01_` prefix = runs first):
`01_node_env_initialisation`, `01_system_core` (**calls `sys.exit(-1)`** if python/pip/node/npm/java/psql prerequisites are missing), `01_system_neo4j`, `01_system_postgresql16`, `java_jacoco`, `java_jqassistant`, `java_jqassistant_graph_rag`, `node_dependency_cruiser`, `node_llm_copilot_sdk`, `node_swc`, `python_graphify`.

Analysers: `doc/markdown_linker`, `java/jqassistant`, `java/jqassistant_graph_rag` (`02-java_jqassistant_graph_rag_analyzer`), `java/jregex` (`03-java_regex_analyzer`), `node/dependency_cruiser`, `node/swc`, `python/graphify`. The numeric prefix of `name` controls order.

## 5. Import rules (the #1 source of confusing errors)

`main.py` (and runners) do `sys.path.insert(0, scripts/)` and `sys.path.insert(0, scripts/graph_rag_explorer/)`. Consequences:

- Both styles resolve: `install.context` / `analyser.base` / `initialization.runner` (via `graph_rag_explorer/` on path) **and** `graph_rag_explorer.install.context` (via `scripts/`). They are **different module objects** for the same file. Follow the style of the file you edit; within `install/modules/**`, existing code uses `from install.…` for sibling modules and `graph_rag_explorer.install.…` for contexts imported from outside the install tree.
- `core` and `graph_rag_explorer` are **namespace packages** (no `__init__.py`). `core.installer` and `config` are real packages whose `__init__` imports eagerly — avoid import cycles (`core.utils` imports `config`; `config.loader` therefore only lazily imports `core.utils`).
- **Never `from config import config`.** `reload_config()` replaces the object; a `from … import` keeps the stale pre-reload copy (this caused a `/.token-razor` read-only-filesystem crash). Always:
  ```python
  import config as config_module
  config_module.config.vsCodeSettings.workspaceRoot   # read at call time
  ```
- `vsCodeSettings` (from `core.VsCodeSettings_gen`) is a module-level singleton mutated in place by `inject_vscode_settings`; importing it by name is safe.

## 6. Central configuration (`config/`)

- `config` is built at import time (before settings arrive) and rebuilt by `reload_config()` in `main.load_vscode_settings()`.
- Layers, lowest → highest precedence: `vsCodeSettings` dataclass defaults → `<ws>/<backendWorkspacePath>/config/application.yaml` → `application-<APP_PROFILE>.yaml` → env vars `APP_A__B=x` (→ `a.b`) → CLI `--a-b=x`.
- Interpolation in strings: `${a.b}`, `${env:VAR:default}`, `${default:key:fallback}`, `${abs_path:key}`, `${lower:key}`.
- YAML tags for list/dict merging: `!replace`, `!extend`, `!merge_by_key`.
- Result is frozen (`ReadOnlyConfigError` on assignment). `config.explain("a.b")` shows provenance; `to_dict(mask_secrets=True)` masks keys containing key/password/token/secret.
- Missing `backendWorkspacePath` raises `ValueError` by design (no hard-coded fallback). `BaseEnvironmentContext` also refuses a workspace root equal to `/`.

## 7. Installer framework — how to add a module (details in the py-module-installer skill)

Create `install/modules/<category>/<tool>/` with:

- `check.py`: class extends `GraphRagExplorerCheck`, decorated `@InstallerRegistry.register_checker`; implements `name` and `execute_all_checks()`; per step: `self.steps_count += 1`, on failure `self.ko_count += 1` and `self.status[key] = {"status": "❌", "message": ...}`; return `self.generate_summary()`.
- `install.py`: extends `GraphRagExplorerInstall`, `@InstallerRegistry.register_installer`; same `name`; `execute_all_installations(installStatus=None)` acts only on failed keys.
- `context.py` (optional): `class XContext(GraphRagExplorerContext)` calling `super().__init__(tool_name=ctx.tool_name)` then deriving `tools_dir`, `raw_outputs_dir`, …; holds the `*_MODULE_NAME` constant. `constants.py` may re-export it.
- **`name` must be identical in checker and installer** (they are paired by this string). No registration code elsewhere: discovery is by **file name** (`check.py`, `install.py`) under `install/`. The registry also loads the base `install/check.py` / `install/install.py`, and a checker imported from another module path can register twice (dict-by-name dedups; harmless, pre-existing).
- Status dict shape: `{"<step>": {"status": "✅|❌|⚠️", "message"?: str, ...}, "summary": {"globalStatus", "stepsCount", "koCount", "okCount"}}`. `globalStatus` is `✅` iff `ko_count == 0`; steps marked `⚠️` without `ko_count += 1` are informational.
- Every `XContext(...)` construction calls `ensure_directories()` (creates `tools/`, `raw_outputs/`, `install_reports/`) — cheap, idempotent, but means constructors have filesystem side effects.

### Filesystem layout produced (`<ws>` = workspace root, default `backendWorkspacePath` = `.token-razor`)

```text
<ws>/.token-razor/
├── scripts/                         # synced copy of this folder (by MD5 or forceScriptSync)
├── python-runtime/                  # shared venv (requirements.txt hash in requirements.sha256)
├── logs/graph-rag-explorer-NN.log   # file log (rotation settings in VS Code settings)
└── target/
    ├── pids/                        # PID files of tracked subprocesses
    ├── install_reports/global-status.json
    └── graph_rag_explorer/
        ├── tools/<category>/<tool>/ # installed tools (npm, neo4j, postgres, jqassistant, venvs…)
        ├── raw_outputs/             # analyser raw results
        ├── ui_outputs/graph-ui-payload.json
        └── install_reports/
            ├── <module>/{before,after}/status.json
            ├── tool-status.json
            └── final-status.json    # LEGACY CONTRACT: read by backend GraphRagInstallerAdapter — keep it
```

`core/clean_target.py` runs at **every** start and deletes transient dirs (`logs`, `pids`, `reports`, `install_reports`, `raw_outputs`, `tmp`) and `.log/.pid/.json/.yaml/.yml/.tmp` files under `target/`, **except** paths containing `tools`, `neo4j`, `jqassistant`, `models`, `data`, `databases`, `git-clone`, `.venv`, `venv`. Anything that must survive between runs has to live under one of those names.

## 8. Conventions & rules for changes

**Mandatory**
- Keep all existing comments; do not delete code comments when refactoring.
- Log with `from core.utils import info, success, warn, error, debug` and always pass `component=` (usually `self.name`). `info/success/debug` → stdout; `warn/error` → stderr, which the extension surfaces as `[main.py:ERR]`. Log at: phase/step start, result with key figures (counts, paths, return codes), and every failure with the reason. Never log secrets (Gemini key etc.; secrets live in VS Code `SecretStorage`, not in scripts).
- Subprocesses: use `execute_tracked_command([...argv...], "<tool>_<action>", cwd=...)` (argument list, PID tracked in `target/pids`, stderr merged into stdout, returns the exit code and **does not raise** — always check the code and log it). Do not build shell strings from interpolated input. Known legacy exception: `shell=True` in `jqassistant_graph_rag/install.py` (`ensure_git_lfs`) — do not copy.
- Validate that resolved paths stay inside the workspace before writing/deleting (project policy: workspace path containment).
- Windows/macOS/Linux: use `ctx.is_windows`, `resolve_executable_name`, `normalize_path`; paths are stored with `/`.
- Do **not** edit `core/VsCodeSettings_gen.py` by hand. It is generated from `./package.json` (`contributes.configuration`) by `./dev-tools/generate-vscode-settings-model.js` (run `npm run generate:code` at the repo root). New VS Code setting → add to `package.json` → regenerate → read via `vsCodeSettings.<path>`.
- When moving/renaming a Python file, grep for references outside `scripts/` too (TS backend, docs, templates, `.jqassistant-template.yml`).
- Preserve output contracts consumed by TypeScript: `install_reports/final-status.json`, `ui_outputs/graph-ui-payload.json`, the stdin payload shape.
- Plain-text URLs only. A previous bad edit turned URLs into markdown links (`[https://x](https://x)`) inside strings; grep for `](http` after bulk edits.

**Style observed in the codebase**
- Short one-line properties (`def name(self) -> str: return ...`) are common in older modules; newer ones use multi-line. Match the file you edit.
- Docstrings/comments in English; emoji status markers (`✅ ❌ ⚠️`) are part of the data contract, not decoration.

**Known gaps / quirks (do not "fix" silently — ask or flag)**
- `scripts/config/application.yaml` is shipped but the loader reads `<ws>/.token-razor/config/`, **not** `…/scripts/config/`, so it is not applied today.
- `analyser/registry.py` builds module names with `.rstrip(".py")` (strips characters, not a suffix); works for current filenames only.
- `ui_outputs_dir` and `pids_dir` are not created by `ensure_directories()` (producers create them).
- Phase 2 is a stub; `initialization/runner.py` still imports Neo4j checker/installer unused.
- Same module can be imported under two names (see §5); class identity checks (`isinstance`) across the two styles can fail.
- `maturity_matrix.py` has a pre-existing undefined name (`extract_maturity_matrix`, line ~166).

## 9. Safe verification recipes

The real pipeline downloads/starts Neo4j (bolt 7687 / http 7474), PostgreSQL, runs `npm`, and starts an MCP server (127.0.0.1:8800). **Do not run `main.py` end-to-end casually.** Prefer:

```bash
# one-off venv with only what the shared scripts need
python3 -m venv /tmp/v && /tmp/v/bin/pip install -q pyyaml pyflakes
/tmp/v/bin/python -m pyflakes scripts | grep -E "undefined name|cannot import"   # static check
```

Import + check-only smoke test (no installs; use a throwaway workspace, never the repo as workspace):

```python
import sys, os, runpy, json, io
scripts = "<repo>/scripts"; ws = "/tmp/ws"; os.makedirs(ws, exist_ok=True); os.chdir(ws)
ns = runpy.run_path(f"{scripts}/graph_rag_explorer/main.py", run_name="smoke")   # imports only, main() not run
sys.stdin = io.StringIO(json.dumps({"tokenRazor": {"workspaceRoot": ws, "backendWorkspacePath": ".token-razor"}}))
sys.stdin.isatty = lambda: False
ns["load_vscode_settings"](); ns["initialize_logger"]()
from core.installer.registry import InstallerRegistry
from graph_rag_explorer.install.context import GraphRagExplorerContext
ctx = GraphRagExplorerContext()
InstallerRegistry.discover_and_load_checkers_and_installers(f"{scripts}/graph_rag_explorer/install")
for c in InstallerRegistry.get_checkers():
    chk = c(ctx); print(chk.name, chk.execute_all_checks()["summary"])   # read-only checks
```

Compare against a baseline commit with `git archive <sha> scripts | tar -x -C /tmp/base` and run the same snippet on both trees; checker statuses must be identical. Clean generated bytecode afterwards with `bash scripts/clean_pyc.sh`.

## 10. TypeScript counterparts (when a change crosses the boundary)

| Concern | File |
|---|---|
| Spawn the pipeline, build stdin payload | `./backend/src/extension.ts` (`runPythonScan`) |
| Python interpreter / venv provisioning, process tracking & kill | `./backend/src/managers/PythonScriptExecution.manager.ts` |
| Copy `scripts/` to the workspace (MD5 / `forceScriptSync`) | `./backend/src/managers/WorkspaceInstallation.manager.ts` |
| Read install report (`final-status.json`) | `./backend/src/services/graph-rag-explorer/grag-installer-service.adapter.ts` |
| Settings source of truth | `./package.json` → generators in `./dev-tools/` |
| Agent/skill guidance | `./.github/agents/token-razor.agent.md`, `./.github/skills/py-module-installer/SKILL.md` |

## 11. Default settings worth knowing (from `VsCodeSettings_gen.py`)

Neo4j `5.26.0` (bolt 7687, http 7474, user `neo4j`), jQAssistant `2.9.1`, GraphRAG MCP `127.0.0.1:8800`, embedding model `all-MiniLM-L6-v2`, `backendWorkspacePath` `.token-razor`, `processTimeout` 500000 ms, pinned versions in node installers: `@swc/core@1.15.43`, `dependency-cruiser@18.0.0`, `@github/copilot-sdk@1.0.13`.
