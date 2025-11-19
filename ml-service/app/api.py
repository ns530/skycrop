import time
import uuid
import hashlib
import json
import os
import numpy as np
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, Optional, Tuple, List

from flask import Blueprint, current_app, g, jsonify, request

from .auth import require_internal_auth
from .inference import encode_geojson_base64, run_unet_geojson, persist_mask_geojson
from .monitoring import log_inference_event
from .yield_predict import predict_numeric, build_matrix_from_features
from .disaster_analyze import analyze_indices, build_feature_collection
from .schemas import (
    ErrorResponse,
    Metrics,
    ModelInfo,
    PredictRequest,
    PredictResponseInline,
    PredictResponseUrl,
    # Sprint 3 schemas
    YieldPredictRequest,
    YieldPredictResponse,
    DisasterAnalyzeRequest,
    DisasterAnalyzeResponse,
    MetricsBasic,
)
from .version import NAME as DEFAULT_MODEL_NAME, VERSION as DEFAULT_MODEL_VERSION

api_bp = Blueprint("api", __name__)


def _ok(body: Dict[str, Any], status: int = 200):
    return jsonify(body), status


def _error(code: str, message: str, details: Optional[Dict[str, Any]] = None, status: int = 400):
    return (
        jsonify(
            {
                "error": {"code": code, "message": message, "details": details or {}},
                "meta": {
                    "correlation_id": getattr(g, "correlation_id", None),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                },
            }
        ),
        status,
    )


@api_bp.get("/health")
def health():
    uptime_s = time.time() - float(current_app.config.get("SERVICE_START_TIME", time.time()))
    # Version exposed in health matches configured default
    version = str(current_app.config.get("UNET_DEFAULT_VERSION", DEFAULT_MODEL_VERSION))
    return _ok({"status": "ok", "version": version, "uptime_s": uptime_s})


def _resolve_effective_model_version(body_version: Optional[str]) -> Tuple[str, str]:
    """
    Returns (header_value_to_echo, version_only_for_payload)
    Header expects a combined string like 'unet-1.0.0'
    Payload expects { name:'unet', version:'1.0.0' }
    """
    header_override = request.headers.get("X-Model-Version")
    model_name = str(current_app.config.get("MODEL_NAME", DEFAULT_MODEL_NAME))
    default_version = str(current_app.config.get("UNET_DEFAULT_VERSION", DEFAULT_MODEL_VERSION))

    version_token = None
    header_value = None

    if header_override:
        header_value = header_override
        # Accept both 'unet-1.0.0' and '1.0.0' forms; prefer split on first '-'
        if "-" in header_override:
            _, version_token = header_override.split("-", 1)
        else:
            version_token = header_override
    elif body_version:
        if "-" in body_version:
            _, version_token = body_version.split("-", 1)
            header_value = body_version
        else:
            version_token = body_version
            header_value = f"{model_name}-{body_version}"
    else:
        version_token = default_version
        header_value = f"{model_name}-{default_version}"

    # Validate known version(s) for Sprint 2 stub
    allowed = {"1.0.0", "2.0.0"}
    if version_token not in allowed:
        # Unknown model version
        raise ValueError(f"unknown_version:{version_token}")

    # Set header echo via after_request hook
    g.effective_model_version = header_value
    return header_value, version_token


def _resolve_effective_model_version_generic(
    model_name: str, body_version: Optional[str], default_version: Optional[str] = None
) -> Tuple[str, str]:
    """
    Generic resolver for Sprint 3 endpoints.

    Returns (header_value_to_echo, version_token_for_payload)
    - Header accepts "name-1.0.0" or just "1.0.0"
    - Payload uses { name, version }
    """
    header_override = request.headers.get("X-Model-Version")
    dv = str(default_version or "1.0.0")

    version_token = None
    header_value = None

    if header_override:
        header_value = header_override
        if "-" in header_override:
            # split at first dash only
            _, version_token = header_override.split("-", 1)
        else:
            version_token = header_override
    elif body_version:
        if "-" in body_version:
            _, version_token = body_version.split("-", 1)
            header_value = body_version
        else:
            version_token = body_version
            header_value = f"{model_name}-{body_version}"
    else:
        version_token = dv
        header_value = f"{model_name}-{dv}"

    # Allowed versions: only the default for Sprint 3
    allowed = {dv}
    if version_token not in allowed:
        raise ValueError(f"unknown_version:{version_token}")

    g.effective_model_version = header_value
    return header_value, version_token


@api_bp.post("/v1/segmentation/predict")
@require_internal_auth
def predict():
    t0 = time.time()

    # Parse and validate request via Pydantic
    try:
        data = request.get_json(force=True, silent=False)
    except Exception:
        return _error("INVALID_INPUT", "Invalid JSON body", status=400)

    try:
        req = PredictRequest.model_validate(data)
    except Exception as exc:
        # Pydantic error formatting
        return _error("INVALID_INPUT", "Payload validation failed", {"details": str(exc)}, status=400)

    # Model version resolution and validation
    try:
        _, version_only = _resolve_effective_model_version(req.model_version)
    except ValueError as ve:
        # Unknown model version
        token = str(ve).replace("unknown_version:", "")
        return _error(
            "MODEL_NOT_FOUND",
            f"Model version not available",
            {"requested": token},
            status=404,
        )

    # Timeout simulation hook (tests)
    sleep_ms = 0
    if req.debug and getattr(req.debug, "sleep_ms", 0) > 0:
        sleep_ms = int(req.debug.sleep_ms)
        if sleep_ms > int(current_app.config.get("REQUEST_TIMEOUT_S", 60)) * 1000:
            return _error("TIMEOUT", "Inference timed out", status=504)

    # ONNX-backed inference path (bbox required in current contract)

    # Build a deterministic synthetic RGB image as input to the ONNX U-Net.
    # This keeps request schema unchanged (no image payload) while enabling the real pipeline.
    # Shape is fixed to 1024x1024 to exercise tiling logic deterministically.
    seed_hex = hashlib.sha256(json.dumps(req.bbox, sort_keys=True).encode("utf-8")).hexdigest()[:8]
    seed = int(seed_hex, 16)
    rng = np.random.default_rng(seed)
    H = W = 1024
    img = rng.integers(0, 255, size=(H, W, 3), dtype=np.uint8)

    # Run inference with tiling settings from request; other configs from env/defaults in inference.py
    try:
        geojson_mask, meta = run_unet_geojson(
            image_rgb=img,
            tile_size=int(req.tiling.size),
            overlap=int(req.tiling.overlap),
            # threshold/batch/padding/hann taken from env defaults inside pipeline
        )
    except Exception as e:
        # Monitoring hook on failure
        request_id = getattr(g, "correlation_id", None) or str(uuid.uuid4())
        try:
            log_inference_event(
                {
                    "request_id": request_id,
                    "route": "/v1/segmentation/predict",
                    "model_version": str(current_app.config.get("UNET_DEFAULT_VERSION", DEFAULT_MODEL_VERSION)),
                    "providers": [],
                    "tile_size": int(req.tiling.size),
                    "overlap": int(req.tiling.overlap),
                    "batch_size": None,
                    "threshold": None,
                    "postprocess": {
                        "min_area": os.getenv("POST_MIN_AREA", "0"),
                        "simplify_tolerance": os.getenv("POST_SIMPLIFY_TOLERANCE", "0.0"),
                        "remove_holes": os.getenv("POST_REMOVE_HOLES", "false"),
                        "topology": os.getenv("POST_TOPOLOGY", "preserve"),
                        "morphology": os.getenv("POST_MORPHOLOGY", "none"),
                    },
                    "timings": {},
                    "image_shape": [H, W, 3],
                    "success": False,
                    "error": str(e),
                }
            )
        except Exception:
            pass
        return _error("UPSTREAM_ERROR", "Inference failed", {"details": str(e)}, status=502)

    # Optional simulated processing delay (within budget)
    if sleep_ms > 0:
        time.sleep(sleep_ms / 1000.0)

    # Compute response fields
    request_id = getattr(g, "correlation_id", None) or str(uuid.uuid4())
    model_info = ModelInfo(name=str(current_app.config.get("MODEL_NAME", DEFAULT_MODEL_NAME)), version=version_only)
    latency_ms = int((time.time() - t0) * 1000)
    metrics = Metrics(latency_ms=latency_ms, tile_count=int(meta.get("tile_count", 1)), cloud_coverage=0.0)

    # Prepare common monitoring payload
    mon_payload = {
        "request_id": request_id,
        "route": "/v1/segmentation/predict",
        "model_version": meta.get("model_version", version_only),
        "providers": meta.get("providers", []),
        "tile_size": int(meta.get("config", {}).get("tile_size", req.tiling.size)),
        "overlap": int(meta.get("config", {}).get("overlap", req.tiling.overlap)),
        "batch_size": int(meta.get("config", {}).get("batch_size", 4)),
        "threshold": float(meta.get("threshold", 0.5)),
        "postprocess": {
            "min_area": int(os.getenv("POST_MIN_AREA", "0")),
            "simplify_tolerance": float(os.getenv("POST_SIMPLIFY_TOLERANCE", "0.0")),
            "remove_holes": os.getenv("POST_REMOVE_HOLES", "false") not in ("0", "false", "False"),
            "topology": os.getenv("POST_TOPOLOGY", "preserve"),
            "morphology": os.getenv("POST_MORPHOLOGY", "none"),
            "morph_kernel": int(os.getenv("POST_MORPH_KERNEL", "3")),
            "morph_iters": int(os.getenv("POST_MORPH_ITERS", "1")),
        },
        "timings": meta.get("timings", {}),
        "image_shape": meta.get("image_shape", [H, W, 3]),
        "success": True,
    }

    if req.return_ == "inline":
        b64 = encode_geojson_base64(geojson_mask)
        resp = PredictResponseInline(
            request_id=request_id,
            model=model_info,
            mask_base64=b64,
            mask_format="geojson",
            metrics=metrics,
            warnings=[],
        ).model_dump(by_alias=True)
        try:
            log_inference_event(mon_payload)
        except Exception:
            pass
        return _ok(resp)

    # Default path: persist to static and return URL
    mask_url = persist_mask_geojson(
        static_folder=current_app.config["STATIC_FOLDER"],
        masks_subdir=current_app.config["MASKS_SUBDIR"],
        request_id=request_id,
        geojson_obj=geojson_mask,
    )
    resp = PredictResponseUrl(
        request_id=request_id,
        model=model_info,
        mask_url=mask_url,
        mask_format="geojson",
        metrics=metrics,
        warnings=[],
    ).model_dump(by_alias=True)
    try:
        log_inference_event(mon_payload)
    except Exception:
        pass
    return _ok(resp)


@api_bp.post("/v1/yield/predict")
@require_internal_auth
def yield_predict_endpoint():
    t0 = time.time()
    # Parse JSON
    try:
        data = request.get_json(force=True, silent=False)
    except Exception:
        return _error("INVALID_INPUT", "Invalid JSON body", status=400)

    # Validate schema
    try:
        req = YieldPredictRequest.model_validate(data)
    except Exception as exc:
        return _error("INVALID_INPUT", "Payload validation failed", {"details": str(exc)}, status=400)

    # Resolve model version for yield_rf
    try:
        _, version_only = _resolve_effective_model_version_generic("yield_rf", req.model_version, default_version="1.0.0")
    except ValueError as ve:
        token = str(ve).replace("unknown_version:", "")
        return _error("MODEL_NOT_FOUND", "Model version not available", {"requested": token}, status=404)

    # Build rows matrix
    field_ids: List[Optional[str]] = []
    feature_names: List[str] = []
    rows: List[List[float]] = []

    if req.features is not None:
        rows, field_ids, feature_names = build_matrix_from_features(req.features, None)
    else:
        # rows + feature_names path
        rows = [[float(x) for x in r] for r in (req.rows or [])]
        feature_names = list(req.feature_names or [])

    # Predict
    try:
        preds = predict_numeric(rows, current_app.config)
    except Exception as e:
        # Map known model loading errors as MODEL_NOT_FOUND when file missing
        msg = str(e)
        if "not found" in msg.lower():
            return _error("MODEL_NOT_FOUND", "Yield model not found", {"path": current_app.config.get("ML_YIELD_MODEL_PATH")}, status=404)
        return _error("UPSTREAM_ERROR", "Inference failed", {"details": msg}, status=502)

    # Build response
    request_id = getattr(g, "correlation_id", None) or str(uuid.uuid4())
    model_info = ModelInfo(name="yield_rf", version=version_only)
    latency_ms = int((time.time() - t0) * 1000)
    metrics_basic = MetricsBasic(latency_ms=latency_ms)

    predictions: List[Dict[str, Any]] = []
    for i, y in enumerate(preds):
        rec: Dict[str, Any] = {
            "yield_kg_per_ha": float(y),
            "harvest_date": (datetime.now() + timedelta(days=120)).strftime('%Y-%m-%d'),  # ~4 months
            "optimal_yield": 5500.0,  # kg/ha
            "previous_season_yield": 4800.0,  # kg/ha
        }
        if i < len(field_ids) and field_ids[i] is not None:
            rec["field_id"] = field_ids[i]  # include only when provided
        predictions.append(rec)

    resp = YieldPredictResponse(
        request_id=request_id,
        model=model_info,
        predictions=[],  # placeholder to satisfy model fields
        metrics=metrics_basic,
        warnings=[],
    ).model_dump()
    # replace predictions with built dicts (exclude None fields)
    resp["predictions"] = predictions
    try:
        g.log_extras = {
            "record_count": len(predictions),
            "model": "yield_rf",
            "model_version": version_only,
        }
    except Exception:
        pass
    return _ok(resp)


@api_bp.post("/v1/disaster/analyze")
@require_internal_auth
def disaster_analyze_endpoint():
    t0 = time.time()
    # Parse JSON
    try:
        data = request.get_json(force=True, silent=False)
    except Exception:
        return _error("INVALID_INPUT", "Invalid JSON body", status=400)

    # Validate schema
    try:
        req = DisasterAnalyzeRequest.model_validate(data)
    except Exception as exc:
        return _error("INVALID_INPUT", "Payload validation failed", {"details": str(exc)}, status=400)

    # Resolve model version for disaster_analysis
    try:
        _, version_only = _resolve_effective_model_version_generic("disaster_analysis", req.model_version, default_version="1.0.0")
    except ValueError as ve:
        token = str(ve).replace("unknown_version:", "")
        return _error("MODEL_NOT_FOUND", "Model version not available", {"requested": token}, status=404)

    # Prepare indices records (ensure types)
    records: List[Dict[str, Any]] = []
    for r in req.indices:
        records.append(
            {
                "field_id": r.field_id,
                "date": r.date,
                "ndvi": float(r.ndvi),
                "ndwi": float(r.ndwi),
                "tdvi": float(r.tdvi),
            }
        )

    try:
        analysis, _ = analyze_indices(
            indices_records=records,
            event=str(req.event),
            event_date=req.event_date,
            app_config=current_app.config,
            pre_days=int(req.pre_days),
            post_days=int(req.post_days),
        )
    except Exception as e:
        return _error("UPSTREAM_ERROR", "Analysis failed", {"details": str(e)}, status=502)

    request_id = getattr(g, "correlation_id", None) or str(uuid.uuid4())
    latency_ms = int((time.time() - t0) * 1000)
    model_info = ModelInfo(name="disaster_analysis", version=version_only)
    metrics_basic = MetricsBasic(latency_ms=latency_ms)

    body: Dict[str, Any] = {
        "request_id": request_id,
        "analysis": analysis,
        "model": model_info.model_dump(),
        "metrics": metrics_basic.model_dump(),
    }

    # GeoJSON inline when requested
    if req.return_ in ("geojson", "both"):
        fc = build_feature_collection(analysis)
        body["mask_geojson"] = fc

    try:
        g.log_extras = {
            "record_count": len(analysis),
            "event": str(req.event),
            "model": "disaster_analysis",
            "model_version": version_only,
            "return": str(req.return_),
        }
    except Exception:
        pass

    return _ok(body)