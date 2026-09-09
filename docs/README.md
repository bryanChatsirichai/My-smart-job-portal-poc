# Documentation

## Local development

| Document | Description |
|----------|-------------|
| [SQLite DB viewer setup (Mac & Windows)](./sqlite-db-viewer-setup.md) | Open and inspect `backend/jobportal.db` during dev and testing |

## Architecture

| Document | Description |
|----------|-------------|
| [Job ingestion architecture](./job-ingestion-architecture.md) | How jobs are gathered from external APIs, normalized, stored in SQLite, and served to the frontend |

## Job source adapters

Setup and API reference for each ingestion adapter:

| Source | API key | Doc |
|--------|---------|-----|
| MyCareersFuture | None | [adapters/mycareersfuture.md](./adapters/mycareersfuture.md) |
| Jobicy | None | [adapters/jobicy.md](./adapters/jobicy.md) |
| Adzuna | Free key | [adapters/adzuna.md](./adapters/adzuna.md) |
| LinkedIn | Self-hosted scraper | [adapters/linkedin.md](./adapters/linkedin.md) |

See [adapters/README.md](./adapters/README.md) for a quick overview and sync command.
