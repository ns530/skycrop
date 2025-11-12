import logging
from typing import Any, Dict


_LOGGER = logging.getLogger("ml-service.monitoring")


def log_inference_event(payload: Dict[str, Any]) -> None:
    """
    Structured monitoring hook.

    Expected payload fields:
      - request_id: str
      - route: str
      - model_version: str
      - providers: list[str]
      - tile_size: int
      - overlap: int
      - batch_size: int
      - threshold: float
      - postprocess: dict or str summary
      - timings: { preprocess_ms, infer_ms, postprocess_ms, total_ms }
      - image_shape: [H,W,C]
      - success: bool
      - error: optional str
    """
    try:
        # Ensure minimal schema and types
        record: Dict[str, Any] = {
            "event": "segmentation_inference",
            "request_id": payload.get("request_id"),
            "route": payload.get("route"),
            "model_version": payload.get("model_version"),
            "providers": payload.get("providers"),
            "tile_size": payload.get("tile_size"),
            "overlap": payload.get("overlap"),
            "batch_size": payload.get("batch_size"),
            "threshold": payload.get("threshold"),
            "postprocess": payload.get("postprocess"),
            "timings": payload.get("timings"),
            "image_shape": payload.get("image_shape"),
            "success": bool(payload.get("success", False)),
        }
        if "error" in payload and payload.get("error"):
            record["error"] = str(payload.get("error"))
        _LOGGER.info("inference_event", extra=record)
    except Exception as e:
        # Never raise from monitoring
        _LOGGER.debug("monitoring_log_failed", extra={"error": str(e)})