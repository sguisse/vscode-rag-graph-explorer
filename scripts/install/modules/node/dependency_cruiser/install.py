import os
from install.base import BaseInstallModule
from install.registry import ModuleRegistry
from core.utils import execute_tracked_command

@ModuleRegistry.register_installer
class NodeDependencyCruiserInstaller(BaseInstallModule):
    @property
    def name(self) -> str: return "node_dependency_cruiser"

    def provisioning_dependency_cruiser(self, target_env: str):
        execute_tracked_command(["npm", "install", "dependency-cruiser@18.0.0"], "dc_install", cwd=target_env)

    def execute_all_installations(self) -> None:
        target_env = f"{self.context.tools_dir}/node"
        os.makedirs(target_env, exist_ok=True)
        if not os.path.exists(f"{target_env}/package.json"):
            execute_tracked_command(["npm", "init", "-y"], "dc_init", cwd=target_env)
        self.provisioning_dependency_cruiser(target_env)
