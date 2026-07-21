# Perpeto Shared-VPS Architecture

<!-- SHARED-CONTENT-VERSION: 2 -->

## Status and scope

This document defines the accepted target architecture for the controlled M4 `PILOT`. It is not a claim that the current runtime is safe for multi-user live trading. The current paper and M3 connector runtime must remain fail-closed for production exchange writes until the M4 isolation, credential, authorization, and recovery gates pass. M6 hardening must pass before M7 can broaden rollout or grant `CERTIFIED_LIVE`.

One operator-managed VPS hosts a shared Perpeto control plane. Many independent traders use the public mobile app, but each trader owns exactly one personal tenant and connects only their own exchange accounts. Team tenants, shared portfolios and customer-fund custody are out of scope.

## Logical architecture

```text
Mobile app + device passkey
          |
       TLS/API
          |
  authentication and tenant context
          |
  +-------+-------------------------------+
  | API / engine / reconciler / worker    |
  | scanner / risk / strategies / audit   |
  +-------+--------------------+----------+
          |                    |
 PostgreSQL + RLS        Vault Transit
          |                    |
          +-------- CEX connectors ------- CEX accounts
```

- The mobile app authenticates the trader, displays state, and authorizes sensitive commands. It never stores exchange secrets after enrollment and never runs the unattended execution loop.
- The API validates identity, device, passkey assertions, role, tenant membership, live eligibility, and command idempotency.
- The engine owns strategy evaluation and execution. The reconciler treats venue state as authoritative. The worker aggregates PnL, health and alerts.
- Public market data and platform connector metadata may be shared. Private account data and every command derived from it remain tenant-scoped.
- Vault Transit performs credential encryption/decryption without returning its tenant encryption keys. PostgreSQL stores only Vault ciphertext and non-secret metadata.

## Tenant boundary

The authenticated session contains the authoritative `tenant_id`. Clients do not select tenancy with an arbitrary request header or body field. At request and job boundaries, services create an immutable tenant context and propagate it through commands, events, traces and audit records.

All tenant-owned tables carry a non-null `tenant_id`. This includes users and memberships where applicable, venue accounts, credential references, strategies and versions, orders, fills, positions, funding, ledger entries, breakers, alerts, notifications, audit events, idempotency keys and outbox messages. Unique constraints and foreign keys include the tenant boundary so identifiers cannot collide or reference another tenant.

Repositories require a tenant context and execute tenant work in a transaction that sets a database-local tenant variable. PostgreSQL policies use that variable, and tenant tables use forced row-level security. Application roles do not own or bypass those policies. Schema migrations, controlled maintenance and narrowly scoped platform aggregation use separate identities and auditable procedures.

Background jobs are never "tenantless." A dispatcher selects a tenant-scoped job, then the worker opens a tenant-bound transaction before reading state or producing effects. Cache keys, Redis locks, rate limits, idempotency namespaces, object-store paths, metrics labels with private data, and WebSocket channels include or derive the tenant boundary.

## Identity, roles and passkeys

Google and Apple establish user identity; Perpeto sessions remain authoritative. A registered platform passkey provides phishing-resistant step-up authorization for credential enrollment, rotation, revocation, live arming, live disarming and other high-risk actions. The backend verifies challenge freshness, origin, RP ID, user verification, credential ownership and replay resistance.

A passkey is not used to derive the long-lived exchange-secret encryption key. Requiring the phone for every decrypt would prevent unattended trading, and retaining a device-derived key on the server would defeat that security claim. Instead, a successful passkey ceremony records a time-bounded, purpose-bound authorization; server workloads subsequently use their Vault identities and tenant policy while the authorization and live eligibility remain valid.

## Live execution boundary

Connector certification and account eligibility are distinct gates:

1. M3 certifies connector code and a venue/route at platform level through fixtures, contract tests, sandbox writes, reconciliation and read-only shadow evidence.
2. A trader enrolls a least-privilege credential using a passkey-authorized, one-use submission flow.
3. Perpeto validates credential permissions, account and margin mode, instrument coverage, balances, clocks, private streams, reconciliation and shadow behavior.
4. The trader reviews limits and explicitly arms live trading with a new passkey assertion and typed confirmation.
5. The engine may open M4 pilot risk only for that tenant, account and platform-certified route. Global and tenant breakers are both enforced.

M4 may grant only the controlled `PILOT` state. `CERTIFIED_LIVE` remains unavailable until M6 hardening is accepted and M7 rollout begins.

Disarming, credential revocation, tenant breaker activation or failed eligibility blocks new risk immediately. Flattening is explicit and policy-checked; revoking a credential before flattening may prevent Perpeto from closing venue positions, so the UI and runbook must explain and sequence that risk.

## Failure and blast-radius behavior

- Vault sealed or unavailable: reject enrollment and new live risk. Keep public monitoring available. Continue reconciliation and bounded risk reduction only when an already authenticated private session can do so safely; otherwise alert and require operator action.
- Database tenant context missing: fail the transaction. Never fall back to an unrestricted query.
- Private stream stale or reconciliation uncertain: stop new risk for the affected tenant/account and apply the connector's certified recovery policy.
- Tenant daily-loss, drawdown or account-health breach: halt that tenant without halting unrelated tenants.
- Platform integrity, market-data or connector-wide breach: activate the global breaker for affected routes or all new risk.
- Suspected credential disclosure: disarm, revoke at the exchange, invalidate the Perpeto credential version, reconcile externally, and preserve non-secret audit evidence.

The initial topology places the API, workloads, database and single Vault node on one VPS. It therefore has a shared host failure and compromise domain. M6 must add the approved hardening path, including tested recovery, stronger service isolation, Vault HA or managed auto-unseal, and static exchange egress where the venue supports IP allowlisting. Documentation and UI must not describe the initial topology as eliminating operator or host compromise risk.

## Data ownership summary

| Scope | Examples | Enforcement |
|---|---|---|
| Platform | public instruments, public books, connector certification, release metadata, global breaker | restricted platform roles and explicit read surfaces |
| Tenant | exchange accounts, credentials, balances, strategies, orders, positions, PnL, alerts, audits | authenticated tenant context, forced RLS, tenant-scoped service APIs |
| Operator-only | Vault unseal shares, root recovery material, host and deployment credentials | never stored in application DB, mobile app, image or repository |

Detailed secret lifecycle rules are in `KEY_MANAGEMENT.md`. Product requirements and delivery gates are in `PRODUCT_SPEC.md` and `MILESTONE.md`.
