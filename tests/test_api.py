"""Pruebas de la API Flask que usa el navegador."""
import pytest

from quantum_rush import create_app


@pytest.fixture
def client():
    return create_app().test_client()


def test_home_page_renders_all_screens(client):
    html = client.get("/").get_data(as_text=True)
    for screen in ("screen-title", "screen-intro", "screen-map", "screen-level1", "screen-level2", "screen-level3"):
        assert f'id="{screen}"' in html


def test_nivel1(client):
    r = client.post("/api/nivel1", json={"gates": [{"gate": "h", "q": 0}], "shots": 100})
    assert r.status_code == 200
    assert r.get_json()["shots"] == 100


def test_nivel1_rejects_bad_gate(client):
    r = client.post("/api/nivel1", json={"gates": [{"gate": "magia", "q": 0}]})
    assert r.status_code == 400
    assert "error" in r.get_json()


def test_nivel2(client):
    data = client.get("/api/nivel2/data").get_json()
    r = client.post("/api/nivel2/scan", json={"gates": ["h", "cswap", "h"], "a": data["healthy"], "b": data["first"]})
    assert r.status_code == 200
    assert 0 <= r.get_json()["measured"] <= 1


def test_nivel2_missing_point_is_bad_request(client):
    assert client.post("/api/nivel2/scan", json={"gates": ["h"]}).status_code == 400


def test_nivel3(client):
    assert len(client.get("/api/nivel3/data").get_json()["berries"]) > 0
    body = {"layers": ["ry", "rx", "cx"], "params": [1.6, 1.6, 0.9, -0.9]}
    assert "accuracy" in client.post("/api/nivel3/eval", json=body).get_json()
    trained = client.post("/api/nivel3/train", json={**body, "epochs": 4}).get_json()
    assert len(trained["history"]) == 4
