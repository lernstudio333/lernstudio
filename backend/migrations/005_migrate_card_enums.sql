-- Migration 005: Rename tipp→tip, migrate card_type + card_modes to new enum values,
--               add teaser_image + teaser_text to programs.
--
-- NOTE on rollback:
--   • ALIKES rows in card_modes are permanently deleted — they cannot be restored.
--   • The _BW mode distinction (e.g. MULTIPLECARDS_BW vs MULTIPLECARDS) is lost after
--     the UP migration; the DOWN migration restores values but not the BW variants.
--   • IMG-SC vs IMG-MC distinction is lost; the DOWN migration maps all IMAGES → IMG-SC.
--
-- ─── UP ──────────────────────────────────────────────────────────────────────

-- 1. Rename tipp → tip in cards
ALTER TABLE public.cards RENAME COLUMN tipp TO tip;

-- 2. Migrate cards.card_type to new CardTypes enum keys
ALTER TABLE public.cards DROP CONSTRAINT IF EXISTS cards_card_type_check;

UPDATE public.cards SET card_type = 'SINGLE_CARD' WHERE card_type = 'SC';
UPDATE public.cards SET card_type = 'MULTI_CARD'  WHERE card_type = 'MC';
UPDATE public.cards SET card_type = 'SYNONYM'     WHERE card_type = 'SYN';
-- GAP stays as GAP
UPDATE public.cards SET card_type = 'IMAGES'      WHERE card_type IN ('IMG-SC', 'IMG-MC');

ALTER TABLE public.cards ADD CONSTRAINT cards_card_type_check
  CHECK (card_type = ANY (ARRAY['SINGLE_CARD'::text, 'MULTI_CARD'::text, 'SYNONYM'::text, 'GAP'::text, 'IMAGES'::text]));

-- 3. Migrate card_modes.mode to new QuizMode enum keys
DELETE FROM public.card_modes WHERE mode = 'ALIKES';

ALTER TABLE public.card_modes DROP CONSTRAINT IF EXISTS card_modes_mode_check;

UPDATE public.card_modes SET mode = 'DISPLAY_ANSWER'  WHERE mode = 'SHOW';
UPDATE public.card_modes SET mode = 'MULTIPLE_CHOICE' WHERE mode IN ('MULTIPLECARDS', 'MULTIPLEANSWERS', 'MULTIPLECARDS_BW');
UPDATE public.card_modes SET mode = 'ARRANGE_ORDER'   WHERE mode IN ('SORTPARTS', 'SORTPARTS_BW');
UPDATE public.card_modes SET mode = 'SELF_ASSESSMENT' WHERE mode IN ('SELFASSES', 'SELFASSES_BW');
UPDATE public.card_modes SET mode = 'TYPED_ANSWER'    WHERE mode IN ('TYPE', 'TYPE_BW');

ALTER TABLE public.card_modes ADD CONSTRAINT card_modes_mode_check
  CHECK (mode = ANY (ARRAY['DISPLAY_ANSWER'::text, 'MULTIPLE_CHOICE'::text, 'TYPED_ANSWER'::text, 'SELF_ASSESSMENT'::text, 'ARRANGE_ORDER'::text]));

-- 4. Add teaser columns to programs
ALTER TABLE public.programs ADD COLUMN teaser_image text;
ALTER TABLE public.programs ADD COLUMN teaser_text  text;


-- ─── DOWN (rollback) ──────────────────────────────────────────────────────────
-- To roll back this migration, run the statements below manually.
-- See NOTE at the top regarding data that cannot be fully restored.

/*

-- 4. Remove teaser columns from programs
ALTER TABLE public.programs DROP COLUMN IF EXISTS teaser_image;
ALTER TABLE public.programs DROP COLUMN IF EXISTS teaser_text;

-- 3. Revert card_modes.mode
ALTER TABLE public.card_modes DROP CONSTRAINT IF EXISTS card_modes_mode_check;

UPDATE public.card_modes SET mode = 'SHOW'          WHERE mode = 'DISPLAY_ANSWER';
UPDATE public.card_modes SET mode = 'MULTIPLECARDS' WHERE mode = 'MULTIPLE_CHOICE';
UPDATE public.card_modes SET mode = 'SORTPARTS'     WHERE mode = 'ARRANGE_ORDER';
UPDATE public.card_modes SET mode = 'SELFASSES'     WHERE mode = 'SELF_ASSESSMENT';
UPDATE public.card_modes SET mode = 'TYPE'          WHERE mode = 'TYPED_ANSWER';

ALTER TABLE public.card_modes ADD CONSTRAINT card_modes_mode_check
  CHECK (mode = ANY (ARRAY['SHOW'::text, 'MULTIPLECARDS'::text, 'MULTIPLEANSWERS'::text,
    'SORTPARTS'::text, 'SELFASSES'::text, 'TYPE'::text, 'ALIKES'::text,
    'MULTIPLECARDS_BW'::text, 'SORTPARTS_BW'::text, 'SELFASSES_BW'::text, 'TYPE_BW'::text]));

-- 2. Revert cards.card_type
ALTER TABLE public.cards DROP CONSTRAINT IF EXISTS cards_card_type_check;

UPDATE public.cards SET card_type = 'SC'    WHERE card_type = 'SINGLE_CARD';
UPDATE public.cards SET card_type = 'MC'    WHERE card_type = 'MULTI_CARD';
UPDATE public.cards SET card_type = 'SYN'   WHERE card_type = 'SYNONYM';
-- GAP stays as GAP
UPDATE public.cards SET card_type = 'IMG-SC' WHERE card_type = 'IMAGES'; -- IMG-MC distinction lost

ALTER TABLE public.cards ADD CONSTRAINT cards_card_type_check
  CHECK (card_type = ANY (ARRAY['SC'::text, 'MC'::text, 'SYN'::text, 'GAP'::text, 'IMG-SC'::text, 'IMG-MC'::text]));

-- 1. Rename tip → tipp
ALTER TABLE public.cards RENAME COLUMN tip TO tipp;

*/
