import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The native store's guarantees: the device binding is written before the
 * refresh token, a failed token write rolls the binding back, and clearing is
 * best-effort across both keys. Expo's native modules are replaced with an
 * in-memory keychain so the ordering can be observed.
 */
const keychain = new Map<string, string>();
const calls: string[] = [];
let failTokenWrite = false;

vi.mock("react-native", () => ({ Platform: { OS: "ios" } }));
vi.mock("expo-crypto", () => ({
  getRandomBytesAsync: vi.fn(async (length: number) => new Uint8Array(length).fill(0xab)),
}));
vi.mock("expo-secure-store", () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: "WHEN_UNLOCKED_THIS_DEVICE_ONLY",
  getItemAsync: vi.fn(async (key: string) => keychain.get(key) ?? null),
  setItemAsync: vi.fn(async (key: string, value: string) => {
    calls.push(`set:${key}`);
    if (failTokenWrite && key.includes("refresh-token")) throw new Error("keychain locked");
    keychain.set(key, value);
  }),
  deleteItemAsync: vi.fn(async (key: string) => {
    calls.push(`delete:${key}`);
    keychain.delete(key);
  }),
}));

const { platformSessionStore, secureSessionStore } = await import("./sessionStore");

const TOKEN = "signex.auth.refresh-token.v1";
const DEVICE = "signex.auth.device-id.v1";

beforeEach(() => {
  keychain.clear();
  calls.length = 0;
  failTokenWrite = false;
});

describe("secure session store", () => {
  it("uses the keychain-backed store on native platforms", () => {
    expect(platformSessionStore).toBe(secureSessionStore);
  });

  it("reads nothing until both halves of the session exist", async () => {
    await expect(secureSessionStore.read()).resolves.toBeNull();
    keychain.set(TOKEN, "refresh");
    await expect(secureSessionStore.read()).resolves.toBeNull();
    keychain.set(DEVICE, "device");
    await expect(secureSessionStore.read()).resolves.toEqual({ refreshToken: "refresh", deviceId: "device" });
  });

  it("writes the device binding before the refresh token", async () => {
    await secureSessionStore.write({ refreshToken: "refresh", deviceId: "device" });
    expect(calls).toEqual([`set:${DEVICE}`, `set:${TOKEN}`]);
  });

  it("rolls the device binding back when the token write fails", async () => {
    failTokenWrite = true;
    await expect(secureSessionStore.write({ refreshToken: "refresh", deviceId: "device" })).rejects.toThrow(
      "keychain locked",
    );
    expect(keychain.has(DEVICE)).toBe(false);
    expect(keychain.has(TOKEN)).toBe(false);
  });

  it("clears both keys", async () => {
    keychain.set(TOKEN, "refresh");
    keychain.set(DEVICE, "device");
    await secureSessionStore.clear();
    expect(keychain.size).toBe(0);
  });

  it("generates a stable 64-character installation id once", async () => {
    const first = await secureSessionStore.installationId();
    expect(first).toBe("ab".repeat(32));
    keychain.set("signex.device.installation-id.v1", "existing");
    await expect(secureSessionStore.installationId()).resolves.toBe("existing");
  });
});
