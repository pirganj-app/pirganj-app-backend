# Render + Supabase deployment guide

## 1. Create the Supabase database

Create a Supabase project. Open **SQL Editor**, paste the complete contents of `supabase/schema.sql`, and run it once. This creates the Pirganj PostgreSQL enums, tables, indexes, triggers and initial service categories.

## 2. Copy the database connection string

In Supabase, open **Connect** and copy a PostgreSQL connection string. For a Render web service, use the Supabase pooler connection string when the dashboard recommends it. Put the real string in Render as `DATABASE_URL`; never commit it to GitHub.

## 3. Deploy the Render service

Choose **New + → Web Service** and select the GitHub repository. Use:

- Runtime: Node
- Build command: `pnpm install --frozen-lockfile && pnpm build`
- Start command: `pnpm start`
- Health check path: `/api/health`

The `render.yaml` file in this repository contains the same settings.

## 4. Add environment variables

Use `ENV_TEMPLATE.txt` as the reference. Required values are `NODE_ENV`, `DATABASE_URL`, `DATABASE_SSL`, `DB_POOL_MAX`, `JWT_SECRET`, `VITE_APP_ID`, `OAUTH_SERVER_URL`, `OWNER_OPEN_ID`, `BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY`. Render can generate `JWT_SECRET` automatically. Do not send any secret values through chat.

## 5. Verify deployment

After Render reports a healthy service, open:

```text
https://YOUR-RENDER-SERVICE.onrender.com/api/health
```

The response should contain `success: true` and `status: "ok"`. Then test `/api/categories` and `/api/services?limit=3`.

## 6. Send only the public URL

After successful verification, send only the public service URL, for example `https://pirganj-api.onrender.com`. The mobile app can then be updated to use that URL as its API base. Do not send passwords, database passwords, API keys or service-role keys.
