import { describe, expect, it } from "vitest";

import { auditEnabled, devAuthEnabled, passkeysEnabled } from "./featureFlags";

describe.each([
  ["passkeysEnabled", passkeysEnabled],
  ["auditEnabled", auditEnabled],
  ["devAuthEnabled", devAuthEnabled],
] as const)("%s", (_name, flag) => {
  it("ships dark when the variable is unset", () => {
    expect(flag(undefined)).toBe(false);
  });

  it.each(["true", "TRUE", " true "])("enables only on the string %j", (value) => {
    expect(flag(value)).toBe(true);
  });

  it.each(["", "1", "yes", "false", "on", "truthy"])("stays off for %j", (value) => {
    expect(flag(value)).toBe(false);
  });
});
