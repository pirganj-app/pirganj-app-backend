-- Security and foreign-key performance hardening.
-- Keep service-role access server-side; this migration does not grant client write access.

create index if not exists blood_requests_requester_id_idx on public.blood_requests(requester_id);
create index if not exists comments_author_id_idx on public.comments(author_id);
create index if not exists comments_parent_id_idx on public.comments(parent_id);
create index if not exists donors_user_id_idx on public.donors(user_id);
create index if not exists jobs_author_id_idx on public.jobs(author_id);
create index if not exists lost_found_author_id_idx on public.lost_found(author_id);
create index if not exists notices_author_id_idx on public.notices(author_id);
create index if not exists notifications_actor_id_idx on public.notifications(actor_id);
create index if not exists post_reactions_user_id_idx on public.post_reactions(user_id);
create index if not exists reactions_user_id_idx on public.reactions(user_id);
create index if not exists services_created_by_idx on public.services(created_by);

drop index if exists public.blood_requests_status_idx;
drop index if exists public.jobs_status_idx;
drop index if exists public.lost_found_status_idx;
drop index if exists public.notices_status_idx;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop policy if exists profiles_owner_access on public.profiles;
create policy profiles_owner_access on public.profiles
  for all to public
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists reactions_no_public_access on public.reactions;
create policy reactions_no_public_access on public.reactions
  for all to public
  using (false)
  with check (false);

-- Public-read tables already have explicit read policies; the old false ALL policies
-- created redundant permissive SELECT policy evaluation for anonymous reads.
drop policy if exists services_no_anon_access on public.services;
drop policy if exists posts_no_anon_access on public.posts;
drop policy if exists blood_requests_no_anon_access on public.blood_requests;
drop policy if exists comments_no_anon_access on public.comments;
drop policy if exists donors_no_anon_access on public.donors;
drop policy if exists notices_no_anon_access on public.notices;
drop policy if exists jobs_no_anon_access on public.jobs;
drop policy if exists lost_found_no_anon_access on public.lost_found;
