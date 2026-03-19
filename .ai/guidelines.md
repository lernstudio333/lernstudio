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

## 6. Edge Function Deployment

### 6.1 CLI
- Use the **Supabase CLI** directly (`supabase`), not `npx supabase`.
- Deploy a single function:
  ```bash
  supabase functions deploy <function-name> --workdir backend
  ```
- Deploy all functions:
  ```bash
  supabase functions deploy --workdir backend
  ```
- Flag is `--workdir`, not `--project-dir`.

### 6.2 Shared Module Imports
- All imports inside `shared/` **must include the `.ts` extension** (e.g. `from './columnDefs.ts'`).
- Deno (used by Edge Functions) requires explicit file extensions; Node/Vitest tolerates both.
- `shared/tsconfig.json` has `allowImportingTsExtensions: true` to satisfy the TypeScript compiler.
- Edge Functions import shared files using relative paths from the function file, e.g.:
  ```ts
  import { validateCsv } from '../../../../shared/features/csv/CsvValidator.ts';
  ```

---

## 7. CSV Import/Export Architecture

### 7.1 Separation of Concerns

The CSV feature is split across three layers, each with a distinct responsibility:

| Layer | Location | Responsibility |
|-------|----------|----------------|
| **Shared logic** | `shared/features/csv/` | Pure validation + formatting — no I/O, no DB, no framework deps |
| **Frontend pre-check** | `CsvImportModal.tsx` | Header-only pre-validation for immediate UX feedback |
| **Backend (final authority)** | `import-cards/` Edge Function | Full validation + DB-only checks; source of truth |

### 7.2 Shared Module (`shared/features/csv/`)

Contains only pure, side-effect-free logic. Both the frontend and backend import from here — this is the single source of truth for all CSV rules.

| File | Purpose |
|------|---------|
| `CsvValidator.ts` | `validateCsv()`, `validateHeaders()`, `validateRows()` — core validation entry points |
| `columnDefs.ts` | `CARD_COLUMN_DEFS`, `FORBIDDEN_IMPORT_COLUMNS`, `normalizeRow()` — column definitions for both import and export |
| `csvFormatter.ts` | `formatCsv()`, `parseCsvString()`, `parseAnswerFromCsv()` — serialization |
| `CsvImportErrType.ts` | Error type enum (14 types) |
| `legacyCardTypeLookup.ts` | Maps legacy aliases (e.g. `SC` → `SINGLE_CARD`) |
| `csvImportTypes.ts` | Shared types: `CsvValidationResult`, `CsvMappedCard`, `CsvImportContext`, etc. |

The shared module is kept pure deliberately: it can be unit tested locally without deploying Edge Functions.

### 7.3 Frontend Pre-Check (UX fast-fail)

`CsvImportModal.tsx` calls **`validateHeaders()`** only — not the full `validateCsv()` — when the user selects a file. This gives immediate feedback (disables the Import button) without waiting for an upload.

- Pre-check: **headers only** (required columns present, no forbidden columns)
- Full row validation is intentionally deferred to the backend
- The pre-check result is informational only; the backend never trusts it

### 7.4 Backend: Final Authority

The `import-cards` Edge Function runs `validateCsv()` (headers + rows) on the raw upload, regardless of what the frontend pre-checked. After shared validation passes, it performs additional **DB-only checks** that the shared module cannot do:

- **Hierarchy verification** — confirms `lesson_id → course_id → program_id` chain exists
- **Media existence** — checks that referenced filenames exist in the `media` table
- **Parent ID mismatch** — if the CSV references different parent IDs than the target lesson, returns `status: "requires_confirmation"` and waits for user acknowledgement before proceeding

### 7.5 Mismatch Confirmation Flow

If `validateCsv()` returns `requiresConfirmation: true` (CSV contains IDs from a different program/course/lesson):
1. Backend returns `status: "requires_confirmation"` with `mismatch_details`
2. Frontend shows a confirmation modal
3. User confirms → re-upload with `ignore_parent_ids: true`
4. Backend re-runs full validation and proceeds

### 7.6 Bidirectional Column Definitions (Single Source of Truth)

`CARD_COLUMN_DEFS` in `columnDefs.ts` is the **only place** where CSV structure is defined. Each `ColumnDef` entry drives both directions:

```ts
type ColumnDef = {
  field:        keyof CsvExportRow;   // internal field name
  header:       string;               // CSV column header string
  required?:    boolean;              // must be present on import
  alwaysExport?: boolean;             // always include in export output
  showInExport?: (rows) => boolean;   // conditional inclusion (e.g. omit internal ID when ext ID exists)
  fromDomain:   (row) => string;      // Export: domain object → CSV cell
  toDomain:     (value) => string;    // Import: CSV cell → normalized string (no validation here)
  aliases?:     string[];             // alternative headers accepted on import (case-insensitive)
};
```

- `fromDomain` is called by `formatCsv()` (export path)
- `toDomain` + `aliases` are used by `normalizeRow()` (import path)
- No mapping logic lives anywhere else — adding a column means touching `CARD_COLUMN_DEFS` only

### 7.7 Data Flow Pipelines

**Import:**
```
CSV file
 → parseCsvString() / PapaParse        (frontend / backend)
 → validateHeaders()                   (shared — frontend pre-check)
 → validateCsv()                       (shared — backend, authoritative)
 → CsvMappedCard[]                     (typed domain objects, ready for DB)
 → DB insert/update                    (backend only)
```

**Export:**
```
DB query (joined cards + answers + media)
 → flatten to CsvExportRow[]           (backend)
 → formatCsv()                         (shared — applies fromDomain per column)
 → CSV string                          (returned as download)
```

Edge functions are thin I/O layers only — no transformation logic inside them.

### 7.8 Answer Serialization Convention

| Card type | Answer cell format | Example |
|-----------|-------------------|---------|
| Single answer | plain string | `drugs used to relieve pain` |
| Multiple answers | markdown list (`- item\n`) | `- Ibuprofen\n- Paracetamol` |
| Image answers (`IMAGES`) | comma-separated filenames | `ibuprofen.jpg, paracetamol.jpg` |

- `formatAnswerForCsv(string[])` → serializes to the above format (export)
- `parseAnswerFromCsv(string)` → deserializes back to `string[]` (import)
- Both functions live in `csvFormatter.ts`; this is the only place the convention is encoded

### 7.9 Future: Tags Column

A `Tags` column (`join with ', '`) was part of the original export spec but is not yet implemented — no `tags` field exists in the DB schema or `CARD_COLUMN_DEFS`. Adding it later means: add a `tags` column to the `cards` table, add one entry to `CARD_COLUMN_DEFS`, and update the roundtrip tests.

### 7.10 Roundtrip Invariant

The system enforces the invariant `domain → CSV → domain ≈ identity` via roundtrip tests in `shared/features/csv/csvRoundtrip.test.ts`. These tests cover single-answer, multi-answer, and image-answer cards. Any change to `CARD_COLUMN_DEFS`, `formatCsv`, or `parseAnswerFromCsv` must keep the roundtrip tests passing.

---

## 8. SQL / Supabase Guidance
- Keep **migrations incremental and versioned**.  
- Seeds are for demo/development data only.  
- Policies should be **documented, readable, and DRY**.  
- For batch or dynamic policy generation, prefer **SQL scripts using templates or helper functions**.

---

## 9. References & Context Usage
Always refer to these `.ai/` files for grounding and consistency:

| File | Purpose |
|------|---------|
| `architecture.md` | System layout, hierarchy, workflow |
| `db-schema.md` | Table definitions, columns, types |
| `db-policies.md` | RLS rules, helper functions, policy generation |
| `admin-ui.md` | Admin UX, lesson workspace, card workflow |
| `CLAUDE.md` | Legacy SPA context, state machine, fetch logic |
| `roadmap.md` | Development roadmap and future planning |
| `guidelines.md §6` | Edge Function deployment commands and shared module import rules |
| `guidelines.md §7` | CSV import/export architecture, validation layers, mismatch flow |
