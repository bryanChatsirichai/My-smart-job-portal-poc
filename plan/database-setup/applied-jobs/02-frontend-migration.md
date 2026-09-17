# Step 3.2 — Frontend Migration (API-backed tracking)

**Goal:** Replace `localStorage` tracking with authenticated API calls while keeping dashboard analytics and UX intact.

**Status:** ⬜ Not started  
**Depends on:** [01-schema-and-api.md](./01-schema-and-api.md), [authentication/03-frontend-auth.md](../authentication/03-frontend-auth.md)  
**Blocks:** [03-localstorage-import.md](./03-localstorage-import.md)

**Estimated effort:** 2 sessions

---

## Context

Files that touch tracked applications today:

| File | Role |
|------|------|
| `frontend/src/services/trackingService.ts` | Sync localStorage CRUD |
| `frontend/src/hooks/useTrackedApplications.ts` | React hook |
| `frontend/src/pages/JobDetailPage.tsx` | Save on apply |
| `frontend/src/pages/DashboardPage.tsx` | List, filter, KPIs |
| `frontend/src/components/Layout/Layout.tsx` | Nav badge count |
| `frontend/src/components/DashboardJobCard/DashboardJobCard.tsx` | Status/notes edit |
| `frontend/src/utils/applicationAnalytics.ts` | Pure aggregation |
| `frontend/src/components/DashboardAnalytics/DashboardAnalytics.tsx` | Charts |

**Strategy:** Keep `TrackedApplication` type and analytics utils; change the data source from `localStorage` to API.

---

## Tasks

### 3.2.1 Applications API client

**New file:** `frontend/src/api/applications.ts`

| Function | Maps to |
|----------|---------|
| `fetchApplications(status?)` | `GET /applications` |
| `fetchApplicationStats()` | `GET /applications/stats` |
| `createApplication(jobId, status, notes?)` | `POST /applications` |
| `updateApplication(id, { status?, notes? })` | `PATCH /applications/{id}` |
| `deleteApplication(id)` | `DELETE /applications/{id}` |

Use shared `request()` from `api/client.ts` (includes JWT header).

Map API snake_case ↔ frontend camelCase in this layer.

### 3.2.2 Refactor tracking service

**Option A (recommended):** Replace `trackingService.ts` internals with API calls; keep the same public method signatures where possible.

**Option B:** Delete `trackingService.ts`; move logic into hook + API directly.

If keeping service as facade:

```typescript
// trackingService.ts — now async
async getAll(): Promise<TrackedApplication[]> {
  return fetchApplications();
}
async save(job: JobListItem, status: ApplicationStatus): Promise<TrackedApplication> {
  return createApplication(job.id, status);
}
```

### 3.2.3 Async hook

**File:** `frontend/src/hooks/useTrackedApplications.ts`

Add state:

| Field | Type |
|-------|------|
| `items` | `TrackedApplication[]` |
| `stats` | `ApplicationStats` |
| `isLoading` | `boolean` |
| `error` | `string \| null` |

On mount (when authenticated):

```typescript
useEffect(() => {
  if (!isAuthenticated) return;
  loadApplications();
}, [isAuthenticated]);
```

Expose async methods: `save`, `updateStatus`, `updateNotes`, `remove`, `refresh`.

### 3.2.4 Update consumers

**`JobDetailPage.tsx`:**

- `await save(job, status)` after apply modal confirm
- Handle loading/error states
- Require auth (redirect from Phase 2)

**`DashboardPage.tsx`:**

- Show loading skeleton while fetching
- Show error banner with retry
- Remove subtitle **"Saved in this browser"**
- Update empty state copy: "No tracked applications yet"

**`Layout.tsx`:**

- Badge count from `stats` or `items.length`
- Hide or zero badge when logged out

**`DashboardJobCard.tsx`:**

- `updateStatus` / `updateNotes` / `remove` → async with optimistic UI optional

### 3.2.5 Analytics — minimal changes

**Files:** `applicationAnalytics.ts`, `DashboardAnalytics.tsx`

These accept `TrackedApplication[]` — **no change** if API/hook returns the same shape.

Verify:

- `getPipelineCounts(items)`
- `getSourceBreakdown(items)`
- `getApplicationsOverTime(items)`

Still work with API data.

### 3.2.6 Remove localStorage writes

After migration:

- Stop writing `jobPortal_trackedApplications`
- Keep read-only import path for [03-localstorage-import.md](./03-localstorage-import.md)
- Remove `sessionStorage` usage for dashboard stats toggle if unrelated (keep `jobPortal_dashboardShowStats`)

### 3.2.7 Error handling

| Scenario | UX |
|----------|-----|
| 401 on fetch | Logout + redirect login |
| Network error | Toast + retry button |
| 409 duplicate track | Show "Already tracked" message |

---

## Type alignment

Ensure `TrackedApplication` in `types/job.ts` matches API response:

```typescript
export interface TrackedApplication {
  id: string;
  jobId: string;
  status: ApplicationStatus;
  notes?: string;
  appliedAt: string;
  jobSnapshot: JobSnapshot;
}
```

Add mapper `toTrackedApplication(dto: ApplicationDetail): TrackedApplication` in API layer.

---

## Verification checklist

- [ ] Track job from detail page → appears on dashboard after refresh
- [ ] Update status and notes persists across reload
- [ ] Remove application works
- [ ] Nav badge count correct
- [ ] Dashboard analytics charts render with API data
- [ ] Dashboard filters (status, salary) still work
- [ ] Logged-out user cannot access dashboard data
- [ ] No new writes to `localStorage` for applications
- [ ] `npm run build` passes

---

## Files touched (implementation)

| File | Change |
|------|--------|
| `frontend/src/api/applications.ts` | New |
| `frontend/src/services/trackingService.ts` | API-backed or removed |
| `frontend/src/hooks/useTrackedApplications.ts` | Async + auth |
| `frontend/src/pages/JobDetailPage.tsx` | Async save |
| `frontend/src/pages/DashboardPage.tsx` | Loading/error, copy |
| `frontend/src/components/Layout/Layout.tsx` | Badge |
| `frontend/src/components/DashboardJobCard/DashboardJobCard.tsx` | Async updates |
| `frontend/src/types/job.ts` | Align with API if needed |
