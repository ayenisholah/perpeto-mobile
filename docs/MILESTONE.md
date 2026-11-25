# Product Milestones

<!-- SHARED-CONTENT-VERSION: 9 -->

DEC-0015 re-baselined the roadmap on 2026-11-22. Perpeto is a public reference implementation, so every exit gate must be achievable by one maintainer, without real capital and without elapsed-time soaks of weeks. The earlier M0–M7 plan is kept in git history and summarized in DEC-0015.

| ID | Milestone | Exit evidence | Status |
|---|---|---|---|
| M1 | Foundations: Rust workspace, social auth and sessions, deterministic paper engine, scanner, risk, strategies, monitoring, mobile app, CI and docs automation | Workspace passes fmt, Clippy (`-D warnings`), all migrations and the full test suite (136 tests). The 11 database-backed suites pass under the non-`BYPASSRLS` runtime role. Mobile lint, typecheck and tests pass | **Done** (closed 2026-11-22 on the verified 2026-07-29 baseline) |
| M2 | Live-data paper trading: PAPER reads keyless public funding and order books from Binance, Bybit and OKX through the existing connectors, simulates fills against live books, and runs on wall-clock time | The engine runs 24 hours on staging with no crash and no unreported stale feed. The scanner lists live routes with freshness. Fixture mode still drives the deterministic tests | **Done** (closed 2026-11-25: [probe](evidence/m2/PUBLIC_PROBE.md), [24-hour run](evidence/m2/STAGING_SOAK.md)) |
| M3 | Public demo, all of the following: staging tracks `main`; a read-only demo viewer (DEC-0017); the Next.js web platform at `app.perpeto.xyz` serving the demo (DEC-0021); a "5-minute tour" in the README; one-command local `docker compose up`. The TestFlight build is deferred while EAS delivery is paused. Web Google/Apple sign-in is implemented and switched off until the provider origins are configured | A reviewer reaches the live demo from the README without help, and a fresh clone runs locally from the README alone | **Done** (closed 2026-11-25: [evidence](evidence/m3/PUBLIC_DEMO.md)) |
| M4 | Testnet execution with the operator's own Bybit testnet, Binance testnet and OKX demo accounts, through the existing sandbox coordinator | Per venue: one open → funding → close cycle, plus one forced partial-fill or timeout recovery. The reconciliation report is committed under `docs/evidence/` | **Next** |
| — | Multi-tenant hardening: personal tenants, forced RLS, passkeys, Vault Transit store, credential lifecycle, preflight, pilot gate, audit chain | The existing database-verified suites | **Implemented and kept; not a release gate.** Deploying Vault infrastructure and the native passkey ceremony are optional extras |

No milestone closes from code alone. Its tests, documentation and backend/mobile compatibility must also pass, and its evidence must be in the repository.

LIVE is permanently fail-closed. No milestone in this roadmap authorizes a production exchange order.
