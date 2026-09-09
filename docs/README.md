# Documentation

## Local development

| Document | Description |
|----------|-------------|
| [SQLite DB viewer setup (Mac & Windows)](./sqlite-db-viewer-setup.md) | Open and inspect `backend/jobportal.db` during dev and testing |

## Architecture

| Document | Description |
|----------|-------------|
| [Job ingestion architecture](./job-ingestion-architecture.md) | How jobs are gathered from external APIs, normalized, stored in SQLite, and served to the frontend |

## Job sources

| Source | API key | Setup doc | Adapter |
|--------|---------|-----------|---------|
| MyCareersFuture | None | — (public API) | `backend/app/adapters/mycareersfuture/` |
| Jobicy | None | [Jobicy API / RSS](https://jobicy.com/jobs-rss-feed) | `backend/app/adapters/jobicy/` |
| Adzuna | Free key required | [Adzuna API setup](./adzuna-setup.md) | `backend/app/adapters/adzuna/` |
| LinkedIn | Self-hosted scraper | See [LinkedIn](#linkedin) below | `backend/app/adapters/linkedin/` |

### Jobicy (remote jobs)

Jobicy is registered automatically — no account or API key. Sync pulls up to **200** latest remote listings per run (the API has no page offset).

Optional filters in `backend/.env` (see [`.env.example`](../.env.example)):

| Variable | Example | Purpose |
|----------|---------|---------|
| `JOBICY_GEO` | `singapore` | Location eligibility slug |
| `JOBICY_INDUSTRY` | `engineering` | Category slug |
| `JOBICY_TAG` | `python` | Keyword search |

Page size defaults to `200` (`jobicy_page_size` in `backend/app/config.py`). Listings use `source=jobicy` in search; apply links point to the canonical Jobicy job URL.

### LinkedIn

LinkedIn jobs are ingested through a **self-hosted** [LinkedIn Jobs API](https://github.com/atharv01h/Linkedin-Jobs-Api) service. This project does **not** embed the scraper — it calls the scraper’s REST API during sync only. The running FastAPI app never contacts LinkedIn at browse time.

```
LinkedIn Jobs API (Node, :3000)  →  LinkedInAdapter  →  SQLite  →  FastAPI  →  React
         ▲
    only during --sync
```

#### Prerequisites

- [Node.js 18+](https://nodejs.org/) (for the scraper repo)
- A separate clone of [atharv01h/Linkedin-Jobs-Api](https://github.com/atharv01h/Linkedin-Jobs-Api)

#### 1. Run the scraper service

Keep this process running whenever you sync LinkedIn jobs:

```bash
git clone https://github.com/atharv01h/Linkedin-Jobs-Api.git
cd Linkedin-Jobs-Api
npm install
npm run dev --workspace=backend
```

The API starts at **http://localhost:3000**. Interactive docs: http://localhost:3000/api/v1/docs

The portal adapter calls `GET /api/v1/jobs/search` with your configured keywords, location, and date filters.

#### 2. Configure the portal backend

Add to `backend/.env` (see also [`.env.example`](../.env.example)):

```env
LINKEDIN_JOBS_API_URL=http://localhost:3000/api/v1
LINKEDIN_KEYWORDS=software engineer
LINKEDIN_LOCATION=Singapore
LINKEDIN_DATE_SINCE_POSTED=past_week
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LINKEDIN_JOBS_API_URL` | Yes | — | Scraper base URL including `/api/v1`. Adapter is **not registered** if unset. |
| `LINKEDIN_KEYWORDS` | No | `""` | Search keywords (e.g. `data engineer`) |
| `LINKEDIN_LOCATION` | No | `Singapore` | Location passed to LinkedIn search |
| `LINKEDIN_DATE_SINCE_POSTED` | No | `past_week` | `past_24h`, `past_week`, or `past_month` |

Page size is **25 jobs per page** (`linkedin_page_size` in `backend/app/config.py`), matching LinkedIn’s pagination.

#### 3. Sync jobs

The scraper must be reachable before you run sync:

```bash
cd backend
uv run python -m app.worker --sync --max-pages 2
```

Example output when LinkedIn is configured:

```text
{'source': 'mycareersfuture', 'fetched': 100, 'upserted': 100, 'expired': 0}
{'source': 'jobicy', 'fetched': 200, 'upserted': 200, 'expired': 0}
{'source': 'linkedin', 'fetched': 50, 'upserted': 50, 'expired': 0}
```

If the scraper is down or `LINKEDIN_JOBS_API_URL` is missing, LinkedIn is skipped or logged as `sync_failed`; other sources still sync.

Sync uses a **120 second** HTTP timeout per page because Puppeteer scraping is slow.

#### 4. Verify in the UI

1. Start FastAPI: `uv run uvicorn app.main:app --reload --port 8000`
2. Start frontend: `npm run dev` (from `frontend/`)
3. Open http://localhost:5173
4. Use the **Source** filter → **LinkedIn**, or add `?source=linkedin` to the URL
5. Job cards show a LinkedIn badge; **Apply** opens the listing on linkedin.com

#### Data mapping

| Scraper field | Stored as |
|---------------|-----------|
| `title` | `title` |
| `company` | `company_name` |
| `location` | `location.address` / `region` |
| `link` | `apply_url` |
| `listDate` | `posted_date` |
| `id` (from URL) | `source_job_id` |
| — | `source = linkedin` |

Job descriptions are **not** stored in this POC (the search endpoint does not return full descriptions). Salary, seniority, and skills are populated only if the scraper response includes an `insights` object (e.g. from the `/jobs/analyze` endpoint in the upstream project; this adapter currently uses `/jobs/search`).

#### Notes and limitations

- **Unofficial API** — LinkedIn may change layouts or block scraping. The upstream project uses Puppeteer with stealth plugins; reliability is not guaranteed.
- **Sync-time only** — Users never trigger LinkedIn calls from the portal UI; listings come from SQLite after sync.
- **Opt-in** — Omit `LINKEDIN_JOBS_API_URL` to disable the adapter entirely.
- **Legal / ethical** — Use in line with LinkedIn’s terms and applicable law; this is a POC integration.

For Adzuna credentials, see [adzuna-setup.md](./adzuna-setup.md). For the full ingestion pipeline, see [job-ingestion-architecture.md](./job-ingestion-architecture.md).
