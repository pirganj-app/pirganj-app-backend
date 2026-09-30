-- Keep activity audit records limited to user, named event and timestamp.
-- Routes, request metadata, status, IP and user-agent details are intentionally cleared.
update public.activity
set method = null,
    path = null,
    status = null,
    metadata = '{}'::jsonb,
    ip_address = null,
    user_agent = null;
