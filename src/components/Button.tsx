import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { minimumTouchTarget, radius, space, useTheme, type Theme } from "@/theme";

import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

export type ButtonVariant = "primary" | "secondary" | "destructive" | "text";

interface ButtonProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly variant?: ButtonVariant;
  readonly icon?: IconName;
  readonly disabled?: boolean;
  readonly busy?: boolean;
  /** Lets a button sit inline in a row instead of filling its container. */
  readonly inline?: boolean;
}

interface Visual {
  readonly background: string;
  readonly foreground: string;
  readonly border: string;
}

function visualFor(variant: ButtonVariant, theme: Theme): Visual {
  switch (variant) {
    case "primary":
      return { background: theme.accent, foreground: theme.onAccent, border: "transparent" };
    case "destructive":
      return { background: theme.critical, foreground: theme.onCritical, border: "transparent" };
    case "secondary":
      return { background: "transparent", foreground: theme.accent, border: theme.border };
    case "text":
      return { background: "transparent", foreground: theme.accent, border: "transparent" };
  }
}

/**
 * Interactive weight comes from `accent`, never from `signal`. A mint fill
 * would read as "this is qualified and safe", which is the confusion section
 * 12.1 warns against — and is why the old build showed "Halt new risk" as an
 * inviting green.
 *
 * Anything that removes capital or cancels protection belongs in
 * `HoldToConfirm`, not here.
 */
export function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  disabled = false,
  busy = false,
  inline = false,
}: ButtonProps) {
  const theme = useTheme();
  const visual = visualFor(variant, theme);
  const inert = disabled || busy;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy, disabled: inert }}
      disabled={inert}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "text" ? styles.text : styles.filled,
        inline ? styles.inline : styles.block,
        {
          backgroundColor: visual.background,
          borderColor: visual.border,
          opacity: disabled ? 0.45 : pressed ? 0.7 : 1,
        },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={visual.foreground} />
      ) : (
        <View style={styles.content}>
          {icon === undefined ? null : <Icon color={visual.foreground} name={icon} size={18} />}
          <Text style={{ color: visual.foreground }} variant="label">
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

interface IconButtonProps {
  readonly name: IconName;
  readonly onPress: () => void;
  /** Required: an icon-only control must announce what it does (section 12.3). */
  readonly label: string;
  readonly hint?: string;
  readonly color?: string;
  readonly disabled?: boolean;
}

export function IconButton({ name, onPress, label, hint, color, disabled = false }: IconButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityHint={hint}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, { opacity: disabled ? 0.45 : pressed ? 0.7 : 1 }]}
    >
      <Icon color={color ?? theme.textSecondary} name={name} size={22} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: minimumTouchTarget,
  },
  filled: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  text: {
    paddingHorizontal: space.xs,
  },
  block: {
    alignSelf: "stretch",
  },
  inline: {
    alignSelf: "flex-start",
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.xs,
  },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: minimumTouchTarget,
    minWidth: minimumTouchTarget,
  },
});
