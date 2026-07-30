import { Pressable, StyleSheet, View } from "react-native";
import type { Opportunity } from "@ayenisholah/perpeto-api-client";

import { radius, space, useTheme } from "@/theme";
import { formatCountdown, formatDecimal, formatUsd, minutesUntil } from "@/utils/decimal";

import { Badge } from "../Badge";
import { Text } from "../Text";
import { RateText } from "./values";

interface OpportunityCardProps {
  readonly opportunity: Opportunity;
  readonly onPress: () => void;
}

/**
 * A scanner row. Section 11.5 asks each row to carry both leg sides and
 * venues, the settlement countdown, basis, capacity and any blocking warning —
 * so the operator can rank routes without opening every one.
 *
 * Net APR is the largest figure, but "Outside limits" sits at the same level:
 * section 12.1 gives risk the same weight as projected yield.
 */
export function OpportunityCard({ opportunity, onPress }: OpportunityCardProps) {
  const theme = useTheme();
  const remaining = minutesUntil(opportunity.next_funding_at);

  return (
    <Pressable
      accessibilityHint="Opens the full route breakdown"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.surfaceElevated, borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={styles.header}>
        <Text variant="bodyStrong">{opportunity.underlying}</Text>
        <RateText directional value={opportunity.net_apr} variant="metric" />
      </View>

      <Text tone="textSecondary" variant="caption">
        {opportunity.route_type === "SPOT_PERP" ? "Spot · Perp" : "Perp · Perp"} · long{" "}
        <Text tone="long" variant="caption">
          {opportunity.long_venue}
        </Text>{" "}
        → short{" "}
        <Text tone="short" variant="caption">
          {opportunity.short_venue}
        </Text>
      </Text>

      <View style={styles.metrics}>
        <Metric label="Win" value={`${(Number(opportunity.profitability_probability) * 100).toFixed(0)}%`} />
        <Metric label="Basis" value={`${formatDecimal(opportunity.entry_basis_bps, 1)} bps`} />
        <Metric label="Capacity" value={formatUsd(opportunity.available_capacity)} />
        <Metric label="Funds in" value={remaining === undefined ? "—" : formatCountdown(remaining)} />
      </View>

      {opportunity.within_limits ? null : (
        <Badge icon="warning" label="Outside limits" tone="warning" />
      )}
    </Pressable>
  );
}

function Metric({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <View style={styles.metric}>
      <Text tone="textSecondary" variant="overline">
        {label.toUpperCase()}
      </Text>
      <Text variant="numericCaption">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space.xs,
    padding: space.sm,
  },
  header: {
    alignItems: "baseline",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.xs,
    justifyContent: "space-between",
  },
  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.md,
  },
  metric: {
    gap: 2,
  },
});
