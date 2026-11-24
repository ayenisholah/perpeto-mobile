# Mobile Implementation Plan

## Current objective

Support M2, live-data paper trading, and then deliver the mobile half of M3, the public demo (DEC-0015). The app is an operations and monitoring client for a single-operator reference system. It never runs trading logic or holds exchange credentials, and LIVE is permanently fail-closed.

## M2 — Live-data paper trading

The backend adds live public data; the client mainly has to show it honestly.

1. Show per-leg data freshness and source on the scanner, opportunity detail and Home, using the existing `FreshnessBadge`.
2. Show stale-feed and venue-feed failures from `/health`. Make it clear that entries are blocked on stale legs rather than silently filled.
3. Pin any additive API client version through `scripts/record-api-client-update.mjs`.

## M3 — Public demo

1. **Hosted web build:** a production web export (`expo export --platform web`) pointed at `https://api.perpeto.xyz`. The current web session store refuses to run outside a development bundle because `localStorage` is not secure storage. So the hosted build supports only the read-only demo viewer, which holds no privileged session.
2. **Demo viewer UX (DEC-0017):** a "View demo" entry on sign-in. A persistent "Read-only demo" badge in the shell. Every mutating control hidden or disabled with an explanation. Covered by a test that viewer mode renders no enabled mutation.
3. **TestFlight:** confirm the existing iOS workflow still delivers from `main`, and record tester availability.
4. **Evidence:** a smoke run of the hosted web build against staging, and an accessibility pass on the five tabs at 200% text.

## M4 — Testnet execution

No new surfaces are required. The Exchanges screen already shows masked venue accounts, sandbox order previews and submission, connector orders and reconciliation. M4 verifies those screens against the operator's testnet and demo accounts, and captures screenshots for the evidence record.

## Implemented hardening (kept, flag-gated)

Passkeys, credential enrollment, preflight, pilot arming and the audit card stay behind `EXPO_PUBLIC_PASSKEYS_ENABLED` and `EXPO_PUBLIC_AUDIT_ENABLED`, both off by default. They are maintained, not extended. The native passkey ceremony needs an EAS development build and is optional.

## Boundary rules

- Generated API types are authoritative, and decimals stay strings, converted for display only.
- Mutations are unavailable offline, on stale state, with an incompatible client, or without server authorization.
- Biometrics may unlock the app but never replace server-side step-up.

## Deferred (DEC-0018)

- DEX signer approval UI
- Treasury and rebalancing screens
- Telegram/Discord settings
- Light theme
- Android delivery
- Public app-store release
- Any real-money live control
