# Adzuna API setup (second job source)

Adzuna aggregates job listings from many sites in Singapore. This project uses their **official REST API** as the second adapter alongside MyCareersFuture.

## 1. Get API credentials

1. Go to [https://developer.adzuna.com](https://developer.adzuna.com)
2. Register a free developer account
3. Create an application and copy:
   - **Application ID** → `ADZUNA_APP_ID`
   - **Application Key** → `ADZUNA_APP_KEY`

## 2. Configure the backend

Add to `backend/.env`:

```env
ADZUNA_APP_ID=your_app_id_here
ADZUNA_APP_KEY=your_app_key_here
```

Restart the API server after changing env vars.

## 3. Sync jobs

```bash
cd backend
uv run python -m app.worker --sync --max-pages 2
```

You should see output for both sources:

```text
{'source': 'mycareersfuture', 'fetched': 100, 'upserted': 100, 'expired': 0}
{'source': 'adzuna', 'fetched': 50, 'upserted': 50, 'expired': 0}
```

## 4. Verify in the UI

1. Start FastAPI: `uv run uvicorn app.main:app --reload --port 8000`
2. Start frontend: `npm run dev` (from `frontend/`)
3. Open http://localhost:5173
4. Use the **Source** filter: All / MyCareersFuture / Adzuna
5. Job cards show a source badge; Apply opens the listing on the original site via `redirect_url`

## How it fits the architecture

```
Adzuna API  →  AdzunaAdapter  →  normalize  →  SQLite (jobs)  →  FastAPI  →  React
```

Same pipeline as MyCareersFuture. See [job-ingestion-architecture.md](./job-ingestion-architecture.md) for full details.

## Notes

- Without API keys, Adzuna is **skipped** — MyCareersFuture sync still works.
- Adzuna salaries are stored as **annual SGD** when provided.
- Rate limits apply per Adzuna developer account; use `--max-pages` for testing.
