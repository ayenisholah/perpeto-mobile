import { describe, expect, it } from "vitest";

import {
  displayDecimal,
  formatCountdown,
  formatDecimal,
  formatPercent,
  formatUsd,
  halfDecimal,
  minutesUntil,
} from "./decimal";

describe("halfDecimal", () => {
  // This value is sent back to the server as a strategy exit threshold, so it
  // must halve exactly rather than through floating point.
  it("halves without losing precision", () => {
    expect(halfDecimal("0.08")).toBe("0.04");
    expect(halfDecimal("1")).toBe("0.5");
    expect(halfDecimal("0.0000000000000000001")).toBe("0.00000000000000000005");
  });

  it("keeps the sign", () => {
    expect(halfDecimal("-0.08")).toBe("-0.04");
  });

  it("does not produce negative zero", () => {
    expect(halfDecimal("-0")).toBe("0");
  });
});

describe("displayDecimal", () => {
  it("falls back to zero rather than propagating NaN into a layout", () => {
    expect(displayDecimal("not a number")).toBe(0);
    expect(displayDecimal("")).toBe(0);
  });
});

describe("formatters", () => {
  it("renders percentages, currency and fixed decimals", () => {
    expect(formatPercent("0.0825")).toBe("8.25%");
    expect(formatUsd("1234.6")).toBe("$1,235");
    expect(formatDecimal("2.345", 1)).toBe("2.3");
  });
});

describe("countdown", () => {
  const now = Date.parse("2026-07-30T12:00:00Z");

  it("counts whole minutes to a server timestamp", () => {
    expect(minutesUntil("2026-07-30T12:30:00Z", now)).toBe(30);
  });

  it("never counts below zero for a settlement that has passed", () => {
    expect(minutesUntil("2026-07-30T11:00:00Z", now)).toBe(0);
  });

  it("returns undefined for an unparseable timestamp", () => {
    expect(minutesUntil("", now)).toBeUndefined();
  });

  it("formats as hours and minutes, never as a bare number", () => {
    expect(formatCountdown(0)).toBe("due");
    expect(formatCountdown(12)).toBe("12m");
    expect(formatCountdown(60)).toBe("1h");
    expect(formatCountdown(252)).toBe("4h 12m");
  });
});
