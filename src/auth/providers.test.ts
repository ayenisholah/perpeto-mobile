import type { SocialChallenge } from "@ayenisholah/perpeto-api-client";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Provider adapters: PKCE material is RFC 7636 base64url, the Apple and Google
 * proofs require every server-verified field, and user cancellation maps to
 * `ProviderCancellation` rather than an error. Native SDKs are replaced.
 */
const apple = { signInAsync: vi.fn() };
const google = { configure: vi.fn(), signIn: vi.fn() };
const extra: Record<string, unknown> = {};

vi.mock("expo-apple-authentication", () => ({
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
  signInAsync: (...args: unknown[]) => apple.signInAsync(...args),
}));
vi.mock("@react-native-google-signin/google-signin", () => ({ GoogleSignin: google }));
vi.mock("expo-constants", () => ({ default: { expoConfig: { extra } } }));
vi.mock("expo-crypto", () => ({
  CryptoDigestAlgorithm: { SHA256: "SHA-256" },
  CryptoEncoding: { BASE64: "base64" },
  getRandomBytesAsync: vi.fn(async (length: number) => new Uint8Array(length).fill(0xfb)),
  digestStringAsync: vi.fn(async () => "ab+/cd=="),
}));

const { authorizeProvider, base64Url, createPkce, ProviderCancellation } = await import("./providers");

const challenge: SocialChallenge = {
  id: "c",
  provider: "APPLE",
  state: "state",
  nonce: "nonce",
  expires_at: "2026-11-22T00:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  for (const key of Object.keys(extra)) delete extra[key];
});

describe("PKCE", () => {
  it("encodes base64url without padding", () => {
    expect(base64Url(new Uint8Array([0xfb, 0xff]))).toBe("-_8");
  });

  it("derives a 64-byte verifier and a url-safe S256 challenge", async () => {
    const pkce = await createPkce();
    expect(pkce.verifier).toMatch(/^[A-Za-z0-9_-]{86}$/u);
    expect(pkce.challenge).toBe("ab-_cd");
  });
});

describe("Apple", () => {
  it("binds state and nonce and returns the full proof", async () => {
    apple.signInAsync.mockResolvedValue({
      authorizationCode: "code",
      identityToken: "token",
      fullName: { givenName: "Ada", familyName: "Lovelace" },
    });
    await expect(authorizeProvider("APPLE", challenge)).resolves.toEqual({
      authorizationCode: "code",
      identityToken: "token",
      displayName: "Ada Lovelace",
    });
    expect(apple.signInAsync).toHaveBeenCalledWith(expect.objectContaining({ state: "state", nonce: "nonce" }));
  });

  it("omits an empty display name", async () => {
    apple.signInAsync.mockResolvedValue({
      authorizationCode: "code",
      identityToken: "token",
      fullName: { givenName: null, familyName: null },
    });
    await expect(authorizeProvider("APPLE", challenge)).resolves.toMatchObject({ displayName: undefined });
  });

  it("rejects a proof missing its identity token", async () => {
    apple.signInAsync.mockResolvedValue({ authorizationCode: "code", identityToken: null, fullName: null });
    await expect(authorizeProvider("APPLE", challenge)).rejects.toThrow("Apple identity token");
  });

  it("maps user cancellation", async () => {
    apple.signInAsync.mockRejectedValue(Object.assign(new Error("cancel"), { code: "ERR_REQUEST_CANCELED" }));
    await expect(authorizeProvider("APPLE", challenge)).rejects.toBeInstanceOf(ProviderCancellation);
  });

  it("propagates other failures", async () => {
    apple.signInAsync.mockRejectedValue(new Error("boom"));
    await expect(authorizeProvider("APPLE", challenge)).rejects.toThrow("boom");
  });
});

describe("Google", () => {
  it("refuses to run without both client ids", async () => {
    extra.googleIosClientId = "ios";
    await expect(authorizeProvider("GOOGLE", challenge)).rejects.toThrow("not configured");
    expect(google.signIn).not.toHaveBeenCalled();
  });

  it("requests offline access and returns the server code", async () => {
    extra.googleIosClientId = "ios";
    extra.googleWebClientId = "web";
    google.signIn.mockResolvedValue({ type: "success", data: { serverAuthCode: "code", idToken: "token" } });
    await expect(authorizeProvider("GOOGLE", challenge)).resolves.toEqual({
      authorizationCode: "code",
      identityToken: "token",
    });
    expect(google.configure).toHaveBeenCalledWith({ iosClientId: "ios", webClientId: "web", offlineAccess: true });
  });

  it("maps cancellation", async () => {
    extra.googleIosClientId = "ios";
    extra.googleWebClientId = "web";
    google.signIn.mockResolvedValue({ type: "cancelled" });
    await expect(authorizeProvider("GOOGLE", challenge)).rejects.toBeInstanceOf(ProviderCancellation);
  });

  it("rejects a missing server authorization code", async () => {
    extra.googleIosClientId = "ios";
    extra.googleWebClientId = "web";
    google.signIn.mockResolvedValue({ type: "success", data: { serverAuthCode: null, idToken: "token" } });
    await expect(authorizeProvider("GOOGLE", challenge)).rejects.toThrow("Google server authorization code");
  });
});
