-- Migration 006: Add user_cards_learnings table for per-user card learning progress.
--
-- ─── UP ──────────────────────────────────────────────────────────────────────

-- 1. Create table
CREATE TABLE public.user_cards_learnings (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id)   ON DELETE CASCADE,
  card_id        UUID        NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  score          INTEGER     NOT NULL DEFAULT 0,
  errors_by_type JSONB       NOT NULL DEFAULT '{}'::jsonb,
  last_visited   TIMESTAMPTZ,
  favorite_date  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_cards_learnings_user_card_unique UNIQUE (user_id, card_id)
);

-- 2. RLS
ALTER TABLE public.user_cards_learnings ENABLE ROW LEVEL SECURITY;

-- Users can read their own learnings; admins can read all (for future admin tab)
CREATE POLICY "learnings read"
ON public.user_cards_learnings
FOR SELECT
USING (
  user_id = auth.uid()
  OR is_admin()
);

-- Users can only insert rows for themselves
CREATE POLICY "learnings insert own"
ON public.user_cards_learnings
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can only update their own rows
CREATE POLICY "learnings update own"
ON public.user_cards_learnings
FOR UPDATE
USING  (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());


-- 3. Helper: return which card IDs from a given list are accessible to a given user.
--    Used by the batch-update-learnings Edge Function (runs as service role,
--    so auth.uid() is not available — user_id must be passed explicitly).
CREATE OR REPLACE FUNCTION get_authorized_card_ids(p_user_id UUID, p_card_ids UUID[])
RETURNS TABLE(card_id UUID)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT ca.id
  FROM   public.cards   ca
  JOIN   public.lessons  l  ON l.id  = ca.lesson_id
  JOIN   public.courses  co ON co.id = l.course_id
  WHERE  ca.id = ANY(p_card_ids)
  AND (
    -- Admin: full access
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = p_user_id AND role = 'admin'
    )
    -- Course member
    OR EXISTS (
      SELECT 1 FROM public.course_memberships
      WHERE course_id = co.id AND user_id = p_user_id
    )
    -- Program member
    OR EXISTS (
      SELECT 1 FROM public.program_memberships
      WHERE program_id = co.program_id AND user_id = p_user_id
    )
  );
$$;


-- ─── DOWN (rollback) ──────────────────────────────────────────────────────────
-- To roll back this migration, run the statements below manually.

/*

DROP FUNCTION IF EXISTS get_authorized_card_ids(UUID, UUID[]);
DROP TABLE IF EXISTS public.user_cards_learnings;

*/
