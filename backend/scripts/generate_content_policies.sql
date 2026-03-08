-- =============================================================
-- Generator: RLS policies for content tables
-- =============================================================
-- Generates SELECT (users + admins) and ALL (admins only) policies
-- for: programs, courses, lessons, cards, card_answers, card_modes
--
-- User access is based on enrollment:
--   - program_enrollments (user_id, program_id)
--   - course_enrollments  (user_id, course_id)
--   Courses inherit from program enrollment; lessons/cards/etc. inherit from course.
--
-- Run this in the Supabase SQL editor or via psql.
-- Safe to re-run: drops existing policies before recreating them.
-- =============================================================


-- Helper function: returns true if the current user is enrolled
-- in the given course (directly or via a program enrollment).
CREATE OR REPLACE FUNCTION user_can_access_course(p_course_id uuid)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM course_enrollments
      WHERE user_id = auth.uid() AND course_id = p_course_id
    )
    OR EXISTS (
      SELECT 1 FROM program_enrollments pe
      JOIN courses c ON c.program_id = pe.program_id
      WHERE pe.user_id = auth.uid() AND c.id = p_course_id
    )
$$;


DO $$
DECLARE
  admin_check text :=
    'EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN (''admin'', ''course_editor''))';

  -- Each entry: { table_name, user SELECT expression }
  tables text[][] := ARRAY[

    ARRAY[
      'programs',
      'EXISTS (SELECT 1 FROM program_enrollments WHERE user_id = auth.uid() AND program_id = programs.id)'
    ],

    ARRAY[
      'courses',
      'user_can_access_course(courses.id)'
    ],

    ARRAY[
      'lessons',
      'user_can_access_course(lessons.course_id)'
    ],

    ARRAY[
      'cards',
      'EXISTS (SELECT 1 FROM lessons l WHERE l.id = cards.lesson_id AND user_can_access_course(l.course_id))'
    ],

    ARRAY[
      'card_answers',
      'EXISTS (SELECT 1 FROM cards ca JOIN lessons l ON l.id = ca.lesson_id WHERE ca.id = card_answers.card_id AND user_can_access_course(l.course_id))'
    ],

    ARRAY[
      'card_modes',
      'EXISTS (SELECT 1 FROM cards ca JOIN lessons l ON l.id = ca.lesson_id WHERE ca.id = card_modes.card_id AND user_can_access_course(l.course_id))'
    ]

  ];

  t          text[];
  tname      text;
  user_expr  text;
BEGIN
  FOREACH t SLICE 1 IN ARRAY tables LOOP
    tname     := t[1];
    user_expr := t[2];

    EXECUTE format('DROP POLICY IF EXISTS "users_read" ON %I', tname);
    EXECUTE format('DROP POLICY IF EXISTS "admins_all"  ON %I', tname);

    -- Users can SELECT rows they have access to; admins can SELECT everything
    EXECUTE format(
      'CREATE POLICY "users_read" ON %I FOR SELECT USING (%s OR %s)',
      tname, user_expr, admin_check
    );

    -- Admins/editors can INSERT, UPDATE, DELETE
    EXECUTE format(
      'CREATE POLICY "admins_all" ON %I FOR ALL USING (%s)',
      tname, admin_check
    );

    RAISE NOTICE 'Policies created for table: %', tname;
  END LOOP;
END $$;
