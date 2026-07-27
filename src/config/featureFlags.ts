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
