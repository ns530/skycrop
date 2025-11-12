import numpy as np
from shapely.geometry import shape, Polygon, MultiPolygon

from utils_geo import mask_to_geojson  # noqa: E402
# Import private helper for morphology tests (unit-test scope)
from utils_geo import _apply_morphology  # type: ignore  # noqa: E402


def _first_polygon_feature(fc):
    feats = fc.get("features", [])
    assert len(feats) > 0, "No polygon features produced"
    return feats[0]


def _exterior_vertex_count(geom_dict):
    shp = shape(geom_dict)
    if isinstance(shp, Polygon):
        return len(list(shp.exterior.coords))
    if isinstance(shp, MultiPolygon):
        # sum exterior vertices across parts
        return sum(len(list(p.exterior.coords)) for p in shp.geoms)
    return 0


def test_simplification_reduces_vertices_preserves_area():
    # Synthetic jagged rectangle
    H, W = 64, 64
    m = np.zeros((H, W), dtype=np.uint8)
    m[10:54, 10:54] = 1  # base rectangle

    # Carve small notches along the top edge to create jagged boundary
    for x in range(10, 54, 2):
        m[10:13, x] = 0  # small notches

    # Baseline polygonization (no simplify)
    fc_base = mask_to_geojson(
        mask01=m,
        transform=None,
        crs=None,
        min_area_pixels=0,
        buffer_pixels=0,
        properties={"test": "baseline"},
        # new options default to disabled (preserve behavior)
        min_area=None,
        simplify_tolerance=0.0,
        remove_holes=False,
        topology="preserve",
        morphology={"smooth": "none", "kernel_size": 3, "iterations": 1},
    )
    geom_base = _first_polygon_feature(fc_base)["geometry"]
    vtx_base = _exterior_vertex_count(geom_base)
    area_base = float(shape(geom_base).area)

    # With simplification
    fc_simp = mask_to_geojson(
        mask01=m,
        transform=None,
        crs=None,
        min_area_pixels=0,
        buffer_pixels=0,
        properties={"test": "simplify"},
        min_area=None,
        simplify_tolerance=1.5,
        remove_holes=False,
        topology="preserve",
        morphology={"smooth": "none", "kernel_size": 3, "iterations": 1},
    )
    geom_simp = _first_polygon_feature(fc_simp)["geometry"]
    vtx_simp = _exterior_vertex_count(geom_simp)
    area_simp = float(shape(geom_simp).area)

    assert vtx_simp < vtx_base, f"Expected fewer vertices after simplification: {vtx_simp} < {vtx_base}"
    # Area should be close (tolerance 10%)
    rel_delta = abs(area_simp - area_base) / max(1.0, area_base)
    assert rel_delta <= 0.1, f"Area changed too much after simplification: delta={rel_delta:.3f}"


def test_min_area_filters_small_polygons():
    H, W = 64, 64
    m = np.zeros((H, W), dtype=np.uint8)
    # Large square (area 25*25=625)
    m[5:30, 5:30] = 1
    # Small square (area 5*5=25)
    m[1:6, 1:6] = 1

    # Set min_area to remove small but keep large
    fc = mask_to_geojson(
        mask01=m,
        transform=None,
        crs=None,
        min_area_pixels=0,
        buffer_pixels=0,
        properties=None,
        min_area=50,  # removes the 25px^2 small polygon
        simplify_tolerance=0.0,
        remove_holes=False,
        topology="preserve",
        morphology={"smooth": "none", "kernel_size": 3, "iterations": 1},
    )
    feats = fc.get("features", [])
    assert len(feats) == 1, f"Expected only one polygon after min_area filtering, got {len(feats)}"
    # Confirm it is the large one
    areas = sorted(float(shape(f["geometry"]).area) for f in feats)
    assert areas[-1] >= 600.0


def test_remove_holes_toggle():
    H, W = 64, 64
    m = np.zeros((H, W), dtype=np.uint8)
    # Outer filled
    m[5:55, 5:55] = 1
    # Inner hole (clear region)
    m[20:35, 20:35] = 0

    # Without hole removal: expect interior ring
    fc_keep_holes = mask_to_geojson(
        mask01=m,
        transform=None,
        crs=None,
        min_area_pixels=0,
        buffer_pixels=0,
        properties=None,
        min_area=None,
        simplify_tolerance=0.0,
        remove_holes=False,
        topology="preserve",
        morphology={"smooth": "none", "kernel_size": 3, "iterations": 1},
    )
    geom = _first_polygon_feature(fc_keep_holes)["geometry"]
    shp = shape(geom)
    assert isinstance(shp, (Polygon, MultiPolygon))
    # Count total number of interior rings
    interiors = 0
    if isinstance(shp, Polygon):
        interiors = len(shp.interiors)
    else:
        interiors = sum(len(p.interiors) for p in shp.geoms)
    assert interiors >= 1, "Hole should remain when remove_holes is False"

    # With hole removal (min_area=0 -> drop all holes)
    fc_drop_holes = mask_to_geojson(
        mask01=m,
        transform=None,
        crs=None,
        min_area_pixels=0,
        buffer_pixels=0,
        properties=None,
        min_area=0,
        simplify_tolerance=0.0,
        remove_holes=True,
        topology="preserve",
        morphology={"smooth": "none", "kernel_size": 3, "iterations": 1},
    )
    shp2 = shape(_first_polygon_feature(fc_drop_holes)["geometry"])
    if isinstance(shp2, Polygon):
        interiors2 = len(shp2.interiors)
    else:
        interiors2 = sum(len(p.interiors) for p in shp2.geoms)
    assert interiors2 == 0, "Expected holes to be dropped when remove_holes=True and min_area=0"


def test_morphology_open_close_effects():
    H, W = 64, 64
    rng = np.random.default_rng(1337)

    # Case A: speckled noise around a block -> opening should reduce small speckles
    mA = np.zeros((H, W), dtype=np.uint8)
    mA[20:44, 20:44] = 1
    noise = (rng.random((H, W)) > 0.95).astype(np.uint8)
    mA = np.clip(mA + noise, 0, 1).astype(np.uint8)

    opened = _apply_morphology(mA, smooth="open", kernel_size=3, iterations=1)
    assert opened.sum() <= mA.sum(), "Opening should not increase foreground pixel count"

    # Case B: block with tiny gaps -> closing should fill small gaps
    mB = np.zeros((H, W), dtype=np.uint8)
    mB[20:44, 20:44] = 1
    holes = (rng.random((24, 24)) > 0.98)
    mB[20:44, 20:44][holes] = 0  # introduce tiny gaps
    closed = _apply_morphology(mB, smooth="close", kernel_size=3, iterations=1)
    assert closed.sum() >= mB.sum(), "Closing should not decrease foreground pixel count"
    # Ensure binary semantics preserved
    assert set(np.unique(closed)).issubset({0, 1}), "Morphology must preserve binary mask {0,1}"


def test_topology_clean_produces_valid_geometries():
    # Two squares touching diagonally (corner-touch)
    H, W = 64, 64
    m = np.zeros((H, W), dtype=np.uint8)
    m[10:30, 10:30] = 1
    m[30:50, 30:50] = 1  # corner-touch at (30,30)

    fc = mask_to_geojson(
        mask01=m,
        transform=None,
        crs=None,
        min_area_pixels=0,
        buffer_pixels=0,
        properties=None,
        min_area=0,
        simplify_tolerance=0.0,
        remove_holes=False,
        topology="clean",  # apply topology cleaning
        morphology={"smooth": "none", "kernel_size": 3, "iterations": 1},
    )
    feats = fc.get("features", [])
    assert len(feats) >= 1
    # All geometries should be valid
    for f in feats:
        shp = shape(f["geometry"])
        assert shp.is_valid, "Topology cleaning should produce valid geometries"
        assert isinstance(shp, (Polygon, MultiPolygon))