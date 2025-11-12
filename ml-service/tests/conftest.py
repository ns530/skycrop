import os
import tempfile
import shutil
import pytest
import sys
from pathlib import Path

# Ensure project root (ml-service) is on sys.path so 'app' package is importable, regardless of CWD
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import create_app  # [create_app()](ml-service/app/__init__.py:32)


@pytest.fixture(scope="session")
def internal_token() -> str:
    return os.environ.get("ML_INTERNAL_TOKEN", "change-me")


@pytest.fixture()
def app_instance(tmp_path, internal_token):
    # Create an isolated static dir for masks
    static_dir = tmp_path / "static"
    static_dir.mkdir(parents=True, exist_ok=True)

    overrides = {
        "ML_PORT": 8001,
        "ML_INTERNAL_TOKEN": internal_token,
        "STATIC_FOLDER": str(static_dir),  # absolute path accepted by factory
        "REQUEST_TIMEOUT_S": 1,  # speed up timeout test path
        "MASKS_SUBDIR": "masks",
        "UNET_DEFAULT_VERSION": "1.0.0",
        "MODEL_NAME": "unet",
        "ENABLE_TEST_HOOKS": True,
        "LOG_LEVEL": "ERROR",
    }
    app = create_app(overrides)
    yield app


@pytest.fixture()
def client(app_instance):
    with app_instance.test_client() as c:
        yield c


@pytest.fixture()
def auth_headers(internal_token):
    return {"X-Internal-Token": internal_token, "Content-Type": "application/json"}