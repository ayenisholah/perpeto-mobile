import { forwardRef } from "react";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";

import { maxFontSizeMultiplier, minimumTouchTarget, radius, space, typography, useTheme } from "@/theme";

import { Text } from "./Text";

interface FieldProps extends Omit<TextInputProps, "style" | "placeholderTextColor"> {
  readonly label: string;
  /** Shown under the input and announced with it (section 12.3). */
  readonly error?: string;
  /** Extra guidance shown above the input. */
  readonly hint?: string;
  /**
   * Type overrides for the input itself, such as the wide-tracked `code`
   * variant used for authenticator entry. The container's styling is not
   * overridable, so fields stay visually consistent.
   */
  readonly inputStyle?: TextInputProps["style"];
}

/**
 * Labelled text input. The visible label doubles as the accessibility label, so
 * the two cannot drift apart, and an error is tied to the field rather than
 * floating at the bottom of the form.
 */
export const Field = forwardRef<TextInput, FieldProps>(function Field(
  { label, error, hint, inputStyle, ...rest },
  ref,
) {
  const theme = useTheme();
  const invalid = error !== undefined;

  return (
    <View style={styles.field}>
      <Text tone="textSecondary" variant="caption">
        {label}
      </Text>
      {hint === undefined ? null : (
        <Text tone="textSecondary" variant="caption">
          {hint}
        </Text>
      )}
      <TextInput
        accessibilityHint={error}
        accessibilityLabel={label}
        maxFontSizeMultiplier={maxFontSizeMultiplier}
        placeholderTextColor={theme.textSecondary}
        ref={ref}
        style={[
          styles.input,
          typography.body,
          { borderColor: invalid ? theme.critical : theme.border, color: theme.textPrimary },
          inputStyle,
        ]}
        {...rest}
      />
      {invalid ? (
        <Text accessibilityRole="alert" tone="critical" variant="caption">
          {error}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  field: {
    gap: space.xxs,
  },
  input: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: minimumTouchTarget,
    paddingHorizontal: space.sm,
  },
});
