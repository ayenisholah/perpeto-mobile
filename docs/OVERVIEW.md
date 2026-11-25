# Perpeto Overview

<!-- SHARED-CONTENT-VERSION: 4 -->

## What Perpeto is

Perpeto is a public, self-hostable **reference implementation** of a market-neutral funding-rate arbitrage system. It has a Rust control plane and an Expo operations client. It paper-trades on real public market data from Binance, Bybit and OKX, and can run execution against the operator's own testnet and demo accounts. It is built to be read, run and judged by engineers. It is not a trading service.

## What problem does it demonstrate?

Funding-rate arbitrage looks simple and is not. A credible system has to:

- compare incompatible venue data;
- rank routes by conservative net return after fees, slippage and exit costs rather than headline funding;
- coordinate two non-atomic legs;
- bound unmatched exposure;
- recover deterministically when one venue fills and the other fails or times out;
- reconcile everything back to the venue's own records.

Perpeto implements those parts end to end and keeps the evidence for each claim in the repository.

## Who it is for

- **Reviewers and engineers**, who should be able to see it working within five minutes: open the live paper demo, run it locally with one command, and trace any claim to a test, decision or runbook.
- **The operator** (the maintainer), who runs one deployment on one VPS. It runs paper mode on live public data, plus optional testnet execution with the operator's own least-privilege test accounts.

## Operating model

- **PAPER** is the default and the public demo mode. It reads keyless public market data, simulates fills against live order books, and never loads exchange credentials or submits externally. Fixture replay stays for deterministic tests.
- **SANDBOX** submits only to explicitly configured testnet or demo accounts owned by the operator.
- **SHADOW** reads production data and records decisions without submitting.
- **LIVE** is permanently fail-closed. Real-money trading is a non-goal.

The isolation and security layer is already built and stays in the codebase as hardening rather than as a release gate. It covers:

- personal tenants with forced PostgreSQL row-level security;
- passkey-authorized sensitive actions;
- a Vault Transit secret store;
- credential lifecycle and preflight;
- the pilot gate;
- a hash-chained audit log.

## Product objectives

- Rank executable opportunities by conservative net return.
- Keep unmatched exposure bounded and visible during every failure mode, including restarts, reconnects and ambiguous order responses.
- Make commands idempotent and every decision, intent, fill, funding payment, risk event and operator action auditable.
- Keep execution logic and exchange secrets on the server. The mobile client is an operations surface only.
- Make every milestone closable by one maintainer without real capital, and record its evidence in the repository.

## Non-goals

- Real-money trading for anyone, including the operator. LIVE stays locked.
- A multi-user trading service, a commercial launch or a public app-store release.
- DEX connectors and transaction signing (dYdX, Hyperliquid).
- Treasury, rebalancing and transfer workflows.
- Telegram or Discord channels.
- Platform certification soaks and limited-capital pilots.

Perpeto does not guarantee profit, atomic cross-venue fills, funding receipt, liquidity or venue safety. Nothing in this repository is investment advice.
