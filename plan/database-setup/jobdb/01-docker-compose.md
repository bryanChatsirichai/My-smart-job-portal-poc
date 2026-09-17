# Step 1.1 — Docker Compose (PostgreSQL)

**Goal:** Run PostgreSQL 16 locally via Docker so the backend can use Postgres instead of SQLite, with a repeatable setup on your PC or a VPS.

**Status:** ⬜ Not started  
**Depends on:** —  
**Blocks:** [02-alembic-migrations.md](./02-alembic-migrations.md), [03-dual-backend-verify.md](./03-dual-backend-verify.md)

**Estimated effort:** 1 session

---

## Context

Root [`docker-compose.yml`](../../docker-compose.yml) already defines:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: jobportal
      POSTGRES_PASSWORD: jobportal
      POSTGRES_DB: jobportal
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

This step hardens that file and documents how to run it.

---

## Tasks

### 1.1.1 Add healthcheck

**File:** `docker-compose.yml`

Add a `healthcheck` so dependent services (future) and humans know when Postgres is ready:

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U jobportal -d jobportal"]
  interval: 5s
  timeout: 5s
  retries: 5
  start_period: 10s
```

### 1.1.2 Add restart policy

```yaml
restart: unless-stopped
```

Keeps the DB running after reboot on a server.

### 1.1.3 Externalize credentials (optional but recommended)

Create root `.env` (or `docker-compose.env`) for Docker only:

```env
POSTGRES_USER=jobportal
POSTGRES_PASSWORD=jobportal
POSTGRES_DB=jobportal
```

Reference in `docker-compose.yml`:

```yaml
environment:
  POSTGRES_USER: ${POSTGRES_USER:-jobportal}
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-jobportal}
  POSTGRES_DB: ${POSTGRES_DB:-jobportal}
```

Add `.env` to `.gitignore` if it contains production secrets. Commit a `.env.example` at repo root for Docker vars.

### 1.1.4 Keep named volume

Retain `postgres_data` volume — data survives `docker compose down`. Only `docker compose down -v` wipes data.

### 1.1.5 Create backend env template for Postgres

**New file:** `backend/.env.postgres.example`

```env
DATABASE_URL=postgresql+psycopg2://jobportal:jobportal@localhost:5432/jobportal
CORS_ORIGINS=http://localhost:5173
# ... copy other vars from backend/.env.example
```

**New file:** `backend/.env.sqlite.example`

```env
DATABASE_URL=sqlite:///./jobportal.db
CORS_ORIGINS=http://localhost:5173
```

Document switching:

```bash
# Use Postgres
cp backend/.env.postgres.example backend/.env

# Use SQLite
cp backend/.env.sqlite.example backend/.env
```

### 1.1.6 Update README

**File:** `README.md` — add a short “Switching databases” subsection pointing to this plan.

---

## Commands reference

| Command | Effect |
|---------|--------|
| `docker compose up -d` | Start Postgres in background |
| `docker compose ps` | Check status (should show `healthy`) |
| `docker compose logs postgres` | View logs |
| `docker compose down` | Stop container; **keeps** data volume |
| `docker compose down -v` | Stop and **delete** all data |
| `docker exec -it <container> psql -U jobportal -d jobportal` | Interactive SQL shell |

---

## Verification checklist

- [ ] `docker compose up -d` succeeds
- [ ] `docker compose ps` shows `healthy` after ~10s
- [ ] Port `5432` reachable: `psql` or any SQL client connects with credentials above
- [ ] Data persists across `docker compose down` + `up -d`
- [ ] `backend/.env.postgres.example` and `backend/.env.sqlite.example` exist

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Port 5432 already in use | Stop local Postgres service or change host port to `5433:5432` and update `DATABASE_URL` |
| `connection refused` | Wait for healthcheck; check `docker compose logs` |
| Wrong password after change | `docker compose down -v` (wipes data) or update volume credentials manually |

---

## Security note (local vs server)

Default `jobportal`/`jobportal` is fine for **local dev only**. Before exposing to the internet, follow [04-production-hardening.md](./04-production-hardening.md).
