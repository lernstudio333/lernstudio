-- =========================================
-- Profile Permission
-- =========================================

alter table profiles enable row level security;

create policy "profiles read"
on profiles
for select
using (
  -- admins can read all profiles (e.g. for Users admin page)
  is_admin()
  -- users can read their own profile
  or id = auth.uid()
);

create policy "profiles update own"
on profiles
for update
using (id = auth.uid())
with check (id = auth.uid());


-- =========================================
-- Program Permission
-- =========================================

alter table programs enable row level security;

create policy "program read"
on programs
for select
using (
  is_admin()
  or is_program_member(id)
);

create policy "program write"
on programs
for all
using (
  is_admin()
  or is_program_editor(id)
)
with check (
  is_admin()
  or is_program_editor(id)
);


-- =========================================
-- Course Permission 
-- =========================================


alter table courses enable row level security;

create policy "course read"
on courses
for select
using (
  is_admin()
  or is_course_member(id)
  or is_program_member(program_id)
);

create policy "course write"
on courses
for all
using (
  is_admin()
  or is_course_editor(id)
  or is_program_editor(program_id)
)
with check (
  is_admin()
  or is_course_editor(id)
  or is_program_editor(program_id)
);


-- =========================================
-- Lesson Permission 
-- =========================================

alter table lessons enable row level security;

create policy "lesson read"
on lessons
for select
using (
  user_can_read_lesson(id)
);


create policy "lesson write"
on lessons
for all
using (
  user_can_edit_lesson(id)
)
with check (
  user_can_edit_lesson(id)
);


-- =========================================
-- Card Permission 
-- =========================================

alter table cards enable row level security;

create policy "cards read"
on cards
for select
using (
  user_can_read_lesson(lesson_id)
);

create policy "cards write"
on cards
for all
using (
  user_can_edit_lesson(lesson_id)
)
with check (
  user_can_edit_lesson(lesson_id)
);


-- =========================================
-- Card Answers Permission 
-- =========================================

alter table card_answers enable row level security;

create policy "answers read"
on card_answers
for select
using (
  user_can_read_card(card_id)
);

create policy "answers write"
on card_answers
for all
using (
  user_can_edit_card(card_id)
)
with check (
  user_can_edit_card(card_id)
);


-- =========================================
-- Card Modes Permission 
-- =========================================

alter table card_modes enable row level security;

create policy "card_modes read"
on card_modes
for select
using (
  user_can_read_card(card_id)
);

create policy "card_modes write"
on card_modes
for all
using (
  user_can_edit_card(card_id)
)
with check (
  user_can_edit_card(card_id)
);




-- =========================================
-- Media Permission 
-- =========================================


alter table media enable row level security;

create policy "media read"
on media
for select
using (true);

drop policy if exists "media write" on media;
create policy "media write"
on media
for all
using (
  is_admin()
)
with check (
  is_admin()
);



-- =========================================
-- Storage Bucket Policies (cards-media)
-- =========================================

drop policy if exists "media is public" on storage.objects;
create policy "media is public"
on storage.objects
for select
using (
  bucket_id = 'cards-media'
);

drop policy if exists "admin can upload media" on storage.objects;
create policy "admin can upload media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'cards-media'
  and is_admin()
);

drop policy if exists "admin can delete media" on storage.objects;
create policy "admin can delete media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'cards-media'
  and is_admin()
);


-- =========================================
-- Membership Permission
-- =========================================

-- TODO: add write policies

alter table program_memberships enable row level security;

create policy "membership read"
on program_memberships
for select
using (
  is_admin()
  or user_id = auth.uid()
);

alter table course_memberships enable row level security;

create policy "course membership read"
on course_memberships
for select
using (
  is_admin()
  or user_id = auth.uid()
);