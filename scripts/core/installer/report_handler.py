import os
import json
from core.installer.context import BaseEnvironmentContext
from core.utils import info, success, error

# Legacy report name still consumed by the extension host (GraphRagInstallerAdapter.readInstallationReport)
LEGACY_FINAL_STATUS_FILE = "final-status.json"
TOOL_STATUS_FILE = "tool-status.json"
GLOBAL_STATUS_FILE = "global-status.json"


class ReportHandler:
    """Global state report handler managing reports grouped by sub install directory / tool name."""

    def __init__(self, context: BaseEnvironmentContext):
        self.context = context

    def save_snapshot(self, module_name: str, phase: str, data: dict):
        """Saves a module installation snapshot under the sub install grouped directory."""
        target_path = f"{self.context.install_reports_dir}/{module_name}/{phase}"
        os.makedirs(target_path, exist_ok=True)
        with open(f"{target_path}/status.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def compile_tool_summary(self) -> dict:
        """Compiles and saves summary for the specific sub install directory / tool group."""
        tool_report = {}
        global_steps, global_ko, global_ok = 0, 0, 0
        has_warnings = False

        if os.path.exists(self.context.install_reports_dir):
            for entry in os.listdir(self.context.install_reports_dir):
                module_dir = os.path.join(self.context.install_reports_dir, entry)
                if os.path.isdir(module_dir):
                    after_file = os.path.join(module_dir, "after", "status.json")
                    if os.path.exists(after_file):
                        try:
                            with open(after_file, "r", encoding="utf-8") as f:
                                sub_data = json.load(f)
                            tool_report[entry] = sub_data
                            sub_summary = sub_data.get("summary", {})
                            global_steps += int(sub_summary.get("stepsCount", 0))
                            global_ko += int(sub_summary.get("koCount", 0))
                            global_ok += int(sub_summary.get("okCount", 0))
                            if sub_summary.get("globalStatus") != "✅":
                                has_warnings = True
                        except Exception as e:
                            error(f"Unreadable module report '{after_file}': {e}", component="ReportHandler")
                            has_warnings = True

        tool_report["summary"] = {
            "toolName": self.context.tool_name,
            "globalStatus": "⚠️" if (has_warnings or global_ko > 0) else "✅",
            "stepsCount": str(global_steps),
            "koCount": global_ko,
            "okCount": global_ok,
        }

        summary_path = f"{self.context.install_reports_dir}/{TOOL_STATUS_FILE}"
        with open(summary_path, "w", encoding="utf-8") as out_f:
            json.dump(tool_report, out_f, indent=2, ensure_ascii=False)

        legacy_path = f"{self.context.install_reports_dir}/{LEGACY_FINAL_STATUS_FILE}"
        with open(legacy_path, "w", encoding="utf-8") as out_f:
            json.dump(tool_report, out_f, indent=2, ensure_ascii=False)

        info(
            f"Tool report [{self.context.tool_name}] written: {tool_report['summary']['globalStatus']} "
            f"(steps={global_steps}, ok={global_ok}, ko={global_ko}) -> {summary_path}",
            component="ReportHandler",
        )

        return tool_report

    def compile_global_summary(self) -> dict:
        """Aggregates all sub install directory summaries into a global state report."""
        global_report = {}
        overall_steps, overall_ko, overall_ok = 0, 0, 0
        overall_warnings = False

        global_reports_dir = self.context.global_install_reports_dir
        # Each tool stores its own report under <global_target_dir>/<tool>/install_reports/
        global_target_dir = self.context.global_target_dir
        if os.path.exists(global_target_dir):
            for tool_folder in sorted(os.listdir(global_target_dir)):
                tool_status_file = os.path.join(global_target_dir, tool_folder, "install_reports", TOOL_STATUS_FILE)
                if os.path.isfile(tool_status_file):
                    try:
                        with open(tool_status_file, "r", encoding="utf-8") as f:
                            tool_data = json.load(f)
                        global_report[tool_folder] = tool_data
                        t_summary = tool_data.get("summary", {})
                        overall_steps += int(t_summary.get("stepsCount", 0))
                        overall_ko += int(t_summary.get("koCount", 0))
                        overall_ok += int(t_summary.get("okCount", 0))
                        if t_summary.get("globalStatus") != "✅":
                            overall_warnings = True
                    except Exception as e:
                        error(f"Unreadable tool report '{tool_status_file}': {e}", component="ReportHandler")
                        overall_warnings = True

        global_report["globalSummary"] = {
            "globalStatus": "⚠️️" if (overall_warnings or overall_ko > 0) else "✅",
            "totalStepsCount": str(overall_steps),
            "totalKoCount": overall_ko,
            "totalOkCount": overall_ok,
        }

        os.makedirs(global_reports_dir, exist_ok=True)
        global_file = f"{global_reports_dir}/{GLOBAL_STATUS_FILE}"
        with open(global_file, "w", encoding="utf-8") as out_f:
            json.dump(global_report, out_f, indent=2, ensure_ascii=False)

        info(
            f"Global report written: {global_report['globalSummary']['globalStatus']} "
            f"(steps={overall_steps}, ok={overall_ok}, ko={overall_ko}) -> {global_file}",
            component="ReportHandler",
        )

        return global_report

    def compile_final_summary(self):
        """Compiles both the grouped tool summary and global state summary."""
        info("Compiling final installation reports...", component="ReportHandler")
        self.compile_tool_summary()
        self.compile_global_summary()
        success("Installation reports compiled.", component="ReportHandler")