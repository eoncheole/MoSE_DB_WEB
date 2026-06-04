"""Test fixtures.

We set the required environment (SECRET_KEY is mandatory and the app refuses to
boot without it) and point the DB at a throwaway SQLite file BEFORE importing
the app, because `app.database` reads DATABASE_URL at import time.
"""

import os
import tempfile

# Must be set before importing app.* modules.
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production")
_DB_PATH = os.path.join(tempfile.gettempdir(), "mose_test.db")
if os.path.exists(_DB_PATH):
    os.remove(_DB_PATH)
os.environ["DATABASE_URL"] = f"sqlite:///{_DB_PATH}"
os.environ["SEED_ADMIN"] = "true"
os.environ["ADMIN_EMAIL"] = "admin"
os.environ["ADMIN_PASSWORD"] = "admin"

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="session")
def client():
    # The context manager triggers FastAPI startup (seeds the demo graph + admin).
    with TestClient(app) as c:
        yield c


def _login(client, username, password):
    res = client.post("/token", data={"username": username, "password": password})
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


@pytest.fixture(scope="session")
def admin_token(client):
    return _login(client, "admin", "admin")


@pytest.fixture(scope="session")
def user_token(client):
    # Public self-registration creates a role=user account.
    client.post("/users/", json={"email": "tester@example.com", "password": "pw12345", "full_name": "Tester"})
    return _login(client, "tester@example.com", "pw12345")
