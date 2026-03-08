-- =============================================================
-- Views
-- =============================================================

-- Programs and courses visible to the current user,
-- based on their program or course enrollments.
create or replace view public.user_programs_courses as
select
  p.id as program_id,
  p.ext_id as program_ext_id,
  p.title as program_title,
  p.description as program_description,
  json_agg(
    json_build_object(
      'course_id', c.id,
      'course_ext_id', c.ext_id,
      'course_title', c.title,
      'course_description', c.description,
      'position', c.position
    ) order by c.position
  ) as courses
from public.programs p
left join public.courses c on c.program_id = p.id
left join public.program_enrollments pe on pe.program_id = p.id
left join public.course_enrollments ce on ce.course_id = c.id
where pe.user_id = auth.uid() or ce.user_id = auth.uid()
group by p.id, p.ext_id, p.title, p.description
order by p.position;
