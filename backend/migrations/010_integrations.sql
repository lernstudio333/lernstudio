-- Migration 010: Add integration tables for external source connections
-- Supports the pairing-code → session-token flow (Google Docs, Confluence, etc.)

-- Pairing codes: short-lived one-time codes used to bootstrap trust with external sources
CREATE TABLE public.pairing_codes (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  code       text        NOT NULL,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  used       boolean     NOT NULL DEFAULT false
);

-- Integrations: session tokens tied to connected documents
CREATE TABLE public.integrations (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  token      text        NOT NULL UNIQUE,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_id     text        NOT NULL,
  doc_name   text        NOT NULL,
  source_id  text,
  lesson_id  uuid        REFERENCES public.lessons(id) ON DELETE SET NULL,
  scope      text        NOT NULL DEFAULT 'import',
  expires_at timestamptz,
  last_sync  timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: pairing codes are owned by the requesting admin
ALTER TABLE public.pairing_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pairing_codes owner"
ON public.pairing_codes
FOR ALL
USING (auth.uid() = user_id AND is_admin());

-- RLS: integrations are visible to their owner only
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integrations owner read"
ON public.integrations
FOR SELECT
USING (auth.uid() = user_id);

-- Down:
-- DROP TABLE IF EXISTS public.integrations;
-- DROP TABLE IF EXISTS public.pairing_codes;
