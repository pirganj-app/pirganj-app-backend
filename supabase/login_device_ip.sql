alter table public.login_devices
  add column if not exists ip_address text;

alter table public.login_devices
  add column if not exists total_failed_attempts integer not null default 0;

create index if not exists login_devices_ip_idx
  on public.login_devices(ip_address);
