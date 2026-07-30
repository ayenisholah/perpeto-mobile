/** The rail spans three times the tolerance, so the band occupies its middle third. */
const SCALE_MULTIPLE = 3;

/** Default residual tolerance, as a fraction of position notional. */
export const DEFAULT_HEDGE_LIMIT = 0.02;

export interface HedgeReadout {
  /** Residual as a signed fraction of notional. */
  readonly fraction: number;
  /** Marker position on the rail, clamped to [-1, 1] where 0 is a perfect hedge. */
  readonly offset: number;
  readonly breached: boolean;
}

/**
 * Gauge maths for `DeltaGauge`, kept free of React Native imports so it stays
 * unit-testable — the same split as `positionPresentation.ts`.
 *
 * A zero notional reads as a perfect hedge rather than dividing by zero.
 */
export function hedgeReadout(
  residual: number,
  notional: number,
  limitFraction: number = DEFAULT_HEDGE_LIMIT,
): HedgeReadout {
  const fraction = notional === 0 ? 0 : residual / notional;
  const scale = limitFraction * SCALE_MULTIPLE;
  const offset = scale === 0 ? 0 : Math.max(-1, Math.min(1, fraction / scale));
  return { fraction, offset, breached: Math.abs(fraction) > limitFraction };
}

/** Percentage width of the tolerance band drawn on the rail. */
export const BAND_WIDTH_PERCENT = 100 / SCALE_MULTIPLE;
/** Percentage offset of the band's left edge. */
export const BAND_LEFT_PERCENT = 50 - 100 / (2 * SCALE_MULTIPLE);
