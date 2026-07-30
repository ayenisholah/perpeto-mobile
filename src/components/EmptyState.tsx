import { StyleSheet, View } from "react-native";

import { space } from "@/theme";

import { Button } from "./Button";
import { Text } from "./Text";

interface EmptyStateProps {
  /** What is not here, stated plainly. */
  readonly title: string;
  /** What the person can do about it. An empty screen is an invitation to act. */
  readonly detail: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
}

export function EmptyState({ title, detail, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text variant="bodyStrong">{title}</Text>
      <Text tone="textSecondary" variant="caption">
        {detail}
      </Text>
      {actionLabel === undefined || onAction === undefined ? null : (
        <Button inline label={actionLabel} onPress={onAction} variant="secondary" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
    gap: space.xs,
    paddingVertical: space.sm,
  },
});
