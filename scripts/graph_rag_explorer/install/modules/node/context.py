import os
from typing import Any
from core.VsCodeSettings_gen import vsCodeSettings
from core.utils import info
from core.context import EnvironmentContext


class NodeContext:
    def __init__(self, ctx: EnvironmentContext):
        # We pass the global EnvironmentContext to derive specific paths
        self.node_env_path = f"{ctx.tools_dir}/node"
