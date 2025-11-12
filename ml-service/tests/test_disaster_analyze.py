import uuid
from typing import Any, Dict, List


def _post(client, url: str, body: Dict[str, Any], headers: Dict[str, str]):
    return client.post(url, json=body, headers=headers)


def _mk_indices_for_fields() -> List[Dict[str, Any]]:
    """
    Build synthetic indices for two fields across a small pre/post window.
    event_date = 2025-01-15
    - Field A engineered to look like FLOOD (ndwi increases strongly post)
    - Field B engineered to look like DROUGHT (ndwi drops and ndvi drops)
    """
    arr: List[Dict[str, Any]] = []
    # Field A (flood-like): NDWI pre ~0.05, post ~0.30
    for d, ndvi, ndwi, tdvi in [
        ("2025-01-10", 0.60, 0.04, 0.05),  # pre
        ("2025-01-14", 0.58, 0.06, 0.05),  # pre
        ("2025-01-16", 0.55, 0.28, 0.06),  # post
        ("2025-01-20", 0.52, 0.32, 0.07),  # post
    ]:
        arr.append({"field_id": "A", "date": d, "ndvi": ndvi, "ndwi": ndwi, "tdvi": tdvi})

    # Field B (drought-like): NDWI pre ~0.30, post ~0.10; NDVI drop as well
    for d, ndvi, ndwi, tdvi in [
        ("2025-01-11", 0.55, 0.32, 0.05),  # pre
        ("2025-01-14", 0.53, 0.28, 0.05),  # pre
        ("2025-01-16", 0.36, 0.14, 0.06),  # post
        ("2025-01-20", 0.34, 0.08, 0.06),  # post
    ]:
        arr.append({"field_id": "B", "date": d, "ndvi": ndvi, "ndwi": ndwi, "tdvi": tdvi})
    return arr


def test_disaster_analyze_summary_ok(client, auth_headers):
    indices = _mk_indices_for_fields()
    body = {
        "indices": indices,
        "event": "auto",
        "event_date": "2025-01-15",
        "pre_days": 14,
        "post_days": 7,
        "return": "summary",
        "model_version": "1.0.0",
    }
    headers = dict(auth_headers)
    headers["X-Request-Id"] = str(uuid.uuid4())
    headers["X-Model-Version"] = "disaster_analysis-1.0.0"

    resp = _post(client, "/v1/disaster/analyze", body, headers)
    assert resp.status_code == 200, resp.get_data(as_text=True)
    data = resp.get_json()
    assert data["model"]["name"] == "disaster_analysis"
    assert data["model"]["version"] == "1.0.0"
    assert "analysis" in data and isinstance(data["analysis"], list) and len(data["analysis"]) == 2
    # Ensure fields are present with severity classification
    fids = sorted([rec["field_id"] for rec in data["analysis"]])
    assert fids == ["A", "B"]
    for rec in data["analysis"]:
        assert rec["event"] in ("flood", "drought", "stress")
        assert rec["severity"] in ("none", "low", "medium", "high")
        assert "metrics" in rec and isinstance(rec["metrics"], dict)
        assert "windows" in rec and rec["windows"] == {"pre_days": 14, "post_days": 7}


def test_disaster_analyze_both_includes_geojson(client, auth_headers):
    indices = _mk_indices_for_fields()
    body = {
        "indices": indices,
        "event": "auto",
        "event_date": "2025-01-15",
        "pre_days": 14,
        "post_days": 7,
        "return": "both",
    }
    headers = dict(auth_headers)
    headers["X-Model-Version"] = "disaster_analysis-1.0.0"
    resp = _post(client, "/v1/disaster/analyze", body, headers)
    assert resp.status_code == 200, resp.get_data(as_text=True)
    data = resp.get_json()
    assert "mask_geojson" in data and isinstance(data["mask_geojson"], dict)
    fc = data["mask_geojson"]
    assert fc.get("type") == "FeatureCollection"
    feats = fc.get("features") or []
    assert len(feats) > 0
    # Basic geometry sanity
    for f in feats:
        assert "geometry" in f and "type" in f["geometry"]


def test_disaster_analyze_validation_errors(client, auth_headers):
    # Bad event value
    bad_event_body = {
        "indices": [
            {"field_id": "A", "date": "2025-01-10", "ndvi": 0.5, "ndwi": 0.1, "tdvi": 0.05},
            {"field_id": "A", "date": "2025-01-16", "ndvi": 0.4, "ndwi": 0.2, "tdvi": 0.06},
        ],
        "event": "typhoon",  # invalid
        "event_date": "2025-01-15",
        "return": "summary",
    }
    resp = _post(client, "/v1/disaster/analyze", bad_event_body, auth_headers)
    assert resp.status_code == 400
    data = resp.get_json()
    assert data["error"]["code"] == "INVALID_INPUT"

    # Bad date format inside indices
    bad_date_body = {
        "indices": [
            {"field_id": "A", "date": "2025-01-32", "ndvi": 0.5, "ndwi": 0.1, "tdvi": 0.05},  # invalid day
            {"field_id": "A", "date": "2025-01-16", "ndvi": 0.4, "ndwi": 0.2, "tdvi": 0.06},
        ],
        "event": "flood",
        "event_date": "2025-01-15",
    }
    resp = _post(client, "/v1/disaster/analyze", bad_date_body, auth_headers)
    assert resp.status_code == 400
    data = resp.get_json()
    assert data["error"]["code"] == "INVALID_INPUT"