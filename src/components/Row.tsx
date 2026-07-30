import type { PropsWithChildren } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { space, useTheme } from "@/theme";

interface RowProps extends PropsWithChildren {
  /** Distributes children to the edges. Off for tight groupings like a badge cluster. */
  readonly spread?: boolean;
  readonly gap?: number;
  readonly style?: StyleProp<ViewStyle>;
}

/** Horizontal grouping. Wraps, because values must never be clipped at large type. */
export function Row({ children, spread = false, gap = space.xs, style }: RowProps) {
  return (
    <View style={[styles.row, spread && styles.spread, { gap }, style]}>{children}</View>
  );
}

/** Hairline separator between rows inside a card. */
export function Divider() {
  const theme = useTheme();
  return <View style={[styles.divider, { backgroundColor: theme.border }]} />;
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  spread: {
    justifyContent: "space-between",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: "100%",
  },
});
