import { describe, expect, it } from "vitest";

import { radius } from "./radius";
import { minimumTouchTarget, space } from "./space";
import { fontFamilies, maxFontSizeMultiplier, typography } from "./typography";

/** Structural rules from PRODUCT_SPEC section 12 that the tokens must keep. */
describe("design tokens", () => {
  it("squares every surface except status dots", () => {
    expect([radius.sm, radius.md, radius.lg]).toEqual([0, 0, 0]);
    expect(radius.dot).toBeGreaterThan(100);
  });

  it("keeps spacing on the 4-point sub-grid of the 8-point system", () => {
    for (const value of Object.values(space)) expect(value % 4).toBe(0);
    expect(minimumTouchTarget).toBe(48);
  });

  it("names a bundled face for every variant", () => {
    const families = new Set<string>(Object.values(fontFamilies));
    for (const [name, style] of Object.entries(typography)) {
      expect(families.has(style.fontFamily), name).toBe(true);
    }
  });

  it("uses tabular figures for every numeric variant", () => {
    for (const name of ["metric", "metricSmall", "numeric", "numericCaption"] as const) {
      expect(typography[name].fontVariant).toEqual(["tabular-nums"]);
    }
  });

  it("gives every variant a line height that clears its font size", () => {
    for (const [name, style] of Object.entries(typography)) {
      expect(style.lineHeight, name).toBeGreaterThanOrEqual(style.fontSize);
    }
  });

  it("supports font scaling to 200%", () => {
    expect(maxFontSizeMultiplier).toBe(2);
  });
});
