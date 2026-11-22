import { describe, expect, it } from "vitest";

import { createPasskeyCredential, getPasskeyAssertion, PasskeyCeremonyUnavailableError } from "./passkeys";

describe("passkey ceremony seam", () => {
  it.each([
    ["registration", createPasskeyCredential],
    ["assertion", getPasskeyAssertion],
  ] as const)("%s fails with a typed, user-legible error until a device build exists", async (_name, ceremony) => {
    const failure = ceremony({});
    await expect(failure).rejects.toBeInstanceOf(PasskeyCeremonyUnavailableError);
    await expect(failure).rejects.toThrow("development build");
  });
});
