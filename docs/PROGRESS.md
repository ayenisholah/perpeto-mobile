# Mobile Progress

## Snapshot

- Milestone: M3 — CEX connector certification
- Overall state: In progress (M2/M3 mobile surfaces implemented; shared exit and device-evidence gates remain open)
- Last verified: 2026-07-21

## Completed or implemented

- Adopted Expo SDK 57, the Perpeto perpetual-loop brand, semantic light/dark tokens and accessible Liquid Glass primitives.
- Established documentation, CI, branch protection, API-update, shared-document drift and iOS TestFlight automation.
- Implemented native Apple/Google entry points, the fail-closed authentication state machine, bootstrap/pending/MFA/recovery flows, Secure Store refresh rotation, approvals, identity/session management, logout and deletion UI.
- Implemented the M2 scanner, opportunity detail/risk, positions, paper open/close/re-hedge/recovery, strategies, emergency controls, portfolio/PnL, health and alerts surfaces.
- Implemented the M3 Exchanges surface for masked venue accounts, connection tests/disable, exact sandbox order previews/submission, recent connector orders, reconciliation summaries, balances and venue positions. Production submissions remain unavailable.
- Consume the exact vendored `@ayenisholah/perpeto-api-client@0.14.0` tarball; financial fields remain decimal strings across the API boundary, and the matching backend client passes local typecheck and 21 contract tests.
- Verified local mobile lint, typecheck, documentation checks and 14 Vitest tests.
- Verified GitHub Mobile CI green at remote `main` `9f9d58c`.
- Verified the automated iOS workflow built Perpeto `0.2.0 (14)` and submitted it successfully to Apple App Store Connect on 2026-07-20. Post-submission Apple processing and tester availability have not been independently confirmed.
- Consume vendored API client `0.15.0` and show the session-derived personal tenant summary in Security without exposing any caller-selectable tenant context.

## Exit gates and unverified work

- The M2 mobile lossless-decimal update is implemented: API financial fields remain strings, request payloads avoid floating-point arithmetic, and conversion is display-only. Shared closure still awaits backend Rust/PostgreSQL round-trip evidence.
- Credentialed CEX sandbox/demo/shadow evidence and primary backend connector WebSocket streams are incomplete, so M3 and production trading remain unavailable.
- Real-device Apple/Google authentication, provider linking, bootstrap, MFA/recovery, remote revocation, accessibility, privacy and security evidence remains pending.
- API client `0.14.0` is vendored but unpublished; `0.7.0` is the latest registry release confirmed by workflow evidence.
- M4 personal-tenant status is implemented locally. Native platform passkeys, ephemeral exchange-credential enrollment, account preflight/live eligibility and pilot controls are not implemented. The phone will authorize changes but will not store or decrypt enrolled credentials.
- M4 may expose only a controlled `PILOT`; `CERTIFIED_LIVE` and broader rollout remain M7 work after M6 hardening.

## Current blockers

- M1 device evidence requires physical-device TestFlight execution and configured provider accounts; a successful archive/submission is delivery evidence only.
- M3 device verification depends on a build-compatible backend whose connector runtime has passed CI and on accepted credentialed certification evidence.
- Permanent consumption of client `0.14.0` depends on publishing that version and replacing the checked-in tarball through the versioned API-update workflow.

## Next verified tasks

1. Confirm Apple processing/TestFlight availability for `0.2.0 (14)` and execute the recorded real-device authentication/accessibility matrix.
2. After the backend passes CI and M3 evidence is available, verify the Exchanges monitoring path on a real device.
3. Run the lossless-decimal mobile contract on a real device after backend CI verifies the shared revision.
4. After the first backend M4 tenant/passkey contract is published, implement the personal-tenant session slice; do not add credential fields before the one-use, passkey-authorized Vault enrollment contract exists.
