import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    from app.api.food import get_db
    from app.api.meal import get_db as meal_get_db
    from app.api.auth import get_db as auth_get_db

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[meal_get_db] = override_get_db
    app.dependency_overrides[auth_get_db] = override_get_db

    # Disable SlowAPI rate limiting for the test session so the suite
    # can make as many requests as needed without hitting 429 errors.
    app.state.limiter.enabled = False
    try:
        with TestClient(app) as c:
            yield c
    finally:
        app.state.limiter.enabled = True
        app.dependency_overrides.clear()


@pytest.fixture
def authorized_client(client):
    """A TestClient pre-configured with a valid JWT Bearer token.

    Registers a fresh test user (unique email per test run), logs in,
    and injects the returned access token into the client's default
    Authorization header so every subsequent request is authenticated.
    """
    unique_email = f"testuser_{uuid.uuid4().hex}@example.com"
    password = "TestPassword123"

    reg_response = client.post(
        "/auth/register",
        json={"email": unique_email, "password": password},
    )
    assert reg_response.status_code == 200, (
        f"authorized_client: registration failed: {reg_response.text}"
    )

    login_response = client.post(
        "/auth/login",
        json={"email": unique_email, "password": password},
    )
    assert login_response.status_code == 200, (
        f"authorized_client: login failed: {login_response.text}"
    )

    token = login_response.json()["access_token"]

    client.headers.update({"Authorization": f"Bearer {token}"})

    return client
