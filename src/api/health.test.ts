import { describe, expect, it } from "vitest";

import { getBackendHealth, isBackendHealth, resolveApiBaseUrl } from "./health";

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

describe("backend health probe", () => {
  const healthy = { status: "OK", mode: "PAPER", stage: "M1_FOUNDATIONS" };
  const respond = (status: number, body: unknown): typeof fetch =>
    (async () => new Response(JSON.stringify(body), { status })) as typeof fetch;

  it("falls back to the local API when no URL is configured", () => {
    expect(resolveApiBaseUrl(undefined)).toBe("http://127.0.0.1:8080");
    expect(resolveApiBaseUrl("   ")).toBe("http://127.0.0.1:8080");
  });

  it("returns a compatible paper backend", async () => {
    await expect(getBackendHealth(respond(200, healthy))).resolves.toEqual(healthy);
  });

  it("requests readiness as JSON from the configured base URL", async () => {
    const calls: [RequestInfo | URL, RequestInit | undefined][] = [];
    const recording = (async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push([input, init]);
      return new Response(JSON.stringify(healthy), { status: 200 });
    }) as typeof fetch;
    await getBackendHealth(recording);
    expect(String(calls[0]?.[0])).toMatch(/\/readyz$/u);
    expect(calls[0]?.[1]?.headers).toEqual({ Accept: "application/json" });
  });

  it("reports a non-success HTTP status", async () => {
    await expect(getBackendHealth(respond(503, {}))).rejects.toThrow("Backend returned HTTP 503");
  });

  it("rejects an incompatible or non-paper payload", async () => {
    await expect(getBackendHealth(respond(200, { ...healthy, mode: "LIVE" }))).rejects.toThrow(
      "Backend health contract is incompatible",
    );
  });

  it("rejects non-object payloads", () => {
    expect(isBackendHealth(null)).toBe(false);
    expect(isBackendHealth("OK")).toBe(false);
  });
});
