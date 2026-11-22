# Requirements Traceability

Re-baselined to the DEC-0015 roadmap on 2026-11-22. **Hardening** marks implemented, flag-gated work that is kept but is not a release gate. **Deferred** marks DEC-0018 scope.

| Requirement | Component | Verification | Milestone | Status |
|---|---|---|---|---|
| Spec 10 API compatibility | Vendored generated client | Exact package pin and schema compatibility CI | M1 | Verified at `0.22.0`. Registry publication lags at `0.7.0` (M3) |
| Spec 11.1 client boundary | Expo app and API layer | No trading logic and no retained credentials | M1 | Verified for current surfaces |
| Spec 11.3 / DEC-0007 authentication | Native Apple/Google, auth state machine, MFA, Secure Store sessions | Unit tests; device end-to-end | M1, M3 | State, storage and UI verified. Device end-to-end testing pending (M3) |
| Spec 11.2–11.14 screens | Five-tab shell and routed feature modules | Lint, typecheck, Vitest | M1 | Verified |
| DEC-0016 live-data freshness | `FreshnessBadge` on the scanner, detail, Home and Health; stale-feed states | Component tests for stale and blocked states | M2 | Planned |
| DEC-0017 demo viewer | Viewer entry, read-only badge, no enabled mutation | Test that viewer mode renders no enabled mutation | M3 | Planned |
| Hosted web demo | Production web export against staging | Smoke run against `api.perpeto.xyz` | M3 | Planned |
| Spec 11.15 offline behaviour | Connection and freshness state | Gap, expiry and recovery tests | M1 | Implemented for current surfaces |
| Spec 11.16 mobile security | Device-only Secure Store, memory access token, privacy controls | Unit tests; device review | M1 | Implemented. Device review pending |
| Spec 12 design system | AgentFloor tokens, Space Grotesk/Mono, square radii | `src/theme/colors.test.ts` WCAG contrast | M1 | Verified. Brand mark recolour pending (M3) |
| Spec 12.3 accessibility | `Text` primitive at 200% scaling, roles and labels | VoiceOver pass on the five tabs | M3 | Pending |
| Spec 18 EAS delivery | Linked EAS project and TestFlight profile | iOS build and App Store Connect submission | M1, M3 | `0.2.0 (14)` submitted. Tester availability pending |
| Exchanges against testnet | Masked accounts, sandbox previews and submission, reconciliation reads | Screenshots against testnet and demo accounts | M4 | Implemented. Evidence pending |
| DEC-0012 passkeys, credential lifecycle, pilot, audit | Flag-gated Security cards | Unit tests | Hardening | Implemented, dark by default |
| DEX signer, treasury, live controls | — | — | Deferred | Not implemented (DEC-0018) |
