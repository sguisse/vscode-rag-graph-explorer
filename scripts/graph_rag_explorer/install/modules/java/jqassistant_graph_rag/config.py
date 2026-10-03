import os
import shutil
import yaml
from install.config import GraphRagExplorerConfig
from core.installer.registry import InstallerRegistry
from install.modules.java.jqassistant_graph_rag.context import (
    JAVA_JQASSISTANT_GRAPH_RAG_MODULE_NAME,
    JQAssistantGraphRagContext,
)
from core.utils import info, success, warn


@InstallerRegistry.register_configurator
class JQAssistantGraphRagConfigurator(GraphRagExplorerConfig):
    """
    Tool-specific configurator for java_jqassistant_graph_rag.
    Reads external configuration from <workspace>/<backendWorkspacePath>/config/java/java_jqassistant_graph_rag/
    and synchronizes rules or options prior to executing check.py.
    """

    def __init__(self, context):
        super().__init__(context=context, category="java")
        self.jqa_ctx = JQAssistantGraphRagContext(context)

    @property
    def name(self) -> str:
        return JAVA_JQASSISTANT_GRAPH_RAG_MODULE_NAME

    def execute_configuration(self) -> None:
        """
        Executes externalized tool configuration sync.
        Copies user rules or custom configuration files from <workspace>/<backendWorkspacePath>/config/java/java_jqassistant_graph_rag/
        into the target tool runtime folder.
        """
        info(f"Applying externalized tool configuration for [{self.name}]...", component=self.name)

        # Sync external YAML configuration or rule overrides if present
        external_rules_file = os.path.join(self.external_config_dir, "custom-rules.yaml")
        if os.path.exists(external_rules_file):
            target_rules_dest = os.path.join(self.jqa_ctx.tools_git_clone, "custom-rules.yaml")
            os.makedirs(os.path.dirname(target_rules_dest), exist_ok=True)
            shutil.copy2(external_rules_file, target_rules_dest)
            success(f"Synchronized custom rules from '{external_rules_file}' to '{target_rules_dest}'.", component=self.name)
        else:
            info(f"No custom-rules.yaml found in '{self.external_config_dir}'. Template baseline retained.", component=self.name)