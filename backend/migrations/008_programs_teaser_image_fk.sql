-- Migration 008: change programs.teaser_image from free text to FK → media
--
-- The column was a text placeholder. Replace it with a proper UUID FK so
-- program cards can reference the media library for their teaser image.

-- ── Up ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.programs DROP COLUMN IF EXISTS teaser_image;
ALTER TABLE public.programs
  ADD COLUMN teaser_image uuid
  REFERENCES public.media(id)
  ON DELETE SET NULL;

-- ── Down ────────────────────────────────────────────────────────────────────

-- ALTER TABLE public.programs DROP COLUMN teaser_image;
-- ALTER TABLE public.programs ADD COLUMN teaser_image text;
