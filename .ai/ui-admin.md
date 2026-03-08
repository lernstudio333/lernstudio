# Admin UI – Learning App

## Layout

- **Global Sidebar**: Content / Media / Users  
- **Content Browser**: collapsible tree → select Lesson  
- **Lesson Workspace**:
  - Header: breadcrumb (Program / Course / Lesson), editable title, optional switch lesson dropdown
  - Split view:
    - Left: Card List (sortable, drag-and-drop, batch operations)
    - Right: Card Detail Editor

---

## Table Conventions
- Columns with text should always be left aligned (add `className="text-start"` to `<Table>` components — covers both headers and cells)

---

## Card Navigation

- Previous / Next buttons follow current sort/filter state  
- Keyboard support: ArrowLeft / ArrowRight  
- Card list drives selection; no database ID order  

---

## Card Editor Sections

- **Basic Info**: question, card type, tipp  
- **Answers**: dynamic depending on type  
- **Card Modes**: multiselect UI from `card_modes` table  

---

## Media Gallery

- Top menu entry “Media”
- Supports upload, delete, search
- *(TODO: rename not yet implemented)*
- Bucket name configured via `VITE_MEDIA_BUCKET` env var (currently `cards-media`)
- Operates on Supabase Storage bucket + `media` table for metadata (`bucket`, `path`, `media_type`)

### Media Deletion

Deleting a media file triggers a safety dialog:
- Calls `list_image_usage(p_media_id)` RPC to check if the file is referenced in `card_answers`
- If **not in use**: simple confirmation dialog
- If **in use**: shows usage locations (lesson + card) + requires a checkbox before the Delete button is enabled
- On confirm:
  1. `delete_media_safe(p_media_id, override)` RPC — **deletes** all `card_answers` rows referencing this media (not nulled!), then deletes the `media` row
  2. Removes the file from Supabase Storage
  3. Calls `purgeMediaFromCards(mediaId)` on the Zustand `lessonStore` — strips the deleted answers from both `cards[]` and `editBuffer` in memory, so no stale placeholder appears and no orphaned answer is re-saved
- All DB cleanup and RLS enforcement happens server-side; frontend only handles dialog, storage removal, and in-memory sync

---
