/**
 * Native WebAuthn ceremony seam.
 *
 * The backend issues opaque `navigator.credentials`-style options; a native
 * authenticator turns them into a credential/assertion. That native module
 * requires an EAS development build (AuthenticationServices on iOS), which is
 * not yet provisioned, so these functions throw a typed, user-legible error
 * until the device build exists. The UI is wired against this seam now so only
 * the implementation — not the call sites — changes later.
 */

export class PasskeyCeremonyUnavailableError extends Error {
  constructor() {
    super("Passkeys need a Perpeto development build on this device. This will be enabled soon.");
    this.name = "PasskeyCeremonyUnavailableError";
  }
}

/** Perform a registration ceremony, returning the WebAuthn attestation JSON. */
export async function createPasskeyCredential(
  _options: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  throw new PasskeyCeremonyUnavailableError();
}

/** Perform an assertion ceremony, returning the WebAuthn assertion JSON. */
export async function getPasskeyAssertion(
  _options: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  throw new PasskeyCeremonyUnavailableError();
}
