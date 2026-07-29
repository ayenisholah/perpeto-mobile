export interface BackendHealth {
  readonly status: "OK";
  readonly mode: "PAPER";
  /**
   * The backend's current milestone, e.g. `M3_CONNECTORS`. Reported for display
   * and not gated on: pinning it to one value rejected any backend that had
   * advanced a milestone. `mode` stays gated, because reaching a non-paper
   * backend is a safety condition rather than a version difference.
   */
  readonly stage: string;
}

export function resolveApiBaseUrl(value = process.env.EXPO_PUBLIC_API_URL): string {
  const candidate = value?.trim() || "http://127.0.0.1:8080";
  return candidate.replace(/\/+$/u, "");
}

export async function getBackendHealth(
  fetchImplementation: typeof fetch = fetch,
): Promise<BackendHealth> {
  const response = await fetchImplementation(`${resolveApiBaseUrl()}/readyz`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Backend returned HTTP ${response.status}`);
  }
  const payload: unknown = await response.json();
  if (!isBackendHealth(payload)) {
    throw new Error("Backend health contract is incompatible");
  }
  return payload;
}

export function isBackendHealth(value: unknown): value is BackendHealth {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const health = value as Record<string, unknown>;
  return (
    health.status === "OK" &&
    health.mode === "PAPER" &&
    typeof health.stage === "string" &&
    health.stage.length > 0
  );
}
