/**
 * Colour roles from PRODUCT_SPEC section 12.2, drawn from the same design
 * system as AgentFloor (the Settle tokens): dark only, warm paper and ink, one
 * lime accent. The ten normative roles come first; the rest are the semantic
 * roles the same section requires us to define separately so that no single
 * value ever has to carry two meanings.
 *
 * Two rules constrain every use site:
 *
 * - `signal` marks fresh, threshold-qualified information. It is never a button
 *   fill and never stands in for "good".
 * - `velocity` carries progress and direction only. It never communicates risk
 *   or profitability, which is why `long`/`short` derive from the directional
 *   families rather than from green/red — a long leg is not a winning leg.
 *
 * Colour never carries meaning alone (section 12.2). Every state that uses one
 * of these also pairs a sign, label or glyph.
 */
const dark = {
  /** paper */
  background: "#0F0F0F",
  /** card */
  surface: "#181817",
  /** secondary */
  surfaceElevated: "#252422",
  /** ink */
  textPrimary: "#F1EFE6",
  /** muted-foreground */
  textSecondary: "#A7A59C",
  border: "rgba(245,235,235,0.10)",
  /** The single lime accent. */
  accent: "#CBFE42",
  /** Soft lime: the "live" family, kept distinct from the accent fill. */
  signal: "#E9FB7F",
  /** bronze */
  velocity: "#93C449",
  focus: "#CBFE42",

  positive: "#1A9E70",
  negative: "#D95926",
  warning: "#C98500",
  critical: "#E6443D",
  informational: "#3987E5",
  disabled: "rgba(241,239,230,0.30)",
  long: "#1581FF",
  /** gilt */
  short: "#F0C13E",
  stale: "rgba(241,239,230,0.45)",
  healthy: "#1A9E70",

  /** Foreground for text and glyphs sitting on an `accent` fill. */
  onAccent: "#0F0F0F",
  /** Foreground for text and glyphs sitting on a `critical` fill. */
  onCritical: "#0F0F0F",
  /** Tinted chip and badge background (lime at 10%). */
  field: "rgba(203,254,66,0.10)",
  /** Scrim behind modals and sheets. */
  overlay: "rgba(0,0,0,0.60)",
} as const;

/**
 * The interface ships dark only. The map is kept so call sites stay keyed by
 * scheme should a second scheme ever be specified.
 */
export const themes = { dark } as const;

/** Chart series, in order. Matches AgentFloor's `SERIES`. */
export const series = ["#CBFE42", "#3987E5", "#D95926", "#1A9E70", "#C98500"] as const;

export type Theme = (typeof themes)[keyof typeof themes];
export type ColorRole = keyof Theme;
