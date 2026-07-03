import re
import json
from typing import Any, Dict, Set

class VsCodeSettingsBeManager:
    """
    Central configuration registry that stores configurations by concern,
    resolves placeholder references, and dynamically generates Python Dataclass source code.
    """
    # Class-level constant for string interpolation matching
    _INTERPOLATION_REGEX = re.compile(r"\${([^}]+)}")
    baseScope = "graphRagExplorer."

    def __init__(self):
        self._registry: Dict[str, Any] = {}

    def _normalize_key(self, key: str) -> str:
        """Ensures the key always contains the baseScope prefix for uniform lookup."""
        if key.startswith(self.baseScope):
            return key
        return f"{self.baseScope}{key}"

    def inject_vscode_settings(self, settings_json: Dict[str, Any]) -> None:
        """Injects VS Code configurations at startup."""
        self._merge_dict(settings_json)

    def get(self, key: str, default: Any = None) -> Any:
        """Retrieves a fully resolved configuration parameter."""
        return self._resolve_value(key, set(), default)

    def containsKey(self, key: str) -> bool:
        """Checks if the configuration registry contains the specified key (prefix-agnostic)."""
        return self._normalize_key(key) in self._registry

    def getMap(self) -> Dict[str, Any]:
        """Retrieves a dictionary of all configuration keys with their fully resolved values."""
        return {k: self.get(k) for k in self._registry}

    def _merge_dict(self, target_dict: Dict[str, Any], prefix: str = "") -> None:
        """Recursively flattens nested dictionaries into dot-notated keys."""
        for k, v in target_dict.items():
            full_key = f"{prefix}{k}" if not prefix else f"{prefix}.{k}"
            if isinstance(v, dict):
                self._merge_dict(v, full_key)
            else:
                self._registry[full_key] = v

    def _resolve_value(self, key: str, visited: Set[str], default: Any = None) -> Any:
        # Normalize the key right away so lookups and circular-dependency checks match up
        normalized_key = self._normalize_key(key)

        if normalized_key in visited:
            return default

        value = self._registry.get(normalized_key)
        if value is None:
            return default

        visited.add(normalized_key)
        if isinstance(value, str):
            value = self._interpolate_string(value, visited)
        visited.remove(normalized_key)
        return value

    def _interpolate_string(self, text: str, visited: Set[str]) -> str:
        def replacer(match: re.Match) -> str:
            target_key = match.group(1).strip()
            resolved = self._resolve_value(target_key, visited, default=match.group(0))
            return str(resolved)
        return self._INTERPOLATION_REGEX.sub(replacer, text)

    def _to_python_attribute(self, key: str) -> str:
        """Converts configuration keys into clean Python attribute identifiers."""
        attr = key
        if attr.startswith(self.baseScope):
            attr = attr[len(self.baseScope):]
        return attr.replace(".", "_")

    def _detect_python_type(self, value: Any) -> str:
        """Infers type hints dynamically based on resolved configuration values."""
        if isinstance(value, bool):
            return "bool"
        if isinstance(value, int):
            return "int"
        if isinstance(value, float):
            return "float"
        if isinstance(value, list):
            return "list"
        return "str"

    def buildDataClass(self) -> str:
        """
        Inspects the configuration registry and generates the complete ScriptsContext
        dataclass code string, including full attribute assignment inside the factory method.
        """
        attributes_lines = []
        factory_assignments = []
        processed_attributes = set()

        # Sort keys to ensure deterministic and organized code generation
        for key in sorted(self._registry.keys()):
            attr_name = self._to_python_attribute(key)

            if attr_name in processed_attributes:
                continue
            processed_attributes.add(attr_name)

            resolved_value = self.get(key)
            type_hint = self._detect_python_type(resolved_value)

            # 1. Generate the class attribute definitions
            attributes_lines.append(f"    {attr_name}: {type_hint}")

            # 2. Generate the keyword initialization lines for the factory method
            if attr_name == "workspaceRoot":
                factory_assignments.append(f"            {attr_name}=context_provider.get('{key}', os.getcwd())")
            else:
                factory_assignments.append(f"            {attr_name}=context_provider.get('{key}')")

        attributes_block = "\n".join(attributes_lines)
        factory_block = ",\n".join(factory_assignments)

        # Generate structural template (escaping runtime brace expressions cleanly)
        template = f"""@dataclass(frozen=True)
class ScriptsContext:
    \"\"\"Immutable parameter object to encapsulate the environment topologies.\"\"\"
{attributes_block}

    @classmethod
    def build_from_context(cls, context_provider: Any) -> "ScriptsContext":
        \"\"\"Factory method to cleanly parse and instantiate all parameters automatically.\"\"\"
        return cls(
{factory_block}
        )

    @classmethod
    def log_context(cls, ctx: "ScriptsContext") -> None:
        \"\"\"Utility method to log the context parameters for debugging purposes.\"\"\"
        info(f"ScriptsContext: {{json.dumps(ctx.__dict__, indent=2)}}", component="ScriptsContext")"""

        return template

# Global runtime instance
vsCodeSettings = VsCodeSettingsBeManager()
