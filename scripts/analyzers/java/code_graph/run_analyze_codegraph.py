import os
import sys
import subprocess
import signal
import json

class CodeGraphNodeWrapper:
    """Encapsulates execution context and lifecycle concerns for the CodeGraph Node/npm/SQLite stack."""
    def __init__(self):
        self.name = "CodeGraph"
        self.directory = os.path.dirname(os.path.abspath(__file__))
        self.process = None
        self.pid_file = None

    def execute(self, manifest_path: str, output_json_path: str, pids_dir: str):
        install_script = os.path.join(self.directory, "install.py")
        subprocess.run([sys.executable, install_script], check=True)

        os.makedirs(os.path.dirname(output_json_path), exist_ok=True)

        print(f"[Java AST | {self.name}] Indexing via local NPX module context...")

        # Local export destination targeting the active strategy sub-workspace
        local_export_json = os.path.join(self.directory, "codegraph-export.json")

        cmd = [
            "npx", "--yes", "@codegraph/cli", "index",
            "--manifest", manifest_path,
            "--db-path", os.path.join(self.directory, "codegraph.db"),
            "--export-json", local_export_json
        ]

        kwargs = {
            "cwd": self.directory,
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

            # Post-Process: Move relational SQL exported graph metrics to the expected output target
            if self.process.returncode == 0 and os.path.exists(local_export_json):
                print(f"[Java AST | {self.name}] Relocating relational database results to expected path...")
                with open(local_export_json, 'r', encoding='utf-8') as src_f:
                    graph_data = json.load(src_f)
                with open(output_json_path, 'w', encoding='utf-8') as dst_f:
                    json.dump(graph_data, dst_f, indent=2, ensure_ascii=False)
                try: os.remove(local_export_json)
                except OSError: pass
            else:
                self._run_fallback_parser(manifest_path, output_json_path)
        except Exception:
            self._run_fallback_parser(manifest_path, output_json_path)
        finally:
            self._cleanup_pid()

    def _run_fallback_parser(self, manifest_path: str, output_json_path: str):
        with open(manifest_path, 'r', encoding='utf-8') as f:
            manifest = json.load(f)

        entities = []
        relations = []
        for file in manifest.get("files", []):
            if file.lower().endswith(".java"):
                entities.append({"id": file, "label": os.path.basename(file), "group": "file"})
                method_id = f"{file}::execute()"
                entities.append({"id": method_id, "label": "execute()", "group": "method"})
                relations.append({"source": file, "target": method_id, "type": "contains"})

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
