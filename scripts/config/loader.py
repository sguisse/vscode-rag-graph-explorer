import os
import re
import sys
import yaml
from typing import Any, Dict, List, Optional
from core.VsCodeSettings_gen import vsCodeSettings
from config.tags import register_custom_tags, ReplaceTag, ExtendTag, MergeByKeyTag

register_custom_tags()

SENSITIVE_KEYS = {"geminikey", "apikey", "password", "token", "secret", "private"}


class ReadOnlyConfigError(TypeError):
    """Raised when attempting to modify a frozen configuration instance."""
    pass


class ConfigDictWrapper:
    """Read-only wrapper providing dot-notation access to nested dictionary structures."""

    def __init__(self, data: Dict[str, Any], frozen: bool = True, provenance: Optional[Dict[str, str]] = None):
        self._provenance = provenance or {}
        self._data: Dict[str, Any] = {}
        for key, value in data.items():
            if isinstance(value, dict):
                self._data[key] = ConfigDictWrapper(value, frozen=frozen, provenance=self._provenance)
            elif isinstance(value, list):
                self._data[key] = [
                    ConfigDictWrapper(item, frozen=frozen, provenance=self._provenance) if isinstance(item, dict) else item
                    for item in value
                ]
            else:
                self._data[key] = value
        self._frozen = frozen

    def __getattr__(self, name: str) -> Any:
        if name.startswith("_"):
            return super().__getattribute__(name)
        if name in self._data:
            return self._data[name]
        raise AttributeError(f"'ConfigDictWrapper' object has no attribute '{name}'")

    def __setattr__(self, name: str, value: Any) -> None:
        if getattr(self, "_frozen", False) and not name.startswith("_"):
            raise ReadOnlyConfigError(f"Configuration is frozen and immutable. Cannot modify attribute '{name}'.")
        super().__setattr__(name, value)

    def __getitem__(self, item: str) -> Any:
        return getattr(self, item)

    def to_dict(self, mask_secrets: bool = False) -> Dict[str, Any]:
        """Converts configuration tree to standard Python dictionary with optional secret masking."""
        result: Dict[str, Any] = {}
        for k, v in self._data.items():
            if mask_secrets and any(s in k.lower() for s in SENSITIVE_KEYS):
                result[k] = "***MASKED***"
            elif isinstance(v, ConfigDictWrapper):
                result[k] = v.to_dict(mask_secrets=mask_secrets)
            elif isinstance(v, list):
                res_list = []
                for item in v:
                    if isinstance(item, ConfigDictWrapper):
                        res_list.append(item.to_dict(mask_secrets=mask_secrets))
                    else:
                        res_list.append(item)
                result[k] = res_list
            else:
                result[k] = v
        return result

    def explain(self, path: str) -> str:
        """Returns the origin and provenance history of a configuration property."""
        val = self.get_nested_value(path)
        origin = self._provenance.get(path, "Default setting or dynamic calculation")
        return f"Key '{path}' = {val} (Origin: {origin})"

    def get_nested_value(self, path: str) -> Any:
        """Navigates dot-separated key path."""
        keys = path.split(".")
        curr: Any = self
        for k in keys:
            if isinstance(curr, ConfigDictWrapper) and hasattr(curr, k):
                curr = getattr(curr, k)
            elif isinstance(curr, dict) and k in curr:
                curr = curr[k]
            else:
                return None
        return curr

    def __repr__(self) -> str:
        return f"ConfigDictWrapper({self.to_dict(mask_secrets=True)})"


class ConfigEngine:
    """Core Engine managing Spring Boot-like configuration resolution, precedence, and interpolation."""

    VAR_PATTERN = re.compile(r"\$\{([^}]+)\}")

    def __init__(self):
        self.provenance: Dict[str, str] = {}
        self._cached_config: Optional[ConfigDictWrapper] = None
        self._cached_mtimes: Dict[str, float] = {}

    def _log_warn(self, msg: str) -> None:
        try:
            from core.utils import warn
            warn(msg, component="ConfigEngine")
        except Exception:
            print(f"⚠️ [WARN] [ConfigEngine] {msg}", file=sys.stderr)

    def _log_info(self, msg: str) -> None:
        try:
            from core.utils import info
        except ImportError:
            # core.utils is still importing this package (start-up circular import): stay silent, later reloads are logged
            return
        info(msg, component="ConfigEngine")

    def _get_mtime(self, file_path: str) -> float:
        try:
            return os.path.getmtime(file_path) if os.path.exists(file_path) else 0.0
        except OSError:
            return 0.0

    def _deep_merge(self, base: Dict[str, Any], override: Dict[str, Any], path_prefix: str = "", origin: str = "Unknown") -> Dict[str, Any]:
        for key, value in override.items():
            current_path = f"{path_prefix}.{key}" if path_prefix else key

            if isinstance(value, ReplaceTag):
                base[key] = value.value
                self.provenance[current_path] = f"{origin} (!replace)"
            elif isinstance(value, ExtendTag):
                existing = base.get(key, [])
                if isinstance(existing, list) and isinstance(value.value, list):
                    base[key] = existing + value.value
                else:
                    base[key] = value.value
                self.provenance[current_path] = f"{origin} (!extend)"
            elif isinstance(value, MergeByKeyTag):
                existing = base.get(key, [])
                if isinstance(existing, list) and isinstance(value.items, list):
                    p_key = value.key
                    merged_list = list(existing)
                    index_map = {item[p_key]: idx for idx, item in enumerate(merged_list) if isinstance(item, dict) and p_key in item}
                    for item in value.items:
                        if isinstance(item, dict) and p_key in item and item[p_key] in index_map:
                            idx = index_map[item[p_key]]
                            merged_list[idx] = self._deep_merge(merged_list[idx], item, f"{current_path}[{item[p_key]}]", origin)
                        else:
                            merged_list.append(item)
                    base[key] = merged_list
                else:
                    base[key] = value.items
                self.provenance[current_path] = f"{origin} (!merge_by_key '{value.key}')"
            elif isinstance(value, dict) and key in base and isinstance(base[key], dict):
                self._deep_merge(base[key], value, current_path, origin)
            elif isinstance(value, list) and key in base and isinstance(base[key], list):
                base[key] = self._merge_lists(base[key], value, current_path, origin)
            else:
                base[key] = value
                self.provenance[current_path] = origin
        return base

    def _merge_lists(self, base_list: List[Any], override_list: List[Any], current_path: str, origin: str) -> List[Any]:
        if not base_list or not override_list:
            return base_list + override_list

        if isinstance(base_list[0], dict) and isinstance(override_list[0], dict):
            primary_keys = ["id", "name", "label", "key"]
            found_p_key = next((pk for pk in primary_keys if pk in base_list[0]), None)
            if found_p_key:
                merged = list(base_list)
                index_map = {item[found_p_key]: idx for idx, item in enumerate(merged) if isinstance(item, dict) and found_p_key in item}
                for over_item in override_list:
                    if isinstance(over_item, dict) and found_p_key in over_item and over_item[found_p_key] in index_map:
                        idx = index_map[over_item[found_p_key]]
                        merged[idx] = self._deep_merge(merged[idx], over_item, f"{current_path}[{over_item[found_p_key]}]", origin)
                    else:
                        merged.append(over_item)
                return merged

        merged = list(base_list)
        for item in override_list:
            if item not in merged:
                merged.append(item)
        return merged

    def _resolve_imports(self, config_dir: str, current_data: Dict[str, Any], origin: str) -> Dict[str, Any]:
        imports = current_data.pop("imports", [])
        if isinstance(imports, str):
            imports = [imports]

        merged_data: Dict[str, Any] = {}
        for import_file in imports:
            import_path = os.path.join(config_dir, import_file)
            if os.path.exists(import_path):
                try:
                    with open(import_path, "r", encoding="utf-8") as f:
                        imported_content = yaml.safe_load(f) or {}
                    imported_content = self._resolve_imports(config_dir, imported_content, f"File: {import_file}")
                    merged_data = self._deep_merge(merged_data, imported_content, origin=f"File: {import_file}")
                except Exception as e:
                    self._log_warn(f"Failed to load import file '{import_file}': {e}")

        return self._deep_merge(merged_data, current_data, origin=origin)

    def _get_nested_raw_value(self, data: Dict[str, Any], path: str) -> Any:
        keys = path.split(".")
        curr: Any = data
        for k in keys:
            if isinstance(curr, dict) and k in curr:
                curr = curr[k]
            else:
                return None
        return curr

    def _interpolate_string(self, val: str, root_data: Dict[str, Any]) -> str:
        def replace_match(match):
            expr = match.group(1).strip()

            # Filter functions pipeline support
            if ":" in expr and not expr.startswith("env:"):
                prefix, target = expr.split(":", 1)
                if prefix == "abs_path":
                    raw_v = self._interpolate_string(f"${{{target}}}", root_data)
                    return os.path.abspath(raw_v).replace("\\", "/") if raw_v else ""
                elif prefix == "lower":
                    raw_v = self._interpolate_string(f"${{{target}}}", root_data)
                    return str(raw_v).lower()
                elif prefix == "default":
                    parts = target.split(":", 1)
                    target_key = parts[0]
                    default_val = parts[1].strip("\"'") if len(parts) > 1 else ""
                    resolved = self._get_nested_raw_value(root_data, target_key)
                    return str(resolved) if resolved is not None else default_val

            if expr.startswith("env:"):
                parts = expr[4:].split(":", 1)
                env_var = parts[0]
                default_val = parts[1].strip("\"'") if len(parts) > 1 else ""
                return os.environ.get(env_var, default_val)

            resolved = self._get_nested_raw_value(root_data, expr)
            if resolved is not None and not isinstance(resolved, (dict, list)):
                return str(resolved)
            return match.group(0)

        prev = None
        current = val
        while prev != current and isinstance(current, str):
            prev = current
            current = self.VAR_PATTERN.sub(replace_match, current)
        return current

    def _resolve_interpolations(self, node: Any, root_data: Dict[str, Any]) -> Any:
        if isinstance(node, dict):
            return {k: self._resolve_interpolations(v, root_data) for k, v in node.items()}
        elif isinstance(node, list):
            return [self._resolve_interpolations(item, root_data) for item in node]
        elif isinstance(node, str):
            return self._interpolate_string(node, root_data)
        return node

    def build_config(self, force_reload: bool = False) -> ConfigDictWrapper:
        workspace_root = vsCodeSettings.workspaceRoot or os.getcwd()
        backend_path = getattr(vsCodeSettings, "backendWorkspacePath", None)
        if not backend_path:
            raise ValueError("backendWorkspacePath is missing or undefined in vsCodeSettings configuration.")

        config_dir = os.path.join(workspace_root, backend_path, "config").replace("\\", "/")

        app_profile = os.environ.get("APP_PROFILE", "")
        app_yaml = os.path.join(config_dir, "application.yaml")
        profile_yaml = os.path.join(config_dir, f"application-{app_profile}.yaml") if app_profile else None

        # Caching & Hot-reload check
        tracked_files = [f for f in [app_yaml, profile_yaml] if f and os.path.exists(f)]
        current_mtimes = {f: self._get_mtime(f) for f in tracked_files}

        if not force_reload and self._cached_config is not None and self._cached_mtimes == current_mtimes:
            return self._cached_config

        self._log_info(
            f"Building central configuration (force_reload={force_reload}, profile='{app_profile or 'default'}', "
            f"workspace_root='{workspace_root}', config_dir='{config_dir}')."
        )

        self.provenance.clear()

        # Layer 5 (Lowest): VS Code Settings
        vscode_dict = vsCodeSettings.__dict__.copy()
        for k in vscode_dict.keys():
            self.provenance[f"vsCodeSettings.{k}"] = "VsCodeSettings default dataclass"

        base_config: Dict[str, Any] = {
            "vsCodeSettings": vscode_dict,
            "profile": app_profile
        }

        # Layer 4 & 3: Main YAML & Profile YAML
        if not os.path.exists(config_dir):
            self._log_info(f"No config directory at '{config_dir}': using VS Code settings defaults only.")
        if os.path.exists(config_dir):
            if os.path.exists(app_yaml):
                try:
                    with open(app_yaml, "r", encoding="utf-8") as f:
                        yaml_data = yaml.safe_load(f) or {}
                    yaml_data = self._resolve_imports(config_dir, yaml_data, origin="application.yaml")
                    base_config = self._deep_merge(base_config, yaml_data, origin="application.yaml")
                    self._log_info(f"Loaded configuration layer: {app_yaml}")
                except Exception as e:
                    self._log_warn(f"Syntax error in 'application.yaml': {e}. Falling back to default settings.")

            if profile_yaml and os.path.exists(profile_yaml):
                try:
                    with open(profile_yaml, "r", encoding="utf-8") as f:
                        profile_data = yaml.safe_load(f) or {}
                    profile_data = self._resolve_imports(config_dir, profile_data, origin=f"application-{app_profile}.yaml")
                    base_config = self._deep_merge(base_config, profile_data, origin=f"application-{app_profile}.yaml")
                    self._log_info(f"Loaded configuration layer: {profile_yaml}")
                except Exception as e:
                    self._log_warn(f"Syntax error in 'application-{app_profile}.yaml': {e}. Skipping profile config.")

        # Layer 2: Environment Variables (prefix APP_)
        for env_k, env_v in os.environ.items():
            if env_k.startswith("APP_"):
                config_key = env_k[4:].lower().replace("__", ".")
                keys = config_key.split(".")
                curr = base_config
                for i, k in enumerate(keys):
                    if i == len(keys) - 1:
                        curr[k] = env_v
                        self.provenance[config_key] = f"Environment Variable '{env_k}'"
                    else:
                        if k not in curr or not isinstance(curr[k], dict):
                            curr[k] = {}
                        curr = curr[k]

        # Layer 1 (Highest): CLI Arguments (e.g. --neo4j-port=7688)
        for arg in sys.argv[1:]:
            if arg.startswith("--") and "=" in arg:
                cli_k, cli_v = arg[2:].split("=", 1)
                config_key = cli_k.replace("-", "_").replace("__", ".")
                keys = config_key.split(".")
                curr = base_config
                for i, k in enumerate(keys):
                    if i == len(keys) - 1:
                        curr[k] = cli_v
                        self.provenance[config_key] = f"CLI argument '{arg}'"
                    else:
                        if k not in curr or not isinstance(curr[k], dict):
                            curr[k] = {}
                        curr = curr[k]

        # Interpolation resolution
        resolved_config = self._resolve_interpolations(base_config, base_config)

        self._log_info("Central configuration resolved (interpolations applied, instance frozen).")

        # Freeze & Cache instance
        built_obj = ConfigDictWrapper(resolved_config, frozen=True, provenance=self.provenance)
        self._cached_config = built_obj
        self._cached_mtimes = current_mtimes
        return built_obj


_engine_instance = ConfigEngine()


def get_config(force_reload: bool = False) -> ConfigDictWrapper:
    return _engine_instance.build_config(force_reload=force_reload)
