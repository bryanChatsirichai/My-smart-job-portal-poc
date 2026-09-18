# Smart Job Portal POC

All-in-one Singapore job aggregator with:
- Python FastAPI backend
- React + TypeScript frontend (`module.scss`)
- SQLite job storage (no Docker required for local POC)
- MyCareersFuture ingestion adapter (no API key)
- Jobicy ingestion adapter (remote jobs, no API key — [Jobicy API](https://jobicy.com/jobs-rss-feed))
- Adzuna ingestion adapter (free API key — see [docs/adapters/adzuna.md](docs/adapters/adzuna.md))
- LinkedIn ingestion adapter (self-hosted [LinkedIn Jobs API](https://github.com/atharv01h/Linkedin-Jobs-Api) scraper — sync only, not runtime)
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

**Job sources:** see [docs/adapters/](docs/adapters/) — MyCareersFuture and Jobicy need no API keys; Adzuna needs `ADZUNA_APP_ID` and `ADZUNA_APP_KEY`; LinkedIn needs a self-hosted scraper on `localhost:3000` (enabled by default). Quick links: [MCF](docs/adapters/mycareersfuture.md) · [Jobicy](docs/adapters/jobicy.md) · [Adzuna](docs/adapters/adzuna.md) · [LinkedIn](docs/adapters/linkedin.md).

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

The running API **does not** call external job sources on each search. It only reads from **SQLite**:

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
| Jobicy | 200 | `--max-pages 1` → 100 jobs; `2` or default → 200 (API max) |
| Adzuna | 50 | up to ~100 jobs |
| LinkedIn | 70 | up to ~140 jobs (requires self-hosted scraper on `localhost:3000`) |

Use `--max-pages 2` for fast local testing; use full `--sync` when you want a complete dataset.

**Jobicy:** one API call per sync; `count` is `100 × --max-pages` (1→100, 2→200), or **200** when `--max-pages` is omitted. Optional filters in `backend/.env`: `JOBICY_GEO`, `JOBICY_INDUSTRY`, `JOBICY_TAG` — see [Jobicy API docs](https://jobicy.com/jobs-rss-feed).

See [job ingestion architecture](./docs/job-ingestion-architecture.md) for the full pipeline.

### LinkedIn (optional)

LinkedIn listings are **not** fetched when users search the portal. They are ingested during `--sync`, same as every other source. You must run the unofficial [LinkedIn Jobs API](https://github.com/atharv01h/Linkedin-Jobs-Api) scraper as a **separate Node service** before syncing.

**1. Start the scraper** (one-time clone; keep this terminal running during sync):

```bash
git clone https://github.com/atharv01h/Linkedin-Jobs-Api.git
cd Linkedin-Jobs-Api
npm install
npm run dev --workspace=backend   # listens on http://localhost:3000
```

Swagger docs: http://localhost:3000/api/v1/docs

**2. Configure the portal backend (optional)** — defaults work for local dev:

| Variable | Default | Description |
|----------|---------|-------------|
| `LINKEDIN_JOBS_API_URL` | `http://localhost:3000/api/v1` | Scraper API base URL |
| `LINKEDIN_LOCATION` | `Singapore` | Location filter |
| `LINKEDIN_KEYWORDS` | `""` | Optional search keywords |
| `LINKEDIN_DATE_SINCE_POSTED` | `past_week` | `past_24h`, `past_week`, or `past_month` |

Set `LINKEDIN_JOBS_API_URL=` in `backend/.env` to disable LinkedIn sync.

**3. Sync** (scraper must be running):

```bash
cd backend
uv run python -m app.worker --sync --max-pages 2
```

Expected output includes a `linkedin` entry (e.g. `fetched: 140` with `--max-pages 2`). The adapter calls `GET /jobs/search?location=Singapore&page=1` then `page=2`.

**4. Browse** — filter by **LinkedIn** in the UI, or set `?source=linkedin` in the URL. Apply links open LinkedIn in a new tab.

> **Note:** This uses an unofficial LinkedIn scraper (Puppeteer). It may break if LinkedIn changes their site, and job descriptions are not stored in the POC. Use responsibly.

### Database

**Current POC — SQLite (default):**

The backend uses **SQLite** by default (`sqlite:///./jobportal.db` in `backend/.env`). No Docker or separate database server is required to run the POC locally.

To browse job rows during dev testing, see [docs/sqlite-db-viewer-setup.md](docs/sqlite-db-viewer-setup.md) (DB Browser for SQLite on Mac and Windows).

**Future — Postgres via Docker/Podman (optional, not required now):**

[`backend/docker/postgres/docker-compose.yml`](backend/docker/postgres/docker-compose.yml) is included for when you later move job storage to Postgres (e.g. production scale, full sync volume, or hosted deployment). You do **not** need to run it for the current POC.

When ready:

```bash
cd backend/docker/postgres
cp .env.example .env   # adjust credentials if needed
podman compose up -d   # or: docker compose up -d
podman compose ps      # should show healthy after ~10s
```

Then set in `backend/.env`:

```env
DATABASE_URL=postgresql+psycopg2://jobportal:jobportal@localhost:5432/jobportal
```

Re-run `uv run python -m app.worker --init-db` and sync after switching.

## Documentation

See [`docs/`](docs/) for architecture details — especially [job ingestion](./docs/job-ingestion-architecture.md) (how jobs are gathered from APIs and served to the frontend) and [viewing SQLite during dev](./docs/sqlite-db-viewer-setup.md).

## Environment

- **Backend:** create `backend/.env` from [`backend/.env.example`](backend/.env.example). Toggle sources with `MCF_ENABLED`, `JOBICY_ENABLED`, `ADZUNA_ENABLED`, `LINKEDIN_ENABLED`; tune fetch size with `*_PAGE_SIZE`.
- **Jobicy (optional):** no API key. Uncomment filters in `backend/.env.example` to narrow remote listings, e.g. `JOBICY_GEO=singapore`, `JOBICY_INDUSTRY=engineering`, `JOBICY_TAG=python`.
- **Job sources:** [docs/adapters/](docs/adapters/) — setup and API reference per adapter.
- **Frontend:** optional `frontend/.env` — leave `VITE_API_BASE_URL` empty so requests use the Vite `/api` proxy in dev.

## Notes

- Application tracking is stored in browser `localStorage` for this POC.
- Future production should move tracking to Postgres with portal auth.
- `backend/docker/postgres/docker-compose.yml` is kept for **future database use** (Postgres); SQLite remains the default until you choose to switch.
