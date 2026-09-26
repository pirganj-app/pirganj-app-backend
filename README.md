# Pirganj Backend

পীরগঞ্জ এলাকার স্থানীয় তথ্য, কমিউনিটি পোস্ট এবং জরুরি সেবা পরিচালনার জন্য এটি একটি **plain JavaScript Express.js REST API**। Backend Supabase PostgreSQL database ব্যবহার করতে পারে এবং Render-এ deploy করার জন্য প্রস্তুত। Flutter mobile app এই API থেকে service, donor, blood request, notice, job এবং lost/found data পড়ে ও নতুন data তৈরি করে।

> **Important:** This repository contains only the backend. The Flutter mobile application is maintained in the separate public repository: [pirganj-app](https://github.com/pirganj-app/pirganj-app).

## Project status

The current API is an MVP suitable for a small community application. It supports public read and create operations, Supabase persistence, automatic approval/publication for new content, CORS access for the mobile client, and a local seed-data fallback when Supabase credentials are not available.

Authentication, user ownership, edit/delete authorization, rate limiting, pagination, push notifications, and production-grade moderation are not yet implemented in this version. These limitations are documented so that the next developer can extend the system safely.

## Technology stack

- **Runtime:** Node.js 22 or compatible modern Node.js
- **Framework:** Express.js 4
- **Language:** Plain JavaScript with CommonJS modules
- **Database:** Supabase PostgreSQL through `@supabase/supabase-js`
- **Deployment:** Render Web Service
- **API style:** JSON REST under `/api`
- **Tests:** Node.js built-in test runner
- **Client:** Flutter app in the separate `pirganj-app` repository

No TypeScript, React, tRPC, or ORM is used in this backend.

## Repository structure

```text
.
├── src/
│   ├── server.js      # Express application, middleware, CORS, error handler
│   ├── api.js         # Versioned REST route definitions
│   ├── store.js       # Supabase queries, mapping, and seed fallback operations
│   └── supabase.js    # Supabase client configuration
├── test/
│   └── api.test.js    # Backend smoke and fallback tests
├── .env.example       # Required environment variable names
├── package.json        # Scripts and dependencies
├── package-lock.json   # Locked npm dependency versions
└── render.yaml         # Render deployment configuration
```

## Local development

### Requirements

Install Node.js 22 or a compatible current LTS release. Supabase credentials are optional for local smoke testing because the store has a seed-data fallback.

### Install and run

```bash
npm install
npm start
```

The server listens on the value of `PORT`, or port `10000` when `PORT` is not set.

For development with Node's file watcher:

```bash
npm run dev
```

The local API base URL is normally:

```text
http://localhost:10000/api
```

### Run tests

```bash
npm test
```

The tests verify that the Express app loads, seed data is available without Supabase credentials, and new local fallback content is immediately approved.

## Environment variables

Copy the example file before local configuration:

```bash
cp .env.example .env
```

Use the following values:

```env
PORT=10000
CORS_ORIGINS=*
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=keep-this-only-on-render
```

`SUPABASE_SERVICE_ROLE_KEY` is a server-side secret. Never place it in Flutter code, never commit it to GitHub, and never expose it in a public response. Configure it as a protected environment variable in Render.

The current server intentionally enables public CORS with `origin: '*'` because the mobile client and other approved public clients need to reach the API. CORS does not provide authentication or protect POST routes; authentication and authorization must be added separately when user accounts are introduced.

## API base URL and response format

The deployed Render base URL is:

```text
https://pirganj-app.onrender.com
```

The API prefix is:

```text
https://pirganj-app.onrender.com/api
```

Successful responses use this shape:

```json
{
  "success": true,
  "data": {}
}
```

Validation and server errors use a similar envelope with `success: false`. The health endpoint returns `200` when the Express process is running.

## REST endpoints

All routes below are relative to `/api`.

| Method | Route | Purpose |
|---|---|---|
| GET | `/health` | Service health and API version |
| GET | `/config` | App name, Android package, and locale |
| GET | `/overview` | Services, posts, donors, and notices overview |
| GET | `/services` | Approved services; supports `category` and `search` query parameters |
| GET | `/services/:id` | One approved service |
| POST | `/services` | Create a service; requires `name` and `category` |
| GET | `/posts` | Approved posts; supports the optional `tag` query parameter |
| POST | `/posts` | Create an automatically approved post |
| POST | `/posts/:id/like` | Increment a post like count |
| GET | `/posts/:id/comments` | List comments for a post |
| POST | `/posts/:id/comments` | Create a comment; requires `body` |
| GET | `/donors` | Available blood donors; supports the optional `group` query parameter |
| POST | `/donors` | Create a donor; requires `name`, `bloodGroup`, and `phone` |
| GET | `/blood-requests` | Open blood requests |
| POST | `/blood-requests` | Create a blood request; requires patient, blood group, hospital, and phone |
| GET | `/notices` | Published notices |
| POST | `/notices` | Create a published notice; requires `title` |
| GET | `/jobs` | Published jobs |
| POST | `/jobs` | Create a published job; requires `title` |
| GET | `/lost-found` | Published lost/found posts |
| POST | `/lost-found` | Create a published lost/found item; requires `title` |
| GET | `/search?q=` | Search services and posts |
| GET | `/admin/summary` | Basic content and member counts when Supabase is configured |

### Example requests

Health check:

```bash
curl https://pirganj-app.onrender.com/api/health
```

Read donors by blood group:

```bash
curl "https://pirganj-app.onrender.com/api/donors?group=O%2B"
```

Create a post:

```bash
curl -X POST https://pirganj-app.onrender.com/api/posts \
  -H 'Content-Type: application/json' \
  -d '{
    "author": "পীরগঞ্জবাসী",
    "title": "জরুরি স্থানীয় খবর",
    "body": "এখানে খবরের বিস্তারিত লেখা হবে।",
    "tag": "খবর"
  }'
```

Create a blood request:

```bash
curl -X POST https://pirganj-app.onrender.com/api/blood-requests \
  -H 'Content-Type: application/json' \
  -d '{
    "patientName": "রোগীর নাম",
    "bloodGroup": "B+",
    "hospital": "পীরগঞ্জ উপজেলা স্বাস্থ্য কমপ্লেক্স",
    "phone": "01700000000",
    "area": "পীরগঞ্জ সদর",
    "units": 2,
    "details": "জরুরি প্রয়োজন"
  }'
```

## Supabase setup

Create the project in Supabase, create the tables expected by `src/store.js`, and then set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the deployment environment. The repository deliberately does not contain database credentials or a secret key.

The store expects tables for services, posts, comments, donors, blood requests, notices, jobs, lost/found items, and profiles. The exact columns are visible in the insert and mapping functions in `src/store.js`. Existing rows are filtered by their public state, such as `approved`, `published`, `open`, or `available`.

If Supabase is not configured, the service automatically uses a small in-memory seed dataset. That fallback is useful for tests and development only. It is not persistent across process restarts and must not be treated as production storage.

## Render deployment

1. Push this repository to GitHub.
2. In Render, create a Web Service from the repository.
3. Use Node as the runtime.
4. Set the build command to `npm install --omit=dev`.
5. Set the start command to `npm start`.
6. Configure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as secret environment variables.
7. Keep the health check path as `/api/health`.
8. Confirm that the deployed URL responds before connecting the Flutter client.

The included `render.yaml` contains the same service configuration and uses Node.js 22.

## Current security and scalability notes

The current public API is intentionally simple. Before adding user-controlled edit/delete actions or exposing the service to a large audience, add Supabase Auth/JWT verification, server-side ownership checks, strict schema validation, rate limiting, pagination, database indexes, atomic like increments, structured logging, and monitoring. Do not trust an owner ID supplied by the Flutter client.

The current automatic approval behavior is intentional for the present requirement. A future moderation system should add a pending state for user submissions while preserving separate admin-only approval routes.

## Planned extensions

The next major backend extensions are Google/Supabase authentication, user ownership, edit and delete operations, device-token registration, Firebase Cloud Messaging for blood-request notifications, notification preferences, and background delivery retries. These features require database migrations and protected server-side routes; they are not enabled by the current public MVP API.

## Related repositories

- [Flutter mobile app](https://github.com/pirganj-app/pirganj-app)
- [Live API health endpoint](https://pirganj-app.onrender.com/api/health)

## License and contribution

This repository is maintained for the Pirganj community application. Before contributing, preserve the plain Express.js/CommonJS architecture, keep secrets out of Git, update tests for route changes, and document any database schema changes.

## বাংলা সংক্ষিপ্ত নির্দেশনা

এই repository-তে শুধু backend code আছে। নতুন developer প্রথমে `npm install` চালাবে, তারপর `.env`-এ Supabase credentials যোগ করে `npm start` চালাবে। Flutter app আলাদা repository-তে রাখা হয়েছে। নতুন feature যোগ করার সময় route `src/api.js`-এ, database operation `src/store.js`-এ এবং test `test/api.test.js`-এ যুক্ত করতে হবে।

অন্য user-এর data edit/delete চালু করার আগে অবশ্যই login, ownership এবং authorization যোগ করতে হবে।

## References

[1]: https://expressjs.com/ "Express.js documentation"
[2]: https://supabase.com/docs "Supabase documentation"
[3]: https://render.com/docs "Render documentation"
[4]: https://nodejs.org/api/test.html "Node.js test runner documentation"

For implementation details, consult the source files and the references above.

---

**Project:** Pirganj | **Backend:** Express.js | **Database:** Supabase | **Deployment:** Render

[1] [2] [3] [4]


## Account and ownership system

The API now requires an authenticated account for every create, update, and delete operation. Registration uses a phone number, password, name, sex, and address. Passwords are stored as bcrypt hashes and successful registration/login returns a bearer JWT. Set a strong random `JWT_SECRET` in Render; never use the local fallback secret in production.

Run the migration in [`supabase/schema_auth_ownership.sql`](supabase/schema_auth_ownership.sql) before enabling the production account flow. It creates the `users` table, stores the profile fields, adds `owner_id` to user-created resources, adds indexes, and blocks anonymous direct table access. The backend uses the Supabase service-role key and checks `owner_id` server-side, so a user can only edit or delete records that they created.

New account endpoints are `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `PUT /api/auth/me`, and `GET /api/profile/items`. Owned records can be changed or removed through `PUT /api/profile/items/:resource/:id` and `DELETE /api/profile/items/:resource/:id`. Send `Authorization: Bearer <token>` with all protected requests. Public read endpoints remain available. Donor and blood-request reads accept `?group=সব`, `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, or `O-`.

Required production environment variables are `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and a strong `JWT_SECRET`. Existing rows created before this migration have `owner_id = NULL`; they remain readable but cannot be edited or deleted by normal accounts until an administrator assigns ownership.
