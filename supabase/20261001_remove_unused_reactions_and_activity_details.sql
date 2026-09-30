-- Approved production cleanup.
-- Removes the unused legacy reactions table and activity detail columns.
-- Activity rows, named events, user IDs, IP addresses and timestamps remain.

drop table if exists public.reactions;

alter table if exists public.activity
  drop column if exists method,
  drop column if exists path,
  drop column if exists status,
  drop column if exists metadata,
  drop column if exists user_agent;
