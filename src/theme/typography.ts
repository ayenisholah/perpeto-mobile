import { Platform, type TextStyle } from "react-native";

/**
 * Native system faces only, per PRODUCT_SPEC section 12.1. The mono face is
 * reserved for values that are read character by character — payload hashes,
 * identifiers, TOTP secrets and recovery codes — where proportional digits
 * cause transcription errors.
 */
export const fontFamilies = {
  mono: Platform.select({ ios: "Menlo", default: "monospace" }),
} as const;

/** Applied to every variant that renders a figure, so columns align. */
const tabular: TextStyle = { fontVariant: ["tabular-nums"] };

/**
 * The type scale. `metric` variants are the only ones that grow large; section
 * 12.1 gives risk and freshness the same weight as yield, so a headline figure
 * never gets a size the warning beside it cannot match.
 */
export const typography = {
  display: { fontSize: 32, fontWeight: "800", letterSpacing: -0.8, lineHeight: 38 },
  title: { fontSize: 24, fontWeight: "700", letterSpacing: -0.4, lineHeight: 30 },
  heading: { fontSize: 20, fontWeight: "700", letterSpacing: -0.2, lineHeight: 26 },
  body: { fontSize: 17, fontWeight: "400", lineHeight: 25 },
  bodyStrong: { fontSize: 17, fontWeight: "600", lineHeight: 25 },
  label: { fontSize: 15, fontWeight: "600", lineHeight: 20 },
  caption: { fontSize: 13, fontWeight: "400", lineHeight: 18 },
  overline: { fontSize: 12, fontWeight: "800", letterSpacing: 0.6, lineHeight: 16 },

  metric: { ...tabular, fontSize: 28, fontWeight: "700", letterSpacing: -0.6, lineHeight: 34 },
  metricSmall: { ...tabular, fontSize: 17, fontWeight: "600", lineHeight: 22 },
  numeric: { ...tabular, fontSize: 15, fontWeight: "500", lineHeight: 20 },
  numericCaption: { ...tabular, fontSize: 13, fontWeight: "500", lineHeight: 18 },

  mono: { fontFamily: fontFamilies.mono, fontSize: 15, lineHeight: 22 },
  monoLarge: { fontFamily: fontFamilies.mono, fontSize: 18, lineHeight: 28 },
  /** Six-digit authenticator entry. */
  code: { ...tabular, fontSize: 26, letterSpacing: 6, lineHeight: 32, textAlign: "center" },
} satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof typography;

/**
 * Section 12.3 requires font scaling to 200%. React Native caps at this
 * multiplier per `Text`; the primitive applies it everywhere so no surface can
 * silently opt out the way the old screen file did.
 */
export const maxFontSizeMultiplier = 2;
