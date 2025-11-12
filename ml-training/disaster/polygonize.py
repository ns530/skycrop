from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Dict, Any, Optional, Tuple, List

import numpy as np
from skimage.measure import label, regionprops
from skimage.morphology import binary_opening, binary_closing, remove_small_objects, disk
from shapely.geometry import shape, mapping, Polygon, MultiPolygon
from shapely.ops import unary_union
from shapely.geometry import Point, LinearRing

# We will reuse utils_geo.mask_to_geojson for robust rasterio-based vectorization when available,
# but also provide a pure scikit-image/shapely fallback for tests.
try:
    from ..utils_geo import mask_to_geojson  # type: ignore
except Exception:  # pragma: no cover
    mask_to_geojson = None  # type: ignore


@dataclass(frozen=True)
class MorphologyConfig:
    min_area_pixels: int = 50
    open_size: int = 2
    close_size: int = 2


def clean_mask(
    mask01: np.ndarray,
    morph: Optional[MorphologyConfig] = None,
) -> np.ndarray:
    """
    Apply morphological open/close and remove small objects.

    Args:
      mask01: (H,W) with {0,1} or boolean
      morph: MorphologyConfig
    Returns:
      (H,W) uint8 cleaned mask
    """
    morph = morph or MorphologyConfig()
    m = (mask01.astype(bool)).copy()
    if morph.open_size and morph.open_size > 0:
        m = binary_opening(m, footprint=disk(int(morph.open_size)))
    if morph.close_size and morph.close_size > 0:
        m = binary_closing(m, footprint=disk(int(morph.close_size)))
    if morph.min_area_pixels and morph.min_area_pixels > 0:
        m = remove_small_objects(m, min_size=int(morph.min_area_pixels))
    return m.astype(np.uint8)


def _polygonize_scikit_shapely(mask01: np.ndarray, min_area: int = 0, simplify_tol: float = 0.5, buffer_px: float = 0.0) -> List[Dict[str, Any]]:
    """
    Pure scikit-image/shapely polygonization, used when utils_geo.mask_to_geojson is unavailable
    or when we want strict pixel-coordinate polygons in tests.

    Steps:
      - Connected component label on mask==1
      - For each region, build exterior boundary polygon by tracing its convex hull approximation
      - Simplify and buffer (buffer can be negative to erode tiny spikes; here we use 0 default)
      - Filter by area

    Returns list of GeoJSON-like geometry dicts.
    """
    m = (mask01.astype(np.uint8) > 0).astype(np.uint8)
    if m.max() == 0:
        return []

    lbl = label(m, connectivity=1)
    geoms: List[Polygon] = []
    for reg in regionprops(lbl):
        if min_area and reg.area < min_area:
            continue
        coords = reg.coords  # (N, 2) (row, col)
        # Quick convex hull via shapely
        pts = [Point(float(c[1]), float(c[0])) for c in coords]
        if not pts:
            continue
        mp = unary_union(pts)
        try:
            hull = mp.convex_hull
        except Exception:
            continue
        if hull.is_empty:
            continue
        geom = hull
        if buffer_px and buffer_px != 0.0:
            geom = geom.buffer(float(buffer_px))
        if simplify_tol and simplify_tol > 0.0:
            geom = geom.simplify(float(simplify_tol), preserve_topology=True)
        if geom.is_empty:
            continue
        if min_area and geom.area < float(min_area):
            continue
        if isinstance(geom, (Polygon, MultiPolygon)):
            if isinstance(geom, MultiPolygon):
                geoms.extend(list(geom.geoms))
            else:
                geoms.append(geom)

    # Merge overlapping parts
    if not geoms:
        return []
    merged = unary_union(geoms)
    parts: List[Polygon]
    if isinstance(merged, Polygon):
        parts = [merged]
    elif isinstance(merged, MultiPolygon):
        parts = list(merged.geoms)
    else:
        parts = []

    out: List[Dict[str, Any]] = []
    for p in parts:
        if min_area and p.area < float(min_area):
            continue
        try:
            out.append(mapping(p))
        except Exception:
            continue
    return out


def polygonize_mask(
    mask01: np.ndarray,
    properties: Optional[Dict[str, Any]] = None,
    min_area_pixels: int = 50,
    simplify_tolerance: float = 0.5,
    buffer_pixels: float = 0.0,
) -> Dict[str, Any]:
    """
    Convert mask to GeoJSON FeatureCollection with provided properties on each feature.

    Uses utils_geo.mask_to_geojson when available; otherwise falls back to scikit-image/shapely vectorization.

    Args:
      mask01: (H,W) uint8/bool mask with 1 indicating damaged area
      properties: properties to attach on each feature
      min_area_pixels: minimum polygon area threshold (in pixel units)
      simplify_tolerance: Douglas-Peucker tolerance in pixel units
      buffer_pixels: buffer distance applied to polygons (can be 0)

    Returns FeatureCollection dict.
    """
    properties = dict(properties or {})
    mask01 = (mask01.astype(np.uint8) > 0).astype(np.uint8)

    if mask_to_geojson is not None:
        # utils_geo handles buffering/simplification via its pipeline; we pass buffer as buffer_pixels
        fc = mask_to_geojson(
            mask01,
            transform=None,
            crs=None,
            min_area_pixels=int(min_area_pixels),
            buffer_pixels=float(buffer_pixels),
            properties=properties,
        )
        # Optionally simplify geometries again if requested
        if simplify_tolerance and simplify_tolerance > 0.0 and fc.get("features"):
            features: List[Dict[str, Any]] = []
            for feat in fc["features"]:
                geom = feat.get("geometry")
                try:
                    shp = shape(geom)
                    shp_s = shp.simplify(float(simplify_tolerance), preserve_topology=True)
                    feat2 = dict(feat)
                    feat2["geometry"] = mapping(shp_s)
                    features.append(feat2)
                except Exception:
                    features.append(feat)
            fc["features"] = features
        return fc

    # Fallback polygonization
    geoms = _polygonize_scikit_shapely(
        mask01,
        min_area=int(min_area_pixels),
        simplify_tol=float(simplify_tolerance),
        buffer_px=float(buffer_pixels),
    )
    features = []
    for g in geoms:
        features.append({"type": "Feature", "geometry": g, "properties": dict(properties)})
    return {"type": "FeatureCollection", "features": features}


def save_geojson(fc: Dict[str, Any], out_path: str) -> None:
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(fc, f, indent=2)