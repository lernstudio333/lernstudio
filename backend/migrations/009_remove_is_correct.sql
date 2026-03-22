-- Migration 009: Remove is_correct from card_answers
-- All answers stored in card_answers are correct answers by definition.
-- Wrong options (distractors) are always sourced from the distractor pool at quiz time.

ALTER TABLE public.card_answers DROP COLUMN IF EXISTS is_correct;
