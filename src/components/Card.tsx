import type { PropsWithChildren } from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";

import { radius, space, useTheme } from "@/theme";

import { GlassSurface } from "./GlassSurface";

interface CardProps extends PropsWithChildren {
  /** Set false when the card holds full-bleed rows that own their own padding. */
  readonly padded?: boolean;
  readonly style?: StyleProp<ViewStyle>;
}

/**
 * The standard grouping surface: a hairline border and a 16 px radius, per
 * PRODUCT_SPEC section 12.1. `GlassSurface` supplies the iOS material and
 * already falls back to a flat fill when Reduce Transparency is on or the
 * platform has no glass API.
 */
export function Card({ children, padded = true, style }: CardProps) {
  const theme = useTheme();
  return (
    <GlassSurface
      fallbackColor={theme.surface}
      style={[styles.card, padded && styles.padded, { borderColor: theme.border }, style]}
    >
      {children}
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space.sm,
    overflow: "hidden",
  },
  padded: {
    padding: space.md,
  },
});
