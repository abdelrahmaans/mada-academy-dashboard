# Mada Mobile (`@mada/mobile`)

Expo Router + TypeScript starter inside the existing pnpm workspace. The first enabled native surface is the R04 instructor shell; the identity and authorization layer recognizes the full Mada role catalog and fails closed for mobile surfaces that are not implemented yet.

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

- `src/app/`: Expo Router screens and layouts; `(instructor)` is the first enabled role surface.
- `src/auth/`: session provider, identity types, and SecureStore-backed token persistence.
- `src/api/`: typed API client, refresh single-flight, and normalized API errors.
- `src/authorization/`: canonical role catalog, permission predicates, and route policy.
- `src/components/`: reusable native layout, state, button, and route-guard components.
- `src/theme/`: Mada design tokens mapped to React Native styles.

## Authentication and role rules

1. Login selects only the backend `accountType` (`staff`, `parent`, or `student`); it never lets the person choose or assert a role.
2. The app stores access/refresh tokens with `expo-secure-store`, calls `GET /api/v1/me`, and reads the active role, scope, and permission keys from the authenticated response.
3. The API is authoritative for every action and record scope. Hiding a tab or blocking a route is defense-in-depth UX, not authorization.
4. The current backend returns one active membership in `/me`; it does not expose a membership-switch endpoint. If an account has multiple role memberships, role switching must wait for an explicit backend contract. The app does not guess or locally switch roles.
5. R00–R09 are recognized; only R04 has mobile screens enabled in this starter. Other roles receive a clear unavailable state rather than seeing another role's screens or fake/demo data.

## Verification

```bash
pnpm --filter @mada/mobile typecheck
pnpm test
```

## SDK references

- [Expo SDK 57 reference](https://docs.expo.dev/versions/v57.0.0/)
- [Expo Router in SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/router/)
- [SecureStore in SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/securestore/)
- [Expo Router authentication guide](https://docs.expo.dev/router/advanced/authentication/)
- [Expo localization and RTL guide](https://docs.expo.dev/guides/localization/)
