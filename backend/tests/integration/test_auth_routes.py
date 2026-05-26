from app.api.auth import _hash_reset_token
from app.auth.hashing import verify_password
from app.repositories.user_repository import get_user_by_email


def test_register_user(client):
    response = client.post(
        "/auth/register", json={"email": "test@example.com", "password": "password123"}
    )
    assert response.status_code == 200
    assert "user_id" in response.json()


def test_login_user(client):
    client.post(
        "/auth/register", json={"email": "login@example.com", "password": "password123"}
    )
    response = client.post(
        "/auth/login", json={"email": "login@example.com", "password": "password123"}
    )
    assert response.status_code == 200


def test_duplicate_register_fails(client):
    client.post(
        "/auth/register", json={"email": "dup@example.com", "password": "password123"}
    )
    response = client.post(
        "/auth/register", json={"email": "dup@example.com", "password": "password123"}
    )
    assert response.status_code == 400


def test_login_wrong_password(client):
    client.post(
        "/auth/register",
        json={"email": "wrongpass@example.com", "password": "correctpassword"},
    )
    response = client.post(
        "/auth/login",
        json={"email": "wrongpass@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401


def test_login_nonexistent_user(client):
    response = client.post(
        "/auth/login", json={"email": "ghost@example.com", "password": "password123"}
    )
    assert response.status_code == 401


def test_register_missing_email(client):
    response = client.post("/auth/register", json={"password": "password123"})
    assert response.status_code == 422


def test_register_missing_password(client):
    response = client.post("/auth/register", json={"email": "nopass@example.com"})
    assert response.status_code == 422


def test_register_invalid_email_format(client):
    response = client.post(
        "/auth/register", json={"email": "not-an-email", "password": "password123"}
    )
    assert response.status_code == 422


def test_forgot_password_returns_generic_response_for_missing_email(client, monkeypatch):
    sent_links = []

    monkeypatch.setenv("RESEND_API_KEY", "test_api_key")
    monkeypatch.setenv("CLIENT_URL", "http://localhost:3000")
    monkeypatch.setattr(
        "app.tasks.email_tasks.send_reset_email.delay",
        lambda email, reset_link: sent_links.append(reset_link),
    )

    response = client.post(
        "/auth/forgot-password", json={"email": "missing@example.com"}
    )

    assert response.status_code == 200
    assert response.json() == {
        "message": "If that email exists, a reset link has been sent."
    }
    assert sent_links == []


def test_reset_password_uses_single_use_token(client, db, monkeypatch):
    sent_links = []

    monkeypatch.setenv("RESEND_API_KEY", "test_api_key")
    monkeypatch.setenv("CLIENT_URL", "http://localhost:3000")
    monkeypatch.setattr(
        "app.tasks.email_tasks.send_reset_email.delay",
        lambda email, reset_link: sent_links.append(reset_link),
    )

    client.post(
        "/auth/register",
        json={"email": "reset@example.com", "password": "oldpassword"},
    )
    forgot_response = client.post(
        "/auth/forgot-password", json={"email": "reset@example.com"}
    )
    assert forgot_response.status_code == 200

    token = sent_links[0].rsplit("/", 1)[-1]
    db_user = get_user_by_email(db, "reset@example.com")
    assert db_user.reset_token == _hash_reset_token(token)
    assert db_user.reset_token != token

    new_password = "NewPassw0rd!"
    reset_response = client.post(
        f"/auth/reset-password/{token}", json={"password": new_password}
    )
    assert reset_response.status_code == 200

    db.refresh(db_user)
    assert verify_password(new_password, db_user.password)
    assert db_user.reset_token is None
    assert db_user.reset_token_expiry is None

    reuse_response = client.post(
        f"/auth/reset-password/{token}", json={"password": "AnotherPassw0rd!"}
    )
    assert reuse_response.status_code == 400
