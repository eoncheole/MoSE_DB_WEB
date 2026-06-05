"""Core API behavior — auth, role-based authorization, list shape, import idempotency.

These lock in the security/design changes: writes require an admin, the CVE list
carries affected-component names, and bundle imports are idempotent.
"""


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def test_root_online(client):
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["status"] == "Online"


def test_admin_login_has_admin_role(client, admin_token):
    res = client.get("/users/me", headers=_auth(admin_token))
    assert res.status_code == 200
    assert res.json()["role"] == "admin"


def test_self_registered_user_is_not_admin(client, user_token):
    res = client.get("/users/me", headers=_auth(user_token))
    assert res.status_code == 200
    assert res.json()["role"] == "user"


def test_list_cves_includes_component_names(client):
    res = client.get("/cves/")
    assert res.status_code == 200
    cves = res.json()
    assert len(cves) >= 3
    demo = next(c for c in cves if c["cve_id"] == "DEMO-CVE-001")
    # Relational replacement for the old `asset` string column.
    assert "STM32F407 SoC" in demo["components"]


def test_non_admin_cannot_create_cve(client, user_token):
    res = client.post(
        "/cves/",
        headers=_auth(user_token),
        json={"cve_id": "FORBIDDEN-1", "severity": "Low"},
    )
    assert res.status_code == 403


def test_unauthenticated_cannot_create_cve(client):
    res = client.post("/cves/", json={"cve_id": "NOAUTH-1", "severity": "Low"})
    assert res.status_code == 401


def test_admin_can_create_cve(client, admin_token):
    res = client.post(
        "/cves/",
        headers=_auth(admin_token),
        json={"cve_id": "ADMIN-NEW-1", "severity": "High", "description": "made by admin"},
    )
    assert res.status_code == 201, res.text
    assert res.json()["cve_id"] == "ADMIN-NEW-1"


def test_duplicate_cve_id_conflicts(client, admin_token):
    payload = {"cve_id": "DUP-1", "severity": "Medium"}
    first = client.post("/cves/", headers=_auth(admin_token), json=payload)
    assert first.status_code == 201
    second = client.post("/cves/", headers=_auth(admin_token), json=payload)
    assert second.status_code == 409


def test_import_bundle_is_idempotent(client, admin_token):
    bundle = {
        "lab": {"name": "Import Test Lab"},
        "components": [{"name": "ImportComp-A", "type": "MCU"}],
        "attacks": [{"name": "ImportAttack-A"}],
        "cves": [{
            "cve_id": "IMP-CVE-1",
            "severity": "High",
            "affects": ["ImportComp-A"],
            "attacks": ["ImportAttack-A"],
        }],
    }
    first = client.post("/import/bundle", headers=_auth(admin_token), json=bundle)
    assert first.status_code == 200, first.text
    assert first.json()["created"]["cves"] == 1

    second = client.post("/import/bundle", headers=_auth(admin_token), json=bundle)
    assert second.status_code == 200
    # Replaying the same payload creates nothing new.
    assert second.json()["created"]["cves"] == 0
    assert second.json()["updated"]["cves"] == 1


def test_import_bundle_requires_admin(client, user_token):
    res = client.post("/import/bundle", headers=_auth(user_token), json={"cves": []})
    assert res.status_code == 403


def test_admin_can_delete_normal_user(client, admin_token):
    created = client.post("/users/", json={"email": "todelete@example.com", "password": "pw12345"})
    assert created.status_code == 200
    uid = created.json()["id"]
    res = client.delete(f"/admin/users/{uid}", headers=_auth(admin_token))
    assert res.status_code == 204


def test_admin_cannot_delete_self(client, admin_token):
    me = client.get("/users/me", headers=_auth(admin_token)).json()
    res = client.delete(f"/admin/users/{me['id']}", headers=_auth(admin_token))
    assert res.status_code == 400


def test_non_admin_cannot_delete_user(client, user_token):
    created = client.post("/users/", json={"email": "victim@example.com", "password": "pw12345"})
    uid = created.json()["id"]
    res = client.delete(f"/admin/users/{uid}", headers=_auth(user_token))
    assert res.status_code == 403


def test_list_limit_is_capped(client):
    # Over-large limit is rejected by validation rather than served.
    res = client.get("/cves/", params={"limit": 100000})
    assert res.status_code == 422


def test_token_is_rate_limited(client):
    # Repeated login attempts from the same client eventually hit the limiter.
    # Keep this last: it exhausts the per-minute /token budget for this IP.
    statuses = [
        client.post("/token", data={"username": "nobody", "password": "wrong"}).status_code
        for _ in range(20)
    ]
    assert 429 in statuses
