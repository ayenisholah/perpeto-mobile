import { describe, expect, it } from "vitest";
import { PerpetoApiError } from "@ayenisholah/perpeto-api-client";

import { describeFailure } from "./errors";

describe("describeFailure", () => {
  it("prefers the server's own title when the response described itself", () => {
    const copy = describeFailure(new PerpetoApiError(404, "STRATEGY_NOT_FOUND", "Strategy not found"));
    expect(copy.title).toBe("Strategy not found");
  });

  it("never leaks the generic transport message to the user", () => {
    const copy = describeFailure(
      new PerpetoApiError(404, "REQUEST_FAILED", "Perpeto request failed with HTTP 404"),
    );
    expect(copy.title).not.toContain("HTTP");
    expect(copy.detail).not.toContain("404");
  });

  it("reads an undescribed 404 as a version mismatch rather than a missing record", () => {
    const copy = describeFailure(new PerpetoApiError(404, "REQUEST_FAILED", "whatever"));
    expect(copy.title).toBe("This app and the server disagree");
    // Retrying cannot fix a route the backend does not serve.
    expect(copy.retryable).toBe(false);
  });

  it("treats an unreachable host as offline, not as a failure", () => {
    const copy = describeFailure(new TypeError("Network request failed"));
    expect(copy.title).toBe("No connection to Perpeto");
    expect(copy.tone).toBe("warning");
    expect(copy.retryable).toBe(true);
  });

  it("offers retry for server faults and rate limits but not for authorization", () => {
    expect(describeFailure(new PerpetoApiError(503, "REQUEST_FAILED", "")).retryable).toBe(true);
    expect(describeFailure(new PerpetoApiError(429, "REQUEST_FAILED", "")).retryable).toBe(true);
    expect(describeFailure(new PerpetoApiError(401, "REQUEST_FAILED", "")).retryable).toBe(false);
    expect(describeFailure(new PerpetoApiError(403, "REQUEST_FAILED", "")).retryable).toBe(false);
  });

  it("falls back for values that are not API errors at all", () => {
    expect(describeFailure("something odd").title).toBe("Something went wrong");
  });
});
