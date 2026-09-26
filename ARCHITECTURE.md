# Pirganj Backend Architecture

## Runtime topology

```text
Flutter Android app
        │ HTTPS /api/*
        ▼
Render Express web service
  ├─ JWT auth and ownership checks
  ├─ content/comment/reaction REST API
  ├─ Supabase data access
  ├─ Supabase Storage image uploads
  └─ Firebase Admin FCM delivery
        ├──────────────► Supabase Postgres
        ├──────────────► Supabase Storage
        └──────────────► Firebase Cloud Messaging
```

## Source layout

- `src/server.js`: Express application, CORS, JSON parsing, error handling, and `/api` route mounting.
- `src/api.js`: REST endpoints, validation, authentication middleware, content creation, comment/reaction notifications, and notification deletion.
- `src/auth.js`: JWT registration/login, user profile data, and ownership operations.
- `src/store.js`: Supabase queries and mapping for services, posts, donors, blood requests, notices, jobs, lost/found records, comments, and reactions.
- `src/notifications.js`: notification persistence, unread counts, read state, delete/delete-all, all-user fan-out, and comment-to-post resolution.
- `src/push.js`: FCM Admin initialization, device-token registration/removal, and push delivery.
- `src/storage.js`: Supabase Storage bucket setup, image upload, public URL creation, and old-image cleanup.
- `supabase/schema_auth_ownership.sql`: reproducible schema and policies for auth-owned records, notifications, device tokens, and image metadata.
- `render.yaml`: Render deployment configuration and secret declarations.

## API contract

All routes are versionless and mounted under `/api`:

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET/PUT /api/auth/me`
- `GET/POST /api/posts`
- `GET/POST /api/posts/:id/comments`
- `GET/POST /api/posts/:id/reactions`
- `GET/POST /api/blood-requests`
- `GET/POST /api/lost-found`
- `GET/POST /api/notices`
- `GET/POST /api/jobs`
- `GET/POST /api/donors`
- `GET/POST /api/services`
- `GET /api/notifications`
- `PUT /api/notifications/read-all`
- `DELETE /api/notifications` and `DELETE /api/notifications/:id`
- `POST/DELETE /api/devices/push-token`

## Notification architecture

When a user creates a post, blood request, lost/found record, service, donor record, notice, or job:

1. The content row is inserted into Supabase.
2. `notifyAllUsers` creates in-app notifications for all other users.
3. Each notification triggers an FCM send to that user's registered device tokens.
4. Comment, reply, and reaction notifications resolve the parent post ID so the client can open the correct post detail page.
5. The client refreshes unread state from FCM events instead of periodic polling.

FCM delivery failures are logged without failing the underlying content or in-app notification write.

## Image pipeline

1. The Flutter client compresses selected images to JPEG before upload.
2. The API accepts only image MIME types and enforces a 2MB request limit.
3. `src/storage.js` uploads to the configured public Supabase bucket with long cache control.
4. Profile/post replacement and deletion clean up old Storage objects where ownership allows it.
5. Image URLs are stored with the owning profile or post record.

## Deployment and secrets

The Render service should define these environment variables without committing their values:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `JWT_SECRET`
- `FIREBASE_SERVICE_ACCOUNT_JSON`
- `SUPABASE_IMAGE_BUCKET`
- `CORS_ORIGINS`
- `NODE_ENV=production`

Render Free is suitable for MVP/testing only: it uses one low-resource instance, sleeps after inactivity, and has monthly instance-hour/bandwidth limits. Supabase and Firebase credentials must be rotated if exposed.

## Verification

- `npm test` passes.
- `node -e "require('./src/server')"` loads the Express server successfully.
- Flutter client tests and the arm64 release build are validated in the app repository.
