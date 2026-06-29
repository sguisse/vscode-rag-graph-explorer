import os
import json
from install.base import EnvironmentContext

class ReportHandler:
    def __init__(self, context: EnvironmentContext):
        self.context = context

    def save_snapshot(self, module_name: str, phase: str, data: dict):
        target_path = f"{self.context.install_outputs_dir}/{module_name}/{phase}"
        os.makedirs(target_path, exist_ok=True)
        with open(f"{target_path}/status.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def compile_final_summary(self):
        final_report = {}
        global_steps, global_ko, global_ok = 0, 0, 0
        has_warnings = False

        if os.path.exists(self.context.install_outputs_dir):
            for module_name in os.listdir(self.context.install_outputs_dir):
                after_file = f"{self.context.install_outputs_dir}/{module_name}/after/status.json"
                if os.path.exists(after_file):
                    try:
                        with open(after_file, "r", encoding="utf-8") as f:
                            sub_data = json.load(f)
                        final_report[module_name] = sub_data
                        sub_summary = sub_data.get("summary", {})
                        global_steps += int(sub_summary.get("stepsCount", 0))
                        global_ko += int(sub_summary.get("koCount", 0))
                        global_ok += int(sub_summary.get("okCount", 0))
                        if sub_summary.get("globalStatus") != "✅":
                            has_warnings = True
                    except Exception:
                        has_warnings = True

        final_report["summary"] = {
            "globalStatus": "⚠️" if (has_warnings or global_ko > 0) else "✅",
            "stepsCount": str(global_steps),
            "koCount": global_ko,
            "okCount": global_ok
        }

        with open(f"{self.context.install_outputs_dir}/final-status.json", "w", encoding="utf-8") as out_f:
            json.dump(final_report, out_f, indent=2, ensure_ascii=False)
