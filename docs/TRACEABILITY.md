# Requirements Traceability

| Requirement | Planned component | Verification | Status |
|---|---|---|---|
| Spec 10 API compatibility | versioned generated client | Exact package pin and schema compatibility CI | `0.13.0` exact vendored pin verified; external publication pending |
| Spec 11.1 client boundary | Expo app and API layer | No trading logic/retained-credentials checks | Scaffolded and enforced for current surfaces |
| Spec 11.3 / DEC-0007 authentication | native Apple/Google, auth state machine, MFA, approval and secure session store | Unit, integration and device E2E | State/storage/UI implemented; provider configuration/device E2E pending |
| Spec 11.4–11.14 screens | routed feature modules | Component, integration, accessibility and E2E | M2 scanner, positions, strategies, controls, portfolio, health and alerts implemented; M3 connector observability added |
| Spec 11.15 offline behavior | connection/freshness state | Gap, replay, expiry and recovery tests | Partial; M4 unattended-live recovery not implemented |
| Spec 11.16 mobile security | device-only Secure Store, memory access token and privacy controls | Device security tests and review | Credential boundary and invalidation policy implemented; device review pending |
| Spec 17.4 mobile tests | CI and device matrix | Required checks and recorded evidence | In progress |
| Spec 18 EAS delivery | linked EAS project and TestFlight profile | Fail-closed provider preflight, iOS EAS build and App Store Connect submission | Initial iOS delivery verified; iOS-only CI path configured and disabled pending provider values |
| Spec 12.1–12.2 brand and themes | Convergent S identity and glass-aware theme primitives | Small-size asset proofs, light/dark rendering, reduced-transparency fallback, and device review | In progress |
| DEC-0012 personal tenant UX | session-derived tenant status with no client-selectable tenant context | Cross-account deep-link/cache/logout tests | Target M4; not implemented |
| DEC-0012 passkeys | native WebAuthn registration/assertion and recovery UX | Physical iOS/Android RP/origin/replay/lost-device matrix | Target M4; not implemented |
| DEC-0012 credential lifecycle | ephemeral CEX enrollment, masked account state, rotation/revocation with no reveal/export | Persistence/log/crash/screenshot/clipboard inspection and device E2E | Target M4; not implemented |
| Spec 17.6 account live entry | separate platform certification, account preflight and passkey/typed arm UI | Negative readiness matrix plus limited-live device evidence | Target M4; backend live remains disabled |
