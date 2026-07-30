import { describe, expect, it } from "vitest";

import { hedgeReadout } from "./hedge";

const LIMIT = 0.02;

describe("hedgeReadout", () => {
  it("centres a perfectly balanced hedge", () => {
    const readout = hedgeReadout(0, 10_000, LIMIT);
    expect(readout.offset).toBe(0);
    expect(readout.breached).toBe(false);
  });

  it("puts the tolerance edge a third of the way out, so the band is visible", () => {
    const readout = hedgeReadout(200, 10_000, LIMIT);
    expect(readout.fraction).toBeCloseTo(0.02);
    expect(readout.offset).toBeCloseTo(1 / 3);
  });

  it("signs the offset by the direction of the imbalance", () => {
    expect(hedgeReadout(-200, 10_000, LIMIT).offset).toBeCloseTo(-1 / 3);
  });

  it("clamps a wildly unbalanced position to the end of the rail", () => {
    expect(hedgeReadout(50_000, 10_000, LIMIT).offset).toBe(1);
    expect(hedgeReadout(-50_000, 10_000, LIMIT).offset).toBe(-1);
  });

  it("breaches only past the limit, not at it", () => {
    expect(hedgeReadout(200, 10_000, LIMIT).breached).toBe(false);
    expect(hedgeReadout(201, 10_000, LIMIT).breached).toBe(true);
  });

  it("treats a zero notional as balanced instead of dividing by zero", () => {
    const readout = hedgeReadout(0, 0, LIMIT);
    expect(readout.fraction).toBe(0);
    expect(readout.offset).toBe(0);
    expect(readout.breached).toBe(false);
  });
});
