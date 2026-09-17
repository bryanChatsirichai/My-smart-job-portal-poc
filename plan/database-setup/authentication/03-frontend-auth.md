# Step 2.3 — Frontend Authentication

**Goal:** Add login/register UI, persist JWT, attach it to API calls, and protect dashboard routes.

**Status:** ⬜ Not started  
**Depends on:** [02-auth-api.md](./02-auth-api.md)  
**Blocks:** [applied-jobs/02-frontend-migration.md](../applied-jobs/02-frontend-migration.md)

**Estimated effort:** 2 sessions

---

## Context

Today:

- `frontend/src/App.tsx` — three public routes: `/`, `/jobs/:id`, `/dashboard`
- `frontend/src/api/jobs.ts` — fetch with no auth headers
- No login, logout, or user menu

After this step:

- Unauthenticated users can browse jobs
- `/dashboard` requires login
- Track-application actions require login (prepare for Phase 3)

---

## Tasks

### 2.3.1 API client with auth

**New file:** `frontend/src/api/client.ts`

```typescript
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('jobPortal_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options?.headers,
    },
  });
  // handle 401 → clear token, redirect login
}
```

Refactor `jobs.ts` to use shared `request()` or keep separate (jobs stay unauthenticated).

**New file:** `frontend/src/api/auth.ts`

| Function | Endpoint |
|----------|----------|
| `register(email, password)` | `POST /api/v1/auth/register` |
| `login(email, password)` | `POST /api/v1/auth/login` |
| `getMe()` | `GET /api/v1/auth/me` |

### 2.3.2 Auth context

**New file:** `frontend/src/contexts/AuthContext.tsx`

State:

| Field | Type |
|-------|------|
| `user` | `UserPublic \| null` |
| `isLoading` | `boolean` |
| `isAuthenticated` | `boolean` |

Methods:

| Method | Behavior |
|--------|----------|
| `login(email, password)` | Call API, store token, set user |
| `register(email, password)` | Same as login after register |
| `logout()` | Clear token + user |
| `refreshUser()` | `GET /me` on mount if token exists |

**New hook:** `frontend/src/hooks/useAuth.ts`

Wrap app in `AuthProvider` in `App.tsx` or `main.tsx`.

### 2.3.3 Token storage

**POC choice:** `localStorage` key `jobPortal_token`

| Approach | Pros | Cons |
|----------|------|------|
| `localStorage` | Simple, works with Vite proxy | XSS can steal token |
| `httpOnly` cookie | Safer from XSS | Needs backend cookie setup + CSRF care |

Document decision in code comment; upgrade path in [04-security-checklist.md](./04-security-checklist.md).

### 2.3.4 Login and register pages

**New files:**

- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/pages/RegisterPage.tsx`
- Matching `.module.scss` files

UX:

- Email + password form
- Link between login ↔ register
- Show API error messages (invalid credentials, email taken)
- Redirect to `/dashboard` or previous page on success

### 2.3.5 Protected route wrapper

**New file:** `frontend/src/components/ProtectedRoute/ProtectedRoute.tsx`

```tsx
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}
```

**File:** `frontend/src/App.tsx`

```tsx
<Route path="/dashboard" element={
  <ProtectedRoute><DashboardPage /></ProtectedRoute>
} />
<Route path="/login" element={<LoginPage />} />
<Route path="/register" element={<RegisterPage />} />
```

### 2.3.6 Layout updates

**File:** `frontend/src/components/Layout/Layout.tsx`

- Show **Sign in** when logged out
- Show user email + **Sign out** when logged in
- Dashboard nav link: redirect to login if not authenticated (or hide until logged in)

### 2.3.7 Job detail — gate tracking (prep for Phase 3)

**File:** `frontend/src/pages/JobDetailPage.tsx`

When user clicks track/apply modal:

- If not authenticated → redirect to `/login?returnTo=/jobs/{id}`
- If authenticated → proceed (Phase 3 will call API instead of `localStorage`)

Keep `localStorage` tracking working until Phase 3, or disable track button until Phase 3 — **recommend gating UI now, wire API in Phase 3**.

---

## Types

**New file:** `frontend/src/types/auth.ts`

```typescript
export interface UserPublic {
  id: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserPublic;
}
```

Map snake_case API responses to camelCase in API layer if frontend convention prefers camelCase.

---

## Verification checklist

- [ ] Register flow creates account and lands on dashboard
- [ ] Login with valid credentials works
- [ ] Login with invalid credentials shows error
- [ ] `/dashboard` redirects to `/login` when logged out
- [ ] Token persists across page refresh
- [ ] Logout clears token and redirects to home
- [ ] Job search/detail still work without login
- [ ] `npm run build` passes

---

## Files touched (implementation)

| File | Change |
|------|--------|
| `frontend/src/api/client.ts` | New shared fetch |
| `frontend/src/api/auth.ts` | New |
| `frontend/src/contexts/AuthContext.tsx` | New |
| `frontend/src/hooks/useAuth.ts` | New |
| `frontend/src/pages/LoginPage.tsx` | New |
| `frontend/src/pages/RegisterPage.tsx` | New |
| `frontend/src/components/ProtectedRoute/` | New |
| `frontend/src/components/Layout/Layout.tsx` | Auth UI |
| `frontend/src/App.tsx` | Routes + provider |
| `frontend/src/types/auth.ts` | New |
