# Guiding Principles

This document covers coding conventions and admin UI rules. For topic-specific guidance see the reference index below.

---

## 1. Coding Conventions

- Use **TypeScript + React best practices**: functional components, explicit prop/state typing, shared state via Context or Zustand store.
- Write **modular, reusable components**. Prefer editing an existing file over creating a new one.
- Use `react-bootstrap` components; light, calm, consistent spacing and typography (Bootstrap 5).
- Prefer the **Supabase client** over raw SQL in frontend code.
- Optimistic updates: reflect changes in UI first, then persist to Supabase.
- Explicit save for edits — avoid auto-save side effects.

---

## 2. Admin UI Conventions

### Lesson-Centric Editing
- Focus on **one lesson at a time** — no full Program/Course tree visible while editing.
- Card navigation (prev/next) must follow the **in-memory ordered list**, not database IDs.
- Sorting state drives behavior; drag-and-drop enabled **only when `sortField === 'position'`**.

### Card List & Editor
- Card list is the **source of truth**; the detail view derives its index from it.
- Batch operations respect current filters and selection.
- `getSortedCards(state)` is a pure function — call with `{ cards, sortField, sortDir }`.
- Card editor flow: `initEditBuffer(card)` on mount → `updateEditBuffer(partial)` for changes → `saveCard()` to persist.

### Table Conventions
- Columns with text should always be **left-aligned** (add `className="text-start"` to `<Table>` components — covers both headers and cells).

---

## 3. Reference Index

| Topic | File |
|-------|------|
| Edge Function deployment, auth, CORS, `verify_jwt`, secrets | `.ai/edge-functions.md` |
| AuthContext, login modal, avatar menu, session handling | `.ai/authentication.md` |
| CSV import/export architecture | `.ai/csv-architecture.md` |
| DB schema, roles, RLS policies, helper functions | `.ai/database.md` |
| Admin UI layout and workflows | `.ai/ui-admin.md` |
| User-facing UI, quiz modes, session behavior | `.ai/ui-app.md` |
| Quiz engine, card types, transformers, scoring | `.ai/quiz-engine.md` |
| Repo file structure | `.ai/filestructure.md` (may be stale — regenerate with `tree`) |
