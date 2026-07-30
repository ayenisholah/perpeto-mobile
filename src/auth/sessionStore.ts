import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";

export { isSessionInvalidatingCode } from "./sessionPolicy";

const REFRESH_TOKEN_KEY = "signex.auth.refresh-token.v1";
const DEVICE_ID_KEY = "signex.auth.device-id.v1";
const INSTALLATION_ID_KEY = "signex.device.installation-id.v1";

export interface StoredSession {
  readonly refreshToken: string;
  readonly deviceId: string;
}

export interface SessionStore {
  read(): Promise<StoredSession | null>;
  write(session: StoredSession): Promise<void>;
  clear(): Promise<void>;
  installationId(): Promise<string>;
}

export const secureSessionStore: SessionStore = {
  async read() {
    const [refreshToken, deviceId] = await Promise.all([
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.getItemAsync(DEVICE_ID_KEY),
    ]);
    if (refreshToken === null || deviceId === null) return null;
    return { refreshToken, deviceId };
  },
  async write(session) {
    // Write the device binding first. A refresh token is never retained without it.
    await SecureStore.setItemAsync(DEVICE_ID_KEY, session.deviceId, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    try {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, session.refreshToken, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } catch (error) {
      await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
      throw error;
    }
  },
  async clear() {
    await Promise.allSettled([
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(DEVICE_ID_KEY),
    ]);
  },
  async installationId() {
    const existing = await SecureStore.getItemAsync(INSTALLATION_ID_KEY);
    if (existing !== null) return existing;
    const bytes = await Crypto.getRandomBytesAsync(32);
    const generated = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    await SecureStore.setItemAsync(INSTALLATION_ID_KEY, generated, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    return generated;
  },
};

/**
 * Browser store for `expo start --web`, used to inspect the app when no
 * compatible Expo Go exists for the device's iOS version.
 *
 * `expo-secure-store` has no web implementation — its web entry point is
 * literally `export default {}` — so every call above would fail in a browser.
 * `localStorage` is the only durable option there, and it is **not** secure
 * storage: any script on the origin can read it, so a refresh token kept here is
 * not protected the way the Keychain protects it on a device.
 *
 * That trade is acceptable for a local development page and nowhere else, so
 * this store refuses to operate in a production bundle rather than silently
 * downgrading the guarantee. The web target is not a delivery channel for this
 * app; iOS TestFlight is.
 */
const webDevSessionStore: SessionStore = {
  async read() {
    assertWebDevelopment();
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (refreshToken === null || deviceId === null) return null;
    return { refreshToken, deviceId };
  },
  async write(session) {
    assertWebDevelopment();
    // Same ordering guarantee as the native store: the device binding is written
    // first, and a failed token write rolls it back so a refresh token is never
    // retained without one.
    localStorage.setItem(DEVICE_ID_KEY, session.deviceId);
    try {
      localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
    } catch (error) {
      localStorage.removeItem(DEVICE_ID_KEY);
      throw error;
    }
  },
  async clear() {
    assertWebDevelopment();
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(DEVICE_ID_KEY);
  },
  async installationId() {
    assertWebDevelopment();
    const existing = localStorage.getItem(INSTALLATION_ID_KEY);
    if (existing !== null) return existing;
    const bytes = await Crypto.getRandomBytesAsync(32);
    const generated = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    localStorage.setItem(INSTALLATION_ID_KEY, generated);
    return generated;
  },
};

function assertWebDevelopment(): void {
  if (!__DEV__) {
    throw new Error(
      "Web session storage is available in development only; it cannot protect a refresh credential.",
    );
  }
}

/** The store for the current platform. Native keeps the Keychain-backed one. */
export const platformSessionStore: SessionStore =
  Platform.OS === "web" ? webDevSessionStore : secureSessionStore;
