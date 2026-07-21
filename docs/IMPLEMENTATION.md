# Mobile Implementation Plan

## Current objective

Keep the existing M2 monitoring and M3 connector-observability surfaces paper/shadow-safe, retain the consumed lossless-decimal contract, and complete the pending backend/device evidence. The personal-tenant session slice and backend's first forced-RLS/private-runtime slice are implemented locally; database/adversarial evidence remains open. Implement consumer credential enrollment and `PILOT` controls only after the separate passkey and Vault contracts land in small contract-pinned slices.

## M4 ordered slices

1. **Personal tenant session — implemented locally:** consume session-derived tenant status and paper/pilot eligibility without accepting or storing a selectable tenant ID. Cross-account and physical-device evidence remains open.
2. **Passkey lifecycle:** register/list/revoke platform passkeys with native iOS/Android credential APIs; handle RP/origin errors, cancellation, lost-device recovery and remote session revocation.
3. **Secure enrollment UX:** collect CEX API key/secret/passphrase in ephemeral, non-persisted fields; suppress analytics, screenshots and crash breadcrumbs; bind submission to a one-use passkey-authorized operation and clear on every exit path.
4. **Account preflight:** display permissions, account/margin mode, connection/private-stream health, reconciliation and shadow results. Explain why read/trade-only credentials with withdrawals/transfers/admin disabled are mandatory.
5. **Pilot arming:** show platform connector certification separately from personal account eligibility; require fresh passkey and typed `ENABLE PILOT`; display exact tenant/account/routes/limits being armed. Do not present M4 as `CERTIFIED_LIVE`.
6. **Live monitoring and containment:** show tenant/global breaker badges, stale/private-stream/Vault status, disarm, pause, close and flatten actions with server-confirmed outcomes and in-flight recovery.
7. **Credential lifecycle:** passkey-authorized rotation/revocation, sequencing warnings for open positions, exchange-side revoke guidance and deletion/recovery states. Never offer secret reveal/export.
8. **Store evidence:** real iOS/Android tests for passkeys, background/offline automation visibility, push deep links, accessibility, privacy shield, enrollment cleanup and fail-closed contract behavior.

## Boundary rules

The phone authorizes but does not execute unattended strategies and does not hold the backend decryption root. Closing the app must not stop an armed server strategy. Local biometrics may unlock the app, but only a server-verified platform passkey assertion satisfies M4 credential/live step-up.

Generated API types remain authoritative; decimal math remains display-only. Live actions are unavailable offline, on stale state, with an incompatible client, or without server eligibility. The UI never interprets platform connector certification as proof that the trader's account is ready.

## Deferred

Team/shared tenants, copy trading, automatic CEX transfers/withdrawals and arbitrary external-wallet signing remain unavailable. DEX signer approval UI moves to M5. `CERTIFIED_LIVE` and broader production rollout follow M6 hardening in M7.
