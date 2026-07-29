# Changelog

## [Unreleased]

### Added

- Synchronized the mobile roadmap with backend M3 WebSocket/sequence-recovery implementation and the first M4 forced-RLS/private-runtime slice. Both remain locally unverified on the Rust/PostgreSQL side; no tenant selector, credential field or pilot control was added to mobile. Local mobile typecheck and all 14 tests pass.

- Documentation audit — synchronized README, implementation, milestone, progress and traceability claims with the consumed `0.15.0` client and implemented personal-tenant session slice. Backend Rust/PostgreSQL and device evidence, passkeys, credential enrollment and every pilot/live gate remain explicitly open.

- M4 tenant foundation — consumed vendored API client **0.15.0** and added the authenticated personal-tenant name, base currency and paper/pilot state to Security. Tenant identity is session-derived and the app exposes no tenant selector.

- Consumed vendored API client **0.14.0** and migrated financial presentation and strategy requests to the exact-decimal string contract. Decimal-to-number conversion is display-only; request construction preserves decimal strings and exact halving. Local typecheck and all 14 mobile tests pass.

- Accepted DEC-0013 and documented the M4 public multi-user pilot architecture: one personal tenant per trader, native passkey authorization, ephemeral CEX credential enrollment into backend per-tenant Vault Transit, account preflight/pilot eligibility, and fail-closed controls. M4 may grant only `PILOT`; `CERTIFIED_LIVE` begins in M7 after M6 hardening. No live capability or credential form is implemented by this docs change.

- Re-sequenced the roadmap to M3 connector certification, M4 shared-VPS multi-user CEX pilot, M5 DEX, M6 hardening and M7 certified-live rollout. Documented that the phone authorizes sensitive operations but does not retain exchange credentials or supply the unattended runtime's decryption key.

- Verified the enabled TestFlight workflow built Perpeto `0.2.0 (14)` and submitted it successfully to Apple App Store Connect; Apple processing and tester availability remain separate evidence.

- M3 Slice 19 — the Exchanges tab now shows exact connector order history, reconciliation status/discrepancy counts, and the latest reconciled balances and venue positions using vendored API client **0.13.0**. Decimal values remain strings and no credential material reaches mobile.

- M3 Slice 18 — the Exchanges tab now previews exact native IOC quantity, equivalent base exposure, projected delta, and payload hash via client **0.12.0**. Non-production accounts support an explicit confirmation before submit; production accounts render SHADOW preview-only status and cannot submit.

- M3 Slice 6 — added an Exchanges tab with connector coverage, masked account/product permissions, configuration tests, and Owner-confirmed account disable. Raw credentials are never accepted or rendered by mobile. Vendors API client **0.11.0**.

- M2 Slices 6–7 — a Strategies tab with paper configuration and enable/disable controls, position strategy attribution, Portfolio/PnL dashboard, venue/service Health view, and deduplicated Alerts with acknowledgement, vendoring API client **0.10.0**. M2 mobile monitoring is complete.

- M2 Slice 5b mobile controls: active breaker badges plus Trader halt/read-only/venue-disable/resume actions and an OWNER-confirmed flatten action. The vendored `@ayenisholah/perpeto-api-client` **0.8.0** contract also presents `RECOVERING` positions and recovery/circuit-breaker exit reasons.

- M2 Slice 5a — position cards now show a persistent **RE-HEDGED** badge when corrective hedge orders are present and a readable funding-flip, threshold, venue-health, or manual exit reason after close. Consumes the verified `@ayenisholah/perpeto-api-client@0.7.0` vendored contract with `residual_breach_ticks` and nullable `exit_reason`.
- M2 Slice 4 — the Positions screen gains realized-PnL and funding display and a **Close position** action on `OPEN` positions (OWNER/TRADER only, via `closePosition`), showing captured funding, realized PnL (green/red), and the close time once closed. Consumes `@ayenisholah/perpeto-api-client@0.6.0`. Paper only — no live orders are placed.
- M2 Slice 3 — a **Positions** tab (segmented `[Scanner | Positions | Security]` home) listing opened paper positions from `GET /api/v1/positions` via a `usePositions` hook, showing state, per-leg venue/symbol/fill/fees, residual delta, and reserved capital. The opportunity detail sheet gains an **Open paper position** action (shown for `within_limits` routes and OWNER/TRADER roles) that calls `createPosition` with an idempotency key and routes to Positions. Consumes `@ayenisholah/perpeto-api-client@0.5.0`. Paper only — no live orders are placed.
- M2 Slice 2 — the Scanner gains route-type filters and a sort control, an **opportunity detail** sheet (tap a route) showing the full cost/forecast breakdown, per-leg forecasts, and the paper capital reservation, and an **Active risk limits** card fed by `GET /api/v1/risk/limits`. Consumes `@ayenisholah/perpeto-api-client@0.4.0` (`getOpportunity`, `getRiskLimits`, richer filters). Monitoring only.
- M2 Slice 1 — a **Scanner** screen for authenticated users: a segmented `[Scanner | Security]` home that lists ranked funding-arbitrage opportunities from the paper backend (`GET /api/v1/opportunities`) via a `useOpportunities` hook, showing net APR, win probability, capacity, venue route, and scan freshness, with manual refresh. Monitoring only — no execution controls. Consumes `@ayenisholah/perpeto-api-client@0.3.0`.
- Initial Expo SDK 57 repository, documentation controls, paper-backend status shell, tests, CI, EAS preview workflow, API update workflow, and shared-document drift checks.
- Convergent S brand assets, light/dark theme tokens, accessible Liquid Glass surfaces, and an iOS TestFlight delivery profile.
- Personal EAS project linkage and authenticated GitHub Packages configuration for preview and CI installs.
- iOS exempt-encryption declaration, EAS Updates project URL, and production brand splash configuration.
- M1A Google/Apple authentication state machine and screens for bootstrap, pending approval, TOTP/recovery enrollment and challenge, Owner access approval, linked identities, device sessions, logout, and account deletion.
- Device-only Secure Store refresh credentials, in-memory access-token handling, refresh/revocation cleanup policy, native Apple capability, and Google Sign-In EAS configuration.
- An iOS-only TestFlight build-and-submit workflow with fail-closed provider configuration validation and a provider credential runbook.

### Security

- The scaffold contains no exchange credentials or trading mutations and labels backend entry readiness as blocked.
- Pending users cannot enter the private shell; provider cancellation is non-destructive, and revoked/reused/deleted sessions clear stored credentials.

### Changed

- Stopped rejecting the backend for advancing a milestone. `isBackendHealth` required `stage` to equal `M0_SCAFFOLD`, but a running paper backend reports `M3_CONNECTORS`, so `getBackendHealth` would have thrown "Backend health contract is incompatible" against every current deployment. `stage` is now reported rather than gated; `status` and `mode` remain gated, because reaching a non-paper backend is a safety condition rather than a version difference. The helper is not yet wired into a screen, so nothing was visibly broken. Verified against a local backend: `GET /readyz` returns `{"status":"OK","mode":"PAPER","stage":"M3_CONNECTORS"}`.

- Documented running the app against a local backend in `README.md`: start PostgreSQL and the API from the backend checkout, point `EXPO_PUBLIC_API_URL` at the host's LAN address in `.env.local` (a device cannot reach `127.0.0.1`), and note that Expo Go excludes the native modules Google/Apple sign-in and passkeys need, so authenticated screens require an EAS development build.

- Consolidated the contributor policy into `docs/ENGINEERING.md`, replacing the former root-level operating contract, and updated `README.md`, `scripts/check-docs.sh`, `scripts/check-shared-docs.sh`, and the shared-document drift workflow to reference the new path. The document remains owned by the backend repository and synchronized here.

- Reconciled progress and traceability with current evidence: M2 mobile features are implemented but shared exact-decimal/device exit gates remain open; client 0.13 connector surfaces are present; M3 WebSocket/certification gates remain incomplete.

- Expanded shared-document drift coverage to architecture/key-management sources, hardened nested dependency/cache exclusions, and updated deployment commands to the renamed `perpeto-mobile` GitHub repository.

- Rebranded the app from **Signex** to **Perpeto** ("The perpetual edge"): a new perpetual-loop mark (interlocking mint/sky ribbon) for the icon, adaptive icon, splash and wordmark; the "Quant Terminal" palette (near-black ink `#0A0C10`, mint accent `#34E0A1`, sky secondary `#38BDF8`); and updated user-facing copy. Brand assets are generated from `assets/brand/perpeto-*.svg` via `npm run brand:render`. The vendored contract package is renamed to `@ayenisholah/perpeto-api-client` (client class `PerpetoClient`). The `com.signex.mobile` bundle ID, `signex://` deep-link scheme, `signex-mobile` slug, EAS linkage, and `signex.auth.*` secure-store keys are intentionally preserved so no re-provisioning or forced sign-out occurs.
- Updated the sign-in copy for the shared v1 open-registration backend (DEC-0009): new accounts currently get full access immediately. DEC-0012 now supersedes that model for M4; the target grants a personal paper tenant and requires separate passkey/account eligibility for live use.
- Replaced the vendor Apple and Google sign-in widgets with a shared `ProviderButton` that renders both as identical 52pt pills (SF Symbol Apple glyph, official multicolor Google mark) following each provider's brand guidelines, resolving the mismatched styling on the sign-in screen. The underlying `expo-apple-authentication` and Google native sign-in flows are unchanged.
- Moved project-control documentation under `docs/` and recorded the temporary solo-maintainer administrator bypass policy.
- Updated API client automation to record dependency releases so generated pull requests satisfy the documentation impact gate.
- Reworked the M0 status shell around the approved signal-to-execution identity while preserving paper-only safety messaging.
- Linked the iOS submit profile to App Store Connect and delivered the initial branded `0.1.0 (3)` archive for TestFlight processing.
- Documented the preview environment contract and interactive Android/iOS credential bootstrap boundary.
- Pinned the additive `@ayenisholah/signex-api-client@0.2.0` package as a verified vendored tarball until GitHub Packages publication completes.
- Replaced the Android/iOS internal-preview automation with an explicitly gated iOS TestFlight workflow; removed the placeholder Google URL scheme.
- Added Expo's build-properties plugin to generate modular headers for the Google Sign-In transitive iOS pods required by CocoaPods static linking.
