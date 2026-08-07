import os
from typing import Any
from core.vscode_settings_4_backend import vsCodeSettings
from core.utils import info
from core.context import EnvironmentContext


class JQAssistantContext:
    def __init__(self, ctx: EnvironmentContext):
        # We pass the global EnvironmentContext to derive specific paths
        self.version = vsCodeSettings.graphRagExplorer.jqassistant.version
        self.raw_outputs_dir = f"{ctx.raw_outputs_dir}/java"
        self.tools_dir = f"{ctx.tools_dir}/java/jqassistant"
        self.config_dir = f"{self.tools_dir}/config"

        self.templates_dir = f"{ctx.beScriptsPath}/scripts/install/modules/java/jqassistant/config/templates"
        self.jqassistant_template_path = os.path.join(self.templates_dir, ".jqassistant-template.yml")
        self.analysis_rules_template = os.path.join(self.templates_dir, "analysis-rules-template.xml")
        self.mcp_server_template_path = os.path.join(self.templates_dir, "mcp-server-template.json")

        self.rules_dir = f"{self.config_dir}/rules"
        self.custom_config_path = f"{self.config_dir}/.jqassistant.yml"
        self.exclude_paths_regex = vsCodeSettings.graphRagExplorer.excludePathsRegex
        self.download_url = vsCodeSettings.graphRagExplorer.jqassistant.downloadUrl

        self.mcp_server_key = "jqassistant-graph-rag"
        self.mcp_host = vsCodeSettings.graphRagExplorer.jqassistant.mcp.host
        self.mcp_port = vsCodeSettings.graphRagExplorer.jqassistant.mcp.port



    def get_java_src_paths_from_jqa_config(self) -> list:
        """
        Extracts the list of Java source directories directly from
        the jQAssistant configuration to ensure synchronization.
        """

        java_src_paths = []

        if not os.path.exists(self.custom_config_path):
            return java_src_paths

        with open(self.custom_config_path, "r", encoding="utf-8") as f:
            in_files_section = False
            for line in f:
                clean_line = line.strip()

                if clean_line == "files:":
                    in_files_section = True
                    continue

                if in_files_section and clean_line and not clean_line.startswith("-") and not clean_line.startswith("#"):
                    break

                if in_files_section and clean_line.startswith("-"):
                    extracted_path = clean_line.lstrip("-").strip(" '\"")

                    # We ignore the paths used by jQAssistant to scan the bytecode
                    if "java:classpath" in extracted_path:
                      continue

                    if "src/main/java" in extracted_path:
                        java_src_paths.append(extracted_path)

        return java_src_paths
