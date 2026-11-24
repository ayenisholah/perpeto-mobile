# Mobile Progress

## Snapshot

- **Roadmap:** re-baselined by DEC-0015 on 2026-11-22.
- **Milestone:** M1 done. M2, live-data paper trading, is next on the backend. The mobile M3 work (hosted web demo, viewer UX) follows.
- **CI:** Mobile CI and iOS TestFlight were green on `main` at `2a52154` (2026-07-30).
- **Drift check:** the scheduled Shared Document Drift check has failed daily since at least 2026-09-24, because backend shared documents were ahead of the mobile copies. The backend re-baseline sync should clear it.
- **Last local verification:** 2026-11-22, on the design-system branch: lint, typecheck and 80 tests pass.

## M1 — Foundations (done)

- **Platform:** Expo SDK 57, React Native 0.86, expo-router, plus documentation, CI, branch protection, API-update, shared-document drift and iOS TestFlight automation.
- **Authentication:** native Apple and Google entry points, a fail-closed authentication state machine, bootstrap, pending, MFA and recovery flows, Secure Store refresh rotation, and identity, session, logout and deletion management.
- **Navigation and design:** five bottom tabs (Home, Scanner, Strategies, Positions, More) with Portfolio, Exchanges, Alerts, Health and Security behind More. A shared component library and the AgentFloor (Settle) dark design system, with a WCAG contrast test.
- **Feature screens:** scanner and opportunity detail, positions, strategies, emergency controls with `HoldToConfirm`, portfolio and PnL, health, alerts, and a masked Exchanges surface with sandbox previews and reconciliation reads.
- **API client:** consumes the vendored `@ayenisholah/perpeto-api-client@0.22.0`. Decimals stay strings and are converted only for display.
- **Delivery:** automated iOS delivery; `0.2.0 (14)` was submitted to App Store Connect on 2026-07-20.

## Implemented hardening (kept, flag-gated)

The following surfaces sit behind `EXPO_PUBLIC_PASSKEYS_ENABLED` and `EXPO_PUBLIC_AUDIT_ENABLED`, off by default:
- passkeys;
- credential enrollment, rotation, revocation and deletion;
- preflight;
- the pilot card;
- the audit "Recent activity" card.

## Open items by milestone

- **M2:** freshness and stale-feed presentation for live public data.
- **M3:** hosted web build; demo-viewer entry, badge and read-only enforcement; TestFlight tester availability; the accessibility pass; the brand mark recoloured to the new palette.
- **M4:** verify Exchanges against testnet and demo accounts and capture evidence screenshots.

## Next tasks

1. After the backend re-baseline merges, merge the shared-document sync and confirm the drift check is green.
2. M2: wire live-data freshness into the scanner, opportunity detail, Home and Health.
3. M3: build the demo-viewer mode and the hosted web export.
