create table if not exists public.app_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

insert into public.app_config (key, value)
values
  ('app_version', '1.0.0'),
  ('apk_download_url', 'https://pirganj-app.netlify.app/apk')
on conflict (key) do nothing;

alter table public.app_config enable row level security;
drop policy if exists app_config_no_anon_access on public.app_config;
create policy app_config_no_anon_access
  on public.app_config for all to anon using (false) with check (false);
