create or replace function public.post_feed_stats(p_post_ids uuid[])
returns table(post_id uuid, reaction_count bigint, comment_count bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select
    p.id as post_id,
    (select count(*) from public.post_reactions r where r.post_id = p.id) as reaction_count,
    (select count(*) from public.comments c where c.post_id = p.id) as comment_count
  from unnest(coalesce(p_post_ids, '{}'::uuid[])) as requested(id)
  join public.posts p on p.id = requested.id;
$$;
