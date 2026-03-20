-- Migration 007: Add admin_list_learnings() and admin_count_learnings() helper
-- functions used by the list-cards-admin Edge Function.
--
-- Returns one row per (card, user) pair. Cards never studied by anyone appear
-- once with user_id = NULL ("not studied yet").
--
-- ─── UP ──────────────────────────────────────────────────────────────────────


-- 1. Data function — paginated, sorted, filtered
CREATE OR REPLACE FUNCTION admin_list_learnings(
  p_program_id  UUID    DEFAULT NULL,
  p_course_id   UUID    DEFAULT NULL,
  p_lesson_id   UUID    DEFAULT NULL,
  p_card_types  TEXT[]  DEFAULT NULL,
  p_sort_field  TEXT    DEFAULT 'program',
  p_sort_dir    TEXT    DEFAULT 'asc',
  p_page        INTEGER DEFAULT 1,
  p_page_size   INTEGER DEFAULT 25
)
RETURNS TABLE (
  user_id         UUID,
  user_name       TEXT,
  program_id      UUID,
  program_title   TEXT,
  program_ext_id  TEXT,
  course_id       UUID,
  course_title    TEXT,
  course_ext_id   TEXT,
  lesson_id       UUID,
  lesson_title    TEXT,
  lesson_ext_id   TEXT,
  card_id         UUID,
  card_ext_id     TEXT,
  card_type       TEXT,
  question        TEXT,
  answers         TEXT,
  score           INTEGER,
  last_visited    TIMESTAMPTZ,
  is_favorite     BOOLEAN,
  created_at      TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT
    ucl.user_id,
    NULLIF(TRIM(CONCAT(pr.first_name, ' ', pr.last_name)), '')   AS user_name,
    prog.id                                                        AS program_id,
    prog.title                                                     AS program_title,
    prog.ext_id                                                    AS program_ext_id,
    co.id                                                          AS course_id,
    co.title                                                       AS course_title,
    co.ext_id                                                      AS course_ext_id,
    les.id                                                         AS lesson_id,
    les.title                                                      AS lesson_title,
    les.ext_id                                                     AS lesson_ext_id,
    cards.id                                                       AS card_id,
    cards.ext_id                                                   AS card_ext_id,
    cards.card_type,
    cards.question,
    -- Inline answers: text answers joined with ' | ', image cards use filenames
    (
      SELECT string_agg(
        CASE
          WHEN cards.card_type = 'IMAGES' THEN split_part(m2.path, '/', -1)
          ELSE ca2.answer_text
        END,
        ' | '
        ORDER BY ca2.position
      )
      FROM   public.card_answers ca2
      LEFT   JOIN public.media m2 ON m2.id = ca2.media_id
      WHERE  ca2.card_id = cards.id
      AND    COALESCE(ca2.answer_text, m2.path) IS NOT NULL
    )                                                              AS answers,
    ucl.score,
    ucl.last_visited,
    (ucl.favorite_date IS NOT NULL)                                AS is_favorite,
    cards.created_at,
    cards.updated_at

  FROM        public.cards   cards
  JOIN        public.lessons les   ON les.id   = cards.lesson_id
  JOIN        public.courses co    ON co.id    = les.course_id
  JOIN        public.programs prog ON prog.id  = co.program_id
  LEFT JOIN   public.user_cards_learnings ucl ON ucl.card_id = cards.id
  LEFT JOIN   public.profiles             pr  ON pr.id       = ucl.user_id

  WHERE (p_program_id IS NULL OR prog.id       = p_program_id)
    AND (p_course_id  IS NULL OR co.id         = p_course_id)
    AND (p_lesson_id  IS NULL OR les.id        = p_lesson_id)
    AND (p_card_types IS NULL OR cards.card_type = ANY(p_card_types))

  ORDER BY
    -- Text sorts
    CASE WHEN p_sort_field = 'program'   AND p_sort_dir = 'asc'  THEN prog.title       END ASC  NULLS LAST,
    CASE WHEN p_sort_field = 'program'   AND p_sort_dir = 'desc' THEN prog.title       END DESC NULLS LAST,
    CASE WHEN p_sort_field = 'course'    AND p_sort_dir = 'asc'  THEN co.title         END ASC  NULLS LAST,
    CASE WHEN p_sort_field = 'course'    AND p_sort_dir = 'desc' THEN co.title         END DESC NULLS LAST,
    CASE WHEN p_sort_field = 'lesson'    AND p_sort_dir = 'asc'  THEN les.title        END ASC  NULLS LAST,
    CASE WHEN p_sort_field = 'lesson'    AND p_sort_dir = 'desc' THEN les.title        END DESC NULLS LAST,
    CASE WHEN p_sort_field = 'card'      AND p_sort_dir = 'asc'  THEN cards.question   END ASC  NULLS LAST,
    CASE WHEN p_sort_field = 'card'      AND p_sort_dir = 'desc' THEN cards.question   END DESC NULLS LAST,
    CASE WHEN p_sort_field = 'cardType'  AND p_sort_dir = 'asc'  THEN cards.card_type  END ASC  NULLS LAST,
    CASE WHEN p_sort_field = 'cardType'  AND p_sort_dir = 'desc' THEN cards.card_type  END DESC NULLS LAST,
    -- Numeric sorts
    CASE WHEN p_sort_field = 'score'     AND p_sort_dir = 'asc'  THEN ucl.score        END ASC  NULLS LAST,
    CASE WHEN p_sort_field = 'score'     AND p_sort_dir = 'desc' THEN ucl.score        END DESC NULLS LAST,
    -- Timestamp sorts
    CASE WHEN p_sort_field = 'lastVisited' AND p_sort_dir = 'asc'  THEN ucl.last_visited END ASC  NULLS LAST,
    CASE WHEN p_sort_field = 'lastVisited' AND p_sort_dir = 'desc' THEN ucl.last_visited END DESC NULLS LAST,
    CASE WHEN p_sort_field = 'createdAt'   AND p_sort_dir = 'asc'  THEN cards.created_at END ASC  NULLS LAST,
    CASE WHEN p_sort_field = 'createdAt'   AND p_sort_dir = 'desc' THEN cards.created_at END DESC NULLS LAST,
    CASE WHEN p_sort_field = 'updatedAt'   AND p_sort_dir = 'asc'  THEN cards.updated_at END ASC  NULLS LAST,
    CASE WHEN p_sort_field = 'updatedAt'   AND p_sort_dir = 'desc' THEN cards.updated_at END DESC NULLS LAST,
    -- Default fallback: hierarchy + position
    prog.title ASC, co.title ASC, les.title ASC, cards.position ASC

  LIMIT  p_page_size
  OFFSET (p_page - 1) * p_page_size;
$$;


-- 2. Count function — same filters, no sort/page
CREATE OR REPLACE FUNCTION admin_count_learnings(
  p_program_id  UUID   DEFAULT NULL,
  p_course_id   UUID   DEFAULT NULL,
  p_lesson_id   UUID   DEFAULT NULL,
  p_card_types  TEXT[] DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*)
  FROM        public.cards   cards
  JOIN        public.lessons les   ON les.id  = cards.lesson_id
  JOIN        public.courses co    ON co.id   = les.course_id
  JOIN        public.programs prog ON prog.id = co.program_id
  LEFT JOIN   public.user_cards_learnings ucl ON ucl.card_id = cards.id

  WHERE (p_program_id IS NULL OR prog.id        = p_program_id)
    AND (p_course_id  IS NULL OR co.id          = p_course_id)
    AND (p_lesson_id  IS NULL OR les.id         = p_lesson_id)
    AND (p_card_types IS NULL OR cards.card_type = ANY(p_card_types));
$$;


-- ─── DOWN (rollback) ──────────────────────────────────────────────────────────
/*

DROP FUNCTION IF EXISTS admin_count_learnings(UUID, UUID, UUID, TEXT[]);
DROP FUNCTION IF EXISTS admin_list_learnings(UUID, UUID, UUID, TEXT[], TEXT, TEXT, INTEGER, INTEGER);

*/
