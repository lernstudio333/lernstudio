# Database — Schema, Roles & Policies

---

## 1. Tables

| Table | Purpose |
|-------|---------|
| `profiles` | One row per user; stores role (`student` / `editor` / `admin`) |
| `programs` | Top-level learning programs |
| `courses` | Belong to a program |
| `lessons` | Belong to a course |
| `cards` | Belong to a lesson; the learning content unit |
| `card_answers` | One or more answers per card |
| `card_modes` | Quiz mode overrides per card |
| `media` | Metadata for uploaded files (`bucket`, `path`, `media_type`) |
| `program_memberships` | Links users to programs with a role (`student` / `editor`) |
| `course_memberships` | Links users to courses with a role (`student` / `editor`) |
| `user_cards_learnings` | Per-user, per-card learning state (score, errors_by_type, last_visited, favorite_date) |

**Notes:**
- Primary keys: UUIDs
- Foreign keys enforce relational integrity
- Timestamps default to `now()`
- `user_cards_learnings` has a `UNIQUE (user_id, card_id)` constraint — upsert via `onConflict`
- Membership tables replaced the old `program_enrollments` / `course_enrollments` tables

---

## 2. Hierarchy

```
Program → Course → Lesson → Card → Card Answers / Card Modes
```

---

## 3. Roles

| Role | Access |
|------|--------|
| `admin` | Full access everywhere |
| `editor` | Write access to programs/courses they are assigned to |
| `student` | Read-only access to enrolled programs/courses |

Roles live in `profiles.role`. Membership tables (`program_memberships`, `course_memberships`) also carry a role column (`student` / `editor`) that scopes write access within that enrollment.

---

## 4. RLS Helper Functions

Use these in policies instead of writing raw SQL joins each time:

| Function | Description |
|----------|-------------|
| `is_admin()` | Returns true if the current user has the `admin` role |
| `is_program_member(program_id)` | True if user is enrolled in the program (any role) |
| `is_program_editor(program_id)` | True if user has `editor` role in the program |
| `is_course_member(course_id)` | True if user is enrolled in the course (any role) |
| `is_course_editor(course_id)` | True if user has `editor` role in the course |
| `get_authorized_card_ids(p_user_id, p_card_ids)` | Returns the subset of card IDs the user may access; used by Edge Functions running under service role where `auth.uid()` is unavailable |

---

## 5. Access Table

| Resource | Read | Write |
|----------|------|-------|
| Programs | member OR admin | editor OR admin |
| Courses | member OR admin | editor OR admin |
| Lessons | course/program member OR admin | course/program editor OR admin |
| Cards | course/program member OR admin | course/program editor OR admin |
| Card Answers | course/program member OR admin | course/program editor OR admin |
| Card Modes | course/program member OR admin | course/program editor OR admin |
| Media (SELECT/INSERT/UPDATE) | inherited from existing media policies | inherited |
| Media (DELETE) | — | `is_admin()` only |

---

## 6. Policy Conventions

- Policies must be **idempotent** (safe to rerun): use `DROP POLICY IF EXISTS` before `CREATE POLICY`.
- Naming conventions:
  - `read_access` → users reading allowed rows
  - `write_access` → users writing allowed rows
  - `admin_access` → full access for admins
- Avoid hardcoding UUIDs or user IDs.
- Always use helper functions (`is_admin()`, `is_course_member()`, etc.) for clarity and reuse.
- Apply policies in migrations; seeds are for demo/development data only.

---

## 7. Media Helper Functions

#### `list_image_usage(p_media_id uuid)`
Returns all database references to a media file (in `card_answers`, `cards.details`, etc.).
Used by the frontend safety dialog before deletion.

#### `delete_media_safe(p_media_id uuid, override boolean)`
Deletes a media row safely:
- Clears references in `card_answers`
- Optionally clears references in `cards.details`
- Only proceeds if `override = true` when references exist

---

## 8. SQL Reference File Sync

The `backend/` folder contains three reference SQL files that must be kept in sync whenever a migration adds or changes functions or policies:

| File | What to sync |
|------|-------------|
| `functions.sql` | Any `CREATE FUNCTION` added via migration — use `DROP FUNCTION IF EXISTS` + `CREATE` (idempotent) |
| `policies.sql` | Any `CREATE POLICY` or `ALTER TABLE … ENABLE ROW LEVEL SECURITY` added via migration |
| `schema.sql` | **Handled manually by the developer** after running migrations (Supabase schema export) |

**Rule:** After writing a migration that adds SQL functions or policies, always update `functions.sql` and/or `policies.sql` in the same change. Do not wait for a separate cleanup step.
