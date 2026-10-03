import yaml
from typing import Any, Dict, List


class ReplaceTag:
    """Tag class indicating that the list or dict should completely replace the target."""
    def __init__(self, value: Any):
        self.value = value


class ExtendTag:
    """Tag class indicating that the list should append elements to the target."""
    def __init__(self, value: Any):
        self.value = value


class MergeByKeyTag:
    """Tag class indicating that list items should be merged by a specific primary key."""
    def __init__(self, key: str, items: List[Any]):
        self.key = key
        self.items = items


def replace_constructor(loader: yaml.Loader, node: yaml.Node) -> ReplaceTag:
    if isinstance(node, yaml.SequenceNode):
        value = loader.construct_sequence(node)
    elif isinstance(node, yaml.MappingNode):
        value = loader.construct_mapping(node)
    else:
        value = loader.construct_scalar(node)
    return ReplaceTag(value)


def extend_constructor(loader: yaml.Loader, node: yaml.Node) -> ExtendTag:
    if isinstance(node, yaml.SequenceNode):
        value = loader.construct_sequence(node)
    elif isinstance(node, yaml.MappingNode):
        value = loader.construct_mapping(node)
    else:
        value = loader.construct_scalar(node)
    return ExtendTag(value)


def merge_by_key_constructor(loader: yaml.Loader, node: yaml.Node) -> MergeByKeyTag:
    mapping = loader.construct_mapping(node)
    key = mapping.get("key", "id")
    items = mapping.get("items", [])
    return MergeByKeyTag(key, items)


def register_custom_tags() -> None:
    """Registers custom YAML tags into PyYAML SafeLoader."""
    yaml.SafeLoader.add_constructor("!replace", replace_constructor)
    yaml.SafeLoader.add_constructor("!extend", extend_constructor)
    yaml.SafeLoader.add_constructor("!merge_by_key", merge_by_key_constructor)