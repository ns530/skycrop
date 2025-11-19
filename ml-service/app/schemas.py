from __future__ import annotations

import base64
from datetime import date
from typing import Any, Dict, List, Literal, Optional, Tuple

from pydantic import BaseModel, Field, ValidationError, field_validator, model_validator


class TilingConfig(BaseModel):
    size: int = Field(default=512, ge=1, le=4096)
    overlap: int = Field(default=64, ge=0, le=1024)


class DebugOptions(BaseModel):
    sleep_ms: int = Field(default=0, ge=0)


class PredictRequest(BaseModel):
    bbox: List[float]
    date: date
    model_version: Optional[str] = None
    tiling: TilingConfig = Field(default_factory=TilingConfig)
    return_: Literal["mask_url", "inline"] = Field(default="mask_url", alias="return")
    debug: Optional[DebugOptions] = None

    model_config = {
        "populate_by_name": True,
        "extra": "forbid",
    }

    @field_validator("bbox")
    @classmethod
    def validate_bbox(cls, v: List[float]) -> List[float]:
        if not isinstance(v, list) or len(v) != 4:
            raise ValueError("bbox must be an array of 4 numbers [minLon,minLat,maxLon,maxLat]")
        try:
            min_lon, min_lat, max_lon, max_lat = map(float, v)
        except Exception:
            raise ValueError("bbox values must be numeric")
        if not (-180.0 <= min_lon <= 180.0 and -180.0 <= max_lon <= 180.0):
            raise ValueError("lon must be within [-180,180]")
        if not (-90.0 <= min_lat <= 90.0 and -90.0 <= max_lat <= 90.0):
            raise ValueError("lat must be within [-90,90]")
        if not (min_lon < max_lon and min_lat < max_lat):
            raise ValueError("bbox min must be less than max for lon and lat")
        return [min_lon, min_lat, max_lon, max_lat]


class ModelInfo(BaseModel):
    name: str
    version: str


class Metrics(BaseModel):
    latency_ms: int
    tile_count: int
    cloud_coverage: float = 0.0


class PredictResponseUrl(BaseModel):
    request_id: str
    model: ModelInfo
    mask_url: str
    mask_format: Literal["geojson"] = "geojson"
    metrics: Metrics
    warnings: List[Dict[str, Any]] = Field(default_factory=list)


class PredictResponseInline(BaseModel):
    request_id: str
    model: ModelInfo
    mask_base64: str
    mask_format: Literal["geojson"] = "geojson"
    metrics: Metrics
    warnings: List[Dict[str, Any]] = Field(default_factory=list)

    @field_validator("mask_base64")
    @classmethod
    def validate_b64(cls, v: str) -> str:
        # best-effort validation
        try:
            base64.b64decode(v.encode("utf-8"), validate=True)
        except Exception:
            raise ValueError("mask_base64 must be valid base64")
        return v


class ErrorMeta(BaseModel):
    correlation_id: Optional[str] = None
    timestamp: Optional[str] = None


class ErrorBody(BaseModel):
    code: Literal[
        "INVALID_INPUT",
        "MODEL_NOT_FOUND",
        "TIMEOUT",
        "UPSTREAM_ERROR",
        "AUTH_REQUIRED",
        "UNAUTHORIZED_INTERNAL",
        "NOT_IMPLEMENTED",
        "NOT_FOUND",
    ]
    message: str
    details: Dict[str, Any] = Field(default_factory=dict)


class ErrorResponse(BaseModel):
    error: ErrorBody
    meta: Optional[ErrorMeta] = None

# ==== Sprint 3 Schemas: Yield RF and Disaster Analysis ====

class MetricsBasic(BaseModel):
    latency_ms: int


class YieldPredictRequest(BaseModel):
    # One of the following input forms must be provided:
    # 1) features: list of dicts, optionally including "field_id"
    # 2) rows + feature_names: 2D numeric matrix and ordered feature names
    features: Optional[List[Dict[str, Any]]] = None
    rows: Optional[List[List[float]]] = None
    feature_names: Optional[List[str]] = None
    model_version: Optional[str] = None

    model_config = {
        "populate_by_name": True,
        "extra": "forbid",
    }

    @model_validator(mode="after")
    def validate_input_forms(self) -> "YieldPredictRequest":
        has_features = self.features is not None
        has_rows = self.rows is not None
        if has_features == has_rows:
            # Either both provided or neither → invalid
            raise ValueError("Provide exactly one of 'features' or 'rows'+'feature_names'")
        if has_rows and (self.feature_names is None or len(self.feature_names) == 0):
            raise ValueError("'feature_names' is required when 'rows' is provided")
        if has_rows:
            # basic numeric validation
            for r in self.rows or []:
                if not isinstance(r, list) or any((not isinstance(x, (int, float))) for x in r):
                    raise ValueError("All 'rows' must be arrays of numbers")
        if has_features:
            if not isinstance(self.features, list) or any(not isinstance(x, dict) for x in self.features):
                raise ValueError("'features' must be a list of objects")
        return self


class YieldPrediction(BaseModel):
    field_id: Optional[str] = None
    yield_kg_per_ha: float
    harvest_date: Optional[str] = None
    optimal_yield: Optional[float] = None
    previous_season_yield: Optional[float] = None


class YieldPredictResponse(BaseModel):
    request_id: str
    model: ModelInfo
    predictions: List[YieldPrediction]
    metrics: MetricsBasic
    warnings: List[Dict[str, Any]] = Field(default_factory=list)


class IndexPoint(BaseModel):
    field_id: str
    date: date
    ndvi: float
    ndwi: float
    tdvi: float

    @field_validator("ndvi", "ndwi", "tdvi")
    @classmethod
    def validate_index_bounds(cls, v: float) -> float:
        # Loose bounds; actual satellite indices often in [-1, 1]
        if not (-2.0 <= float(v) <= 2.0):
            raise ValueError("index values must be within [-2, 2]")
        return float(v)


class DisasterAnalyzeRequest(BaseModel):
    indices: List[IndexPoint]
    event: Literal["flood", "drought", "stress", "auto"]
    event_date: date
    pre_days: int = Field(default=14, ge=1, le=90)
    post_days: int = Field(default=7, ge=1, le=90)
    return_: Literal["summary", "geojson", "both"] = Field(default="summary", alias="return")
    model_version: Optional[str] = None

    model_config = {
        "populate_by_name": True,
        "extra": "forbid",
    }


class DisasterAnalysisItem(BaseModel):
    field_id: str
    event: Literal["flood", "drought", "stress"]
    severity: Literal["none", "low", "medium", "high"]
    metrics: Dict[str, float]
    windows: Dict[str, int]


class DisasterAnalyzeResponse(BaseModel):
    request_id: str
    analysis: List[DisasterAnalysisItem]
    model: ModelInfo
    metrics: MetricsBasic
    # When return is "geojson" or "both", include inline FeatureCollection
    mask_geojson: Optional[Dict[str, Any]] = None
