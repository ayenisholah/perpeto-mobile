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

The API binds `0.0.0.0:8080` and the script prints the host's LAN URL. Put that in `.env.local` (gitignored) — **not** `localhost`, because on a physical device `127.0.0.1` is the phone:

```
EXPO_PUBLIC_API_URL=http://<host-lan-ip>:8080
```

Then `npm start` and open the project from Expo Go on a device sharing that network. Confirm connectivity by loading `http://<host-lan-ip>:8080/readyz` in the phone's browser first; if that fails, the cause is the network or a host firewall rather than the app.

Expo Go runs the JavaScript bundle only. Google/Apple sign-in and passkeys are native modules it does not include, so authenticated screens require an EAS development build (`eas build --profile development`). Keep `EXPO_PUBLIC_PASSKEYS_ENABLED` and `EXPO_PUBLIC_AUDIT_ENABLED` off under Expo Go. The local backend runs in PAPER mode, which serves no venue credentials and permits no external writes.

## Delivery

Pull requests run checks only. The app is linked to EAS project `@ayenisholah/signex-mobile`; successful `main` builds trigger the enabled iOS-only TestFlight workflow while its protected provider and automation configuration remains valid. The latest verified run submitted `0.2.0 (14)` to App Store Connect. Android delivery and production OTA channels are outside this slice. Follow [the credential and TestFlight runbook](docs/DEPLOYMENT.md).

No license has been granted yet. Until a license decision is recorded, all rights are reserved.
