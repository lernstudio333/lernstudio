# System Prompt — Lernstudio

## Project Overview

- **Type:** Learning app (lesson-centric, card-based spaced repetition)
- **Frontend:** React 18 + TypeScript + Vite + Bootstrap 5 + react-bootstrap
- **Backend:** Supabase (Postgres + Edge Functions + Storage)
- **Admin Area:** Lesson-centric editing workspace, accessible to `admin` and `editor` roles
- **Hierarchy:** Program → Course → Lesson → Card

## Quick Reference

All detailed guidance lives in `.ai/`. Start here:

| What you need | File |
|---------------|------|
| Writing or deploying an Edge Function | `.ai/edge-functions.md` |
| Auth, login modal, session handling | `.ai/authentication.md` |
| DB tables, RLS, roles, policies | `.ai/database.md` |
| CSV import/export architecture | `.ai/csv-architecture.md` |
| Admin UI layout, card editor, media | `.ai/ui-admin.md` |
| User-facing UI, quiz modes, rewards | `.ai/ui-app.md` |
| Quiz engine, card types, scoring | `.ai/quiz-engine.md` |
| Coding conventions, general rules | `.ai/guidelines.md` |
