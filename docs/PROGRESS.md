# Mobile Progress

## Snapshot

- **Roadmap:** re-baselined by DEC-0015 on 2026-11-22. M1, M2 and M3 are done (M2 and M3 closed 2026-11-25); M4, testnet execution, is next.
- **Platforms:** this repository is the iOS client. The web platform, including the public live demo at `https://app.perpeto.xyz`, is the Next.js app in `perpeto-web` (DEC-0021).
- **Delivery:** EAS and TestFlight delivery stay paused (`EAS_TESTFLIGHT_ENABLED=false`) by choice; M3 closed without a TestFlight build.
- **API client:** vendored `@ayenisholah/perpeto-api-client@0.24.0`. The registry holds `0.25.0`, which adds only web sign-in types.
- **Shared documents:** synced by hand from backend `main` at `6ec1cf0` (version 9) on 2026-11-25. The automatic sync's cross-repository token has expired.
- **Last local verification:** 2026-11-24: lint, typecheck, 224 tests, `audit:deps` and `expo-doctor` pass.

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

- **M2 (done):** live public data flows through the existing freshness, feed-status and blocked-entry surfaces (client 0.23.0 fields).
- **M3 (done):** the read-only interface for the demo principal and Viewer-only accounts (`useIsDemo`, `useIsReadOnly`, the shell badge, hidden alert-acknowledgement and account controls). The hosted demo itself is served by `perpeto-web`.
- **M4:** verify Exchanges against testnet and demo accounts and capture evidence screenshots.

## Next tasks

1. M4: exercise the Exchanges surface against the operator's testnet and demo accounts and record the evidence.
2. Renew the cross-repository token so shared-document sync and API updates run automatically again.
3. Resume EAS delivery when a TestFlight build is wanted.
