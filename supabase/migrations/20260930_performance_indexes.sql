-- Query indexes for public feeds, filters, ownership pages and reaction/comment lookups.
-- Apply this migration in Supabase before production traffic increases.

create index if not exists services_status_created_idx on public.services(status, created_at desc);
create index if not exists services_category_status_created_idx on public.services(category, status, created_at desc);
create index if not exists posts_status_created_idx on public.posts(status, created_at desc);
create index if not exists posts_tag_status_created_idx on public.posts(tag, status, created_at desc);
create index if not exists donors_available_created_idx on public.donors(available, created_at desc);
create index if not exists donors_group_available_created_idx on public.donors(blood_group, available, created_at desc);
create index if not exists blood_requests_status_created_idx on public.blood_requests(status, created_at desc);
create index if not exists blood_requests_group_status_created_idx on public.blood_requests(blood_group, status, created_at desc);
create index if not exists notices_status_created_idx on public.notices(status, created_at desc);
create index if not exists jobs_status_created_idx on public.jobs(status, created_at desc);
create index if not exists lost_found_status_created_idx on public.lost_found(status, created_at desc);
create index if not exists comments_post_created_idx on public.comments(post_id, created_at desc);

-- Trigram indexes make the service search endpoint scale better than a full scan.
create extension if not exists pg_trgm;
create index if not exists services_name_trgm_idx on public.services using gin (name gin_trgm_ops);
create index if not exists services_category_trgm_idx on public.services using gin (category gin_trgm_ops);
create index if not exists services_location_trgm_idx on public.services using gin (location gin_trgm_ops);
