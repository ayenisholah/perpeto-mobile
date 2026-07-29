# Engineering Standard

This document defines how changes are made across the Perpeto backend and mobile repositories. It is
a shared document: the canonical copy lives in the backend repository and is synchronized to the
mobile repository.

## Source precedence

Resolve project truth in this order:

1. `docs/PRODUCT_SPEC.md`
2. accepted entries in `docs/DECISION.md`
3. `docs/ARCHITECTURE.md` and `docs/KEY_MANAGEMENT.md` for their declared target milestone and security boundaries
4. published OpenAPI and event schemas for implemented wire behavior
5. `docs/IMPLEMENTATION.md` and `docs/MILESTONE.md`
6. `docs/TRACEABILITY.md`, `docs/PROGRESS.md`, and `README.md`

Stop and request a decision when higher-priority sources conflict. Never silently choose an interpretation.

## Required workflow

Before editing, identify the specification section, decision IDs, acceptance criteria, and affected risk boundary. Keep the change within one milestone-sized objective. After editing, run proportionate checks, update `docs/CHANGELOG.md`, and update `docs/TRACEABILITY.md`, `docs/PROGRESS.md`, `docs/MILESTONE.md`, or `docs/DECISION.md` when their facts changed.

Never record a command as passing unless it ran. Record unavailable tooling or external dependencies as blockers. Do not convert missing behavior into a mocked success response.

## Non-negotiable invariants

- Trading logic and venue credentials remain server-side.
- Decimal money, rates, prices, quantities, and PnL never use IEEE floating point.
- Commands and external effects are idempotent, versioned, correlated, and audited.
- Unknown order outcomes are reconciled before retry.
- PostgreSQL is durable truth; Redis must be rebuildable.
- Exactly one execution leader may submit external effects.
- Entries fail closed on stale data, bad clock, unresolved reconciliation, risk freeze, or missing leader lease.
- CEX withdrawal permission and arbitrary DEX transfer signing are prohibited.
- Live mode remains unavailable until the applicable certification evidence is accepted.
- The mobile client never contains venue credentials, signing material, or trading algorithms.
- Mobile mutations are blocked while offline, stale, version-incompatible, or missing a current server preview.
- Biometrics may unlock a stored refresh credential but never replace server-side step-up authentication.

## Evidence and sourcing

Exchange semantics, endpoints, payloads, funding signs, account modes, risk defaults, package versions, and schema fields must come from an authoritative source rather than from assumption. Connector behavior must cite current official venue documentation and be captured in contract fixtures. Test results and operational evidence are recorded only from runs that actually happened.

Do not weaken a test, risk gate, security boundary, or audit record to make CI pass. Do not add dependencies without documenting why the standard library or an existing dependency is insufficient.

## Completion standard

A change is complete only when implementation, tests, schemas, documentation, observability, failure behavior, and rollback implications agree. TODOs, placeholders, skipped tests, and scaffold behavior must remain visibly labelled and cannot satisfy a milestone exit criterion.
