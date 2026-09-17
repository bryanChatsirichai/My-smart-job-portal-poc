# Step 3.1 — Applications Schema and API

**Goal:** Store tracked job applications in the database, scoped per user, with a REST API replacing browser `localStorage`.

**Status:** ⬜ Not started  
**Depends on:** Phase 2 complete ([authentication/02-auth-api.md](../authentication/02-auth-api.md)), Phase 1 ([jobdb/02-alembic-migrations.md](../jobdb/02-alembic-migrations.md))  
**Blocks:** [02-frontend-migration.md](./02-frontend-migration.md)

**Estimated effort:** 2 sessions

---

## Context

Today `frontend/src/services/trackingService.ts` stores `TrackedApplication[]` in `localStorage` under key `jobPortal_trackedApplications`. Each record includes:

- `id`, `jobId`, `status`, `notes`, `appliedAt`
- `jobSnapshot` — denormalized copy of job fields (title, company, source, etc.)

Phase 3 moves this to Postgres/SQLite with `user_id` ownership.

---

## Schema design

### `applications` table

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → `users.id`, ON DELETE CASCADE |
| `job_id` | UUID | FK → `jobs.id`, ON DELETE SET NULL, nullable |
| `status` | VARCHAR(32) | NOT NULL — `saved`, `applied`, `interview`, `rejected`, `accepted` |
| `notes` | TEXT | nullable |
| `applied_at` | TIMESTAMP TZ | NOT NULL |
| `created_at` | TIMESTAMP TZ | NOT NULL |
| `updated_at` | TIMESTAMP TZ | NOT NULL |
| `job_snapshot` | JSON | NOT NULL — denormalized job copy |

**Constraints:**

- `UNIQUE (user_id, job_id)` — one application per job per user (when `job_id` is not null)
- Index on `(user_id, status)` for dashboard filters
- Index on `(user_id, applied_at)` for analytics

**Why `job_snapshot`?**

Jobs can be marked `expired` or deleted. The dashboard should still show title/company for historical applications — same pattern as current `localStorage` design.

**Why nullable `job_id`?**

If a job row is removed, the application row survives with snapshot only.

---

## API design

Base path: `/api/v1/applications` — **all routes require auth** (`Depends(get_current_user)`).

| Method | Path | Body / params | Response |
|--------|------|---------------|----------|
| `GET` | `/applications` | Query: `status?` | `ApplicationListResponse` |
| `GET` | `/applications/stats` | — | `{ saved, applied, interview, ... }` |
| `POST` | `/applications` | `{ job_id, status, notes? }` | `ApplicationDetail` |
| `PATCH` | `/applications/{id}` | `{ status?, notes? }` | `ApplicationDetail` |
| `DELETE` | `/applications/{id}` | — | `204 No Content` |

**`POST /applications` behavior:**

1. Verify `job_id` exists and is active (or allow expired with warning)
2. Reject duplicate `(user_id, job_id)` → `409 Conflict`
3. Build `job_snapshot` from current `Job` row
4. Set `applied_at` to now (or accept optional client timestamp)

**Authorization:**

- Users can only read/update/delete their own applications
- Return `404` (not `403`) for other users' IDs to avoid leaking existence

---

## Tasks

### 3.1.1 ORM model

**File:** `backend/app/models/orm.py`

```python
class Application(Base):
    __tablename__ = "applications"
    id: Mapped[uuid.UUID] = ...
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    job_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("jobs.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = ...
    notes: Mapped[str | None] = ...
    applied_at: Mapped[datetime] = ...
    job_snapshot: Mapped[dict] = mapped_column(JSON, ...)
```

### 3.1.2 Pydantic schemas

**New file:** `backend/app/models/application_schemas.py`

| Schema | Purpose |
|--------|---------|
| `ApplicationCreate` | `job_id`, `status`, `notes?` |
| `ApplicationUpdate` | `status?`, `notes?` |
| `ApplicationDetail` | Full response incl. `job_snapshot` |
| `ApplicationListResponse` | `{ items: [], total: int }` |
| `ApplicationStats` | Counts by status |

Align field names with frontend `TrackedApplication` where possible.

### 3.1.3 Database helpers

**New file:** `backend/app/db/applications.py`

| Function | Purpose |
|----------|---------|
| `list_applications(db, user_id, status?)` | Dashboard list |
| `get_application_stats(db, user_id)` | KPI counts |
| `create_application(db, user_id, job_id, ...)` | Insert with snapshot |
| `update_application(db, user_id, app_id, ...)` | Status/notes |
| `delete_application(db, user_id, app_id)` | Remove |
| `build_job_snapshot(job: Job) -> dict` | Map Job → snapshot JSON |

### 3.1.4 API routes

**New file:** `backend/app/api/routes/applications.py`

Mount in `main.py` with prefix `/api/v1`.

### 3.1.5 Alembic migration

```bash
uv run alembic revision --autogenerate -m "create applications table"
uv run alembic upgrade head
```

Test on SQLite and Postgres.

### 3.1.6 Snapshot builder

Map from `Job` model to snapshot shape matching frontend:

```typescript
// frontend/src/types/job.ts — TrackedApplication.jobSnapshot
{
  title, companyName, source, applyUrl,
  location?, salaryMin?, salaryMax?, salaryPeriod?
}
```

Use consistent casing in API (document snake_case vs camelCase mapping in frontend API layer).

---

## Verification checklist

- [ ] Migration applies on SQLite and Postgres
- [ ] `POST /applications` requires auth; rejects without token
- [ ] User A cannot read User B's applications
- [ ] Duplicate `job_id` for same user returns `409`
- [ ] `job_snapshot` populated correctly from `Job` row
- [ ] `PATCH` updates status and notes
- [ ] `DELETE` removes only own application
- [ ] `GET /applications/stats` matches list counts
- [ ] Application survives if linked job is expired (snapshot still readable)

---

## Files touched (implementation)

| File | Change |
|------|--------|
| `backend/app/models/orm.py` | `Application` model |
| `backend/app/models/application_schemas.py` | New |
| `backend/app/db/applications.py` | New |
| `backend/app/api/routes/applications.py` | New |
| `backend/app/main.py` | Mount router |
| `backend/alembic/versions/003_*.py` | Migration |
