# Pirganj Backend

**Pirganj – আপনার এলাকার তথ্যসেবা**-এর Supabase PostgreSQL-ready backend এখানে রাখা হয়েছে। এটি Express, Drizzle ORM এবং the `pg` driver ব্যবহার করে Supabase PostgreSQL-এর সঙ্গে সংযুক্ত হয়। Mobile app কখনো সরাসরি database-এ সংযোগ করে না; সব request server API-এর মাধ্যমে যায়।

## Production setup order

1. Create a Supabase project.
2. Run `supabase/schema.sql` once in the Supabase SQL Editor.
3. Copy the Supabase PostgreSQL connection string from **Connect**.
4. Add the values from `ENV_TEMPLATE.txt` to Render Environment Variables.
5. Deploy with the commands in `RENDER_DEPLOY.md`.
6. Test `https://YOUR-RENDER-SERVICE.onrender.com/api/health`.
7. Send only the public Render URL to update the mobile app.

## API scope

The backend exposes public health, app-version, categories, services, posts, blood donors and emergency request endpoints. Authenticated notifications and the admin dashboard endpoint are protected server-side. The Bengali admin dashboard is included as a management foundation.

## Local commands

```bash
pnpm install
pnpm check
pnpm test
pnpm build
pnpm dev
```

## Database files

- `drizzle/schema.ts` is the PostgreSQL Drizzle schema used by the application.
- `supabase/schema.sql` is the one-time SQL script for Supabase SQL Editor.
- `ENV_TEMPLATE.txt` lists the required environment variables without real secrets.

## Security

Never upload `.env`, Supabase service-role keys, database passwords or Firebase private keys to GitHub. Use Render Environment Variables. Keep `DATABASE_URL` and all server secrets on the backend only.

## Documents

- [Render + Supabase deployment](./RENDER_DEPLOY.md)
- [API documentation](./API_DOCUMENTATION.md)
- [Database overview](./DATABASE.md)
- [Environment template](./ENV_TEMPLATE.txt)
- [Test report](./TEST_REPORT.md)
