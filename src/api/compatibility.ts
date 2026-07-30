/**
 * PRODUCT_SPEC section 11.3 asks the app to validate API compatibility before
 * routing into the main interface.
 *
 * The backend advertises its milestone at `/readyz` as a `stage` such as
 * `M1_AUTH` or `M3_CONNECTORS`, and the trading, portfolio and connector routes
 * this client calls only exist from M2 onward. An M1 backend therefore answers
 * every one of them with an empty-bodied 404 — which is how the app once showed
 * "request failed with HTTP 404" on six screens at once while sign-in and the
 * session list kept working.
 *
 * Detecting it here turns six identical mysteries into one accurate sentence.
 */

/** The first milestone that serves opportunities, positions, strategies and portfolio. */
export const REQUIRED_MILESTONE = 2;

const STAGE_PATTERN = /^M(\d+)_/u;

/** `"M3_CONNECTORS"` → `3`. Undefined when the stage is not milestone-shaped. */
export function milestoneOf(stage: string): number | undefined {
  const match = STAGE_PATTERN.exec(stage);
  if (match?.[1] === undefined) return undefined;
  const milestone = Number.parseInt(match[1], 10);
  return Number.isNaN(milestone) ? undefined : milestone;
}

/**
 * An unrecognised stage is treated as compatible: a future naming change should
 * not lock the operator out of a backend that works.
 */
export function isBackendCompatible(stage: string): boolean {
  const milestone = milestoneOf(stage);
  return milestone === undefined || milestone >= REQUIRED_MILESTONE;
}

export interface Incompatibility {
  readonly title: string;
  readonly detail: string;
}

export function describeIncompatibility(stage: string): Incompatibility | undefined {
  if (isBackendCompatible(stage)) return undefined;
  return {
    title: "This app is newer than its backend",
    detail:
      `The server is running ${stage.replaceAll("_", " ").toLowerCase()}, which does not serve ` +
      "opportunities, positions, strategies, portfolio or exchange data. Those screens will stay " +
      "empty until the deployment is updated — or until you install a build that targets it.",
  };
}
