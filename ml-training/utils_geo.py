import json
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from shapely.geometry import shape, mapping, Polygon, MultiPolygon
from shapely.ops import unary_union
import cv2

try:
    import rasterio
    from rasterio.features import shapes
except Exception:  # pragma: no cover - optional at runtime (for PNGs we can run without)
    rasterio = None  # type: ignore


def _polygons_from_mask(mask01: np.ndarray, transform: Optional[Any] = None) -> List[Dict[str, Any]]:
    """
    Vectorize a binary mask into GeoJSON-like feature geometries using rasterio.features.shapes
    if available. Coordinates are:
      - map coordinates when a valid affine `transform` is provided
      - pixel coordinates when `transform` is None (not ideal for GeoJSON, but acceptable for PNGs)
    """
    if mask01.dtype != np.uint8:
        mask01 = (mask01 > 0).astype(np.uint8)

    results: List[Dict[str, Any]] = []
    if rasterio is not None:
        # shapes yields (geom, value) for connected components of same values.
        for geom, val in shapes(mask01, mask=mask01.astype(bool), transform=transform):
            if int(val) == 1:
                results.append(geom)
    else:  # pragma: no cover
        # Fallback without rasterio: build simple polygons from connected components via contours.
        # Note: This branch is rarely used in practice given rasterio in requirements.
        import cv2  # local import to avoid hard dependency here
        contours, _ = cv2.findContours(mask01, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for cnt in contours:
            coords = [(float(p[0][0]), float(p[0][1])) for p in cnt]
            if len(coords) >= 3:
                results.append({"type": "Polygon", "coordinates": [coords]})
    return results


def _apply_morphology(mask01: np.ndarray, smooth: str = "none", kernel_size: int = 3, iterations: int = 1) -> np.ndarray:
    """
    Apply optional morphological smoothing on a binary mask BEFORE polygonization.
    Ensures the mask remains binary {0,1} with nearest-neighbor semantics.

    Args:
        mask01: HxW uint8 array with values in {0,1}
        smooth: one of ["none","open","close"]
        kernel_size: odd int (default 3)
        iterations: int (default 1)
    """
    if mask01.dtype != np.uint8:
        m = (mask01 > 0).astype(np.uint8)
    else:
        m = (mask01 > 0).astype(np.uint8)

    if smooth is None:
        smooth = "none"
    smooth = str(smooth).lower()

    k = int(kernel_size) if kernel_size else 3
    if k & 1 == 0:
        k = k + 1  # enforce odd kernel size
    iters = max(1, int(iterations)) if iterations else 1

    if smooth == "none":
        return m
    # Use ellipse for milder smoothing by default
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))
    if smooth == "open":
        m = cv2.morphologyEx(m, cv2.MORPH_OPEN, kernel, iterations=iters)
    elif smooth == "close":
        m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, kernel, iterations=iters)
    # Ensure binary {0,1}
    m = (m > 0).astype(np.uint8)
    return m


def _filter_and_postprocess(
    geoms: List[Dict[str, Any]],
    min_area: float = 0.0,
    buffer_pixels: float = 0.0,
    simplify_tolerance: float = 0.0,
    remove_holes: bool = False,
    topology: str = "preserve",
) -> List[Dict[str, Any]]:
    """
    Filter/simplify/clean polygons derived from mask polygonization.

    Args:
        geoms: list of GeoJSON-like geometries from rasterization
        min_area: minimum area threshold; polygons below are removed. Also used for hole removal threshold.
        buffer_pixels: optional buffer distance applied to polygons before merging (units of transform or pixels)
        simplify_tolerance: Douglas-Peucker tolerance for simplifying polygons (preserve_topology=True)
        remove_holes: if True, drop interior rings entirely when min_area == 0; else drop interior rings whose area < min_area
        topology: one of ["preserve" (default), "clean", "none"]
                  - preserve: rely on valid geometries; simplify with preserve_topology and merge via unary_union
                  - clean: apply unary_union then buffer(0) to clean small self-intersections; return cleaned Polygons/MultiPolygons
                  - none: skip topology corrections (no buffer(0)), still merges for backward-compatible behavior
    """
    out: List[Dict[str, Any]] = []
    polys: List[Polygon] = []

    def _drop_holes(p: Polygon, hole_area_thresh: Optional[float]) -> Polygon:
        if not remove_holes:
            return p
        # If threshold is None or 0 -> drop all holes
        if not hole_area_thresh or hole_area_thresh <= 0.0:
            return Polygon(p.exterior)
        # Keep only holes whose area >= threshold
        keep_interiors = []
        for ring in p.interiors:
            try:
                rpoly = Polygon(ring)
                if rpoly.area >= float(hole_area_thresh):
                    keep_interiors.append(ring)
            except Exception:
                # If ring invalid, skip it
                continue
        return Polygon(p.exterior, holes=keep_interiors)

    def _maybe_simplify(p: Polygon) -> Polygon:
        if simplify_tolerance and simplify_tolerance > 0.0:
            try:
                return p.simplify(float(simplify_tolerance), preserve_topology=True)
            except Exception:
                return p
        return p

    # Convert to shapely, apply per-polygon ops
    for g in geoms:
        try:
            shp = shape(g)
        except Exception:
            continue
        if shp.is_empty:
            continue

        # Normalize to list of Polygons
        if isinstance(shp, Polygon):
            parts = [shp]
        elif isinstance(shp, MultiPolygon):
            parts = list(shp.geoms)
        else:
            continue

        for p in parts:
            if buffer_pixels and buffer_pixels != 0.0:
                try:
                    p = p.buffer(float(buffer_pixels))
                except Exception:
                    pass
            p = _maybe_simplify(p)
            p = _drop_holes(p, hole_area_thresh=float(min_area) if remove_holes else None)
            # Area filter
            if min_area and p.area < float(min_area):
                continue
            if not p.is_empty:
                polys.append(p)

    if not polys:
        return out

    # Merge and apply topology mode
    mode = str(topology or "preserve").lower()
    try:
        merged = unary_union(polys)
    except Exception:
        # Fallback: treat as MultiPolygon of inputs
        merged = MultiPolygon(polys)

    if mode == "clean":
        try:
            merged = merged.buffer(0)
        except Exception:
            # keep as-is if buffer(0) fails
            pass
    elif mode in ("preserve", "none"):
        # already handled via unary_union; no extra cleaning for "none"
        pass
    else:
        # Unknown option -> default to preserve behavior
        pass

    # Flatten to list of polygons, filter by area, map to GeoJSON
    parts: List[Polygon] = []
    if isinstance(merged, Polygon):
        parts = [merged]
    elif isinstance(merged, MultiPolygon):
        parts = list(merged.geoms)

    for p in parts:
        if min_area and p.area < float(min_area):
            continue
        try:
            out.append(mapping(p))
        except Exception:
            continue
    return out


def mask_to_geojson(
    mask01: np.ndarray,
    transform: Optional[Any] = None,
    crs: Optional[Any] = None,
    min_area_pixels: int = 0,
    buffer_pixels: int = 0,
    properties: Optional[Dict[str, Any]] = None,
    # New optional postprocess controls (all default disabled to preserve behavior)
    min_area: Optional[int] = None,
    simplify_tolerance: float = 0.0,
    remove_holes: bool = False,
    topology: str = "preserve",
    morphology: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Convert a binary mask to a GeoJSON FeatureCollection.

    Args:
        mask01: HxW uint8 array with values in {0,1}
        transform: affine transform (e.g., rasterio.transform.Affine) or None
        crs: rasterio.crs.CRS or None; when provided, included in the output under 'crs' field
        min_area_pixels: legacy minimum polygon area (in coordinate units implied by transform or pixels)
        buffer_pixels: buffer distance applied to each polygon before merging (same units as above)
        properties: optional dict of properties to attach to each feature
        min_area: new minimum area override (pixels/CRS units). If provided, supersedes min_area_pixels.
        simplify_tolerance: Douglas-Peucker tolerance; uses preserve_topology=True
        remove_holes: boolean; drop interior rings entirely when min_area==0, or rings below min_area when min_area>0
        topology: one of ["preserve","clean","none"], default "preserve"
        morphology: dict { smooth: "none"|"open"|"close", kernel_size: odd int, iterations: int }
                    Applied on binary mask BEFORE polygonization.

    Returns:
        GeoJSON FeatureCollection dict
    """
    if properties is None:
        properties = {}

    # Resolve min_area effective (new key overrides legacy one)
    eff_min_area = float(min_area) if (min_area is not None) else float(min_area_pixels)

    # Morphological smoothing (optional)
    morph = morphology or {}
    smooth = str(morph.get("smooth", "none")).lower()
    ksize = int(morph.get("kernel_size", 3))
    iters = int(morph.get("iterations", 1))
    mask_in = _apply_morphology(mask01, smooth=smooth, kernel_size=ksize, iterations=iters)

    raw_geoms = _polygons_from_mask(mask_in, transform=transform)
    post = _filter_and_postprocess(
        raw_geoms,
        min_area=eff_min_area,
        buffer_pixels=float(buffer_pixels),
        simplify_tolerance=float(simplify_tolerance),
        remove_holes=bool(remove_holes),
        topology=str(topology),
    )

    features: List[Dict[str, Any]] = []
    for geom in post:
        features.append(
            {
                "type": "Feature",
                "geometry": geom,
                "properties": dict(properties),
            }
        )

    fc: Dict[str, Any] = {"type": "FeatureCollection", "features": features}
    # Note: GeoJSON RFC recommends WGS84; we include CRS info if available for consumers to decide.
    if crs is not None:
        try:
            crs_obj = crs.to_string() if hasattr(crs, "to_string") else str(crs)
            fc["crs"] = {"type": "name", "properties": {"name": crs_obj}}
        except Exception:  # pragma: no cover
            pass
    return fc


def save_geojson(fc: Dict[str, Any], out_path: str) -> None:
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(fc, f, indent=2)