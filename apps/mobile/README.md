# Mada Mobile (`@mada/mobile`)

Expo Router + TypeScript inside the existing pnpm workspace. The first enabled mobile surface is the R04 instructor shell; the identity and authorization layers recognize the full Mada role catalog and fail closed for roles whose mobile surfaces are not implemented.

## Install and run

From the repository root:

```bash
pnpm install
cp apps/mobile/.env.example apps/mobile/.env.local
# Edit EXPO_PUBLIC_API_URL for your runtime, then:
pnpm --filter @mada/mobile start
```

- Android Emulator: `http://10.0.2.2:4191/api/v1`
- iOS Simulator: `http://127.0.0.1:4191/api/v1`
- Physical device: use a reachable LAN HTTPS/dev API address, not `localhost`.

For native development builds, use Expo Go only if the current SDK and installed native modules are supported; otherwise create an EAS/development build. iOS native builds require macOS or a remote EAS build service.

The UI is Arabic-first and applies RTL direction in the screen layout. For SDK 57, verify navigation on an Arabic-configured device/development build; Expo Go can differ from a native build for RTL behavior. Do not add an unrecognized `supportsRTL` field to app config.

## Structure

- `src/app/`: Expo Router screens and layouts; `(instructor)` is the first enabled role surface. Keep routes thin.
- `src/api/`: typed API client, refresh single-flight, and normalized API errors.
- `src/auth/`: session provider, identity types, and SecureStore-backed token persistence.
- `src/authorization/`: canonical role catalog, permission predicates, and route policy.
- `src/components/`: shared native layouts, `MadaText`, state, button, and route-guard components.
- `src/theme/`: Mada tokens, local font assets, and typography family mapping.
- `src/features/`: domain modules include `sessions/` for live sessions, attendance, and evaluations; add notifications UI and other flows here when implemented.

## Visual contract

`packages/mada-tokens/tokens.css` and `client/src/components/MadaTheme.css` are the web reference. `src/theme/tokens.ts` mirrors their colors, spacing, radius, and shadow values; update both sides together when the design system changes.

Arabic uses locally bundled Cairo; Latin text and technical identifiers use Inter. `src/app/_layout.tsx` loads the font assets before rendering the navigation tree. All interface copy uses `src/components/MadaText.tsx`, which maps text weight to the corresponding font face. Use `MadaText` rather than importing React Native `Text` directly. Keep Arabic layouts RTL and set phone numbers, IDs, and other LTR values explicitly to Inter.

Home, Schedule, and Tasks now use live `GET /sessions` data within a bounded date window. Home highlights a nearby session and the actions permitted for it; Tasks lists available session actions but is not a backend-confirmed task queue. Do not invent due-work counts or notification badges. Attendance and Evaluations use their typed backend contracts, with the backend remaining authoritative for permission and assignment checks.

## Authentication and role rules

1. The first mobile login sends `accountType: "staff"` internally and does not expose a role selector. `accountType` is an authentication path, not the user's role.
2. The app calls `GET /api/v1/me` and reads active role, scope, and permission keys from the authenticated response. No role, scope, or permission is inferred locally.
3. The API authorizes every action and record scope. Hiding a tab or blocking a route is defense-in-depth UX, not authorization.
4. The current backend returns one active membership in `/me`; it does not expose a membership-switch endpoint. Do not implement local role switching.
5. R00–R09 are recognized, but only R04 has mobile screens enabled in this starter. Other roles receive an unavailable state rather than another role's screens or fake/demo data.
6. Keep refresh credentials in `expo-secure-store`; do not log passwords/tokens or store them in unencrypted AsyncStorage.

## Verification

```bash
pnpm --filter @mada/mobile lint
pnpm --filter @mada/mobile typecheck
pnpm test
pnpm check
pnpm build
pnpm --filter @mada/mobile exec expo install --check
```

## EAS build profiles

`eas.json` defines three profiles: `development` builds an internal custom development client, `preview` builds an internal Android APK, and `production` builds store-ready artifacts with remotely managed build numbers. The development profile uses `expo-dev-client`.

Before the first EAS build, link this app to the intended Expo project so its real project ID is added to `expo.extra.eas.projectId`. Set `EXPO_PUBLIC_API_URL` in the matching EAS `development`, `preview`, or `production` environment. This value is embedded in the client and must point to the correct reachable API, but must never contain credentials or server secrets. No Expo project ID, EAS credential, or staging API URL is configured in this repository yet; do not start a cloud build until those are set and verified. Production signing/submission and official launcher branding remain separate release prerequisites.

After navigation, typography, or native-module changes, export both platforms and review RTL and font loading:

```bash
pnpm --filter @mada/mobile exec expo export --platform android --output-dir /tmp/mada-mobile-android
pnpm --filter @mada/mobile exec expo export --platform ios --output-dir /tmp/mada-mobile-ios
```

## SDK references

- [Expo SDK 57 reference](https://docs.expo.dev/versions/v57.0.0/)
- [expo-font in SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/font/)
- [Expo Fonts guide](https://docs.expo.dev/develop/user-interface/fonts/)
- [Expo Router in SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/router/)
- [SecureStore in SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/securestore/)
- [Expo Router authentication guide](https://docs.expo.dev/router/advanced/authentication/)
- [Expo localization and RTL guide](https://docs.expo.dev/guides/localization/)
- [Cairo font package](https://www.npmjs.com/package/@expo-google-fonts/cairo)
- [Inter font package](https://www.npmjs.com/package/@expo-google-fonts/inter)
