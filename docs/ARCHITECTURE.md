# Perpeto Architecture

<!-- SHARED-CONTENT-VERSION: 3 -->

## Status and scope

This document describes the architecture Perpeto implements as a single-operator reference system (DEC-0015). The engine has four modes. PAPER uses live public data (DEC-0016). SANDBOX writes only to the operator's own testnet and demo accounts. SHADOW is read-only. LIVE is permanently fail-closed.

The isolation layer described below is implemented and retained as hardening, not as a release gate: personal tenants, forced RLS, passkey step-up, the Vault Transit store and the pilot gate. Where this document describes behaviour that only matters for real-money or multi-user live trading, it is design record.

## Live-data paper flow (M2)

```text
Binance / Bybit / OKX public REST + WebSocket   (no credentials)
          |
  connectors: instruments, funding, mark/index, order books
          |
  engine: MarketLeg per instrument --> scanner.scan_legs --> ranked opportunities
          |                                   |
  paper execution: fills simulated     freshness per leg; stale legs block entry
  against live book depth                     |
          |                                   v
  PostgreSQL (positions, fills, funding, PnL, alerts) --> API --> mobile / web client
```

- The engine already builds each `MarketLeg` from `connector.market_stream` and `connector.current_funding` (`bins/engine/src/main.rs`). M2 makes that path available in PAPER through the keyless public endpoints only.
- Fixture replay (`PERPETO_PAPER_SOURCE=fixtures`, with `PERPETO_SIM_START` and `PERPETO_SIM_TICK_SECS`) remains an explicit selection for deterministic tests.
- **One snapshot per tick.** Every tick, the engine takes one `MarketSnapshot` and uses it for venue breakers, position supervision, ranking and strategy auto-entry. It persists the snapshot with the scan (`scan_runs.market_snapshot`). `POST /positions` opens against that stored snapshot, and only while it is fresh. Each leg fills at the VWAP of walking its captured book; thin books (`INSUFFICIENT_DEPTH`) and degraded legs (`VENUE_DEGRADED`) are refused.
- PAPER never constructs a `SecretStore` read path, opens a private stream or calls a submit method.

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

## Execution boundary

External writes are permitted only in SANDBOX, and only to a connector account explicitly configured for a testnet or demo environment (DEC-0011). The implemented gate chain stays in place so that no shortcut path can submit externally:
- passkey-authorized credential enrollment;
- account preflight to `ELIGIBLE`;
- pilot arming;
- `permit_live_risk`.

Global and tenant breakers are both enforced. Disarming, credential revocation, breaker activation or failed eligibility blocks new risk immediately, and disarm escalates to flatten.

Production routes stay unreachable because LIVE is locked. Route certification states (`PILOT`, `CERTIFIED_LIVE`) exist in code but are not pursued (DEC-0015, DEC-0018).

## Failure and blast-radius behavior

- Vault sealed or unavailable: reject enrollment and new live risk. Keep public monitoring available. Continue reconciliation and bounded risk reduction only when an already authenticated private session can do so safely; otherwise alert and require operator action.
- Database tenant context missing: fail the transaction. Never fall back to an unrestricted query.
- Private stream stale or reconciliation uncertain: stop new risk for the affected tenant/account and apply the connector's certified recovery policy.
- Tenant daily-loss, drawdown or account-health breach: halt that tenant without halting unrelated tenants.
- Platform integrity, market-data or connector-wide breach: activate the global breaker for affected routes or all new risk.
- Suspected credential disclosure: disarm, revoke at the exchange, invalidate the Perpeto credential version, reconcile externally, and preserve non-secret audit evidence.

The topology places the API, workloads, database and, when deployed, a single Vault node on one VPS. It is one shared host failure and compromise domain. That is acceptable for paper and testnet scope. Vault HA, auto-unseal and stronger infrastructure isolation are deferred (DEC-0018). Documentation and UI must not describe the topology as eliminating operator or host compromise risk.

## Data ownership summary

| Scope | Examples | Enforcement |
|---|---|---|
| Platform | public instruments, public books, connector certification, release metadata, global breaker | restricted platform roles and explicit read surfaces |
| Tenant | exchange accounts, credentials, balances, strategies, orders, positions, PnL, alerts, audits | authenticated tenant context, forced RLS, tenant-scoped service APIs |
| Operator-only | Vault unseal shares, root recovery material, host and deployment credentials | never stored in application DB, mobile app, image or repository |

Detailed secret lifecycle rules are in `KEY_MANAGEMENT.md`. Product requirements and delivery gates are in `PRODUCT_SPEC.md` and `MILESTONE.md`.
