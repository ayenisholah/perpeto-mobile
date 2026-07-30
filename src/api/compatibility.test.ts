import { describe, expect, it } from "vitest";

import { describeIncompatibility, isBackendCompatible, milestoneOf } from "./compatibility";

describe("milestoneOf", () => {
  it("reads the milestone number out of a stage", () => {
    expect(milestoneOf("M1_AUTH")).toBe(1);
    expect(milestoneOf("M3_CONNECTORS")).toBe(3);
    expect(milestoneOf("M12_SOMETHING")).toBe(12);
  });

  it("returns undefined for a stage that is not milestone-shaped", () => {
    expect(milestoneOf("PRODUCTION")).toBeUndefined();
    expect(milestoneOf("")).toBeUndefined();
  });
});

describe("isBackendCompatible", () => {
  it("rejects the auth-only backend, which cannot serve the trading routes", () => {
    expect(isBackendCompatible("M1_AUTH")).toBe(false);
    expect(isBackendCompatible("M0_SCAFFOLD")).toBe(false);
  });

  it("accepts backends from the milestone that added those routes onward", () => {
    expect(isBackendCompatible("M3_CONNECTORS")).toBe(true);
    expect(isBackendCompatible("M9_FUTURE")).toBe(true);
  });

  it("does not lock the operator out over an unrecognised stage name", () => {
    expect(isBackendCompatible("SOMETHING_NEW")).toBe(true);
  });
});

describe("describeIncompatibility", () => {
  it("says nothing when the backend can serve the app", () => {
    expect(describeIncompatibility("M3_CONNECTORS")).toBeUndefined();
  });

  it("names the affected screens so the message is actionable", () => {
    const incompatibility = describeIncompatibility("M1_AUTH");
    expect(incompatibility?.detail).toContain("opportunities");
    expect(incompatibility?.detail).toContain("m1 auth");
  });
});
