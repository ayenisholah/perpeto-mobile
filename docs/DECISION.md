# Decision Log

Accepted entries are append-only. Supersede an earlier decision with a new ID instead of rewriting history.

## DEC-0001 — Two public implementation repositories

- Status: Accepted
- Date: 2026-07-14
- Scope: Shared
- Decision: Maintain `perpeto-backend` and `perpeto-mobile` as separate public GitHub repositories. Do not create a third governance repository.
- Consequences: Cross-repository contracts and selected documentation require automation and explicit ownership.

## DEC-0002 — Shared documentation ownership

- Status: Accepted
- Date: 2026-07-14
- Scope: Shared
- Decision: The backend repository owns canonical shared sections. Automation opens reviewed synchronization pull requests against the mobile repository.
- Consequences: Direct edits to generated shared sections in mobile are rejected by drift checks.

## DEC-0003 — Development deployment boundary

- Status: Accepted
- Date: 2026-07-14
- Scope: Backend
- Decision: GitHub deploys only staging/paper to one owner-supplied Docker-ready VPS. It performs no VPS, Docker, per-user, or production provisioning.
- Consequences: Host hardening, Docker installation, DNS, TLS prerequisites, deployment user, and runtime secrets are established outside the workflow.

## DEC-0004 — Public artifacts and versioned client

- Status: Accepted
- Date: 2026-07-14
- Scope: Shared
- Decision: Backend images are public GHCR packages tagged by immutable commit SHA. Backend API and event schemas generate a semantically versioned TypeScript package consumed at an exact version by mobile.
- Consequences: Images contain no secrets; incompatible contracts require a major package version and an accepted decision.

## DEC-0005 — Strict documentation impact gate

- Status: Accepted
- Date: 2026-07-14
- Scope: Shared
- Decision: Every ordinary pull request updates `CHANGELOG.md`. Other control documents are updated whenever their represented facts change.
- Consequences: Documentation drift is a merge failure, not deferred cleanup.

## DEC-0006 — Solo-maintainer branch-protection bypass

- Status: Accepted
- Date: 2026-07-14
- Scope: Shared
- Decision: Required checks, pull requests, code-owner review, and linear history apply normally, but administrator enforcement remains disabled while the repository has only one trusted maintainer. Enable administrator enforcement when an independent reviewer is available.
- Consequences: The owner can perform an auditable emergency or bootstrap push; routine work still uses pull requests. Admin bypass must not be used to conceal a failing check.

## DEC-0007 — Google and Apple identity with Perpeto-authoritative sessions

- Status: Accepted
- Date: 2026-07-14
- Scope: Shared
- Decision: Replace password, magic-link, phone, and guest authentication with native Google and Apple identity. Provider subjects are keyed by `(provider, provider_subject)` and are never matched or merged by email. Perpeto remains authoritative for pending approval, users, roles, mandatory privileged-role TOTP, recovery codes, devices, rotating sessions, step-up proofs, revocation, and deletion. Access tokens are 15-minute Ed25519 JWTs held in memory; device-bound opaque refresh tokens rotate once and are stored hashed server-side and in mobile Secure Store. The first socially authenticated user consumes a one-use deployment bootstrap token to become Owner.
- Consequences: Open registration creates an isolated `PENDING` account; approval initially grants Viewer. Apple and Google codes/tokens require server-side issuer, audience, signature, expiry, state, nonce, subject, and replay checks. Explicit linking requires fresh authentication (plus TOTP for privileged users), the final provider and final Owner are protected, and deletion erases PII/provider credentials while immutable evidence retains only a non-identifying audit pseudonym. Biometrics and Android authentication are deferred.

## DEC-0008 — Authentication runtime dependency set

- Status: Accepted
- Date: 2026-07-18
- Scope: Backend
- Decision: Implement the M1 authentication HTTP runtime with `axum`/`tokio`/`tower-http` (transport), `sqlx` with the Postgres/rustls driver (transactional persistence and the migrator behind `funding-arb-migrate`), `jsonwebtoken` (RS256 verification of Apple/Google identity tokens via cached JWKS), `reqwest` with rustls (JWKS fetch), and `ed25519-dalek`, `aes-gcm`, `hmac`/`sha1`, `sha2`, `subtle`, `rand`, and `uuid` for token signing, TOTP-secret encryption, TOTP, hashing, constant-time comparison, and identifiers. Access-token JWTs are minted and verified with Ed25519 directly (compact EdDSA), keeping DEC-0007's asymmetric access-token requirement without a third-party JWT signer. Application logic lives in a transport-free `funding-arb-auth-service` crate; `funding_arb_domain::auth` remains dependency-free and owns the invariants.
- Consequences: The standard library cannot provide asynchronous TLS Postgres access, JWKS signature verification, or authenticated symmetric encryption within the milestone, so these dependencies are justified under the operating contract. Provider verification is expressed through an `IdentityTokenVerifier` trait so handlers are testable with injected verifiers and locally issued tokens. Local Windows builds require a C toolchain and linker for the crypto/async dependencies; compilation and the database-backed test suite run on Linux CI (a Postgres service) and in the release container.

## DEC-0009 — Interim open registration for the shared v1 backend

- Status: Accepted
- Date: 2026-07-19
- Scope: Shared
- Decision: Version 1 runs a single shared backend for development and TestFlight. Gate a self-service registration mode behind `PERPETO_OPEN_REGISTRATION` (default false). When enabled, a new social sign-in is admitted immediately as an active account with the full privileged role set (`OWNER`, `TRADER`, `APPROVER`), and TOTP MFA is waived, so each tester can exercise the complete app without a pending queue, Owner approval, or authenticator setup. This deliberately relaxes DEC-0007's "open registration creates a `PENDING` account; approval initially grants Viewer" and the PRODUCT_SPEC mandatory-privileged-role-MFA rule for this deployment only. Version 2 provisions an isolated backend per user and restores gated approval and MFA; this decision is superseded at that point.
- Consequences: The flag is off by default, so isolated or production deployments keep the strict DEC-0007 flow — the pending-approval and Owner-approval endpoints, screens, and the one-use bootstrap-Owner path remain in the codebase and behave unchanged when the flag is unset. Because every open-registration user is a privileged Owner without MFA, step-up-gated and identity-linking flows that require a TOTP proof are not usable under the flag; they return with v2 isolation. The mobile client shows instant-access sign-in copy for the shared v1 build. The waiver is a documented, reversible deployment policy applied in the service layer (`compute_next`), not in `funding_arb_domain::auth`, whose invariants stay strict.

## DEC-0010 — Deterministic M2 paper supervision thresholds

- Status: Accepted
- Date: 2026-07-20
- Scope: Shared
- Decision: M2 Slice 5a uses the existing effective unmatched-exposure limit (`RiskLimits::max_unmatched()`) and two consecutive scenario ticks to trigger corrective paper re-hedging. The engine separates real scan sleep from a configurable simulated-time step so the four-snapshot `t0→t3` path is exercised deterministically.
- Consequences: This is a paper-fixture simplification for repeatable milestone evidence, not the live risk policy. The PRODUCT_SPEC §6.2 greater-of-USD-100/5-bps threshold with three seconds of elapsed persistence must be implemented before live execution and cannot be inferred from the tick counter.

## DEC-0011 — M3 sandbox writes and read-only shadow boundary

- Status: Accepted
- Date: 2026-07-20
- Scope: Backend
- Decision: M3 introduces `SANDBOX` and `SHADOW` runtime modes. Only `SANDBOX` may submit external orders, and only to a connector account explicitly configured for a non-production testnet/demo environment. `SHADOW` may consume production public/private reads but routes every execution decision to a non-submitting recorder. `LIVE` remains fail-closed until M6. CEX credentials enter the shared v1 deployment only through an audited server-side administration CLI because DEC-0009 does not provide the step-up proof required for credential mutations.
- Consequences: Environment/mode mismatches are fatal configuration errors. Mobile and HTTP APIs never accept raw CEX credentials in v1. M3 can advance routes through `PAPER_ONLY` and `SHADOW`; `PILOT` and `CERTIFIED_LIVE` require M6 authorization and evidence.

## DEC-0012 — Shared-VPS personal tenants and passkey-authorized Vault credentials

- Status: Accepted
- Date: 2026-07-20
- Scope: Shared
- Decision: Operate one Perpeto control plane on the operator's VPS for many independent consumer traders. Every trader receives one personal tenant; teams and shared portfolios are deferred. PostgreSQL row-level security, tenant-scoped repositories, tenant-aware unique constraints and tenant-bound authorization isolate private state in the shared database. Each trader supplies CEX read-and-trade credentials with withdrawal, transfer and API-administration permissions disabled. HashiCorp Vault Transit encrypts those credentials with a distinct key per tenant and is manually unsealed after restart using a 2-of-3 Shamir quorum. A registered device passkey authorizes credential enrollment, rotation, revocation and live arming, but does not derive or persist the server's encryption key: authorized automation must continue while the phone is offline. Connector routes are certified once at platform level; each connected account must separately pass permission, account-mode, reconciliation and shadow preflight before limited live entry.
- Consequences: This decision supersedes DEC-0009's universal privileged-role open-registration model and the CLI-only credential-entry constraint in DEC-0011. Registration may remain public for paper use, but live eligibility is per tenant and fail-closed. The API derives tenant identity from the authenticated session rather than accepting an arbitrary tenant header. API and engine identities receive narrow Vault policies; Vault root and unseal shares never enter application configuration. A sealed or unavailable Vault halts new live risk and credential changes while reconciliation and safe risk-reduction continue where already established sessions permit. The first production profile accepts a single-VPS and manual-unseal availability boundary; Vault HA, managed KMS auto-unseal, static exchange egress and stronger infrastructure isolation are explicit M6 work. Until M4 isolation and secret-lifecycle gates pass, production CEX writes remain disabled.

## DEC-0013 — M4 pilot and M7 certified-live boundary

- Status: Accepted
- Date: 2026-07-21
- Scope: Shared
- Decision: M3 remains non-production and can advance connector routes only through `PAPER_ONLY` and read-only `SHADOW`. After every M4 tenant-isolation, passkey, Vault, account-preflight, reconciliation and risk gate passes, a controlled cohort may receive the `PILOT` state for a narrowly approved BTC or ETH CEX route. M6 then hardens recovery, service isolation and operations. `CERTIFIED_LIVE` and broader capital rollout begin only in M7 after the applicable M6 evidence is accepted.
- Consequences: This decision supersedes DEC-0011's statements that both `PILOT` and `CERTIFIED_LIVE` require M6. M4 permits only the limited pilot; it does not authorize broad production availability. Any failed eligibility, security, reconciliation or risk gate returns the affected account or route to a non-writing state.

## DEC-0014 — Development-only identity verification for Expo Go

- Status: Accepted
- Date: 2026-07-30
- Scope: Shared
- Decision: A `DevIdentityVerifier` may substitute provider identity-token verification behind the existing `IdentityTokenVerifier` trait, so the Expo Go client can reach authenticated surfaces. Expo Go cannot execute the native Google or Apple modules, so no provider sign-in is possible there and no authenticated screen is otherwise reachable. It accepts only tokens prefixed `perpeto-dev:` and rejects everything else, so a genuine provider token is never treated as verified by a relaxed path. The verifier is selected only when `PERPETO_MODE=PAPER` and `PERPETO_DEV_AUTH=true`; `bins/api` refuses to start when the flag is set in any other mode, rather than falling back to the live verifier, and prints a warning when the verifier is active. `PERPETO_DEV_AUTH` and the client's `EXPO_PUBLIC_DEV_AUTH_ENABLED` appear only in gitignored local files, never in `runtime.env.example`, Compose manifests, or CI.
- Consequences: This is an authentication bypass and is recorded as one. Enabled anywhere reachable it would let any caller assume any identity, so the mode gate and the refusal to start are load-bearing and may not be relaxed for convenience. Nothing else in the exchange is weakened: challenge purpose and lifetime, the PKCE verifier, the device-platform check and Apple's nonce binding all still apply, and the resulting session is an ordinary one. Because the nonce binding cannot be satisfied by a synthetic token, the development client authenticates as `GOOGLE`. This decision does not alter DEC-0012's authorization model or grant any live capability, and it must be revisited if a development build ever needs to target a deployed backend.

## DEC-0015 — Reposition Perpeto as a public reference implementation

- Status: Accepted
- Date: 2026-11-22
- Scope: Shared
- Decision: Perpeto is a public, self-hostable reference implementation of a market-neutral funding-rate arbitrage system, run by one operator. It is not a multi-user trading service. Real-money LIVE trading is a non-goal for everyone, including the operator, so LIVE stays permanently fail-closed. The roadmap is re-baselined to four milestones, each closable by one maintainer without real capital:
  - M1: foundations, done;
  - M2: live-data paper trading;
  - M3: public demo;
  - M4: testnet execution on the operator's own accounts.
- Consequences: This supersedes the product scope of DEC-0012 and DEC-0013: the shared service for independent consumer traders, the `PILOT` cohort, `CERTIFIED_LIVE`, and the old M5–M7 plan. It does not supersede their security mechanisms. Personal tenants, forced RLS, passkey-authorized actions, the Vault Transit store, credential lifecycle, preflight, the pilot gate and the hash-chained audit log stay in the codebase as implemented hardening, tested and maintained but not release gates. Requirements in `PRODUCT_SPEC.md` that apply only to live trading are retained as design record and marked as non-binding.
  - The earlier plan failed for two reasons. Its exit gates depended on things one maintainer cannot supply: third-party traders, credentialed venue soaks of 72 hours to 14 days, a Vault Shamir ceremony, real capital and signed evidence. As a result M0–M4 were all open at once and none could close.
  - Operating automated trading for third parties would also carry licensing and legal exposure that the project does not need.

## DEC-0016 — Live-data paper mode

- Status: Accepted
- Date: 2026-11-22
- Scope: Backend
- Decision: `PAPER` may read keyless public market data from Binance, Bybit and OKX through the existing connectors: instruments, funding, mark and index prices, and order books. It simulates fills against those live books on wall-clock time. PAPER never loads exchange credentials, never opens private streams and never submits external orders. The deterministic fixture replay (`PERPETO_SIM_START`, `PERPETO_SIM_TICK_SECS`) remains, selected explicitly, and stays the source for reproducible tests.
- Consequences: The public demo shows real opportunities rather than replayed fixtures, with no credential in the deployment. A stale or failed public feed marks the affected legs stale and blocks paper entries on them; it never falls back to fixture data silently. This refines DEC-0011, under which production public reads were available only in `SHADOW`.

## DEC-0017 — Read-only demo access

- Status: Accepted
- Date: 2026-11-22
- Scope: Shared
- Decision: The public demo exposes a read-only viewer path into one seeded demo tenant. The viewer can read the scanner, positions, portfolio, health and alerts. It cannot mutate anything: no strategy, control, credential, pilot or account change. DEC-0009 open registration with Owner rights is not used for the public demo, and DEC-0014's development verifier stays local and PAPER-only. The viewer mechanism and its authorization tests are M3 deliverables.
- Consequences: Reviewers can see the system without an account or a native build. The demo carries no privileged identity. Every mutating endpoint must reject the viewer role, and an authorization test must prove it.

## DEC-0018 — Scope cuts

- Status: Accepted
- Date: 2026-11-22
- Scope: Shared
- Decision: The following are deferred indefinitely and are not on the roadmap:
  - DEX connectors and transaction signing (dYdX, Hyperliquid, `bins/signer`);
  - treasury, rebalancing and transfer proposals;
  - Telegram and Discord notification channels;
  - second-approver quorum;
  - platform route certification soaks;
  - limited-capital pilots;
  - Vault HA and auto-unseal.
- Consequences: Existing code for these, such as the `signer` binary and route certification state, may remain but is not extended. The corresponding `PRODUCT_SPEC.md` sections are marked deferred. Effort goes to M2–M4, which are what a reviewer can see and run.

## DEC-0019 — PR-only main for every account

- Status: Accepted
- Date: 2026-11-22
- Scope: Shared
- Decision: `main` changes only through a pull request from a feature branch, in every Perpeto repository. Branch protection enforces this for administrators too (`enforce_admins`). Requirements: a pull request, the required status checks on an up-to-date branch, linear history, resolved conversations, and no force-push or deletion. Because the project has one maintainer, a PR needs **zero** approving reviews and no code-owner review; green required checks are the merge gate. Branches are named `feat/`, `fix/`, `docs/` or `chore/`. A local `.githooks/pre-push` hook refuses a push to `main` (enable it with `git config core.hooksPath .githooks`).
- Consequences: This supersedes DEC-0006. The administrator bypass is gone, so emergency fixes also go through a PR, and a failing required check blocks every merge. Restore a required review count when an independent reviewer joins.

## DEC-0020 — PAPER staging on AWS

- Status: Accepted
- Date: 2026-11-23
- Scope: Backend
- Decision: PAPER staging moves from the operator-managed VPS (`77.42.124.215`) to one EC2 host in AWS `eu-north-1`, owned by the CDK app in `infra/`. The host runs the existing compose stack behind Caddy (TLS), on a `t3.small` with a pinned Amazon Linux 2023 AMI, in a public-only VPC with only 80 and 443 open. Deploys reach it through SSM Run Command, not SSH. Database passwords are generated by CloudFormation and the application keys by the host, both into Secrets Manager. Container logs go to CloudWatch, and the host has daily AWS Backup snapshots and automatic recovery. The deploy identity is a scoped IAM user, because the AWS organisation's service control policy forbids GitHub OIDC.
- Consequences: The SSH deploy key, the `STAGING_SSH_*`/`STAGING_HOST`-style variables and the hand-placed `runtime.env` are retired; nothing secret lives on GitHub except the deployer's access key. All three venues are reachable from `eu-north-1` (verified 2026-11-23), unlike the developer network, so M2's public probe and 24-hour run happen here. EC2 plus compose keeps cost near $20/month; ECS Fargate with RDS was rejected as roughly four times the cost for one paper control plane. The API hostname is unchanged; its DNS record is moved by hand to the Elastic IP.

## DEC-0021 — Next.js web platform

- Status: Accepted
- Date: 2026-11-24
- Scope: Shared
- Decision: The M3 web client is a Next.js application in a third product repository, `perpeto-web` (DEC-0001's two-repository rule covers governance, not product clients). It runs as a Node server container behind the staging host's Caddy at `app.perpeto.xyz`, deployed as `ghcr.io/ayenisholah/perpeto-web:sha-<commit>`. It serves the read-only demo of DEC-0017 and real Google and Apple sign-in through a backend-for-frontend: the browser holds only an encrypted, `httpOnly`, `Secure`, `SameSite=Strict` session cookie, and the web server keeps the refresh credential and calls the API over the compose network with bearer tokens. Every state-changing web request must pass an `Origin`/`Sec-Fetch-Site` check and a CSRF token, as the product specification requires of any cookie-based web console. The Expo client stays mobile-only. The web server is deployed by its own IAM user, which may only invoke the `Perpeto-UpdateWeb` SSM document; that document accepts nothing but a full-commit `perpeto-web` image and runs nothing but `deploy/ec2/update-web.sh`.
- Consequences: The API stays bearer-only with no production CORS, because the browser never calls it directly. The backend must accept `WEB` devices, a list of Apple audiences (bundle ID plus the web Services ID) and a web redirect-URI allowlist, and revoked sessions must stop working at once rather than when their access token expires. The web server receives only its session-cookie key and public client identifiers, never database or API signing keys. A backend deploy never waits on the web repository: the `web` compose profile starts only once its image can be pulled. EAS and TestFlight stay paused.
