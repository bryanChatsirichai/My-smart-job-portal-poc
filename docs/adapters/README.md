# Job source adapters

Each adapter fetches listings from an external API, normalizes them, and upserts into SQLite during `--sync`.

| Source | API key | Doc | Adapter code |
|--------|---------|-----|--------------|
| MyCareersFuture | None | [mycareersfuture.md](./mycareersfuture.md) | `backend/app/adapters/mycareersfuture/` |
| Jobicy | None | [jobicy.md](./jobicy.md) | `backend/app/adapters/jobicy/` |
| Adzuna | Free key | [adzuna.md](./adzuna.md) | `backend/app/adapters/adzuna/` |
| LinkedIn | Self-hosted scraper | [linkedin.md](./linkedin.md) | `backend/app/adapters/linkedin/` |

## Quick sync (all sources)

```bash
cd backend
uv run python -m app.worker --sync --max-pages 2
```

`--max-pages` caps pages **per source** — use for local dev. See [job-ingestion-architecture.md](../job-ingestion-architecture.md) for the full pipeline.
