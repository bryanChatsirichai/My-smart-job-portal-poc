# Step 1.3 — Dual Backend Verification (SQLite + Postgres)

**Goal:** Prove worker and API work correctly against **both** database backends by switching only `DATABASE_URL`.

**Status:** ⬜ Not started  
**Depends on:** [01-docker-compose.md](./01-docker-compose.md), [02-alembic-migrations.md](./02-alembic-migrations.md)  
**Blocks:** Phase 2 authentication

**Estimated effort:** 1 session

---

## Principle

There is no runtime database toggle in code. Verification means:

1. Set `DATABASE_URL` to SQLite → run full flow → record results
2. Set `DATABASE_URL` to Postgres → run full flow → record results
3. Confirm datasets are independent

Both `uvicorn` and `python -m app.worker` must be restarted after changing `.env` (settings load at import time).

---

## Test matrix

Run every row for **SQLite** and **Postgres**:

| # | Step | SQLite | Postgres | Notes |
|---|------|--------|----------|-------|
| 1 | `alembic upgrade head` | ⬜ | ⬜ | Fresh or stamped DB |
| 2 | `worker --sync --max-pages 2` | ⬜ | ⬜ | Check per-source counts in output |
| 3 | `GET /api/v1/jobs` | ⬜ | ⬜ | Returns `items`, `total` |
| 4 | `GET /api/v1/jobs/{id}` | ⬜ | ⬜ | Use ID from list response |
| 5 | `GET /api/v1/jobs?q=engineer` | ⬜ | ⬜ | Text search (`ILIKE`) |
| 6 | `GET /api/v1/jobs?location=Singapore` | ⬜ | ⬜ | JSON location branch |
| 7 | `GET /api/v1/jobs?source=mycareersfuture` | ⬜ | ⬜ | Source filter |
| 8 | `GET /api/v1/jobs?sort=salary_desc` | ⬜ | ⬜ | Sort variant |
| 9 | Re-run `--sync` (upsert) | ⬜ | ⬜ | No duplicate rows; `updated_at` changes |
| 10 | Jobs not in sync marked `expired` | ⬜ | ⬜ | Optional: disable one source, sync, check |

---

## Procedure per backend

### SQLite profile

```bash
cp backend/.env.sqlite.example backend/.env
cd backend
uv run alembic upgrade head
uv run python -m app.worker --sync --max-pages 2
uv run uvicorn app.main:app --reload --port 8000
```

Test with browser (`http://localhost:5173`) or curl:

```bash
curl "http://localhost:8000/api/v1/health"
curl "http://localhost:8000/api/v1/jobs?limit=5"
```

### Postgres profile

```bash
docker compose up -d
cp backend/.env.postgres.example backend/.env
cd backend
uv run alembic upgrade head
uv run python -m app.worker --sync --max-pages 2
uv run uvicorn app.main:app --reload --port 8000
```

Repeat the same curl/browser tests.

### Independence check

- Sync 100+ jobs into Postgres
- Switch `.env` back to SQLite (without syncing)
- API should return SQLite dataset (likely different count)
- Confirms no accidental shared state

---

## Optional: health endpoint enhancement

**File:** `backend/app/api/routes/jobs.py` (or dedicated health route)

Extend `GET /api/v1/health` to report which backend is active (read-only, derived from `settings.database_url`):

```json
{
  "status": "ok",
  "database": "postgres"
}
```

Values: `sqlite` | `postgres` | `other`

This is for **debugging only** — not a switch. Do not expose connection strings.

---

## Known dialect differences (already handled)

**File:** `backend/app/db/search.py`

```python
USE_SQLITE = settings.database_url.startswith("sqlite")
```

Location filter uses `cast(Job.location, String)` on SQLite and JSON path `.astext` on Postgres. Verify step 6 in the matrix specifically.

---

## Documentation updates

**File:** `README.md`

Add section **“Database profiles”**:

| Profile | `DATABASE_URL` | Docker required |
|---------|----------------|-----------------|
| SQLite (default) | `sqlite:///./jobportal.db` | No |
| Postgres | `postgresql+psycopg2://...@localhost:5432/jobportal` | Yes |

Include quick-switch commands from [01-docker-compose.md](./01-docker-compose.md).

---

## Verification checklist

- [ ] All 10 matrix rows pass on SQLite
- [ ] All 10 matrix rows pass on Postgres
- [ ] Frontend job search works against both backends
- [ ] README documents both profiles
- [ ] (Optional) Health endpoint reports `database` type

---

## Failure triage

| Symptom | Likely cause |
|---------|--------------|
| `no such table: jobs` | Migrations not applied; run `alembic upgrade head` |
| Postgres `connection refused` | Docker not running or wrong port |
| Location filter empty on Postgres only | JSON path mismatch; check `search.py` branch |
| Worker writes but API sees old data | API not restarted after `.env` change |
| Duplicate key on sync | Expected on re-sync; should upsert, not fail |
