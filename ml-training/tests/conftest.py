import os
import sys
import shutil
import pytest
import numpy as np
import random

# Ensure the ml-training directory is importable when pytest runs from repo root
HERE = os.path.dirname(__file__)
ML_TRAINING_ROOT = os.path.abspath(os.path.join(HERE, ".."))
if ML_TRAINING_ROOT not in sys.path:
    sys.path.insert(0, ML_TRAINING_ROOT)

# Light seeding for determinism across tests
def _seed_all(seed: int = 1337):
    random.seed(seed)
    np.random.seed(seed)
    try:
        import tensorflow as tf  # noqa: F401

        try:
            tf.random.set_seed(seed)
        except Exception:
            pass
    except Exception:
        pass


@pytest.fixture(autouse=True)
def seeded_env():
    _seed_all(1337)
    yield


@pytest.fixture
def tmp_dirs(tmp_path):
    """
    Provide temporary DATA_DIR and RUNS_DIR as environment variables,
    and restore environment afterwards.
    """
    prev_data = os.environ.get("DATA_DIR")
    prev_runs = os.environ.get("RUNS_DIR")
    prev_version = os.environ.get("MODEL_VERSION")

    data_dir = str(tmp_path / "data")
    runs_dir = str(tmp_path / "runs")
    os.makedirs(data_dir, exist_ok=True)
    os.makedirs(runs_dir, exist_ok=True)
    os.environ["DATA_DIR"] = data_dir
    os.environ["RUNS_DIR"] = runs_dir
    os.environ["MODEL_VERSION"] = "1.0.0"

    yield {"DATA_DIR": data_dir, "RUNS_DIR": runs_dir}

    # Cleanup and restore
    if prev_data is not None:
        os.environ["DATA_DIR"] = prev_data
    else:
        os.environ.pop("DATA_DIR", None)
    if prev_runs is not None:
        os.environ["RUNS_DIR"] = prev_runs
    else:
        os.environ.pop("RUNS_DIR", None)
    if prev_version is not None:
        os.environ["MODEL_VERSION"] = prev_version
    else:
        os.environ.pop("MODEL_VERSION", None)