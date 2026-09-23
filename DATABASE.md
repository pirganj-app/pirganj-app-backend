# Pirganj Database

The current managed project uses Drizzle ORM with a MySQL-compatible database. The schema is defined in `drizzle/schema.ts`; it is intentionally accessed through the server rather than directly from the mobile app.

## Core tables

| Table | Role |
|---|---|
| `users` | Auth identity, profile fields, role and posting restriction state. |
| `categories` | Admin-managed service categories. |
| `services` | Public local directory entries and moderation status. |
| `posts` | Community feed, lost-and-found fields, pin state and moderation status. |
| `comments` | Post comments and replies through `parentId`. |
| `reactions` | One reaction per user per post. |
| `reviews` | One review per user per service and a 1–5 rating value. |
| `bloodDonors` | Blood group, area, availability and contact data. |
| `emergencyRequests` | Blood and other urgent requests. |
| `notificationTokens` | Device token metadata for future FCM delivery. |
| `notifications` | Global or user-specific notification history. |
| `reports` | Moderation reports with open, dismissed and resolved states. |
| `passwordRecoveryRequests` | Recovery workflow metadata without storing old passwords. |
| `appVersions` | Published APK version, minimum code and force-update policy. |

## Important constraints

`users.openId`, `users.phone` and `users.username` are unique. The database uses a case-insensitive collation for normal username uniqueness; the backend should also normalize usernames to lowercase before any future phone/password registration route is enabled. `reactions` enforces one reaction per user per post, `reviews` enforces one review per user per service, and `bloodDonors` enforces one donor profile per user.

The schema stores media references rather than file bytes. Profile, service and post images should be uploaded to object storage after validating type and size, then the resulting URL should be stored in the relevant record.

## Migration state

The current managed database was inspected before migration and contained the starter `users` table. The Pirganj tables, profile columns, unique constraints and indexes were then applied. No test rows were inserted through the migration workflow.

## References

[1]: https://orm.drizzle.team/docs/sql-schema-declaration "Drizzle schema declaration documentation"
[2]: https://dev.mysql.com/doc/refman/8.0/en/create-table.html "MySQL CREATE TABLE documentation"
