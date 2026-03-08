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
  - `program_membership` (formerly `program_enrollments`)
  - `course_membership` (formerly `course_enrollments`)

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

## 4. Coding Conventions
- Use **TypeScript + React best practices**.  
- Write **modular, reusable, and functional components**.  
- Include **inline comments** for clarity, especially in helpers or SQL logic.  
- Avoid assumptions about the legacy backend; prefer **Supabase client** and helper functions.  

---

## 5. SQL / Supabase Guidance
- Keep **migrations incremental and versioned**.  
- Seeds are for demo/development data only.  
- Policies should be **documented, readable, and DRY**.  
- For batch or dynamic policy generation, prefer **SQL scripts using templates or helper functions**.

---

## 6. References & Context Usage
Always refer to these `.ai/` files for grounding and consistency:

| File | Purpose |
|------|---------|
| `architecture.md` | System layout, hierarchy, workflow |
| `db-schema.md` | Table definitions, columns, types |
| `db-policies.md` | RLS rules, helper functions, policy generation |
| `admin-ui.md` | Admin UX, lesson workspace, card workflow |
| `CLAUDE.md` | Legacy SPA context, state machine, fetch logic |
| `roadmap.md` | Development roadmap and future planning |
