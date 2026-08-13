import os
from typing import Any
from core.VsCodeSettings_gen import vsCodeSettings
from core.utils import info
from core.context import EnvironmentContext


class JQAssistantContext:
    def __init__(self, ctx: EnvironmentContext):
        # We pass the global EnvironmentContext to derive specific paths
        self.version = vsCodeSettings.graphRagExplorer.jqassistant.version
        self.raw_outputs_dir = f"{ctx.raw_outputs_dir}/java"
        self.tools_dir = f"{ctx.tools_dir}/java/jqassistant"
        self.config_dir = f"{self.tools_dir}/config"
        self.workspace_root = ctx.workspace_root

        self.templates_dir = f"{ctx.beScriptsPath}/scripts/graph_rag_explorer/install/modules/java/jqassistant/config/templates"
        self.jqassistant_template_path = os.path.join(self.templates_dir, ".jqassistant-template.yml")
        self.analysis_rules_template = os.path.join(self.templates_dir, "analysis-rules-template.xml")
        self.mcp_server_template_path = os.path.join(self.templates_dir, "mcp-server-template.json")

        self.rules_dir = f"{self.config_dir}/rules"
        self.custom_config_path = f"{self.config_dir}/.jqassistant.yml"
        self.exclude_paths_regex = vsCodeSettings.graphRagExplorer.excludePathsRegex
        self.download_url = vsCodeSettings.graphRagExplorer.jqassistant.downloadUrl
