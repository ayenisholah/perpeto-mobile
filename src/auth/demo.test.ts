import { describe, expect, it } from "vitest";

import { DEMO_MIN_RENEW_MS, DEMO_RENEW_LEAD_MS, demoRenewDelay } from "./demo";

describe("demoRenewDelay", () => {
  const now = Date.parse("2026-11-24T10:00:00Z");

  it("renews a minute before the access token lapses", () => {
    const expiresAt = now + 15 * 60_000;
    expect(demoRenewDelay(expiresAt, now)).toBe(15 * 60_000 - DEMO_RENEW_LEAD_MS);
  });

  it("never renews sooner than the floor, even for an already-expired token", () => {
    expect(demoRenewDelay(now - 5_000, now)).toBe(DEMO_MIN_RENEW_MS);
    expect(demoRenewDelay(now + 30_000, now)).toBe(DEMO_MIN_RENEW_MS);
  });

  it("falls back to the floor for an unparseable expiry", () => {
    expect(demoRenewDelay(Number.NaN, now)).toBe(DEMO_MIN_RENEW_MS);
  });
});
