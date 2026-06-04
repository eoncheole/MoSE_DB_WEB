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
