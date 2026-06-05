# MoSE DB

**Mobility Cybersecurity Lab — hardware vulnerability graph database.**

MoSE DB catalogs hardware/semiconductor security knowledge as an explicit graph:
vulnerabilities (CVEs), the hardware **components** they affect, the **attack
techniques** that exploit them, and the **labs** that contributed each finding.
Every edge carries provenance (which lab, free-form notes), so the dataset can be
shared and merged across collaborating labs.

```
   Lab ──contributes──> CVE ──affects──> Component
                         │                   │
                       uses                contains / connects_to / variant_of
                         ▼                   ▼
                  AttackTechnique        Component
```

---

## Architecture

| Path | Role | Stack |
|------|------|-------|
| `frontend/` | **Canonical web UI** (referenced by `docker-compose.yml`) | Next.js 14, React 18, Tailwind, framer-motion, recharts, lucide-react |
| `backend/` | REST API, data model, migrations | FastAPI, SQLAlchemy, Alembic, Pydantic v1, python-jose (JWT), passlib/bcrypt, slowapi |
| `legacy-vite/` | Archived original Vite SPA — reference only, **do not deploy** ([details](legacy-vite/README.md)) | Vite + React |
| `docs/` | Technical docs (e.g. [security hardening report](docs/HARDENING_REPORT.md)) | — |

**Services** (`docker-compose.yml`): `frontend` (3000) · `backend` (8000) ·
`db` PostgreSQL 15 (5432) · `redis` (6379).
The backend uses SQLite automatically when `DATABASE_URL` is unset (local dev).

---

## Quick start (Docker)

```bash
cp .env.example .env

# generate a JWT signing key and paste it into .env as SECRET_KEY:
python3 -c "import secrets; print(secrets.token_urlsafe(48))"

# set at least SECRET_KEY and POSTGRES_PASSWORD in .env, then:
docker compose up --build
```

- Frontend → http://localhost:3000
- API + interactive docs → http://localhost:8000/docs

> The backend **refuses to boot without `SECRET_KEY`**, and Compose requires
> `POSTGRES_PASSWORD`. This is intentional (fail-closed). See `.env.example`.

---

## Local development

**Backend**
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Postgres: apply migrations. SQLite dev: tables auto-create on first run.
alembic upgrade head

SECRET_KEY=$(python -c "import secrets;print(secrets.token_urlsafe(48))") \
  uvicorn app.main:app --reload          # http://localhost:8000

pytest -q                                 # run the test suite (15 tests)
```

**Frontend**
```bash
cd frontend
npm install
npm run dev                               # http://localhost:3000
# npm run build && npm start              # production build
```

Point the frontend at the API with `NEXT_PUBLIC_API_URL` (defaults to
`http://localhost:8000`). The base URL is centralized in `frontend/lib/api.js`.

---

## Data model

| Entity | Description |
|--------|-------------|
| `Lab` | Contributor (our lab + collaborating labs) |
| `Component` | Hardware piece — SoC, MCU, Memory, Bus, Firmware, Board, Sensor |
| `CVE` | Vulnerability record (severity, CVSS, remediation script, status) |
| `AttackTechnique` | Exploitation method (side-channel, fault injection, …; optional MITRE id) |

**Edges** (association tables carrying provenance):
`CVEAffectsComponent`, `CVEUsesAttack`, `ComponentRelation`
(`contains` / `connects_to` / `variant_of` / `depends_on`).

A small connected demo dataset is seeded on startup so the dashboard isn't empty.

---

## API overview

Interactive docs at `/docs`. Reads require authentication; **writes require an
`admin` role** (non-admins receive `403`).

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/` | — | Health |
| `POST` | `/users/` | public | Register (always role `user`) |
| `POST` | `/token` | public | Login → JWT (rate-limited) |
| `GET` | `/users/me` | user | Current profile |
| `GET` | `/admin/users` | admin | List users |
| `DELETE` | `/admin/users/{id}` | admin | Delete user (not self/admin) |
| `GET` | `/labs/`, `/components/`, `/attacks/`, `/cves/` | user | List (paginated, capped) |
| `GET` | `/cves/{id}/graph` | user | CVE + connected components/attacks/labs |
| `GET` | `/graph/overview` | user | Flat nodes+edges for visualization |
| `POST` | `/labs/`, `/components/`, `/attacks/`, `/cves/` | **admin** | Create |
| `POST` | `/cves/links/components`, `/cves/links/attacks` | **admin** | Link CVE edges |
| `POST` | `/graph/component-relations` | **admin** | Link components |
| `POST` | `/import/bundle` | **admin** | Idempotent bulk import of a partner bundle |

---

## Configuration

| Variable | Purpose | Default / requirement |
|----------|---------|----------------------|
| `SECRET_KEY` | JWT signing key | **Required** — app won't boot without it |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime (min) | `30` |
| `CORS_ORIGINS` | Allowed origins (comma-separated) | `http://localhost:3000` |
| `SEED_ADMIN` | Seed an admin on startup | `true` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seeded admin credentials | `admin` / `admin` (warns) |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | DB credentials | PASSWORD **required** |
| `DATABASE_URL` | DB connection | unset → SQLite (`./mose.db`) |
| `RATELIMIT_STORAGE_URI` | Rate-limit backend | unset → in-memory; use Redis for multi-worker |
| `TOKEN_RATELIMIT` | `/token` limit | `10/minute` |
| `NEXT_PUBLIC_API_URL` | Frontend → API base | `http://localhost:8000` |

Copy `.env.example` → `.env` and fill in real values. `.env` is gitignored —
never commit secrets.

---

## Security

- **Authentication** — JWT (HS256) via `/token`; `SECRET_KEY` is mandatory.
- **Authorization** — role-based (`role` column). All writes/imports require
  `admin`; reads require any authenticated user.
- **Brute-force protection** — login is rate-limited (`slowapi`).
- **Admin provisioning** — env-driven seeding; disable with `SEED_ADMIN=false`
  once a real admin exists, and always set a strong `ADMIN_PASSWORD`.
- **CORS** — explicit origins only (no wildcard with credentials).

A full account of findings, fixes (with PoCs and severity ratings), and remaining
risks is in **[docs/HARDENING_REPORT.md](docs/HARDENING_REPORT.md)**.

> **Known remaining item:** the frontend stores the JWT in `localStorage`
> (XSS-exposed). Moving to HttpOnly cookies is the top outstanding hardening task.

---

## Testing

```bash
cd backend && pytest -q          # 15 tests: auth, RBAC (403/401/201),
                                 # list shape, import idempotency,
                                 # pagination caps, rate limiting, user deletion
```

The suite uses FastAPI `TestClient` against a throwaway SQLite DB and is the
canonical regression guard for the security/design changes above.

---

## License

Internal — Mobility Cybersecurity Lab, Kookmin University.
