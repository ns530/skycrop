import os
import yaml
from typing import Any, Dict


def _expand_env_style_vars(value: Any) -> Any:
    """
    Expand strings like ${VAR:-default} using environment variables.
    Non-strings are returned as-is.
    """
    if not isinstance(value, str):
        return value

    out = value

    # Simple ${VAR} expansion
    out = os.path.expandvars(out)

    # Handle ${VAR:-default}
    # We do a conservative parse for patterns of the exact form ${NAME:-default}
    # and replace with os.getenv("NAME", "default")
    def _replace_default(match):
        inner = match.group(1)
        if ":-" in inner:
            var, default = inner.split(":-", 1)
            return os.getenv(var, default)
        return os.getenv(inner, "")

    import re

    out = re.sub(r"\$\{([^}]+)\}", _replace_default, out)
    return out


def _expand_in_obj(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {k: _expand_in_obj(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_expand_in_obj(v) for v in obj]
    return _expand_env_style_vars(obj)


def load_yaml_config(path: str) -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f) or {}
    return _expand_in_obj(cfg)


def load_and_resolve_config(config_path: str) -> Dict[str, Any]:
    """
    Load YAML config, expand environment variables including ${VAR:-default} syntax,
    and apply environment overrides for key paths.
    """
    cfg = load_yaml_config(config_path)

    # Allow direct env overrides for convenience
    data_dir_env = os.getenv("DATA_DIR")
    runs_dir_env = os.getenv("RUNS_DIR")
    model_version_env = os.getenv("MODEL_VERSION")

    if data_dir_env:
        cfg.setdefault("data", {})
        cfg["data"]["data_dir"] = data_dir_env
        cfg["data"]["raw_dir"] = os.path.join(data_dir_env, "raw")
        cfg["data"]["tiles_dir"] = os.path.join(data_dir_env, "tiles")
    if runs_dir_env:
        cfg.setdefault("paths", {})
        cfg["paths"]["runs_dir"] = runs_dir_env
    if model_version_env:
        cfg.setdefault("registry", {})
        cfg["registry"]["model_version"] = model_version_env

    return cfg