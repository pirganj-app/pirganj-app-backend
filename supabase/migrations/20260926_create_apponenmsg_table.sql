-- Public API reads the latest visible startup announcement with the service role.
create extension if not exists pgcrypto;

create table if not exists public.apponenmsg (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Pirganj',
  html_content text not null default '',
  visible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists apponenmsg_visible_updated_idx
  on public.apponenmsg(visible, updated_at desc);

alter table public.apponenmsg enable row level security;
drop policy if exists apponenmsg_no_anon_access on public.apponenmsg;
create policy apponenmsg_no_anon_access
  on public.apponenmsg for all to anon using (false) with check (false);

drop trigger if exists apponenmsg_set_updated_at on public.apponenmsg;
create trigger apponenmsg_set_updated_at
  before update on public.apponenmsg
  for each row execute function public.set_updated_at();
