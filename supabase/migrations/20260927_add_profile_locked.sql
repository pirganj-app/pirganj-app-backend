alter table public.users
  add column if not exists profile_locked boolean not null default false;
