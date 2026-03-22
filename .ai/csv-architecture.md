# CSV Import/Export Architecture

---

## 1. Separation of Concerns

The CSV feature is split across three layers, each with a distinct responsibility:

| Layer | Location | Responsibility |
|-------|----------|----------------|
| **Shared logic** | `shared/features/csv/` | Pure validation + formatting — no I/O, no DB, no framework deps |
| **Frontend pre-check** | `CsvImportModal.tsx` | Header-only pre-validation for immediate UX feedback |
| **Backend (final authority)** | `import-cards/` Edge Function | Full validation + DB-only checks; source of truth |

---

## 2. Shared Module (`shared/features/csv/`)

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

---

## 3. Frontend Pre-Check (UX fast-fail)

`CsvImportModal.tsx` calls **`validateHeaders()`** only — not the full `validateCsv()` — when the user selects a file. This gives immediate feedback (disables the Import button) without waiting for an upload.

- Pre-check: **headers only** (required columns present, no forbidden columns)
- Full row validation is intentionally deferred to the backend
- The pre-check result is informational only; the backend never trusts it

---

## 4. Backend: Final Authority

The `import-cards` Edge Function runs `validateCsv()` (headers + rows) on the raw upload, regardless of what the frontend pre-checked. After shared validation passes, it performs additional **DB-only checks** that the shared module cannot do:

- **Hierarchy verification** — confirms `lesson_id → course_id → program_id` chain exists
- **Media existence** — checks that referenced filenames exist in the `media` table
- **Parent ID mismatch** — if the CSV references different parent IDs than the target lesson, returns `status: "requires_confirmation"` and waits for user acknowledgement before proceeding

---

## 5. Mismatch Confirmation Flow

If `validateCsv()` returns `requiresConfirmation: true` (CSV contains IDs from a different program/course/lesson):
1. Backend returns `status: "requires_confirmation"` with `mismatch_details`
2. Frontend shows a confirmation modal
3. User confirms → re-upload with `ignore_parent_ids: true`
4. Backend re-runs full validation and proceeds

---

## 6. Bidirectional Column Definitions (Single Source of Truth)

`CARD_COLUMN_DEFS` in `columnDefs.ts` is the **only place** where CSV structure is defined. Each `ColumnDef` entry drives both directions:

```ts
type ColumnDef = {
  field:         keyof CsvExportRow;   // internal field name
  header:        string;               // CSV column header string
  required?:     boolean;              // must be present on import
  alwaysExport?: boolean;              // always include in export output
  showInExport?: (rows) => boolean;    // conditional inclusion (e.g. omit internal ID when ext ID exists)
  fromDomain:    (row) => string;      // Export: domain object → CSV cell
  toDomain:      (value) => string;    // Import: CSV cell → normalized string (no validation here)
  aliases?:      string[];             // alternative headers accepted on import (case-insensitive)
};
```

- `fromDomain` is called by `formatCsv()` (export path)
- `toDomain` + `aliases` are used by `normalizeRow()` (import path)
- No mapping logic lives anywhere else — adding a column means touching `CARD_COLUMN_DEFS` only

---

## 7. Data Flow Pipelines

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

---

## 8. Answer Serialization Convention

| Card type | Answer cell format | Example |
|-----------|-------------------|---------|
| Single answer | plain string | `drugs used to relieve pain` |
| Multiple answers | markdown list (`- item\n`) | `- Ibuprofen\n- Paracetamol` |
| Image answers (`IMAGES`) | comma-separated filenames | `ibuprofen.jpg, paracetamol.jpg` |

- `formatAnswerForCsv(string[])` → serializes to the above format (export)
- `parseAnswerFromCsv(string)` → deserializes back to `string[]` (import)
- Both functions live in `csvFormatter.ts`; this is the only place the convention is encoded

---

## 9. Future: Tags Column

A `Tags` column (`join with ', '`) was part of the original export spec but is not yet implemented — no `tags` field exists in the DB schema or `CARD_COLUMN_DEFS`. Adding it later means: add a `tags` column to the `cards` table, add one entry to `CARD_COLUMN_DEFS`, and update the roundtrip tests.

---

## 10. Roundtrip Invariant

The system enforces the invariant `domain → CSV → domain ≈ identity` via roundtrip tests in `shared/features/csv/csvRoundtrip.test.ts`. These tests cover single-answer, multi-answer, and image-answer cards. Any change to `CARD_COLUMN_DEFS`, `formatCsv`, or `parseAnswerFromCsv` must keep the roundtrip tests passing.
