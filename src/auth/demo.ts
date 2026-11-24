/** Renew a demo session this long before its access token lapses. */
export const DEMO_RENEW_LEAD_MS = 60_000;
/** Never renew more often than this, whatever the server's expiry says. */
export const DEMO_MIN_RENEW_MS = 30_000;

/**
 * Delay before renewing a read-only demo session (DEC-0017) that expires at
 * `expiresAt` (epoch milliseconds). Demo sessions carry no refresh token, so
 * the client simply asks for a new one shortly before the old one lapses.
 */
export function demoRenewDelay(expiresAt: number, now: number): number {
  if (!Number.isFinite(expiresAt)) return DEMO_MIN_RENEW_MS;
  return Math.max(expiresAt - now - DEMO_RENEW_LEAD_MS, DEMO_MIN_RENEW_MS);
}
