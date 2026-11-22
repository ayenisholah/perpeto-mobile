import { describe, expect, it } from "vitest";

import { themes, type ColorRole } from "./colors";

const theme = themes.dark;

/** sRGB relative luminance (WCAG 2.2). Accepts `#RRGGBB` only. */
function luminance(hex: string): number {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (match === null) throw new Error(`expected an opaque #RRGGBB colour, got ${hex}`);
  const value = Number.parseInt(match[1], 16);
  const channels = [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff].map((channel) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

const surfaces: readonly ColorRole[] = ["background", "surface", "surfaceElevated"];

const statusRoles: readonly ColorRole[] = [
  "signal",
  "velocity",
  "positive",
  "negative",
  "warning",
  "critical",
  "informational",
  "long",
  "short",
];

describe("dark theme contrast (WCAG 2.2 AA)", () => {
  for (const text of ["textPrimary", "textSecondary"] as const) {
    for (const surface of surfaces) {
      it(`${text} on ${surface} meets 4.5:1`, () => {
        expect(contrast(theme[text], theme[surface])).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  it("onAccent on accent meets 4.5:1", () => {
    expect(contrast(theme.onAccent, theme.accent)).toBeGreaterThanOrEqual(4.5);
  });

  it("onCritical on critical meets 4.5:1", () => {
    expect(contrast(theme.onCritical, theme.critical)).toBeGreaterThanOrEqual(4.5);
  });

  for (const role of statusRoles) {
    for (const surface of surfaces) {
      it(`${role} on ${surface} meets the 3:1 non-text minimum`, () => {
        expect(contrast(theme[role], theme[surface])).toBeGreaterThanOrEqual(3);
      });
    }
  }
});

describe("semantic separation", () => {
  it("gives every status role its own value", () => {
    const values = statusRoles.map((role) => theme[role].toUpperCase());
    expect(new Set(values).size).toBe(values.length);
  });

  it("keeps signal off the accent fill", () => {
    expect(theme.signal).not.toBe(theme.accent);
  });
});
