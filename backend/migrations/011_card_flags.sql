-- Migration 011: replace card_modes with a flags text column on cards
--
-- The card_modes table was never fully wired up; it stored legacy mode names
-- from the old quiz engine. The new approach uses a single TEXT column on
-- cards containing comma-separated flag names (e.g. 'NO_BACKWARD,NO_TYPING').
-- This is simple to query, easy to extend, and requires no join.

ALTER TABLE cards
  ADD COLUMN flags TEXT NOT NULL DEFAULT '';

DROP TABLE IF EXISTS card_modes;
