# Perpeto Overview

<!-- SHARED-CONTENT-VERSION: 2 -->

## What problem does Perpeto solve?

Funding-rate arbitrage requires continuously comparing incompatible venue data, estimating returns after costs, coordinating two non-atomic leveraged trades, and recovering safely when one venue fills while another fails. Perpeto runs that work continuously on an operator-managed VPS and gives traders a mobile control surface.

The product is becoming a multi-user service: one shared Perpeto deployment serves many independent traders who install the iOS or Android app and connect their own exchange accounts. Each trader has one personal tenant. Funds remain at the exchange, and Perpeto receives only read-and-trade credentials without withdrawal, transfer, API-administration, or unrelated account permissions.

## Target operating model

- The operator brings and administers the VPS, PostgreSQL, Redis, Vault, DNS, TLS, monitoring, backups, and releases.
- Each trader brings their own supported CEX credentials and explicitly arms live automation for their tenant.
- The server keeps executing authorized strategies while the phone is offline; a phone passkey authorizes sensitive changes but is not the persistent decryption key.
- PostgreSQL row-level security and tenant-scoped repositories isolate trader data inside the shared database.
- HashiCorp Vault Transit protects exchange credentials with a distinct key per tenant. Runtime services receive narrow encrypt/decrypt capabilities, not Vault root credentials.
- Public market data and certified connector code may be shared. Private streams, account state, risk, orders, positions, alerts, audit records, breakers, and credentials are tenant-scoped.

The current implementation does not yet provide these multi-user live guarantees. M3 certifies CEX connector behavior; M4 adds tenant isolation, passkey-authorized credential enrollment, Vault-backed secrets, account preflight, and limited live execution. Until M4 passes its acceptance gates, external writes remain restricted to certified sandbox environments and live mode remains fail-closed.

## Product objectives

- Rank executable opportunities by conservative net return rather than headline funding.
- Keep unmatched exposure bounded and visible during every failure mode.
- Make commands idempotent and every decision, intent, fill, funding payment, risk event, credential action, and operator action auditable.
- Permit unattended server-side automation without placing exchange secrets or execution logic on the mobile device.
- Prevent one trader from reading, controlling, or consuming another trader's data, credentials, limits, or idempotency namespace.
- Certify connector routes once at the platform level, then preflight every connected account before that account can enter live trading.

Perpeto does not guarantee profit, atomic cross-venue fills, funding receipt, liquidity, or venue safety. A read-and-trade key can still lose all capital available to it, so account isolation, limited balances, hard risk controls, monitoring, and rapid revocation remain mandatory.
