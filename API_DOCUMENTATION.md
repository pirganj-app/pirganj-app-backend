# Pirganj REST API

Base URL: `https://3000-iyes8mjflpxi9amnci46l-9b6bfd30.us4.manus.computer/api`

All successful responses use `{ "success": true, "data": ... }` unless noted. Errors use `{ "success": false, "message": "..." }`. The mobile app should show the Bangla `message` value instead of raw server errors.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/health` | Public | Checks that the server is alive. |
| GET | `/app-version` | Public | Returns the latest published version and force-update settings. |
| GET | `/categories` | Public | Lists active service categories. |
| GET | `/services?page=1&limit=20&category=1&search=` | Public | Returns paginated published services. |
| GET | `/services/:id` | Public | Returns a service and visible reviews. |
| GET | `/posts?page=1&limit=20&category=` | Public | Returns paginated published community posts. |
| GET | `/blood-donors?bloodGroup=O%2B&area=Pirganj` | Public | Lists available matching donors. |
| GET | `/emergency-requests` | Public | Lists open emergency requests. |
| GET | `/notifications` | Authenticated | Returns global and user-specific notifications. |
| GET | `/admin/dashboard` | Admin | Returns protected management counts. |

Pagination responses include `pagination.page`, `pagination.limit` and `pagination.hasMore`. Service `averageRating` is returned as a number. Post `imageUrls` is returned as an array even though it is stored as JSON text in the database.

## Version policy

The app compares `versionCode` and `minimumVersionCode` with its installed version. When `forceUpdate` is enabled and the installed code is below the minimum, the app shows a blocking Bangla update screen. When a newer version exists but force update is disabled, the app shows a soft update banner. A temporary network failure does not lock the user out.

## Authentication

The server authenticates protected requests through the configured Manus session. Admin routes additionally require `user.role === 'admin'`. The mobile app can browse public data without login. Account-bound creation and mutation routes should be added behind `protectedProcedure` or a corresponding authenticated REST middleware before release.

## External credentials still required

Firebase Cloud Messaging, Supabase storage, a permanent Render URL, and the Netlify APK release website require project-specific credentials or hosting accounts. The current implementation leaves those secrets out of source code.

## References

[1]: https://expressjs.com/ "Express documentation"
[2]: https://orm.drizzle.team/docs/overview "Drizzle ORM documentation"
