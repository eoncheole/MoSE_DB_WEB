# Legacy Vite frontend (archived)

This is the original Vite + React single-page app (`auto-isaac-platform`). It has
been **superseded by the Next.js app in `frontend/`**, which is the canonical
frontend wired into `docker-compose.yml`.

Kept here for reference / history only. It does **not** reflect the current
backend contract — notably it predates:

- role-based authorization (admin-only writes, 403 handling),
- the relational `asset` → affected-component model,
- the unified `API_URL` config.

Do not deploy or develop against this app. If you need its functionality, port
it into `frontend/` instead.
