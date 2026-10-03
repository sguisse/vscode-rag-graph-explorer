import os
from core.VsCodeSettings_gen import vsCodeSettings
from graph_rag_explorer.install.context import GraphRagExplorerContext

JQASSISTANT_MODULE_NAME = "java_jqassistant"


class JQAssistantContext(GraphRagExplorerContext):
    def __init__(self, ctx: GraphRagExplorerContext):
        super().__init__(tool_name=ctx.tool_name)
        # We pass the global GraphRagExplorerContext to derive specific paths
        self.version = vsCodeSettings.graphRagExplorer.jqassistant.version
        self.raw_outputs_dir = f"{self.raw_outputs_dir}/java"
        self.tools_dir = f"{self.tools_dir}/java/jqassistant"
        self.config_dir = f"{self.tools_dir}/config"

        self.templates_dir = f"{self.beScriptsPath}/scripts/graph_rag_explorer/install/modules/java/jqassistant/config/templates"
        self.jqassistant_template_path = os.path.join(self.templates_dir, ".jqassistant-template.yml")
        self.analysis_rules_template = os.path.join(self.templates_dir, "analysis-rules-template.xml")
        # Portable good-practice packs (tech-* / xc-* / gp:Default), copied verbatim into rules_dir
        self.rule_packs_dir = os.path.join(self.templates_dir, "rules")
        # Application pack versioned in the application repository (rules, rule-parameters.yml, audit-rule-map.yaml)
        self.app_pack_dir = os.path.join(self.workspace_root, "jqassistant")
        self.mcp_server_template_path = os.path.join(self.templates_dir, "mcp-server-template.json")

        self.rules_dir = f"{self.config_dir}/rules"
        self.custom_config_path = f"{self.config_dir}/.jqassistant.yml"
        self.exclude_paths_regex = vsCodeSettings.graphRagExplorer.excludePathsRegex
        self.download_url = vsCodeSettings.graphRagExplorer.jqassistant.downloadUrl
