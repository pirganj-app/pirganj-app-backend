# Render environment variables

Add these values in Render's Environment tab. Do not commit the real values.

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Your MySQL-compatible managed database URL. |
| `JWT_SECRET` | A long random secret; Render can generate it. |
| `VITE_APP_ID` | Your Manus application ID. |
| `OAUTH_SERVER_URL` | `https://api.manus.im` unless your OAuth setup specifies another URL. |
| `OWNER_OPEN_ID` | The owner open ID used for the first admin account. |
| `BUILT_IN_FORGE_API_URL` | Your configured built-in API URL. |
| `BUILT_IN_FORGE_API_KEY` | Your configured built-in API key. |

Do not send any of these secret values through chat. After deployment, send only the public Render service URL.
