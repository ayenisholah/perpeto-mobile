/**
 * Colour roles from PRODUCT_SPEC section 12.2. The first ten roles are the
 * normative table and are copied verbatim; the rest are the semantic roles the
 * same section requires us to define separately so that no single value ever
 * has to carry two meanings.
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
export const themes = {
  light: {
    background: "#F5F7FB",
    surface: "#FFFFFF",
    surfaceElevated: "#EEF2F7",
    textPrimary: "#101828",
    textSecondary: "#475467",
    border: "#D0D5DD",
    accent: "#1E5EFF",
    signal: "#007A70",
    velocity: "#6D28D9",
    focus: "#174EA6",

    positive: "#067647",
    negative: "#B42318",
    warning: "#B54708",
    critical: "#912018",
    informational: "#174EA6",
    disabled: "#98A2B3",
    long: "#0369A1",
    short: "#6D28D9",
    stale: "#64748B",
    healthy: "#067647",

    /** Foreground for text and glyphs sitting on an `accent` fill. */
    onAccent: "#FFFFFF",
    /** Foreground for text and glyphs sitting on a `critical` fill. */
    onCritical: "#FFFFFF",
    /** Tinted chip and badge background. */
    field: "rgba(30,94,255,0.10)",
    /** Scrim behind modals and sheets. */
    overlay: "rgba(16,24,40,0.40)",
  },
  dark: {
    background: "#080D18",
    surface: "#111827",
    surfaceElevated: "#1B2535",
    textPrimary: "#F8FAFC",
    textSecondary: "#B6C2D2",
    border: "#344054",
    accent: "#78A6FF",
    signal: "#5EEAD4",
    velocity: "#C4B5FD",
    focus: "#A8C7FA",

    positive: "#6FD39B",
    negative: "#FF9BAB",
    warning: "#F5B14C",
    critical: "#FF6B85",
    informational: "#A8C7FA",
    disabled: "#5A6B85",
    long: "#7DD3FC",
    short: "#C4B5FD",
    stale: "#94A3B8",
    healthy: "#6FD39B",

    onAccent: "#06122B",
    onCritical: "#2A0710",
    field: "rgba(120,166,255,0.14)",
    overlay: "rgba(2,6,23,0.60)",
  },
} as const;

export type Theme = (typeof themes)[keyof typeof themes];
export type ColorRole = keyof Theme;
