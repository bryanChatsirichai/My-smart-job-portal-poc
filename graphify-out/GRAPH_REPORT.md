# Graph Report - My-smart-job-portal-poc  (2026-09-08)

## Corpus Check
- 46 files · ~8,934 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 241 nodes · 441 edges · 17 communities (16 shown, 1 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- adzuna/adapter.py
- JobDetailPage.tsx
- config.py
- package.json
- compilerOptions
- HomePage.tsx
- Adzuna API setup (second job source)
- Job Ingestion Architecture
- jobs.py
- trackingService.ts
- job-portal-backend

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 17 edges
2. `JobSourceAdapter` - 13 edges
3. `CanonicalJobInput` - 13 edges
4. `Job Ingestion Architecture` - 13 edges
5. `AdzunaAdapter` - 12 edges
6. `useTrackedApplications()` - 11 edges
7. `FetchParams` - 10 edges
8. `MyCareersFutureAdapter` - 9 edges
9. `sync_source()` - 9 edges
10. `getSourceDisplayName()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `upsert_job()` --uses--> `CanonicalJobInput`  [INFERRED]
  backend/app/db/upsert.py → backend/app/models/schemas.py
- `AdzunaAdapter` --uses--> `FetchParams`  [INFERRED]
  backend/app/adapters/adzuna/adapter.py → backend/app/adapters/base.py
- `AdzunaAdapter` --uses--> `CanonicalJobInput`  [INFERRED]
  backend/app/adapters/adzuna/adapter.py → backend/app/models/schemas.py
- `AdzunaAdapter` --uses--> `LocationSchema`  [INFERRED]
  backend/app/adapters/adzuna/adapter.py → backend/app/models/schemas.py
- `sync_source()` --uses--> `AdzunaAdapter`  [INFERRED]
  backend/app/worker/sync.py → backend/app/adapters/adzuna/adapter.py

## Import Cycles
- None detected.

## Communities (17 total, 1 thin omitted)

### Community 0 - "adzuna/adapter.py"
Cohesion: 0.15
Nodes (22): ABC, AdzunaAdapter, _format_contract_time(), _format_contract_type(), _parse_date(), datetime, Decimal, Adzuna job search API — https://developer.adzuna.com (Singapore: /jobs/sg/). (+14 more)

### Community 1 - "JobDetailPage.tsx"
Cohesion: 0.16
Nodes (22): ApplicationStatusBadge(), LABELS, ApplyButton(), ApplyButtonProps, DashboardJobCard(), DashboardJobCardProps, STATUS_OPTIONS, JobCard() (+14 more)

### Community 2 - "config.py"
Cohesion: 0.12
Nodes (21): Settings, get_job_by_id(), Session, UUID, search_jobs(), get_db(), Session, expire_stale_jobs() (+13 more)

### Community 3 - "package.json"
Cohesion: 0.07
Nodes (28): dependencies, react, react-dom, react-router-dom, devDependencies, sass, @types/react, @types/react-dom (+20 more)

### Community 4 - "compilerOptions"
Cohesion: 0.09
Nodes (22): compilerOptions, allowImportingTsExtensions, jsx, lib, module, moduleDetection, moduleResolution, noEmit (+14 more)

### Community 5 - "HomePage.tsx"
Cohesion: 0.14
Nodes (14): buildQuery(), fetchJobById(), fetchJobs(), request(), App(), FilterPanel(), FilterPanelProps, Layout() (+6 more)

### Community 6 - "Adzuna API setup (second job source)"
Cohesion: 0.11
Nodes (16): 1. Get API credentials, 2. Configure the backend, 3. Sync jobs, 4. Verify in the UI, Adzuna API setup (second job source), How it fits the architecture, Notes, Documentation (+8 more)

### Community 7 - "Job Ingestion Architecture"
Cohesion: 0.10
Nodes (20): Adding a new job source (checklist), Adding more sources, Adzuna (second source), Application tracking (separate from job ingestion), Components, Core design principle, File reference, Future improvements (not in POC) (+12 more)

### Community 8 - "jobs.py"
Cohesion: 0.28
Nodes (13): get_job(), health(), list_jobs(), get, Session, UUID, HealthResponse, JobDetail (+5 more)

### Community 9 - "trackingService.ts"
Cohesion: 0.49
Nodes (10): useTrackedApplications(), getAll(), getByJobId(), getStats(), readAll(), remove(), save(), updateNotes() (+2 more)

## Knowledge Gaps
- **72 isolated node(s):** `job-portal-backend`, `name`, `private`, `version`, `type` (+67 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Job Ingestion Architecture` connect `Job Ingestion Architecture` to `Adzuna API setup (second job source)`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `CanonicalJobInput` connect `adzuna/adapter.py` to `jobs.py`, `config.py`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `JobSourceAdapter` (e.g. with `CanonicalJobInput` and `get_adapters()`) actually correct?**
  _`JobSourceAdapter` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `CanonicalJobInput` (e.g. with `AdzunaAdapter` and `JobSourceAdapter`) actually correct?**
  _`CanonicalJobInput` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `AdzunaAdapter` (e.g. with `FetchParams` and `CanonicalJobInput`) actually correct?**
  _`AdzunaAdapter` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `job-portal-backend`, `name`, `private` to the rest of the system?**
  _72 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `config.py` be split into smaller, more focused modules?**
  _Cohesion score 0.11576354679802955 - nodes in this community are weakly interconnected._