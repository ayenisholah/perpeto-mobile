# Perpeto Mobile

Perpeto Mobile is the Expo iOS and Android operations client for the shared, multi-tenant Perpeto funding-rate arbitrage backend. It displays opportunities, execution state, risk, accounting, alerts, approvals, and system health. It never runs trading logic or stores exchange credentials.

## Current status

M2 paper features, their mobile monitoring surfaces and the lossless-decimal `0.15.0` client integration are implemented, but shared exit gates remain open for backend Rust/PostgreSQL and device evidence. M3 CEX integration is in progress. The app includes authentication, a session-derived personal-tenant summary, scanner, positions, strategies, emergency controls, portfolio/PnL, health, alerts, and a masked Exchanges tab with sandbox preview/submit and exact connector accounting/reconciliation reads. It never receives exchange credentials or enables production writes. See [PROGRESS.md](docs/PROGRESS.md).

## Authoritative documents

Read [PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md), [DECISION.md](docs/DECISION.md), [TRACEABILITY.md](docs/TRACEABILITY.md), [IMPLEMENTATION.md](docs/IMPLEMENTATION.md), and [ENGINEERING.md](docs/ENGINEERING.md) before changing behavior.

## Development

Requirements: Node.js 24 and npm 11.

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm start
```

Set `EXPO_PUBLIC_API_URL` to the paper backend URL. No mutation is permitted while data is stale, offline, or incompatible.

### Running against a local backend

Start the backend's PostgreSQL and Redis, then the API, from the `perpeto-backend` checkout:

```bash
docker compose -f deploy/compose/docker-compose.dev.yml up -d
bash scripts/dev-run-api.sh
```

If the first command reports `address already in use` on 5432, the usual cause is a second Docker daemon holding the port — see the local-development notes in the backend's `docs/DEPLOYMENT.md`.

The API binds `0.0.0.0:8080` and the script prints the host's LAN URL. PostgreSQL stays bound to `127.0.0.1`; the app never talks to it directly. Put that in `.env.local` (gitignored) — **not** `localhost`, because on a physical device `127.0.0.1` is the phone:

```
EXPO_PUBLIC_API_URL=http://<host-lan-ip>:8080
```

Then `npm start` and open the project from Expo Go on a device sharing that network. Confirm connectivity by loading `http://<host-lan-ip>:8080/readyz` in the phone's browser first; if that fails, the cause is the network or a host firewall rather than the app.

Expo Go runs the JavaScript bundle only. Google/Apple sign-in and passkeys are native modules it does not include, so real provider sign-in requires an EAS development build (`eas build --profile development`). Keep `EXPO_PUBLIC_PASSKEYS_ENABLED` and `EXPO_PUBLIC_AUDIT_ENABLED` off under Expo Go. The local backend runs in PAPER mode, which serves no venue credentials and permits no external writes.

### Development sign-in

To reach the authenticated screens from Expo Go without a native build, set both halves of the development sign-in (DEC-0014):

```
# perpeto-mobile/.env.local
EXPO_PUBLIC_DEV_AUTH_ENABLED=true
```
```
# perpeto-backend/deploy/dev.env
PERPETO_DEV_AUTH=true
```

The sign-in card then offers a development button that exchanges a synthetic identity token instead of a provider one. Restart the API and run `npx expo start --clear`, because Expo inlines `EXPO_PUBLIC_*` at bundle time.

**This substitutes provider identity verification — it is an authentication bypass.** The backend permits it in PAPER mode only and refuses to start if `PERPETO_DEV_AUTH` is set in any other mode. Both flags belong only in the gitignored local files above; never set either for a build that talks to a deployed backend.

### Running in a browser

When no Expo Go build supports this SDK on your device's iOS version, run the app as a web page instead:

```bash
npx expo start --web
```

This needs the backend's development CORS layer, since it otherwise sends no CORS headers and the browser blocks every call:

```
# perpeto-backend/deploy/dev.env
PERPETO_DEV_CORS_ORIGINS=http://localhost:8081,http://127.0.0.1:8081
```

Session storage falls back to `localStorage` on web, because `expo-secure-store` has no web implementation. That is **not** secure storage — any script on the origin can read it — so the web store refuses to run outside a development bundle. Web is for inspecting the app locally; iOS remains the delivery target, and `GlassSurface` degrades to a plain surface off iOS.

## Delivery

Pull requests run checks only. The app is linked to EAS project `@ayenisholah/signex-mobile`; successful `main` builds trigger the enabled iOS-only TestFlight workflow while its protected provider and automation configuration remains valid. The latest verified run submitted `0.2.0 (14)` to App Store Connect. Android delivery and production OTA channels are outside this slice. Follow [the credential and TestFlight runbook](docs/DEPLOYMENT.md).

No license has been granted yet. Until a license decision is recorded, all rights are reserved.
