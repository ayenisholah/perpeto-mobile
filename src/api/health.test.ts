import { describe, expect, it } from "vitest";

import { isBackendHealth, resolveApiBaseUrl } from "./health";

describe("backend health contract", () => {
  it("accepts a paper backend at any milestone stage", () => {
    expect(isBackendHealth({ status: "OK", mode: "PAPER", stage: "M0_SCAFFOLD" })).toBe(true);
    expect(isBackendHealth({ status: "OK", mode: "PAPER", stage: "M3_CONNECTORS" })).toBe(true);
  });

  it("rejects a non-paper backend or a missing stage", () => {
    expect(isBackendHealth({ status: "OK", mode: "LIVE", stage: "M3_CONNECTORS" })).toBe(false);
    expect(isBackendHealth({ status: "OK", mode: "PAPER", stage: "" })).toBe(false);
  });

  it("normalizes the configured API base URL", () => {
    expect(resolveApiBaseUrl("https://staging.example.test///")).toBe(
      "https://staging.example.test",
    );
  });
});
