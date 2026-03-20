-- =========================================
-- Admin: list learnings (paginated, sorted, filtered)
-- =========================================

drop function if exists public.admin_list_learnings(uuid, uuid, uuid, text[], text, text, integer, integer);
create function public.admin_list_learnings(
  p_program_id  uuid    default null,
  p_course_id   uuid    default null,
  p_lesson_id   uuid    default null,
  p_card_types  text[]  default null,
  p_sort_field  text    default 'program',
  p_sort_dir    text    default 'asc',
  p_page        integer default 1,
  p_page_size   integer default 25
)
returns table (
  user_id         uuid,
  user_name       text,
  program_id      uuid,
  program_title   text,
  program_ext_id  text,
  course_id       uuid,
  course_title    text,
  course_ext_id   text,
  lesson_id       uuid,
  lesson_title    text,
  lesson_ext_id   text,
  card_id         uuid,
  card_ext_id     text,
  card_type       text,
  question        text,
  answers         text,
  score           integer,
  last_visited    timestamptz,
  is_favorite     boolean,
  created_at      timestamptz,
  updated_at      timestamptz
)
language sql
stable
security definer
as $$
  select
    ucl.user_id,
    nullif(trim(concat(pr.first_name, ' ', pr.last_name)), '')   as user_name,
    prog.id                                                        as program_id,
    prog.title                                                     as program_title,
    prog.ext_id                                                    as program_ext_id,
    co.id                                                          as course_id,
    co.title                                                       as course_title,
    co.ext_id                                                      as course_ext_id,
    les.id                                                         as lesson_id,
    les.title                                                      as lesson_title,
    les.ext_id                                                     as lesson_ext_id,
    cards.id                                                       as card_id,
    cards.ext_id                                                   as card_ext_id,
    cards.card_type,
    cards.question,
    (
      select string_agg(
        case
          when cards.card_type = 'IMAGES' then split_part(m2.path, '/', -1)
          else ca2.answer_text
        end,
        ' | '
        order by ca2.position
      )
      from   public.card_answers ca2
      left   join public.media m2 on m2.id = ca2.media_id
      where  ca2.card_id = cards.id
      and    coalesce(ca2.answer_text, m2.path) is not null
    )                                                              as answers,
    ucl.score,
    ucl.last_visited,
    (ucl.favorite_date is not null)                                as is_favorite,
    cards.created_at,
    cards.updated_at

  from        public.cards   cards
  join        public.lessons les   on les.id   = cards.lesson_id
  join        public.courses co    on co.id    = les.course_id
  join        public.programs prog on prog.id  = co.program_id
  left join   public.user_cards_learnings ucl on ucl.card_id = cards.id
  left join   public.profiles             pr  on pr.id       = ucl.user_id

  where (p_program_id is null or prog.id       = p_program_id)
    and (p_course_id  is null or co.id         = p_course_id)
    and (p_lesson_id  is null or les.id        = p_lesson_id)
    and (p_card_types is null or cards.card_type = any(p_card_types))

  order by
    case when p_sort_field = 'program'     and p_sort_dir = 'asc'  then prog.title       end asc  nulls last,
    case when p_sort_field = 'program'     and p_sort_dir = 'desc' then prog.title       end desc nulls last,
    case when p_sort_field = 'course'      and p_sort_dir = 'asc'  then co.title         end asc  nulls last,
    case when p_sort_field = 'course'      and p_sort_dir = 'desc' then co.title         end desc nulls last,
    case when p_sort_field = 'lesson'      and p_sort_dir = 'asc'  then les.title        end asc  nulls last,
    case when p_sort_field = 'lesson'      and p_sort_dir = 'desc' then les.title        end desc nulls last,
    case when p_sort_field = 'card'        and p_sort_dir = 'asc'  then cards.question   end asc  nulls last,
    case when p_sort_field = 'card'        and p_sort_dir = 'desc' then cards.question   end desc nulls last,
    case when p_sort_field = 'cardType'    and p_sort_dir = 'asc'  then cards.card_type  end asc  nulls last,
    case when p_sort_field = 'cardType'    and p_sort_dir = 'desc' then cards.card_type  end desc nulls last,
    case when p_sort_field = 'score'       and p_sort_dir = 'asc'  then ucl.score        end asc  nulls last,
    case when p_sort_field = 'score'       and p_sort_dir = 'desc' then ucl.score        end desc nulls last,
    case when p_sort_field = 'lastVisited' and p_sort_dir = 'asc'  then ucl.last_visited end asc  nulls last,
    case when p_sort_field = 'lastVisited' and p_sort_dir = 'desc' then ucl.last_visited end desc nulls last,
    case when p_sort_field = 'createdAt'   and p_sort_dir = 'asc'  then cards.created_at end asc  nulls last,
    case when p_sort_field = 'createdAt'   and p_sort_dir = 'desc' then cards.created_at end desc nulls last,
    case when p_sort_field = 'updatedAt'   and p_sort_dir = 'asc'  then cards.updated_at end asc  nulls last,
    case when p_sort_field = 'updatedAt'   and p_sort_dir = 'desc' then cards.updated_at end desc nulls last,
    prog.title asc, co.title asc, les.title asc, cards.position asc

  limit  p_page_size
  offset (p_page - 1) * p_page_size;
$$;


-- =========================================
-- Admin: count learnings (same filters, no sort/page)
-- =========================================

drop function if exists public.admin_count_learnings(uuid, uuid, uuid, text[]);
create function public.admin_count_learnings(
  p_program_id  uuid   default null,
  p_course_id   uuid   default null,
  p_lesson_id   uuid   default null,
  p_card_types  text[] default null
)
returns bigint
language sql
stable
security definer
as $$
  select count(*)
  from        public.cards   cards
  join        public.lessons les   on les.id  = cards.lesson_id
  join        public.courses co    on co.id   = les.course_id
  join        public.programs prog on prog.id = co.program_id
  left join   public.user_cards_learnings ucl on ucl.card_id = cards.id

  where (p_program_id is null or prog.id        = p_program_id)
    and (p_course_id  is null or co.id          = p_course_id)
    and (p_lesson_id  is null or les.id         = p_lesson_id)
    and (p_card_types is null or cards.card_type = any(p_card_types));
$$;


-- =========================================
-- List all places where a media file is referenced
-- =========================================

drop function if exists public.list_image_usage(uuid);
create function public.list_image_usage(p_media_id uuid)
returns table(
  lesson_id uuid,
  lesson_title text,
  card_id uuid,
  card_question text
)
language sql
stable
security definer
as $$
  select
    l.id,
    l.title,
    c.id,
    c.question
  from card_answers ca
  join cards c on c.id = ca.card_id
  join lessons l on l.id = c.lesson_id
  where ca.media_id = p_media_id;
$$;

-- =========================================
-- Safely delete a media record, clearing all references first.
-- Storage file deletion is handled by the frontend.
-- =========================================

drop function if exists public.delete_media_safe(uuid, boolean);
create function public.delete_media_safe(p_media_id uuid, override boolean default false)
returns void
language plpgsql
security definer
as $$
declare
  usage_count int;
begin
  select count(*) into usage_count
  from public.list_image_usage(p_media_id);

  if usage_count > 0 and override = false then
    raise exception 'Cannot delete media: still in use. Set override = true to force delete.';
  end if;

  -- Delete card_answers that reference this media (IMG card answers have no meaning without media)
  delete from card_answers
    where media_id = p_media_id;

  -- Delete media row
  delete from media where id = p_media_id;
end;
$$;
