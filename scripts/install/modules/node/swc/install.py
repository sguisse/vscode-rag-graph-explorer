import os
from install.base import BaseInstallModule
from install.registry import ModuleRegistry
from core.utils import execute_tracked_command

@ModuleRegistry.register_installer
class NodeSwcInstaller(BaseInstallModule):
    @property
    def name(self) -> str: return "node_swc"

    def init_package_json(self, target_env: str):
        if not os.path.exists(f"{target_env}/package.json"):
            execute_tracked_command(["npm", "init", "-y"], "swc_init", cwd=target_env)

    def install_swc_core(self, target_env: str):
        execute_tracked_command(["npm", "install", "@swc/core@1.15.43"], "swc_install", cwd=target_env)

    def execute_all_installations(self) -> None:
        target_env = f"{self.context.tools_dir}/node"
        os.makedirs(target_env, exist_ok=True)
        self.init_package_json(target_env)
        self.install_swc_core(target_env)
