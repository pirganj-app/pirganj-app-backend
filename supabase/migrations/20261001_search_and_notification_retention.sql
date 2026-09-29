-- Search and notification retention improvements.

alter table if exists public.posts
  add column if not exists search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(body, '') || ' ' || coalesce(tag, ''))
  ) stored;

alter table if exists public.services
  add column if not exists search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(category, '') || ' ' || coalesce(location, ''))
  ) stored;

create index if not exists posts_search_vector_idx on public.posts using gin(search_vector);
create index if not exists services_search_vector_idx on public.services using gin(search_vector);
create index if not exists notifications_created_at_idx on public.notifications(created_at);

create or replace function public.delete_old_notifications(retention interval default interval '7 days')
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare deleted_count bigint;
begin
  delete from public.notifications
   where created_at < now() - retention;
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;
