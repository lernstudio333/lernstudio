-- =========================================
-- Admin check
-- =========================================

create or replace function is_admin()
returns boolean
language sql
stable
security definer
as $$
  select role = 'admin'
  from profiles
  where id = auth.uid();
$$;


-- =========================================
-- Program Membership
-- =========================================

create or replace function is_program_member(p_program_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1
    from program_memberships
    where program_id = p_program_id
    and user_id = auth.uid()
  );
$$;


create or replace function is_program_editor(p_program_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1
    from program_memberships
    where program_id = p_program_id
    and user_id = auth.uid()
    and role = 'editor'
  );
$$;


-- =========================================
-- Course Membership
-- =========================================

create or replace function is_course_member(p_course_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1
    from course_memberships
    where course_id = p_course_id
    and user_id = auth.uid()
  );
$$;


create or replace function is_course_editor(p_course_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1
    from course_memberships
    where course_id = p_course_id
    and user_id = auth.uid()
    and role = 'editor'
  );
$$;


-- =========================================
-- Lesson Access
-- =========================================

create or replace function user_can_read_lesson(p_lesson_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select
    is_admin()
    or exists (
      select 1
      from lessons l
      join courses c on c.id = l.course_id
      where l.id = p_lesson_id
      and (
        is_course_member(c.id)
        or is_program_member(c.program_id)
      )
    );
$$;



create or replace function user_can_edit_lesson(p_lesson_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select
    is_admin()
    or exists (
      select 1
      from lessons l
      join courses c on c.id = l.course_id
      where l.id = p_lesson_id
      and (
        is_course_editor(c.id)
        or is_program_editor(c.program_id)
      )
    );
$$;

-- =========================================
-- Card Access
-- =========================================


create or replace function user_can_read_card(p_card_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select
    is_admin()
    or exists (
      select 1
      from cards ca
      join lessons l on l.id = ca.lesson_id
      join courses c on c.id = l.course_id
      where ca.id = p_card_id
      and (
        is_course_member(c.id)
        or is_program_member(c.program_id)
      )
    );
$$;


create or replace function user_can_edit_card(p_card_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select
    is_admin()
    or exists (
      select 1
      from cards ca
      join lessons l on l.id = ca.lesson_id
      join courses c on c.id = l.course_id
      where ca.id = p_card_id
      and (
        is_course_editor(c.id)
        or is_program_editor(c.program_id)
      )
    );
$$;