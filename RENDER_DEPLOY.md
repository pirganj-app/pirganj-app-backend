# Render deployment guide

1. Extract `pirganj-backend-render.zip` and upload the folder to a GitHub repository, or connect the repository directly in Render.
2. In Render, choose **New + → Web Service** and select the repository.
3. Use Node runtime. Build command: `pnpm install --frozen-lockfile && pnpm build`. Start command: `pnpm start`. Health check path: `/api/health`.
4. Add the environment variables shown in `.env.example`. Never paste secrets into chat or commit them to GitHub. Render can generate `JWT_SECRET` automatically.
5. Deploy the service and wait for a healthy status.
6. Test `https://YOUR-RENDER-SERVICE.onrender.com/api/health`. A successful response contains `success: true` and `status: "ok"`.
7. Send me only the public base URL, for example `https://pirganj-api.onrender.com`. Do not send your Render password, database password, or API keys.

The backend database schema is already in `drizzle/schema.ts`, and the reviewed SQL migration is in `drizzle/0001_violet_thunderbird.sql`. The current project was built against the managed MySQL-compatible database. If you switch to Supabase PostgreSQL, the schema dialect and migration require a separate migration pass before production use.
