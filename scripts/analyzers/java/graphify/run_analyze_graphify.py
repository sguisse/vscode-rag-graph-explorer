import os
import sys
import subprocess
import signal
import json
import time

# Dynamically map the unified core logging utilities path
CORE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "core"))
if CORE_DIR not in sys.path:
    sys.path.insert(0, CORE_DIR)

from utils import info, warn, error, success

class GraphifyPythonWrapper:
    """Encapsulates execution context and lifecycle concerns for the Graphify PyPI/Tree-sitter parser stack."""
    def __init__(self):
        self.name = "Graphify"
        self.directory = os.path.dirname(os.path.abspath(__file__))
        self.process = None
        self.pid_file = None

    def execute(self, manifest_path: str, output_json_path: str, pids_dir: str):
        install_script = os.path.join(self.directory, "install.py")
        subprocess.run([sys.executable, install_script], check=True)

        os.makedirs(os.path.dirname(output_json_path), exist_ok=True)

        info("Scanning project repository workspace using uvx environment commands...", component="GraphifyAnalyze")

        cmd = [
            "uvx", "--from", "graphifyy[all]", "graphify", "update", "."
        ]

        kwargs = {
            "cwd": os.getcwd(),
            "stdout": subprocess.PIPE,
            "stderr": subprocess.PIPE
        }

        if os.name == 'nt':
            kwargs["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP
        else:
            kwargs["preexec_fn"] = os.setsid

        try:
            self.process = subprocess.Popen(cmd, **kwargs)

            self.pid_file = os.path.join(pids_dir, f"java_{self.name.lower()}_{self.process.pid}.pid")
            with open(self.pid_file, "w") as f:
                f.write(str(self.process.pid))

            stdout, stderr = self.process.communicate()

            native_output_json = os.path.join(os.getcwd(), "graphify-out", "graph.json")

            # Polling wait loop with maximum 10-second timeout metric bounds
            info("Polling for native graph.json generation (Max 10s timeout)...", component="GraphifyAnalyze")
            timeout = 10
            start_time = time.time()
            file_ready = False

            while time.time() - start_time < timeout:
                if os.path.exists(native_output_json) and os.path.getsize(native_output_json) > 0:
                    file_ready = True
                    break
                time.sleep(0.5)

            if file_ready and self.process.returncode == 0:
                self._filter_graph_content(manifest_path, native_output_json, output_json_path)
            else:
                error(f"Output graph unavailable or execution unhealthy. Process exit code: {self.process.returncode}", component="GraphifyAnalyze")
                self._run_fallback_parser(manifest_path, output_json_path)
        except Exception as e:
            error(f"Exception encountered during active processing loop: {e}", component="GraphifyAnalyze")
            self._run_fallback_parser(manifest_path, output_json_path)
        finally:
            self._cleanup_pid()

    def _filter_graph_content(self, manifest_path: str, native_output_json: str, output_json_path: str):
        """Externalized logic designed to filter raw tool extractions against project discovery constraints."""
        info("Running containment verification scan against manifest schema maps...", component="GraphifyAnalyze")

        with open(manifest_path, 'r', encoding='utf-8') as mf:
            manifest_data = json.load(mf)
        allowed_files = set(f.replace("\\", "/").lower() for f in manifest_data.get("files", []))

        with open(native_output_json, 'r', encoding='utf-8') as src_f:
            raw_graph = json.load(src_f)

        filtered_entities = []
        filtered_relations = []
        allowed_entity_ids = set()

        for ent in raw_graph.get("entities", []):
            ent_id = ent.get("id", "")
            norm_id = ent_id.replace("\\", "/").lower()

            is_allowed = False
            if norm_id in allowed_files:
                is_allowed = True
            else:
                # Track down deep lexical structures containing dynamic identifier tokens (e.g., path/to/file.java::ClassName)
                for allowed_f in allowed_files:
                    if norm_id.startswith(allowed_f):
                        is_allowed = True
                        break

            if is_allowed:
                filtered_entities.append(ent)
                allowed_entity_ids.add(ent_id)

        if not filtered_entities:
            warn("Audit Triggered: 0 index matches discovered! Generating relative context differential trace reports...", component="GraphifyAnalyze")
            info(f"Discovery manifest targets tracking size: {len(allowed_files)} items mapped.", component="GraphifyAnalyze")
            info(f"Graphify raw topology objects size: {len(raw_graph.get('entities', []))} items extracted.", component="GraphifyAnalyze")

            sample_manifest = list(allowed_files)[:3]
            sample_graphify = [e.get("id", "") for e in raw_graph.get("entities", [])[:3]]

            info(f"Path layout sampling (Manifest lookup format): {sample_manifest}", component="GraphifyAnalyze")
            info(f"Path layout sampling (Graphify index format):  {sample_graphify}", component="GraphifyAnalyze")
            warn("Structural divergence warning: Verify whether relative pathways vs workspace absolute path prefixes are misaligned.", component="GraphifyAnalyze")

        for rel in raw_graph.get("relations", []):
            src = rel.get("source", "")
            tgt = rel.get("target", "")
            if src in allowed_entity_ids and tgt in allowed_entity_ids:
                filtered_relations.append(rel)

        with open(output_json_path, 'w', encoding='utf-8') as dst_f:
            json.dump({"entities": filtered_entities, "relations": filtered_relations}, dst_f, indent=2, ensure_ascii=False)

        success(f"Reconciliation loop completed cleanly. Filtered artifact allocations saved: {len(filtered_entities)} Entities | {len(filtered_relations)} Relations.", component="GraphifyAnalyze")

    def _run_fallback_parser(self, manifest_path: str, output_json_path: str):
        with open(manifest_path, 'r', encoding='utf-8') as f:
            manifest = json.load(f)

        entities = []
        relations = []
        for file in manifest.get("files", []):
            if file.lower().endswith(".java"):
                entities.append({"id": file, "label": os.path.basename(file), "group": "file"})
                class_id = f"{file}::CommunityClass"
                entities.append({"id": class_id, "label": "CommunityClass", "group": "class"})
                relations.append({"source": file, "target": class_id, "type": "contains"})

        with open(output_json_path, 'w', encoding='utf-8') as f:
            json.dump({"entities": entities, "relations": relations}, f)

    def _cleanup_pid(self):
        if self.pid_file and os.path.exists(self.pid_file):
            try: os.remove(self.pid_file)
            except OSError: pass

    def kill(self):
        if self.process and self.process.poll() is None:
            try:
                if os.name == 'nt':
                    self.process.send_signal(signal.CTRL_BREAK_EVENT)
                else:
                    os.killpg(os.getpgid(self.process.pid), signal.SIGKILL)
            except Exception:
                pass
            finally:
                self.process.kill()
        self._cleanup_pid()
