import os

import pytest
from fastapi.testclient import TestClient

pytestmark = pytest.mark.skipif(
    not os.environ.get("DATABASE_URL"),
    reason="DATABASE_URL not set",
)


@pytest.fixture
def client() -> TestClient:
    from app.main import app

    return TestClient(app)


def test_healthz(client: TestClient) -> None:
    res = client.get("/api/healthz")
    assert res.status_code == 200
    assert res.json()["status"]


def test_languages(client: TestClient) -> None:
    res = client.get("/api/languages")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    if data:
        assert "id" in data[0]
        assert "slug" in data[0]
        assert "name" in data[0]


def test_articles(client: TestClient) -> None:
    res = client.get("/api/articles")
    assert res.status_code == 200
    assert isinstance(res.json(), list)
