import { Pressable, StyleSheet } from "react-native";

import { radius, space, useTheme } from "@/theme";

import { Text } from "./Text";

interface PillProps {
  readonly label: string;
  readonly active: boolean;
  readonly onPress: () => void;
}

/**
 * Filter chip. Sits at 40 px with `hitSlop` making up the 48 px touch target
 * from section 12.1, so a row of filters stays visually light without becoming
 * hard to hit.
 */
export function Pill({ label, active, onPress }: PillProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      hitSlop={{ bottom: 4, top: 4 }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        {
          backgroundColor: active ? theme.accent : "transparent",
          borderColor: active ? theme.accent : theme.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text style={{ color: active ? theme.onAccent : theme.textSecondary }} variant="label">
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: "center",
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: space.sm,
  },
});
