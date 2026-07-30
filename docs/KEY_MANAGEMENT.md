# Exchange Credential and Key Management

<!-- SHARED-CONTENT-VERSION: 1 -->

## Status and security objective

This is the accepted M4 target design. The current environment-master-key and server-side CLI flow is transitional and is not approved for shared multi-user live trading.

The Vault Transit **application backend** has landed in code (`crates/venue-service/src/vault.rs`, a `VaultTransitSecretStore` behind the existing `SecretStore` trait, selected when `PERPETO_VAULT_ADDR` is set), now including the **ciphertext-rewrap** path: a `SecretStore::rewrap` primitive (Vault via Transit's native `rewrap` endpoint, gated on a dedicated `PERPETO_VAULT_REWRAP_TOKEN`; the transitional AES store via a decrypt-only keyring) driven by a scheduled `bins/rewrap` worker that migrates non-revoked credentials to the current key version. The operator **infrastructure** below — deploying Vault with integrated storage and TLS, creating the per-tenant Transit keys, 2-of-3 Shamir initialization, workload auth/policies, token rotation (including the rewrap token), and custodian runbooks — remains to be provisioned, and the store (including live rewrap) is unverified against a live Vault until then.

The **enrollment flow** below now has an API path: the `venue-credentials` endpoints (`bins/api`) drive `CredentialEnrollmentService` (`crates/venue-service/src/enrollment.rs`), which requires a one-use passkey `ActionProof` bound to the exact action, writes the secret only through the encrypt-only `SecretStore.put`, persists ciphertext plus masked metadata, and returns no credential material. Enrollment leaves the connection `PENDING_PREFLIGHT`; an owner/trader **preflight endpoint** (`preflight_credential`) now performs the declared-permission checks and a live `ReconciliationService.run`, recording `ELIGIBLE`/`PREFLIGHT_FAILED` (step 5). The config half runs now; the live reconciliation reaches `ELIGIBLE` only with testnet credentials, and a scheduled preflight worker plus credential deletion remain deferred. `venue-admin import`/`rotate` stay only as transitional/dev tooling.

Perpeto must execute authorized strategies while a trader's phone is offline without exposing raw exchange credentials to the database, logs, mobile storage, backups, support tooling or other tenants. A device passkey authorizes sensitive lifecycle actions; HashiCorp Vault Transit is the persistent cryptographic control plane.

## Credential policy

Every trader creates a dedicated Perpeto credential for each connected CEX account. It must have only the venue's required read and spot/derivatives trading permissions. Withdrawals, external or internal transfers, API-key administration, subaccount administration, convert, earn, P2P and unrelated products are prohibited. IP allowlisting is required when the deployment has a stable egress address and the venue supports it.

Perpeto validates inspectable permissions and requires a venue-specific checklist for permissions the API cannot report. A permission change, credential version change, account-mode change or failed private preflight removes live eligibility until revalidated. Least-privilege credentials can still lose trading capital; traders should use isolated accounts or subaccounts and limit funded balances.

## Cryptographic design

- Run an always-on HashiCorp Vault service with integrated durable storage and TLS/authenticated local networking.
- Create one non-exportable Transit encryption key per tenant. Key names use opaque tenant identifiers, not email addresses or exchange account names.
- Store only Vault ciphertext, credential version, masked key metadata, venue/account identifiers, validation state and audit timestamps in PostgreSQL.
- Bind encryption context to the tenant, venue account, credential record, purpose and schema version so ciphertext cannot be substituted across records.
- Give the API an encrypt-only path for enrollment. Give execution/reconciliation workloads a purpose-limited decrypt path only for eligible tenant credential records. Neither receives Vault root tokens, unseal shares or permission to manage arbitrary keys.
- Rotate Vault tokens automatically using short leases and workload authentication. Rotate tenant Transit key versions without requiring immediate exchange-key replacement; rewrap stored ciphertext through an audited job.
- Initialize Vault with a 2-of-3 Shamir unseal quorum. Three separate custodians or recovery locations hold the shares. Shares and the initial root token never enter environment files, Compose manifests, CI, application logs, backups or the mobile app. Revoke the initial root token after bootstrap and keep a tested, audited break-glass process.

## Enrollment flow

1. The authenticated trader starts enrollment for a specific tenant and venue. The API returns a short-lived, one-use operation and WebAuthn challenge.
2. The mobile app collects the credential in an ephemeral form and obtains a user-verified passkey assertion bound to the exact action and account metadata.
3. The API verifies session, tenant, credential ownership, challenge, origin, RP ID, counter/replay signals and operation expiry.
4. The API sends the secret directly to the tenant's Vault Transit encrypt path, zeroizes request buffers where practical, and persists only ciphertext and masked metadata.
5. A preflight worker decrypts only for the named account, validates permissions and account configuration, opens private read streams, reconciles balances/orders/positions, and records the result.
6. The API invalidates the one-use operation. Raw credentials are never returned by any endpoint or echoed in error responses.

Mobile clients must avoid analytics, crash capture, screenshots and clipboard use on credential fields. The app clears the form on backgrounding, cancellation, timeout or completion. TLS protects transport, but TLS is not a substitute for Vault encryption and tenant authorization.

## Rotation, revocation and deletion

Rotation enrolls a new exchange credential version, validates it, atomically switches eligible workloads, then retires the previous version. A rollback window may retain the old ciphertext in a disabled state, but it must never be silently reactivated.

Revocation is passkey-authorized and immediately disarms new risk. The trader should first flatten or deliberately accept externally managed positions, then revoke the key at the exchange. Perpeto marks the version revoked, terminates private sessions, clears credential caches, reconciles what remains observable and emits an audit/alert record. Emergency operator action may disarm use but cannot impersonate a trader to reveal or export a credential.

Tenant deletion disables automation, requires positions and unresolved workflows to be addressed, destroys the tenant Transit key after the retention decision, removes credential ciphertext under the deletion policy, and retains only non-secret pseudonymous evidence required for audit. Destroying a Transit key is irreversible and must use an explicit delayed, audited workflow.

## Runtime handling

Decrypt only immediately before connector authentication or request signing. Keep plaintext lifetime and process scope minimal; never persist it to disk, Redis, traces, panic reports, metrics or queues. Logs use a central redaction policy and masked identifiers. Core dumps and swap are disabled or encrypted according to the deployment hardening profile.

Connector instances and private-stream sessions are tenant/account-bound. Plaintext is not pooled between tenants. Cache entries have short bounded lifetimes, explicit zeroization where supported, and are invalidated by disarm, rotation, revocation, breaker activation and lease failure.

The mobile passkey does not decrypt exchange secrets and the mobile app cannot retrieve them. Passkey loss is handled by registered recovery and new-device policy, not by storing a recoverable secret copy on the device.

## Sealed and recovery behavior

After a VPS or Vault restart, two custodians provide their shares over an authenticated operator channel to unseal Vault. Until unsealed, Perpeto reports a prominent degraded state, rejects credential changes and new live risk, and sends no operation that requires a fresh decrypt. Paper operation and public monitoring may continue.

Backups contain Vault's encrypted storage and PostgreSQL ciphertext, never unseal shares. Recovery tests must prove that authorized custodians can restore both stores, preserve tenant/key mappings and re-establish leases without exposing plaintext. Loss of enough unseal shares makes credentials unrecoverable; loss or theft of sufficient shares is a security incident.

## Required evidence before M4 live use

- Cross-tenant authorization, forced-RLS and ciphertext-substitution tests.
- Passkey challenge, replay, origin/RP ID, lost-device and recovery tests.
- Vault policy tests proving API cannot decrypt, workloads cannot manage keys, and tenants cannot cross key paths.
- Secret-redaction and crash/log inspection tests.
- Rotation, revocation, sealed-start, restore and 2-of-3 unseal exercises.
- Venue permission checks showing withdrawal/transfer/admin capabilities are absent.
- Account preflight and explicit live-arm evidence for every enabled tenant/account.

No production live mode is permitted if any of these controls is replaced by a shared plaintext environment variable, a global application master key, client-side recoverable encryption, or a reusable unscoped Vault token.
