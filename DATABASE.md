# Pirganj Database

The final backend uses **Supabase PostgreSQL** through Drizzle ORM and the `pg` driver. The mobile app never connects directly to Supabase. It calls the backend API, and the backend keeps `DATABASE_URL` server-side.

## Setup

Run the complete `supabase/schema.sql` file once in the Supabase SQL Editor. It creates the application enums, tables, indexes, timestamp triggers and starter service categories. The same model is represented in `drizzle/schema.ts` and can be used for future migrations.

For Render, copy the PostgreSQL string from Supabase **Connect** into `DATABASE_URL`. Use the Supabase pooler connection string when Supabase recommends it for external services. Keep SSL enabled with `DATABASE_SSL=true`.

## Core tables

| Table | Role |
|---|---|
| `users` | Auth identity, profile fields, role and posting restriction state. |
| `categories` | Admin-managed service categories. |
| `services` | Public local directory entries and moderation status. |
| `posts` | Community feed, lost-and-found fields, pin state and moderation status. |
| `comments` | Post comments and replies through `parent_id`. |
| `reactions` | One reaction per user per post. |
| `reviews` | One review per user per service and a 1–5 rating value. |
| `blood_donors` | Blood group, area, availability and contact data. |
| `emergency_requests` | Blood and other urgent requests. |
| `notification_tokens` | Device token metadata for future FCM delivery. |
| `notifications` | Global or user-specific notification history. |
| `reports` | Moderation reports with open, dismissed and resolved states. |
| `password_recovery_requests` | Recovery workflow metadata without storing old passwords. |
| `app_versions` | Published APK version, minimum code and force-update policy. |

## Important constraints

The SQL script enforces case-insensitive username uniqueness, optional phone uniqueness, one reaction per user per post, one review per user per service and one donor profile per user. It also adds foreign keys with safe delete behavior for related content.

The schema stores media references rather than file bytes. Profile, service and post images should be uploaded to Supabase Storage or another object store after validating type and size; only the resulting URL should be stored in the application table.

## Security

Do not enable broad anonymous write access in Supabase for these tables. The backend should remain the write boundary, with admin and authenticated checks applied in the API. Never put `DATABASE_URL` or a Supabase service-role key inside the mobile app.

## References

[1]: https://supabase.com/docs/guides/database/connecting-to-postgres "Supabase PostgreSQL connection documentation"
[2]: https://supabase.com/docs/guides/database/connection-management "Supabase connection management documentation"
[3]: https://orm.drizzle.team/docs/get-started-postgresql "Drizzle PostgreSQL documentation"
