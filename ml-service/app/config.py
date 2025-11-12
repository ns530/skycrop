import os
import time
import json
from typing import Optional, Dict, Any


class Config:
    # Service metadata
    SERVICE_NAME: str = "ml-service"
    START_TIME: float = time.time()

    # Networking
    ML_HOST: str = os.getenv("ML_HOST", "0.0.0.0")
    ML_PORT: int = int(os.getenv("ML_PORT", "8001"))

    # Security
    ML_INTERNAL_TOKEN: str = os.getenv("ML_INTERNAL_TOKEN", "change-me")

    # Models (Segmentation - Sprint 2)
    MODEL_NAME: str = os.getenv("MODEL_NAME", "unet")
    # Effective default version used when not specified by header/body
    UNET_DEFAULT_VERSION: str = os.getenv("UNET_DEFAULT_VERSION", os.getenv("MODEL_VERSION", "2.0.0"))

    # Models (Sprint 3 additions)
    # Path to yield RF ONNX model (fallback to joblib if ORT unavailable)
    ML_YIELD_MODEL_PATH: str = os.getenv("ML_YIELD_MODEL_PATH", "ml-training/models/yield_rf/1.0.0/model.onnx")

    # Dataset references for trained models
    DATASET_LINKS: Dict[str, str] = {
        "unet_2.0.0_train": "https://drive.google.com/drive/folders/1s06WXKPTNXeRuz4M2SAxY3hAf8vH2Zjw?usp=drive_link",
        "unet_2.0.0_train_images": "https://drive.google.com/drive/folders/1WHsyPZDcPADZanLAtyZ8roaUBTcES2QG?usp=drive_link",
        "unet_2.0.0_train_masks": "https://drive.google.com/drive/folders/1WB38Uwm_qf3Wfzj8nhVCF_zUTGgv6xQn?usp=drive_link",
    }

    # Disaster analysis defaults
    DISASTER_PRE_DAYS: int = int(os.getenv("DISASTER_PRE_DAYS", "14"))
    DISASTER_POST_DAYS: int = int(os.getenv("DISASTER_POST_DAYS", "7"))
    # Thresholds as JSON string; parsed into dict below
    _DISASTER_THRESHOLDS_JSON_RAW: str = os.getenv(
        "DISASTER_THRESHOLDS_JSON",
        '{"FLOOD_NDWI_DELTA_MIN":0.15,"FLOOD_NDWI_ABS_MIN":0.1,"DROUGHT_NDWI_DROP_MIN":0.12,"DROUGHT_NDVI_DROP_MIN":0.08,"STRESS_TDVI_DELTA_MIN":0.08}',
    )
    DISASTER_THRESHOLDS: Dict[str, Any] = {}  # populated in __init__

    def __init__(self) -> None:
        # Parse thresholds JSON safely
        try:
            parsed = json.loads(self._DISASTER_THRESHOLDS_JSON_RAW or "{}")
            if isinstance(parsed, dict):
                self.DISASTER_THRESHOLDS = parsed
            else:
                self.DISASTER_THRESHOLDS = {}
        except Exception:
            self.DISASTER_THRESHOLDS = {}

    # Timeouts and limits
    REQUEST_TIMEOUT_S: int = int(os.getenv("REQUEST_TIMEOUT_S", "60"))
    MAX_PAYLOAD_MB: int = int(os.getenv("MAX_PAYLOAD_MB", "10"))
    MAX_CONTENT_LENGTH: int = MAX_PAYLOAD_MB * 1024 * 1024  # bytes

    # Static storage for masks (served by Flask static)
    STATIC_FOLDER: str = os.getenv("STATIC_FOLDER", "static")
    MASKS_SUBDIR: str = os.getenv("MASKS_SUBDIR", "masks")

    # Optional upstream for field_id resolution (Backend)
    FIELD_RESOLVER_URL: Optional[str] = os.getenv("FIELD_RESOLVER_URL")

    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_JSON: bool = os.getenv("LOG_JSON", "1") not in ("0", "false", "False")

    # Testing hooks (intentionally allowed)
    ENABLE_TEST_HOOKS: bool = os.getenv("ENABLE_TEST_HOOKS", "1") not in ("0", "false", "False")


def load_config(overrides: Optional[dict] = None) -> Config:
    cfg = Config()
    if overrides:
        for k, v in overrides.items():
            if hasattr(cfg, k):
                setattr(cfg, k, v)
    return cfg