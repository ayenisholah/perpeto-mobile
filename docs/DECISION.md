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
