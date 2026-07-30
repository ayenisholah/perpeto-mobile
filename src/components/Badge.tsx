import { StyleSheet, View } from "react-native";

import { radius, space, useTheme, type ColorRole } from "@/theme";

import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

interface BadgeProps {
  readonly label: string;
  readonly tone?: ColorRole;
  readonly icon?: IconName;
}

/**
 * A state marker. The label is mandatory and the icon optional, because
 * section 12.2 prohibits colour as the sole carrier of meaning — the tone tints
 * the outline and the text, but the word is what actually says the state.
 */
export function Badge({ label, tone = "textSecondary", icon }: BadgeProps) {
  const theme = useTheme();
  return (
    <View
      style={[styles.badge, { backgroundColor: theme.surfaceElevated, borderColor: theme[tone] }]}
    >
      {icon === undefined ? null : <Icon color={theme[tone]} name={icon} size={13} />}
      <Text style={{ color: theme[tone] }} variant="overline">
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: space.xxs,
    paddingHorizontal: space.xs,
    paddingVertical: space.xxs,
  },
});
