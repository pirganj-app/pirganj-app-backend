-- Keep activity audit records limited to user, named event, IP and timestamp.
-- Routes, request metadata, status and user-agent details are intentionally cleared.
update public.activity
set method = null,
    path = null,
    status = null,
    metadata = '{}'::jsonb,
    user_agent = null;
