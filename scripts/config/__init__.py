from config.loader import get_config, ConfigDictWrapper, ReadOnlyConfigError

config = get_config()


def reload_config() -> ConfigDictWrapper:
    global config
    config = get_config(force_reload=True)
    return config


__all__ = ["config", "get_config", "reload_config", "ConfigDictWrapper", "ReadOnlyConfigError"]