-- Rename profile role 'user' → 'student' to align with membership table roles.
-- Roles across the system: student / editor / admin

-- Drop stale view that referenced the old enrollment table names
DROP VIEW IF EXISTS public.user_programs_courses;

-- Drop constraint before updating data to avoid violation
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Migrate existing data
UPDATE public.profiles
  SET role = 'student'
  WHERE role = 'user';

-- Re-add constraint and update default
ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'student';

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('student', 'editor', 'admin'));
