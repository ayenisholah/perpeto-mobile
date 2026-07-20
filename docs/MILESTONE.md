# Product Milestones

<!-- SHARED-CONTENT-VERSION: 3 -->

| ID | Milestone | Exit evidence | Status |
|---|---|---|---|
| M0 | Governance and scaffolding | Two repositories, protected workflow design, synchronized documents, executable scaffolds, contract seed, CI and paper staging automation | Implementation complete; `0.1.0` publication evidence pending |
| M1 | Foundations and simulator | Durable domain, auth, audit, deterministic simulator, ledger, Expo shell and generated client | In progress (M1A social-auth contract/domain) |
| M2 | Scanner and paper trading | Normalized markets, forecasts, opportunity/risk engine, coordinated paper lifecycle and complete mobile monitoring | Complete (paper lifecycle, automated strategies, emergency controls, portfolio/health/alerts, mobile monitoring) |
| M3 | CEX connector certification | Binance, Bybit and OKX contract suites, reconciliation, sandbox writes, read-only shadow operation, and platform-level staged certification evidence | In progress (connector engineering and evidence tooling implemented; primary WebSocket streams and credentialed timed certification pending) |
| M4 | Shared-VPS multi-user CEX live | Personal tenants, PostgreSQL RLS, passkeys, Vault Transit credentials, account preflight, tenant risk isolation, and limited unattended live trading | Not started |
| M5 | DEX integrations | dYdX, Hyperliquid, isolated signer, nonce/chain recovery and approval flows | Not started |
| M6 | Operational hardening | Fault injection, DR, runbooks, SLOs, accessibility, security review, and shared-VPS blast-radius reduction | Not started |
| M7 | Controlled live rollout | Approved production automation and venue-by-venue rollout evidence beyond the limited M4 cohort | Not started |

No milestone closes from code completion alone. Its traceability, tests, security evidence, documentation, and backend/mobile compatibility must also pass.

The shared deployment is not authorized for live trading merely because registration is available. DEC-0012 supersedes the interim universal-Owner model in DEC-0009: each authenticated trader receives one personal tenant, sensitive credential and live-mode actions require passkey authorization, and eligibility is enforced per tenant. M4 must prove tenant isolation and credential controls before any production CEX order is submitted.
