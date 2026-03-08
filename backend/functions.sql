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
