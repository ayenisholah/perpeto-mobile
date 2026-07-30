import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { space } from "@/theme";

import { Card } from "../Card";
import { Text } from "../Text";

interface MetricCardProps {
  readonly label: string;
  /** The figure itself, as `MoneyText`/`RateText` — not a pre-formatted string. */
  readonly value: ReactNode;
  /** Currency, source timestamp or freshness. Section 11.4 requires all three somewhere. */
  readonly caption?: string;
  readonly badge?: ReactNode;
}

export function MetricCard({ label, value, caption, badge }: MetricCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text tone="textSecondary" variant="overline">
          {label.toUpperCase()}
        </Text>
        {badge}
      </View>
      {value}
      {caption === undefined ? null : (
        <Text tone="textSecondary" variant="caption">
          {caption}
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexShrink: 1,
    gap: space.xxs,
    minWidth: 150,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.xs,
    justifyContent: "space-between",
  },
});
