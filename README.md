# Smart Job Portal POC

All-in-one Singapore job aggregator with:
- Python FastAPI backend
- React + TypeScript frontend (`module.scss`)
- SQLite job storage (no Docker required for local POC)
- MyCareersFuture ingestion adapter (no API key)
- Jobicy ingestion adapter (remote jobs, no API key — [Jobicy API](https://jobicy.com/jobs-rss-feed))
- Adzuna ingestion adapter (free API key — see [docs/adzuna-setup.md](docs/adzuna-setup.md))
- Browser `localStorage` application tracking (POC)

## Quick start

### First-time setup

**1. Backend** — requires [uv](https://docs.astral.sh/uv/) (`pip install uv` or see uv install docs).

```bash
cd backend
uv sync                       # install Python deps into .venv
uv run python -m app.worker --init-db
uv run python -m app.worker --sync --max-pages 2
```

Create `backend/.env` if needed (see [Environment](#environment) below).

| Command | Purpose |
|---------|---------|
| `uv sync` | Creates `.venv` and installs dependencies from `pyproject.toml` |
| `--init-db` | Creates SQLite tables in `jobportal.db` (run once, or after a DB/schema change) |
| `--sync --max-pages 2` | Fetches up to 2 **pages per source** into SQLite (see [Refreshing job data](#refreshing-job-data)) |

For Adzuna (second source), add `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` to `backend/.env` — see [docs/adzuna-setup.md](docs/adzuna-setup.md).

**2. Frontend**

```bash
cd frontend
npm install
```

### Local dev (every day)

Run **two terminals** — one for the API, one for the UI:

```bash
# Terminal 1 — backend API (serves jobs from SQLite)
cd backend
uv run uvicorn app.main:app --reload --port 8000

# Terminal 2 — frontend dev server
cd frontend
npm run dev
```

Open **http://localhost:5173**.

You do **not** need to re-run `--init-db` or `--sync` on every start. The API reads whatever is already in `jobportal.db`.

**How the frontend talks to the API:** Vite proxies `/api` to `http://localhost:8000` (see `frontend/vite.config.ts`), so the browser calls the same origin and CORS is not an issue. API docs: http://localhost:8000/docs

### How job data flows

The running API **does not** call MyCareersFuture or Adzuna on each search. It only reads from **SQLite**:

```
External APIs  →  sync worker (--sync)  →  jobportal.db  →  FastAPI  →  React
                 (manual or scheduled)      (cache)
```

When you search or open a job card, FastAPI queries the local database. External APIs are contacted only when you run the sync worker.

### Refreshing job data

Re-run sync when you want fresher listings. No need to restart `uvicorn` — reload the browser after sync completes.

```bash
cd backend
# Quick refresh (POC default — limited pages per source)
uv run python -m app.worker --sync --max-pages 2

# Full refresh (all pages until each source is exhausted — can be thousands of jobs)
uv run python -m app.worker --sync
```

| Flag | Meaning |
|------|---------|
| `--sync` | Fetch from each registered source and upsert into SQLite |
| `--max-pages N` | Stop after **N pages per source** (not N jobs total). Omit for a full sync |

**What `--max-pages 2` fetches** (page sizes from `backend/app/config.py`):

| Source | Jobs per page | With `--max-pages 2` |
|--------|---------------|----------------------|
| MyCareersFuture | 100 | up to ~200 jobs |
| Jobicy | 200 | up to ~200 jobs (single page; API max) |
| Adzuna | 50 | up to ~100 jobs |

Use `--max-pages 2` for fast local testing; use full `--sync` when you want a complete dataset.

See [job ingestion architecture](./docs/job-ingestion-architecture.md) for the full pipeline.

### Database

**Current POC — SQLite (default):**

The backend uses **SQLite** by default (`sqlite:///./jobportal.db` in `backend/.env`). No Docker or separate database server is required to run the POC locally.

**Future — Postgres via Docker (optional, not required now):**

[`docker-compose.yml`](docker-compose.yml) is included for when you later move job storage to Postgres (e.g. production scale, full sync volume, or hosted deployment). You do **not** need to run it for the current POC.

When ready:

```bash
docker compose up -d
```

Then set in `backend/.env`:

```env
DATABASE_URL=postgresql+psycopg2://jobportal:jobportal@localhost:5432/jobportal
```

Re-run `uv run python -m app.worker --init-db` and sync after switching.

## Documentation

See [`docs/`](docs/) for architecture details — especially [job ingestion](./docs/job-ingestion-architecture.md) (how jobs are gathered from APIs and served to the frontend).

## Environment

- **Backend:** create `backend/.env` with at least `DATABASE_URL` and `CORS_ORIGINS` (defaults in root [`.env.example`](.env.example)).
- **Frontend:** optional `frontend/.env` — leave `VITE_API_BASE_URL` empty so requests use the Vite `/api` proxy in dev.

## Notes

- Application tracking is stored in browser `localStorage` for this POC.
- Future production should move tracking to Postgres with portal auth.
- `docker-compose.yml` is kept for **future database use** (Postgres); SQLite remains the default until you choose to switch.
