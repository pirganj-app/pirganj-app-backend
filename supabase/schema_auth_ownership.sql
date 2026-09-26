-- Pirganj authentication and ownership migration
-- Run this once in Supabase SQL Editor. Keep SUPABASE_SERVICE_ROLE_KEY server-side only.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  password_hash text not null,
  name text not null,
  sex text not null check (sex in ('পুরুষ', 'নারী', 'অন্যান্য')),
  address text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_phone_idx on public.users(phone);

-- Every user-created record is linked to the account that created it.
alter table if exists public.services add column if not exists owner_id uuid references public.users(id) on delete cascade;
alter table if exists public.posts add column if not exists owner_id uuid references public.users(id) on delete cascade;
alter table if exists public.donors add column if not exists owner_id uuid references public.users(id) on delete cascade;
alter table if exists public.blood_requests add column if not exists owner_id uuid references public.users(id) on delete cascade;
alter table if exists public.notices add column if not exists owner_id uuid references public.users(id) on delete cascade;
alter table if exists public.jobs add column if not exists owner_id uuid references public.users(id) on delete cascade;
alter table if exists public.lost_found add column if not exists owner_id uuid references public.users(id) on delete cascade;
alter table if exists public.comments add column if not exists owner_id uuid references public.users(id) on delete cascade;
alter table if exists public.comments add column if not exists parent_id uuid references public.comments(id) on delete cascade;

create table if not exists public.post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  reaction text not null default 'like',
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);

create table if not exists public.comment_reactions (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  reaction text not null default 'like',
  created_at timestamptz not null default now(),
  unique(comment_id, user_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  actor_id uuid references public.users(id) on delete set null,
  type text not null default 'general',
  title text not null,
  body text not null,
  entity_type text,
  entity_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token text not null unique,
  platform text not null default 'android',
  updated_at timestamptz not null default now()
);

create index if not exists services_owner_id_idx on public.services(owner_id);
create index if not exists posts_owner_id_idx on public.posts(owner_id);
create index if not exists donors_owner_id_idx on public.donors(owner_id);
create index if not exists blood_requests_owner_id_idx on public.blood_requests(owner_id);
create index if not exists notices_owner_id_idx on public.notices(owner_id);
create index if not exists jobs_owner_id_idx on public.jobs(owner_id);
create index if not exists lost_found_owner_id_idx on public.lost_found(owner_id);
create index if not exists comments_owner_id_idx on public.comments(owner_id);
create index if not exists post_reactions_post_id_idx on public.post_reactions(post_id);
create index if not exists comment_reactions_comment_id_idx on public.comment_reactions(comment_id);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index if not exists notifications_user_unread_idx on public.notifications(user_id, is_read) where is_read = false;
create index if not exists device_tokens_user_id_idx on public.device_tokens(user_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at before update on public.users
for each row execute function public.set_updated_at();

-- The backend uses the Supabase service-role key, so it performs authorization
-- in the API using owner_id. RLS remains enabled to prevent accidental public access.
alter table public.users enable row level security;
drop policy if exists users_no_anon_access on public.users;
create policy users_no_anon_access on public.users for all to anon using (false) with check (false);

-- These policies protect direct client access. The service role used by Render bypasses them.
do $$
declare t text;
begin
  foreach t in array array['services','posts','donors','blood_requests','notices','jobs','lost_found','comments','post_reactions','comment_reactions','notifications','device_tokens'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_no_anon_access', t);
    execute format('create policy %I on public.%I for all to anon using (false) with check (false)', t || '_no_anon_access', t);
  end loop;
end $$;

-- Existing rows are intentionally left with owner_id NULL. They remain publicly readable,
-- but cannot be edited or deleted by any account until an administrator assigns ownership.
