import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SessionStore, StoredSession } from "./sessionStore";

/**
 * The controller's contract: sessions are accepted only once the refresh
 * credential is safely stored, invalidating server codes wipe local state, and
 * provider cancellation is not an error. The API client and native provider
 * modules are replaced so the flows run in Node.
 */
const client = {
  refresh: vi.fn(),
  me: vi.fn(),
  createSocialChallenge: vi.fn(),
  exchangeSocialAuthorization: vi.fn(),
  bootstrap: vi.fn(),
  linkIdentity: vi.fn(),
  verifyMfa: vi.fn(),
  enrollMfa: vi.fn(),
  confirmMfa: vi.fn(),
  acknowledgeRecoveryCodes: vi.fn(),
  logout: vi.fn(),
  deleteAccount: vi.fn(),
};
let clientOptions: { baseUrl: string; getAccessToken: () => string | undefined } | undefined;

class FakeApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
class FakeCancellation extends Error {}

vi.mock("@ayenisholah/perpeto-api-client", () => ({
  PerpetoApiError: FakeApiError,
  PerpetoClient: class {
    constructor(options: typeof clientOptions) {
      clientOptions = options;
      return client;
    }
  },
}));
vi.mock("expo-constants", () => ({
  default: { expoConfig: { version: "9.9.9", extra: { apiBaseUrl: "https://api.example.test" } } },
}));
vi.mock("expo-device", () => ({ deviceName: "Test iPhone" }));
vi.mock("./providers", () => ({
  ProviderCancellation: FakeCancellation,
  createPkce: vi.fn(async () => ({ verifier: "v".repeat(43), challenge: "pkce-challenge" })),
  authorizeProvider: vi.fn(async () => ({ authorizationCode: "code", identityToken: "id-token" })),
}));
vi.mock("./sessionStore", () => ({
  isSessionInvalidatingCode: (code: string) => code === "SESSION_REVOKED",
}));

const { AuthController } = await import("./controller");
const providers = await import("./providers");

const session = {
  access_token: "access",
  access_token_expires_at: "2026-11-22T00:00:00Z",
  refresh_token: "refresh",
  session_id: "session",
  device_id: "device",
};
const user = { id: "user", status: "ACTIVE" };

function memoryStore(initial: StoredSession | null = null): SessionStore & { saved: StoredSession | null } {
  return {
    saved: initial,
    read: vi.fn(async function (this: { saved: StoredSession | null }) {
      return this.saved;
    }),
    write: vi.fn(async function (this: { saved: StoredSession | null }, value: StoredSession) {
      this.saved = value;
    }),
    clear: vi.fn(async function (this: { saved: StoredSession | null }) {
      this.saved = null;
    }),
    installationId: vi.fn(async () => "installation-id-0000"),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  client.createSocialChallenge.mockResolvedValue({ id: "challenge" });
  client.me.mockResolvedValue(user);
});

describe("AuthController", () => {
  it("targets the configured API and exposes the access token only after a session", async () => {
    const controller = new AuthController(memoryStore());
    expect(clientOptions?.baseUrl).toBe("https://api.example.test");
    expect(clientOptions?.getAccessToken()).toBeUndefined();
    client.verifyMfa.mockResolvedValue(session);
    await controller.verifyMfa("challenge", "123456", false);
    expect(clientOptions?.getAccessToken()).toBe("access");
    expect(controller.client).toBe(client);
  });

  it("restores nothing without a stored session", async () => {
    const store = memoryStore();
    await expect(new AuthController(store).restore()).resolves.toBeNull();
    expect(client.refresh).not.toHaveBeenCalled();
  });

  it("refreshes, persists the rotated credential and loads the user", async () => {
    const store = memoryStore({ refreshToken: "old", deviceId: "device" });
    client.refresh.mockResolvedValue(session);
    await expect(new AuthController(store).restore()).resolves.toEqual(user);
    expect(client.refresh).toHaveBeenCalledWith("old", "device");
    expect(store.saved).toEqual({ refreshToken: "refresh", deviceId: "device" });
  });

  it("wipes local state when the server invalidates the session", async () => {
    const store = memoryStore({ refreshToken: "old", deviceId: "device" });
    client.refresh.mockRejectedValue(new FakeApiError(401, "SESSION_REVOKED", "revoked"));
    await expect(new AuthController(store).restore()).rejects.toThrow("revoked");
    expect(store.saved).toBeNull();
  });

  it("keeps the stored credential on a transient failure", async () => {
    const store = memoryStore({ refreshToken: "old", deviceId: "device" });
    client.refresh.mockRejectedValue(new FakeApiError(503, "SERVICE_UNAVAILABLE", "down"));
    await expect(new AuthController(store).restore()).rejects.toThrow("down");
    expect(store.saved).toEqual({ refreshToken: "old", deviceId: "device" });
  });

  it("refuses the session when the refresh credential cannot be stored", async () => {
    const store = memoryStore();
    vi.mocked(store.write).mockRejectedValue(new Error("keychain"));
    client.verifyMfa.mockResolvedValue(session);
    const controller = new AuthController(store);
    await expect(controller.verifyMfa("challenge", "123456", false)).rejects.toThrow(
      "could not protect the refresh credential",
    );
    expect(clientOptions?.getAccessToken()).toBeUndefined();
    expect(store.clear).toHaveBeenCalled();
  });

  it("exchanges a provider proof with PKCE and the device registration", async () => {
    const store = memoryStore();
    client.exchangeSocialAuthorization.mockResolvedValue({ next: "AUTHENTICATED", user, session });
    const result = await new AuthController(store).signIn("GOOGLE");
    expect(result.cancelled).toBe(false);
    expect(client.createSocialChallenge).toHaveBeenCalledWith("GOOGLE", "signex://auth/callback", "pkce-challenge");
    expect(client.exchangeSocialAuthorization).toHaveBeenCalledWith(
      expect.objectContaining({
        challenge_id: "challenge",
        authorization_code: "code",
        identity_token: "id-token",
        code_verifier: "v".repeat(43),
        device: {
          installation_id: "installation-id-0000",
          platform: "IOS",
          app_version: "9.9.9",
          display_name: "Test iPhone",
        },
      }),
    );
    expect(store.saved).toEqual({ refreshToken: "refresh", deviceId: "device" });
  });

  it("does not store anything when the exchange returns no session", async () => {
    const store = memoryStore();
    client.exchangeSocialAuthorization.mockResolvedValue({ next: "PENDING_APPROVAL", user });
    await new AuthController(store).signIn("APPLE");
    expect(store.write).not.toHaveBeenCalled();
  });

  it("treats provider cancellation as a non-error", async () => {
    vi.mocked(providers.authorizeProvider).mockRejectedValueOnce(new FakeCancellation());
    const result = await new AuthController(memoryStore()).signIn("APPLE");
    expect(result.cancelled).toBe(true);
    expect(client.exchangeSocialAuthorization).not.toHaveBeenCalled();
  });

  it("propagates other provider failures", async () => {
    vi.mocked(providers.authorizeProvider).mockRejectedValueOnce(new Error("network"));
    await expect(new AuthController(memoryStore()).signIn("APPLE")).rejects.toThrow("network");
  });

  it("development sign-in never calls the native provider", async () => {
    client.exchangeSocialAuthorization.mockResolvedValue({ next: "AUTHENTICATED", user, session });
    await new AuthController(memoryStore()).signInDev();
    expect(providers.authorizeProvider).not.toHaveBeenCalled();
    expect(client.exchangeSocialAuthorization).toHaveBeenCalledWith(
      expect.objectContaining({ identity_token: expect.stringMatching(/^perpeto-dev:/u) }),
    );
  });

  it("links an identity with a fresh provider proof and optional TOTP", async () => {
    await new AuthController(memoryStore()).linkIdentity("APPLE", "123456");
    expect(client.createSocialChallenge).toHaveBeenCalledWith(
      "APPLE",
      "signex://auth/link",
      "pkce-challenge",
      "LINK_IDENTITY",
    );
    expect(client.linkIdentity).toHaveBeenCalledWith(expect.objectContaining({ totp_code: "123456" }));
  });

  it("delegates bootstrap and MFA enrollment", async () => {
    const controller = new AuthController(memoryStore());
    client.bootstrap.mockResolvedValue({ next: "AUTHENTICATED", user });
    client.enrollMfa.mockResolvedValue({ secret: "s" });
    client.confirmMfa.mockResolvedValue({ recovery_codes: ["a", "b"] });
    await expect(controller.bootstrap("token")).resolves.toEqual({ next: "AUTHENTICATED", user });
    await expect(controller.beginMfaEnrollment()).resolves.toEqual({ secret: "s" });
    await expect(controller.confirmMfaEnrollment("challenge", "123456")).resolves.toEqual(["a", "b"]);
  });

  it("accepts the session after recovery codes are acknowledged", async () => {
    const store = memoryStore();
    client.acknowledgeRecoveryCodes.mockResolvedValue(session);
    await expect(new AuthController(store).acknowledgeRecoveryCodes("challenge", "digest")).resolves.toEqual({
      session,
      user,
    });
    expect(store.saved).not.toBeNull();
  });

  it.each(["logout", "deleteAccount"] as const)("%s clears local state even when the call fails", async (method) => {
    const store = memoryStore({ refreshToken: "r", deviceId: "d" });
    client[method].mockRejectedValue(new Error("offline"));
    await expect(new AuthController(store)[method]()).rejects.toThrow("offline");
    expect(store.saved).toBeNull();
  });
});
