# System Prompt – Learning App (Admin Area + Supabase Backend)

This prompt defines how the AI should reason about, generate, and assist with the learning app project.  
It is intended for use with code generation, SQL generation, documentation, or UI/UX suggestions.

---

## 1. Project Overview

- **Type:** Learning app (lesson-centric, card-based)
- **Frontend:** React 18 + TypeScript + Vite + Bootstrap 5 + react-bootstrap
- **Backend:** Supabase Postgres (primary), legacy Google Apps Script (for user-facing app, to be migrated later)
- **Admin Area:** New development on Supabase, lesson-centric editing workspace
- **Legacy Backend:** GAS endpoints used by current user-facing LearnSession / CourseSelector; migration planned in future

---

## 2. Tech Stack & Conventions

- **React / TypeScript**
  - Functional components preferred
  - Shared state via Context or store
  - Explicit typing for props, state, API data
- **Bootstrap 5**
  - Use `react-bootstrap` components
  - Light, calm, consistent spacing and typography
- **Supabase**
  - UUID primary keys
  - Row-level security (RLS) enforced
  - Unified membership tables: `program_memberships` and `course_memberships`
  - Roles: `student`, `editor`, `admin`
- **API / DB Access**
  - Prefer Supabase client over raw SQL in frontend
  - Helper functions for RLS policies encouraged
  - Explicit save for edits; optimistic UI updates

---

## 3. Admin UI Guidelines

- **Lesson-centric design**:
  - Select a lesson → enter Lesson Workspace
  - No full Program/Course tree visible while editing
- **Layout**:
  - Left Sidebar: Content / Media / Users
  - Lesson Workspace:
    - Header: breadcrumb, editable title, optional lesson switch
    - Split view: Left → Card List; Right → Card Detail Editor
- **Card List**:
  - Sortable by column (order, title, question type, updated_at)
  - Drag-and-drop reordering only in default “order” view
  - Batch move/reorder supports filtering & multi-selection
- **Card Navigation**:
  - Prev/Next buttons follow in-memory ordered list, not DB ID
  - Keyboard: ArrowLeft / ArrowRight
- **Card Editor Sections**:
  - Basic Info: question, type, optional Tipp
  - Answers: dynamically rendered based on type (`SC`, `MC`, `SYN`, `GAP`, `IMG-SC`, `IMG-MC`)
  - Card Modes: multi-select from `card_modes` table
- **Media Gallery**:
  - CRUD operations on bucket + `media` table
  - Search and rename functionality
- **Avatar Menu** (top-right):
  - Placeholder icon
  - Dropdown: Name / Email / Score → divider → Settings → Admin Dashboard (admin only) → divider → Sign out
- **UX Philosophy**:
  - Calm, focused, lesson-based
  - Optimistic updates, explicit save
  - Deep focus for sequential card editing

---

## 4. Database / Supabase Guidelines

- **Tables**: programs, courses, lessons, cards, card_answers, card_modes, media, profiles, program_memberships, course_memberships
- **Hierarchy**: Program → Course → Lesson → Card
- **Membership & Roles**:
  - Membership tables replace old enrollment tables
  - Roles:
    - `student` → read access to enrolled programs/courses
    - `editor` → write access to assigned programs/courses
    - `admin` → full access
- **RLS Policies**:
  - Always use helper functions for clarity (`user_can_access_course()`, `is_admin()`)
  - Policies should be idempotent
  - Admins can always read/write
  - Editors can write where assigned
  - Students can only read where enrolled
- **Policy Generation**:
  - Use SQL generator scripts or templates
  - Avoid manually repeating similar policies

---

## 5. Backend & State Rules

- **State Management**
  - Card list is source of truth for navigation
  - Sorting state affects selection index
  - Batch operations must respect current filters
- **Optimistic Updates**
  - Moving cards updates in-memory state first, then persists to Supabase
- **Lesson Workspace**
  - Explicit save for edits
  - Avoid full reloads while navigating cards



## 6. Authentication & Session Handling

- **Session source of truth:** Always use the Supabase Auth API. Never read or write `localStorage` directly.

### Login Priority Order
1. **Existing Supabase session** – restored on mount via `getSession()`; no login form shown.
2. **Browser password manager autofill** – login form shown with proper `autocomplete` attributes.
3. **Manual login** – user types credentials.

### AuthContext — Two-Effect Pattern
- **Effect 1 (session):** `getSession()` → `setUser()`. `onAuthStateChange` (skip `INITIAL_SESSION`) → `setUser()`. Never call Supabase API inside `onAuthStateChange` — it deadlocks the client.
- **Effect 2 (profile):** Watches `user`; fetches profile outside the Supabase callback; sets `isLoggedIn`, profile fields, and `isInitializing = false`.
- `isInitializing` stays `true` until profile fetch completes (session found) or `getSession()` returns no session.

### Login Modal — No-Flicker Pattern
- Single `<Modal animation={false}>` always mounted; `show={isInitializing || !isLoggedIn}`.
- Content switches between `placeholder-glow` skeleton (during init) and real form (when logged out).
- `animation={false}` prevents Bootstrap fade from briefly exposing form content on session restore.

### Avatar Menu
- Always rendered (never conditionally hidden in parent).
- States: dimmed icon (initializing) → plain icon (logged out) → full dropdown (logged in).

---

## 7. References

- `.ai/architecture.md` → current system layout, data hierarchy
- `.ai/db-schema.md` → Supabase table overview
- `.ai/db-policies.md` → RLS rules and helpers
- `.ai/ui-app.md` → App UI and workflow
- `.ai/ui-admin.md` → Admin Area UI and workflow
- `.ai/roadmap.md` → development roadmap
