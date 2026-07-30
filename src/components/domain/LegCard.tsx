import { StyleSheet, View } from "react-native";
import type { PositionLeg } from "@ayenisholah/perpeto-api-client";

import { space, useTheme } from "@/theme";
import { formatUsd } from "@/utils/decimal";

import { Text } from "../Text";
import { DetailLine } from "./values";

interface LegCardProps {
  readonly side: "LONG" | "SHORT";
  readonly leg: PositionLeg;
}

/**
 * One side of a hedge. The side is spelled out as well as coloured, because
 * long and short are the pair most often confused at a glance.
 */
export function LegCard({ side, leg }: LegCardProps) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { borderColor: theme[side === "LONG" ? "long" : "short"] }]}>
      <Text tone={side === "LONG" ? "long" : "short"} variant="overline">
        {side} · {leg.venue} · {leg.symbol}
      </Text>
      <DetailLine label="Filled" value={`${leg.filled_qty} @ ${formatUsd(leg.avg_fill_price)}`} />
      <DetailLine label="Fees" value={formatUsd(leg.fees)} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderLeftWidth: 2,
    gap: space.xxs,
    paddingLeft: space.xs,
  },
});
