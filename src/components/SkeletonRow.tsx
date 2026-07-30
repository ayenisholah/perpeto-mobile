import { StyleSheet, View } from "react-native";

import { radius, space, useTheme } from "@/theme";

interface SkeletonRowProps {
  readonly rows?: number;
}

/**
 * Placeholder bars while a surface loads. Deliberately static: section 12.1
 * prohibits persistent pulsing, and a shimmer that runs for as long as a
 * request takes is exactly that. The bars are announced as busy instead.
 */
export function SkeletonRow({ rows = 3 }: SkeletonRowProps) {
  const theme = useTheme();
  return (
    <View accessibilityLabel="Loading" accessibilityRole="progressbar" style={styles.container}>
      {Array.from({ length: rows }, (_, index) => (
        <View
          key={index}
          style={[
            styles.bar,
            { backgroundColor: theme.surfaceElevated, width: index % 2 === 0 ? "100%" : "62%" },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: space.xs,
  },
  bar: {
    borderRadius: radius.sm,
    height: 14,
  },
});
