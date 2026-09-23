# Pirganj Test Report

## Final result

The backend type check, REST regression test, existing authentication logout test and production build passed. The mobile app TypeScript check, Expo configuration validation and web export passed. The public backend health endpoint was verified through the public sandbox URL. The mobile export was served locally and inspected after the splash animation completed.

## Executed checks

| Area | Check | Result |
|---|---|---|
| Backend | `pnpm check` | Passed. |
| Backend | `pnpm test -- --run` | Passed: 2 files, 2 tests. |
| Backend | `pnpm build` | Passed. |
| Backend | `GET /api/health` | Passed with `{success:true,status:"ok"}`. |
| Backend | `GET /api/app-version` | Passed; no published version is configured yet. |
| Backend | `GET /api/services?limit=3` | Passed with an empty paginated result because no service rows exist yet. |
| Mobile | `pnpm exec tsc --noEmit` | Passed. |
| Mobile | `pnpm exec expo config --type public` | Passed; package is `com.pirganj.app`. |
| Mobile | `pnpm exec expo export --platform web` | Passed. |
| Mobile UI | Splash, Bengali home, quick cards, skeleton/empty states | Visually verified in the exported web preview. |

## Bugs found and fixed

The initial Expo TypeScript check rejected a generic string skeleton width because React Native expects a typed dimension value. The skeleton component was changed to use `DimensionValue`, after which the type check passed. The generated database migration initially contained a duplicate username uniqueness declaration; the schema was corrected before applying the reviewed database SQL.

## Not yet testable without external credentials

Firebase Cloud Messaging delivery, Supabase Storage uploads, phone/password registration, password recovery approval, user-submitted mutations, review moderation, Render deployment, Netlify APK hosting and release downloads require external service credentials and a permanent deployment environment. These are documented rather than simulated with fake success responses.

## Known limitations

This session could not create a second managed WebDev project after initializing the backend. Therefore the Android app source is delivered as a standalone Expo TypeScript project rather than as a second managed WebDev mobile project. The requested Flutter stack is not available in this session; the delivered native source uses Expo/React Native and retains the requested package identifier. The backend public URL is a session sandbox URL, not a permanent Render hostname.

## References

[1]: https://docs.expo.dev/ "Expo documentation"
[2]: https://vitest.dev/ "Vitest documentation"
