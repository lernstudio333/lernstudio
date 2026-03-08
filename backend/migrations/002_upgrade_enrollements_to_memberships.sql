-- Rename tables
ALTER TABLE course_enrollments RENAME TO course_memberships;
ALTER TABLE program_enrollments RENAME TO program_memberships;

-- Add role column
ALTER TABLE course_memberships
  ADD COLUMN role text NOT NULL DEFAULT 'student' CHECK (role IN ('student','editor'));

ALTER TABLE program_memberships
  ADD COLUMN role text NOT NULL DEFAULT 'student' CHECK (role IN ('student','editor'));

-- Rename timestamp column for clarity (optional)
ALTER TABLE course_memberships
  RENAME COLUMN enrolled_at TO added_at;

ALTER TABLE program_memberships
  RENAME COLUMN enrolled_at TO added_at;

-- Update profile roles
alter table public.profiles
drop constraint if exists profiles_role_check;

alter table public.profiles
add constraint profiles_role_check
check (role in ('user', 'editor', 'admin'));

-- Update constraint names
ALTER TABLE course_memberships
  RENAME CONSTRAINT course_enrollments_user_id_fkey TO course_memberships_user_id_fkey;

ALTER TABLE course_memberships
  RENAME CONSTRAINT course_enrollments_course_id_fkey TO course_memberships_course_id_fkey;

ALTER TABLE program_memberships
  RENAME CONSTRAINT program_enrollments_user_id_fkey TO program_memberships_user_id_fkey;

ALTER TABLE program_memberships
  RENAME CONSTRAINT program_enrollments_program_id_fkey TO program_memberships_program_id_fkey;