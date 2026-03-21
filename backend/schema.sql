-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.card_answers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  card_id uuid,
  answer_text text,
  media_id uuid,
  is_correct boolean DEFAULT true,
  position integer DEFAULT 0,
  CONSTRAINT card_answers_pkey PRIMARY KEY (id),
  CONSTRAINT card_answers_media_id_fkey FOREIGN KEY (media_id) REFERENCES public.media(id),
  CONSTRAINT card_answers_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.cards(id)
);
CREATE TABLE public.card_modes (
  card_id uuid NOT NULL,
  mode text NOT NULL CHECK (mode = ANY (ARRAY['DISPLAY_ANSWER'::text, 'MULTIPLE_CHOICE'::text, 'TYPED_ANSWER'::text, 'SELF_ASSESSMENT'::text, 'ARRANGE_ORDER'::text])),
  value integer NOT NULL,
  min_score integer DEFAULT 0,
  CONSTRAINT card_modes_pkey PRIMARY KEY (card_id, mode),
  CONSTRAINT card_modes_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.cards(id)
);
CREATE TABLE public.cards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ext_id text UNIQUE,
  lesson_id uuid,
  question text NOT NULL,
  card_type text NOT NULL CHECK (card_type = ANY (ARRAY['SINGLE_CARD'::text, 'MULTI_CARD'::text, 'SYNONYM'::text, 'GAP'::text, 'IMAGES'::text])),
  details text,
  source text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  position integer NOT NULL DEFAULT 0,
  tip text,
  CONSTRAINT cards_pkey PRIMARY KEY (id),
  CONSTRAINT cards_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id)
);
CREATE TABLE public.course_memberships (
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  added_at timestamp with time zone DEFAULT now(),
  role text NOT NULL DEFAULT 'student'::text CHECK (role = ANY (ARRAY['student'::text, 'editor'::text])),
  CONSTRAINT course_memberships_pkey PRIMARY KEY (user_id, course_id),
  CONSTRAINT course_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT course_memberships_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.course_tags (
  course_id uuid NOT NULL,
  tag_id uuid NOT NULL,
  CONSTRAINT course_tags_pkey PRIMARY KEY (course_id, tag_id),
  CONSTRAINT course_tags_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT course_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id)
);
CREATE TABLE public.courses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  program_id uuid,
  ext_id text UNIQUE,
  title text NOT NULL,
  description text,
  position integer DEFAULT 0,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT courses_pkey PRIMARY KEY (id),
  CONSTRAINT courses_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id),
  CONSTRAINT courses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.lesson_tags (
  lesson_id uuid NOT NULL,
  tag_id uuid NOT NULL,
  CONSTRAINT lesson_tags_pkey PRIMARY KEY (lesson_id, tag_id),
  CONSTRAINT lesson_tags_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id),
  CONSTRAINT lesson_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id)
);
CREATE TABLE public.lessons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_id uuid,
  ext_id text UNIQUE,
  title text NOT NULL,
  content text,
  google_doc_id text,
  position integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lessons_pkey PRIMARY KEY (id),
  CONSTRAINT lessons_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.media (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  media_type text NOT NULL CHECK (media_type = ANY (ARRAY['image'::text, 'video'::text])),
  created_at timestamp with time zone DEFAULT now(),
  bucket text,
  path text,
  width integer,
  height integer,
  CONSTRAINT media_pkey PRIMARY KEY (id)
);
CREATE TABLE public.media_tags (
  media_id uuid NOT NULL,
  tag_id uuid NOT NULL,
  CONSTRAINT media_tags_pkey PRIMARY KEY (media_id, tag_id),
  CONSTRAINT media_tags_media_id_fkey FOREIGN KEY (media_id) REFERENCES public.media(id),
  CONSTRAINT media_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  first_name text,
  last_name text,
  gas_token text,
  role text DEFAULT 'student'::text CHECK (role = ANY (ARRAY['student'::text, 'editor'::text, 'admin'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.program_memberships (
  user_id uuid NOT NULL,
  program_id uuid NOT NULL,
  added_at timestamp with time zone DEFAULT now(),
  role text NOT NULL DEFAULT 'student'::text CHECK (role = ANY (ARRAY['student'::text, 'editor'::text])),
  CONSTRAINT program_memberships_pkey PRIMARY KEY (user_id, program_id),
  CONSTRAINT program_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT program_memberships_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id)
);
CREATE TABLE public.program_tags (
  program_id uuid NOT NULL,
  tag_id uuid NOT NULL,
  CONSTRAINT program_tags_pkey PRIMARY KEY (program_id, tag_id),
  CONSTRAINT program_tags_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id),
  CONSTRAINT program_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id)
);
CREATE TABLE public.programs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ext_id text UNIQUE,
  title text NOT NULL,
  description text,
  created_by uuid,
  position integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  teaser_text text,
  teaser_image uuid,
  CONSTRAINT programs_pkey PRIMARY KEY (id),
  CONSTRAINT programs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id),
  CONSTRAINT programs_teaser_image_fkey FOREIGN KEY (teaser_image) REFERENCES public.media(id)
);
CREATE TABLE public.tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tags_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_cards_learnings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  card_id uuid NOT NULL,
  score integer NOT NULL DEFAULT 0,
  errors_by_type jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_visited timestamp with time zone,
  favorite_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_cards_learnings_pkey PRIMARY KEY (id),
  CONSTRAINT user_cards_learnings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_cards_learnings_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.cards(id)
);
