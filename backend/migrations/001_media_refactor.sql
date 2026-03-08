-- =============================================================
-- Migration 001: refactor media table + add media_tags
-- =============================================================
-- Changes:
--   1. Replace media.url with media.bucket + media.path
--   2. Add media.width and media.height (optional, for images/videos)
--   3. Drop media.tags array column
--   4. Create media_tags junction table
--
-- NOTE: existing media rows will have NULL bucket/path after this migration.
-- Backfill them manually before uncommenting the NOT NULL constraints below.
-- =============================================================

-- 1. Refactor media columns
ALTER TABLE public.media
  ADD COLUMN IF NOT EXISTS bucket text,
  ADD COLUMN IF NOT EXISTS path   text,
  ADD COLUMN IF NOT EXISTS width  int,
  ADD COLUMN IF NOT EXISTS height int;

ALTER TABLE public.media DROP COLUMN IF EXISTS url;
ALTER TABLE public.media DROP COLUMN IF EXISTS tags;

-- After backfilling existing rows, enforce NOT NULL:
-- ALTER TABLE public.media ALTER COLUMN bucket SET NOT NULL;
-- ALTER TABLE public.media ALTER COLUMN path   SET NOT NULL;

-- 2. Create media_tags junction table
CREATE TABLE IF NOT EXISTS public.media_tags (
  media_id uuid NOT NULL,
  tag_id   uuid NOT NULL,
  CONSTRAINT media_tags_pkey          PRIMARY KEY (media_id, tag_id),
  CONSTRAINT media_tags_media_id_fkey FOREIGN KEY (media_id) REFERENCES public.media(id),
  CONSTRAINT media_tags_tag_id_fkey   FOREIGN KEY (tag_id)   REFERENCES public.tags(id)
);
