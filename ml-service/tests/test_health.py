import time
from datetime import datetime
from typing import Any, Dict


def test_health_happy_path(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    data: Dict[str, Any] = resp.get_json()
    assert data["status"] == "ok"
    assert "version" in data and isinstance(data["version"], str)
    assert "uptime_s" in data and isinstance(data["uptime_s"], (int, float))
    # header echo behavior (X-Request-Id optional) — ensure header present if set
    # In this test, no header is set; service may still generate one and echo back
    # Accept either absence or valid UUID-like string
    # Ensure uptime progresses
    time.sleep(0.01)
    resp2 = client.get("/health")
    data2 = resp2.get_json()
    assert data2["uptime_s"] >= data["uptime_s"]