# MoSE DB

Mobility Cybersecurity Lab — hardware vulnerability graph database.

## Structure

| Path | Role |
|------|------|
| `frontend/` | **Canonical frontend** — Next.js app (the one in `docker-compose.yml`) |
| `backend/` | FastAPI API + SQLAlchemy models + Alembic migrations |
| `legacy-vite/` | Archived original Vite SPA — reference only, do not deploy ([details](legacy-vite/README.md)) |

## Quick start (Docker)

```bash
cp .env.example .env        # then fill in the required values
# generate a signing key:
python3 -c "import secrets; print(secrets.token_urlsafe(48))"   # -> SECRET_KEY
docker compose up --build
```

The backend refuses to boot without `SECRET_KEY`, and `POSTGRES_PASSWORD` is
required by Compose. See `.env.example` for all variables.

## Local development

**Backend**
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head                       # Postgres; SQLite dev auto-creates tables
SECRET_KEY=dev-key uvicorn app.main:app --reload
pytest                                      # run the test suite
```

**Frontend**
```bash
cd frontend
npm install
npm run dev                                 # or: npm run build
```

## Security notes

- **Auth:** JWT via `/token`; writes (CVE/component/attack/lab/import) require an
  `admin` role. Rate-limited login. Set a strong `SECRET_KEY` and `ADMIN_PASSWORD`.
- **Admin seeding:** controlled by `SEED_ADMIN` / `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
  Disable seeding (`SEED_ADMIN=false`) once a real admin exists.
- **CORS:** explicit origins via `CORS_ORIGINS` (no wildcard with credentials).
