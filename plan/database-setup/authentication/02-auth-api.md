# Step 2.2 — Auth API (JWT)

**Goal:** Expose register, login, and current-user endpoints; provide a FastAPI dependency for protecting routes in Phase 3.

**Status:** ⬜ Not started  
**Depends on:** [01-user-model.md](./01-user-model.md)  
**Blocks:** [03-frontend-auth.md](./03-frontend-auth.md), [applied-jobs/01-schema-and-api.md](../applied-jobs/01-schema-and-api.md)

**Estimated effort:** 1–2 sessions

---

## API design

Base path: `/api/v1/auth`

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| `POST` | `/register` | Public | `{ email, password }` | `{ access_token, token_type, user }` |
| `POST` | `/login` | Public | `{ email, password }` | `{ access_token, token_type, user }` |
| `GET` | `/me` | Bearer JWT | — | `UserPublic` |

**Job routes stay public** — no auth on `GET /api/v1/jobs` or `GET /api/v1/jobs/{id}`.

---

## Tasks

### 2.2.1 JWT configuration

**File:** `backend/app/config.py`

Add settings:

| Field | Env var | Default |
|-------|---------|---------|
| `jwt_secret_key` | `JWT_SECRET_KEY` | Random dev default (warn if unset in prod) |
| `jwt_algorithm` | `JWT_ALGORITHM` | `HS256` |
| `jwt_expire_minutes` | `JWT_EXPIRE_MINUTES` | `60` |

Document in `backend/.env.example`:

```env
JWT_SECRET_KEY=change-me-in-production
JWT_EXPIRE_MINUTES=60
```

### 2.2.2 Token utilities

**New file:** `backend/app/auth/jwt.py`

| Function | Purpose |
|----------|---------|
| `create_access_token(user_id: UUID) -> str` | Encode JWT with `sub`, `exp` |
| `decode_access_token(token: str) -> UUID` | Validate and return user ID |

Use `python-jose` or `PyJWT`.

### 2.2.3 Auth dependency

**New file:** `backend/app/auth/deps.py`

```python
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    ...
```

- Extract Bearer token from `Authorization` header
- Decode JWT → `user_id`
- Load user from DB; raise `401` if invalid or missing

Optional: `get_current_user_optional` for endpoints that work with or without auth.

### 2.2.4 Auth routes

**New file:** `backend/app/api/routes/auth.py`

**`POST /register`:**

1. Validate email not taken (`409 Conflict` if exists)
2. Hash password
3. Insert user
4. Return token + `UserPublic`

**`POST /login`:**

1. Lookup by email
2. Verify password (`401` if wrong)
3. Return token + `UserPublic`

**`GET /me`:**

- `Depends(get_current_user)`
- Return `UserPublic`

### 2.2.5 Mount router

**File:** `backend/app/main.py`

```python
from app.api.routes.auth import router as auth_router
app.include_router(auth_router, prefix="/api/v1")
```

### 2.2.6 Error responses

Use consistent HTTP status codes:

| Case | Status |
|------|--------|
| Invalid credentials | `401 Unauthorized` |
| Email already registered | `409 Conflict` |
| Validation error | `422 Unprocessable Entity` |
| Missing/invalid token | `401 Unauthorized` |

---

## Testing (manual)

```bash
# Register
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Me
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer <token>"
```

---

## Verification checklist

- [ ] Register creates user in DB and returns JWT
- [ ] Duplicate register returns `409`
- [ ] Login with wrong password returns `401`
- [ ] `GET /me` works with valid token, fails without
- [ ] Job endpoints still work without auth
- [ ] OpenAPI docs at `/docs` show auth routes

---

## Files touched (implementation)

| File | Change |
|------|--------|
| `backend/app/config.py` | JWT settings |
| `backend/app/auth/jwt.py` | New |
| `backend/app/auth/deps.py` | New |
| `backend/app/api/routes/auth.py` | New |
| `backend/app/main.py` | Mount auth router |
| `backend/.env.example` | JWT vars |
