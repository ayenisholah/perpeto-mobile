import type { TextStyle } from "react-native";

/**
 * Space Grotesk for interface text and Space Mono for character-by-character
 * values, per PRODUCT_SPEC section 12.1 and matching AgentFloor. Both ship as
 * bundled TTFs (`@expo-google-fonts/*`) and are loaded in the root layout, so
 * nothing is fetched at runtime.
 *
 * Custom faces do not respond to `fontWeight`: each weight is its own family,
 * so every variant names the family for its weight explicitly.
 *
 * The mono face is reserved for values that are read character by character —
 * payload hashes, identifiers, TOTP secrets and recovery codes — where
 * proportional digits cause transcription errors, plus the overline label.
 */
export const fontFamilies = {
  sans: "SpaceGrotesk_400Regular",
  sansMedium: "SpaceGrotesk_500Medium",
  sansBold: "SpaceGrotesk_700Bold",
  mono: "SpaceMono_400Regular",
  monoBold: "SpaceMono_700Bold",
} as const;

/** Applied to every variant that renders a figure, so columns align. */
const tabular: TextStyle = { fontVariant: ["tabular-nums"] };

/** AgentFloor body tracking (-0.011em), in points for a given size. */
const track = (fontSize: number, em: number) => Math.round(fontSize * em * 100) / 100;

/**
 * The type scale. `metric` variants are the only ones that grow large; section
 * 12.1 gives risk and freshness the same weight as yield, so a headline figure
 * never gets a size the warning beside it cannot match.
 *
 * `display` carries AgentFloor's `.tc-display` treatment: bold, uppercase and
 * tightly tracked. Its line height is 1.0x rather than the web's 0.9x so the
 * glyphs never clip at 200% font scale.
 */
export const typography = {
  display: {
    fontFamily: fontFamilies.sansBold,
    fontSize: 32,
    letterSpacing: track(32, -0.03),
    lineHeight: 34,
    textTransform: "uppercase",
  },
  title: { fontFamily: fontFamilies.sansBold, fontSize: 24, letterSpacing: track(24, -0.02), lineHeight: 30 },
  heading: { fontFamily: fontFamilies.sansBold, fontSize: 20, letterSpacing: track(20, -0.011), lineHeight: 26 },
  body: { fontFamily: fontFamilies.sans, fontSize: 17, letterSpacing: track(17, -0.011), lineHeight: 25 },
  bodyStrong: { fontFamily: fontFamilies.sansMedium, fontSize: 17, letterSpacing: track(17, -0.011), lineHeight: 25 },
  label: { fontFamily: fontFamilies.sansMedium, fontSize: 15, letterSpacing: track(15, -0.011), lineHeight: 20 },
  caption: { fontFamily: fontFamilies.sans, fontSize: 13, lineHeight: 18 },
  overline: {
    fontFamily: fontFamilies.monoBold,
    fontSize: 12,
    letterSpacing: track(12, 0.08),
    lineHeight: 16,
    textTransform: "uppercase",
  },

  metric: { ...tabular, fontFamily: fontFamilies.sansBold, fontSize: 28, letterSpacing: track(28, -0.02), lineHeight: 34 },
  metricSmall: { ...tabular, fontFamily: fontFamilies.sansMedium, fontSize: 17, lineHeight: 22 },
  numeric: { ...tabular, fontFamily: fontFamilies.sansMedium, fontSize: 15, lineHeight: 20 },
  numericCaption: { ...tabular, fontFamily: fontFamilies.sansMedium, fontSize: 13, lineHeight: 18 },

  mono: { fontFamily: fontFamilies.mono, fontSize: 15, lineHeight: 22 },
  monoLarge: { fontFamily: fontFamilies.mono, fontSize: 18, lineHeight: 28 },
  /** Six-digit authenticator entry. */
  code: { fontFamily: fontFamilies.monoBold, fontSize: 26, letterSpacing: 6, lineHeight: 32, textAlign: "center" },
} satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof typography;

/**
 * Section 12.3 requires font scaling to 200%. React Native caps at this
 * multiplier per `Text`; the primitive applies it everywhere so no surface can
 * silently opt out the way the old screen file did.
 */
export const maxFontSizeMultiplier = 2;
