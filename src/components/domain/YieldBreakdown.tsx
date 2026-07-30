import { StyleSheet, View } from "react-native";
import type { Opportunity } from "@ayenisholah/perpeto-api-client";

import { space, useTheme } from "@/theme";
import { formatPercent } from "@/utils/decimal";

import { Text } from "../Text";
import { DetailLine, RateText } from "./values";

/**
 * Gross funding, every modelled cost, and what survives (section 11.6). Costs
 * are shown as deductions rather than bare figures so the arithmetic between
 * the top line and the net is legible without a calculator.
 */
export function YieldBreakdown({ opportunity }: { readonly opportunity: Opportunity }) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <DetailLine label="Gross funding APR" value={formatPercent(opportunity.gross_funding_apr)} />
      <DetailLine label="Entry cost" value={`− ${formatPercent(opportunity.entry_cost)}`} />
      <DetailLine label="Exit cost" value={`− ${formatPercent(opportunity.exit_cost)}`} />
      <DetailLine label="Carry cost" value={`− ${formatPercent(opportunity.carry_cost)}`} />
      <DetailLine label="Risk buffer" value={`− ${formatPercent(opportunity.risk_buffer)}`} />
      <View style={[styles.total, { borderTopColor: theme.border }]}>
        <Text variant="label">Net APR</Text>
        <RateText directional value={opportunity.net_apr} variant="metricSmall" />
      </View>
      <DetailLine label="Break-even funding" value={formatPercent(opportunity.break_even_funding)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 2,
  },
  total: {
    alignItems: "baseline",
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: space.xxs,
    paddingTop: space.xs,
  },
});
