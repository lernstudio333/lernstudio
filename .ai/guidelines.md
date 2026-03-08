# Guiding Principles

**Purpose:**  
This document serves as a shared reference for developers and AI agents working on this repository. It contains conventions, best practices, and behavioral guidelines for database, admin UI, coding, and Supabase workflows.

---

## 1. Core Principle
- Always produce work that is **correct, consistent, and aligned with project conventions**.
- Reference other `.ai/` files for grounding:
  - `architecture.md` → system layout, data hierarchy, workflow
  - `db-schema.md` → tables, columns, and types
  - `db-policies.md` → RLS rules, helper functions, policy generation
  - `admin-ui.md` → admin UX, card workflow, lesson workspace
  - `CLAUDE.md` → legacy SPA backend context
  - `roadmap.md` → development roadmap

---

## 2. Database & RLS

### 2.1 Role-Based Access
- Respect roles in all SQL queries and policy generation:
  - `user` → can read/write their own data or content they are enrolled in
  - `course_editor` → can write to programs/courses they are assigned to
  - `admin` → full access everywhere
- Use **membership tables** as the source of truth:
  - `program_memberships` (formerly `program_enrollments`)
  - `course_memberships` (formerly `course_enrollments`)

### 2.2 Helper Functions
- Use helper SQL functions for clarity and reuse:
  - `user_can_access_course(course_id)`
  - `is_admin()`

### 2.3 Policy Generation
- Policies must be **idempotent** (safe to rerun).  
- Naming conventions:
  - `read_access` → users reading allowed rows
  - `write_access` → users writing allowed rows
  - `admin_access` → full access for admins
- Avoid hardcoding UUIDs or user IDs.

---

## 3. Admin UI / React Frontend

### 3.1 Lesson-Centric Editing
- Focus on **one lesson at a time**.  
- Card navigation (prev/next) must follow **in-memory ordered list**, not database IDs.  
- Sorting state drives behavior; drag-and-drop enabled **only in default order**.

### 3.2 Card List & Editor
- Card list is the **source of truth**; detail view derives index from it.  
- Batch operations respect current filters and selection.  
- Optimistic updates: reflect changes in UI first, then persist to Supabase.

### 3.3 Avatar & Admin Area
- Top-right avatar menu includes:
  - Name, Email, Score
  - Settings
  - Admin Dashboard (visible to admins only)
  - Sign Out  
- Dropdown should collapse gracefully on smaller screens.

---

## 4. Authentication Conventions

### 4.1 Session Handling Priority
1. **Existing Supabase session** – restore on mount via `supabase.auth.getSession()`.
2. **Browser autofill** – show login form with proper `autocomplete` attributes.
3. **Manual login** – user enters credentials.

### 4.2 AuthContext Implementation
- **Two separate effects** — do not conflate session restore with profile fetching:
  - **Effect 1** — session: calls `getSession()`, stores result via `setUser()`. Subscribes to `onAuthStateChange` (skip `INITIAL_SESSION`). Sets `isInitializing = false` immediately if no session; otherwise waits for Effect 2.
  - **Effect 2** — profile: watches `user` state; when user is set, fetches profile from `profiles` table, then sets `isLoggedIn = true` and all profile fields, then sets `isInitializing = false`.
- **CRITICAL: never call Supabase API methods inside `onAuthStateChange`** — it deadlocks the Supabase JS client. The callback must only call React `setState` functions.
- `login(email, password)` → `supabase.auth.signInWithPassword()` only; state flows reactively through `onAuthStateChange` → `setUser` → Effect 2 → profile fetch.
- `signOut()` → `supabase.auth.signOut()` only; state cleared reactively via `onAuthStateChange` → `setUser(null)` → Effect 2 clears profile state.
- Last used email stored in `localStorage` under `lastLoginEmail` (convenience only, never the password).

### 4.3 Login Modal Behavior
- Single `<Modal>` always mounted — switching content between skeleton and real form avoids Bootstrap mount/unmount flash.
- `show={isInitializing || !isLoggedIn}` — modal visible during init and when logged out.
- `animation={false}` — prevents Bootstrap fade transition from briefly exposing form content during session restore.
- While `isInitializing`: show Bootstrap `placeholder-glow` skeleton matching the form layout (non-interactive).
- While `!isLoggedIn && !isInitializing`: show real email/password form.

### 4.4 Avatar Menu Behavior
- Always rendered in `Hdr` — never conditionally hidden.
- While `isInitializing`: dimmed non-clickable icon (`opacity-50`).
- While `!isLoggedIn`: plain icon (login modal handles login).
- While `isLoggedIn`: full dropdown with name, role-based links (Admin Dashboard for `admin`/`course_editor`), and Sign Out.

### 4.5 Login Form Requirements
- Email input: `type="email"` + `name="email"` + `autoComplete="username"`
- Password input: `type="password"` + `name="password"` + `autoComplete="current-password"`
- Required for browser password manager autofill compatibility.

---

## 5. Coding Conventions
- Use **TypeScript + React best practices**.
- Write **modular, reusable, and functional components**.
- Include **inline comments** for clarity, especially in helpers or SQL logic.
- Avoid assumptions about the legacy backend; prefer **Supabase client** and helper functions.

---

## 6. SQL / Supabase Guidance
- Keep **migrations incremental and versioned**.  
- Seeds are for demo/development data only.  
- Policies should be **documented, readable, and DRY**.  
- For batch or dynamic policy generation, prefer **SQL scripts using templates or helper functions**.

---

## 7. References & Context Usage
Always refer to these `.ai/` files for grounding and consistency:

| File | Purpose |
|------|---------|
| `architecture.md` | System layout, hierarchy, workflow |
| `db-schema.md` | Table definitions, columns, types |
| `db-policies.md` | RLS rules, helper functions, policy generation |
| `admin-ui.md` | Admin UX, lesson workspace, card workflow |
| `CLAUDE.md` | Legacy SPA context, state machine, fetch logic |
| `roadmap.md` | Development roadmap and future planning |
