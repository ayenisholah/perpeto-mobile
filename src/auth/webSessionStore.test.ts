import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The browser store exists only for local development: it must refuse to run
 * in a production bundle, and it keeps the native store's write ordering.
 */
const storage = new Map<string, string>();
let failTokenWrite = false;

vi.mock("react-native", () => ({ Platform: { OS: "web" } }));
vi.mock("expo-secure-store", () => ({}));
vi.mock("expo-crypto", () => ({
  getRandomBytesAsync: vi.fn(async (length: number) => new Uint8Array(length).fill(1)),
}));

vi.stubGlobal("localStorage", {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => {
    if (failTokenWrite && key.includes("refresh-token")) throw new Error("quota");
    storage.set(key, value);
  },
  removeItem: (key: string) => storage.delete(key),
});

const { platformSessionStore: store } = await import("./sessionStore");

beforeEach(() => {
  storage.clear();
  failTokenWrite = false;
  vi.stubGlobal("__DEV__", true);
});

describe("web development session store", () => {
  it("round-trips a session and clears it", async () => {
    await store.write({ refreshToken: "refresh", deviceId: "device" });
    await expect(store.read()).resolves.toEqual({ refreshToken: "refresh", deviceId: "device" });
    await store.clear();
    await expect(store.read()).resolves.toBeNull();
  });

  it("rolls the device binding back when the token write fails", async () => {
    failTokenWrite = true;
    await expect(store.write({ refreshToken: "refresh", deviceId: "device" })).rejects.toThrow("quota");
    expect(storage.size).toBe(0);
  });

  it("generates and then reuses an installation id", async () => {
    const id = await store.installationId();
    expect(id).toBe("01".repeat(32));
    await expect(store.installationId()).resolves.toBe(id);
  });

  it.each(["read", "clear", "installationId"] as const)("%s refuses to run in a production bundle", async (method) => {
    vi.stubGlobal("__DEV__", false);
    await expect(store[method]()).rejects.toThrow("development only");
  });

  it("write refuses to run in a production bundle", async () => {
    vi.stubGlobal("__DEV__", false);
    await expect(store.write({ refreshToken: "r", deviceId: "d" })).rejects.toThrow("development only");
  });
});
