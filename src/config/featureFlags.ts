/**
 * Build-time feature flags resolved from Expo public env vars.
 *
 * Passkeys ship dark: the backend WebAuthn slice (M4) lands first, and the
 * native device ceremony needs an EAS development build that is not yet
 * provisioned. Until then this stays off so the release build never exposes an
 * unusable control.
 */
export function passkeysEnabled(
  value = process.env.EXPO_PUBLIC_PASSKEYS_ENABLED,
): boolean {
  return value?.trim().toLowerCase() === "true";
}

/**
 * The owner-only audit review card. Ships dark until the control-plane audit log
 * has real content on a provisioned environment.
 */
export function auditEnabled(
  value = process.env.EXPO_PUBLIC_AUDIT_ENABLED,
): boolean {
  return value?.trim().toLowerCase() === "true";
}

/**
 * Development sign-in, for Expo Go only.
 *
 * Expo Go cannot run the native Google or Apple modules, so there is otherwise
 * no way to reach an authenticated screen from it. When this is on, the sign-in
 * card offers a button that exchanges a synthetic identity token instead of a
 * provider one.
 *
 * This only works against a backend started with `PERPETO_DEV_AUTH=true`, which
 * that backend permits in PAPER mode alone and refuses to start with otherwise.
 * Never enable either flag for a build that talks to a deployed backend.
 */
export function devAuthEnabled(
  value = process.env.EXPO_PUBLIC_DEV_AUTH_ENABLED,
): boolean {
  return value?.trim().toLowerCase() === "true";
}
