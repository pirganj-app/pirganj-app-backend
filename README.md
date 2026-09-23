# Pirganj Backend

**Pirganj – আপনার এলাকার তথ্যসেবা**-এর backend foundation এখানে রাখা হয়েছে। এটি Express-এর উপর চলা একটি typed server, যেখানে database schema, public REST API, authentication-aware notification access এবং admin dashboard shell রয়েছে।

## Current public URL

Development deployment URL: `https://3000-iyes8mjflpxi9amnci46l-9b6bfd30.us4.manus.computer`

The mobile app currently uses the following API base URL:

`https://3000-iyes8mjflpxi9amnci46l-9b6bfd30.us4.manus.computer/api`

This is a sandbox-hosted URL for the current session. A permanent Render deployment requires a Render service and its own environment variables.

## Implemented backend scope

The database schema includes users, categories, services, posts, comments, reactions, reviews, blood donors, emergency requests, notification tokens, notifications, reports, password recovery requests and app versions. The public API exposes health, app version, categories, services, posts, blood donors, emergency requests and authenticated notifications. The admin dashboard endpoint is protected by the server-side admin role.

The server accepts CORS requests for the mobile client and returns simple Bangla error messages for protected endpoints. It does not expose database credentials to the mobile app.

## Local development

```bash
pnpm install
pnpm check
pnpm test
pnpm build
pnpm dev
```

The database URL is provided through the managed project environment. For a separate deployment, set `DATABASE_URL`, `JWT_SECRET`, `VITE_APP_ID`, `OAUTH_SERVER_URL`, `OWNER_OPEN_ID`, `BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY` in the server environment. Do not commit `.env` files.

## Schema changes

The TypeScript schema lives in `drizzle/schema.ts`. Generate migrations with `pnpm drizzle-kit generate`, review the generated SQL, and apply the reviewed SQL to the target database. The current managed database contains the Pirganj tables and indexes described in [DATABASE.md](./DATABASE.md).

## Deployment note

The current session provides a public sandbox URL rather than a direct Render deployment connector. To deploy on Render, create a Node service that runs `pnpm build && pnpm start`, provide the environment variables above, and point the mobile app's `API_BASE_URL` to the permanent Render URL.

## Related documents

- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- [DATABASE.md](./DATABASE.md)
- [TEST_REPORT.md](./TEST_REPORT.md)
