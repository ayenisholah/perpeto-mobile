import { StyleSheet, View } from "react-native";

import { describeFailure } from "@/api/errors";
import { radius, space, useTheme } from "@/theme";

import { Button } from "./Button";
import { Icon } from "./Icon";
import { Text } from "./Text";

interface ErrorStateProps {
  readonly error: unknown;
  readonly onRetry?: () => void;
}

/**
 * The single place a request failure becomes words. Nothing renders a caught
 * error directly any more: the old screen printed the transport message at
 * fourteen call sites, which is how "Perpeto request failed with HTTP 404"
 * ended up being what six surfaces said to the operator.
 */
export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const theme = useTheme();
  const copy = describeFailure(error);
  const tone = theme[copy.tone];

  return (
    <View
      accessibilityRole="alert"
      style={[styles.container, { backgroundColor: theme.surfaceElevated, borderColor: tone }]}
    >
      <View style={styles.header}>
        <Icon color={tone} name={copy.tone} size={18} />
        <Text style={styles.title} tone={copy.tone} variant="label">
          {copy.title}
        </Text>
      </View>
      {copy.detail === "" ? null : (
        <Text tone="textSecondary" variant="caption">
          {copy.detail}
        </Text>
      )}
      {copy.retryable && onRetry !== undefined ? (
        <Button inline label="Try again" onPress={onRetry} variant="secondary" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space.xs,
    padding: space.sm,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.xs,
  },
  title: {
    flexShrink: 1,
  },
});
