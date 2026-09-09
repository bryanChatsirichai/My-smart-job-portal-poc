# LinkedIn

LinkedIn jobs via a **self-hosted** [LinkedIn Jobs API](https://github.com/atharv01h/Linkedin-Jobs-Api) scraper. Optional — the portal calls the scraper during sync only, never at browse time.

| Item | Value |
|------|--------|
| Adapter | `backend/app/adapters/linkedin/adapter.py` |
| Source ID in DB | `linkedin` |
| Scraper repo | [atharv01h/Linkedin-Jobs-Api](https://github.com/atharv01h/Linkedin-Jobs-Api) |

## Setup

### 1. Run the scraper service

Requires [Node.js 18+](https://nodejs.org/). Keep running while syncing LinkedIn jobs:

```bash
git clone https://github.com/atharv01h/Linkedin-Jobs-Api.git
cd Linkedin-Jobs-Api
npm install
npm run dev --workspace=backend
```

API: **http://localhost:3000** · Docs: http://localhost:3000/api/v1/docs

### 2. Configure the portal backend

Add to `backend/.env`:

```env
LINKEDIN_JOBS_API_URL=http://localhost:3000/api/v1
LINKEDIN_KEYWORDS=software engineer
LINKEDIN_LOCATION=Singapore
LINKEDIN_DATE_SINCE_POSTED=past_week
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LINKEDIN_JOBS_API_URL` | Yes | — | Scraper base URL including `/api/v1` |
| `LINKEDIN_KEYWORDS` | No | `""` | Search keywords |
| `LINKEDIN_LOCATION` | No | `Singapore` | Location filter |
| `LINKEDIN_DATE_SINCE_POSTED` | No | `past_week` | `past_24h`, `past_week`, or `past_month` |

The adapter is **not registered** if `LINKEDIN_JOBS_API_URL` is unset.

### 3. Sync

```bash
cd backend
uv run python -m app.worker --sync --max-pages 2
```

The scraper must be reachable. Sync uses a **120 second** HTTP timeout per page.

## API

```http
GET {LINKEDIN_JOBS_API_URL}/jobs/search?page={page}&keywords=...&location=...&dateSincePosted=...
```

| Parameter | Description |
|-----------|-------------|
| `page` | **1-based** page number |
| `keywords` | From `LINKEDIN_KEYWORDS` |
| `location` | From `LINKEDIN_LOCATION` |
| `dateSincePosted` | From `LINKEDIN_DATE_SINCE_POSTED` |

### Response

JSON with `jobs` array (and `success` flag).

## Configuration

| Setting | Location | Default |
|---------|----------|---------|
| API URL | `linkedin_jobs_api_url` / `LINKEDIN_JOBS_API_URL` | `""` (disabled) |
| Page size | `linkedin_page_size` / `LINKEDIN_PAGE_SIZE` | `25` |

## Pagination

| Mode | Pages | Approx. jobs |
|------|-------|--------------|
| `--max-pages 2` | 2 | up to **~50** (2 × 25) |
| Full `--sync` | all | until scraper returns no more |

## Data mapping

| Scraper field | Stored as |
|---------------|-----------|
| `title` | `title` |
| `company` | `company_name` |
| `location` | `location.address` / `region` |
| `link` | `apply_url` |
| `listDate` | `posted_date` |
| `id` (from URL) | `source_job_id` |
| `insights.salaryRange` | `salary_min` / `salary_max` / currency / period |
| `insights.seniorityLevel` | `seniority_level` |
| `insights.jobType` | `employment_type` |
| `insights.requiredSkills` | `skills` |
| — | `source = linkedin` |

Job descriptions are **not** stored (search endpoint does not return them). Salary/skills only if `insights` is present.

## Verify in the UI

1. `uv run uvicorn app.main:app --reload --port 8000` (from `backend/`)
2. `npm run dev` (from `frontend/`)
3. Open http://localhost:5173 → **Source** filter → **LinkedIn**

## Notes

- **Unofficial** — LinkedIn may block scraping; reliability not guaranteed.
- **Sync-time only** — UI reads from SQLite after sync.
- **Opt-in** — omit `LINKEDIN_JOBS_API_URL` to disable.
- Use in line with LinkedIn's terms and applicable law.

See also: [job-ingestion-architecture.md](../job-ingestion-architecture.md)
