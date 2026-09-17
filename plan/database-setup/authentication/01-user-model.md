# Step 2.1 — User Model

**Goal:** Add a `users` table and password hashing utilities so accounts can be created and verified in the database.

**Status:** ⬜ Not started  
**Depends on:** Phase 1 complete ([jobdb/02-alembic-migrations.md](../jobdb/02-alembic-migrations.md))  
**Blocks:** [02-auth-api.md](./02-auth-api.md), Phase 3 applied-jobs

**Estimated effort:** 1 session

---

## Context

The portal has no backend users today. Application tracking lives in browser `localStorage`. Phase 2 introduces server-side accounts scoped to the same database as jobs (`DATABASE_URL`).

---

## Schema design

### `users` table

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK, default `uuid4` |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE, indexed |
| `password_hash` | VARCHAR(255) | NOT NULL |
| `created_at` | TIMESTAMP TZ | NOT NULL, default `now()` |
| `updated_at` | TIMESTAMP TZ | NOT NULL, default `now()`, on update |

**Indexes:**

- `uq_users_email` — unique on `email`

**Out of scope for POC:**

- `display_name`, `avatar_url`, email verification, OAuth — add later if needed

---

## Tasks

### 2.1.1 Add ORM model

**File:** `backend/app/models/orm.py` (or new `backend/app/models/user.py`)

```python
class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(...)
    updated_at: Mapped[datetime] = mapped_column(...)
```

### 2.1.2 Add dependencies

**File:** `backend/pyproject.toml`

```toml
"passlib[bcrypt]>=1.7.4",
"python-jose[cryptography]>=3.3.0",  # or PyJWT
```

Run `uv sync` after adding.

### 2.1.3 Password hashing module

**New file:** `backend/app/auth/password.py`

| Function | Purpose |
|----------|---------|
| `hash_password(plain: str) -> str` | bcrypt hash via passlib |
| `verify_password(plain: str, hashed: str) -> bool` | constant-time verify |

Use `CryptContext(schemes=["bcrypt"], deprecated="auto")` from passlib.

### 2.1.4 Pydantic schemas

**New file:** `backend/app/models/auth_schemas.py` (or extend `schemas.py`)

| Schema | Fields |
|--------|--------|
| `UserRegister` | `email`, `password` |
| `UserLogin` | `email`, `password` |
| `UserPublic` | `id`, `email`, `created_at` (no password hash) |

Validation:

- Email format (Pydantic `EmailStr`)
- Password minimum length (e.g. 8 characters) — align with [04-security-checklist.md](./04-security-checklist.md)

### 2.1.5 Alembic migration

```bash
uv run alembic revision --autogenerate -m "create users table"
uv run alembic upgrade head
```

Verify on SQLite and Postgres.

### 2.1.6 User repository helpers (optional)

**New file:** `backend/app/db/users.py`

| Function | Purpose |
|----------|---------|
| `get_user_by_email(db, email)` | Lookup for login |
| `create_user(db, email, password_hash)` | Insert new user |
| `get_user_by_id(db, user_id)` | For `GET /me` |

Keep thin — no business logic in routes.

---

## Verification checklist

- [ ] Migration applies on SQLite and Postgres
- [ ] `hash_password` / `verify_password` round-trip works
- [ ] Duplicate email insert raises integrity error
- [ ] `UserPublic` never exposes `password_hash`
- [ ] Manual insert via Python shell or test script succeeds

---

## Files touched (implementation)

| File | Change |
|------|--------|
| `backend/app/models/orm.py` | Add `User` model |
| `backend/app/auth/password.py` | New |
| `backend/app/models/auth_schemas.py` | New |
| `backend/app/db/users.py` | New (optional) |
| `backend/alembic/versions/002_*.py` | `users` migration |
| `backend/pyproject.toml` | passlib, python-jose |
