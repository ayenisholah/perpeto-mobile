import { StyleSheet, View } from "react-native";
import type { DecimalString } from "@ayenisholah/perpeto-api-client";

import { MASK, useMasking } from "@/state/masking";
import { space, type ColorRole, type TypeVariant } from "@/theme";
import { displayDecimal, formatPercent, formatUsd } from "@/utils/decimal";

import { Text } from "../Text";

/**
 * Profit and loss always combines colour with a sign (section 12.2), so the
 * explicit `+` is not decoration — it is half of the signal. Without it a
 * red-green colour blind operator reads two identical figures.
 */
function signed(formatted: string, value: DecimalString): string {
  return displayDecimal(value) > 0 ? `+${formatted}` : formatted;
}

function toneFor(value: DecimalString, directional: boolean): ColorRole | undefined {
  if (!directional) return undefined;
  const numeric = displayDecimal(value);
  if (numeric > 0) return "positive";
  if (numeric < 0) return "negative";
  return undefined;
}

interface ValueProps {
  readonly value: DecimalString;
  readonly variant?: TypeVariant;
  /** Adds a sign and profit/loss colour. Off for quantities and thresholds. */
  readonly directional?: boolean;
  /** Set false for figures that are not the operator's money, such as limits. */
  readonly sensitive?: boolean;
}

/** A currency amount. Takes a `DecimalString` only — never a `number`. */
export function MoneyText({
  value,
  variant = "numeric",
  directional = false,
  sensitive = true,
}: ValueProps) {
  const { masked } = useMasking();
  const formatted = formatUsd(value);
  return (
    <Text tone={toneFor(value, directional)} variant={variant}>
      {sensitive && masked ? MASK : directional ? signed(formatted, value) : formatted}
    </Text>
  );
}

/** A rate, APR or fraction. Rates are not balances, so they are never masked. */
export function RateText({ value, variant = "numeric", directional = false }: ValueProps) {
  const formatted = formatPercent(value);
  return (
    <Text tone={toneFor(value, directional)} variant={variant}>
      {directional ? signed(formatted, value) : formatted}
    </Text>
  );
}

interface DetailLineProps {
  readonly label: string;
  readonly value: string;
}

/** Label-and-value row for detail sheets. */
export function DetailLine({ label, value }: DetailLineProps) {
  return (
    <View style={styles.line}>
      <Text tone="textSecondary" variant="caption">
        {label}
      </Text>
      <Text style={styles.value} variant="numeric">
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  line: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: space.sm,
    justifyContent: "space-between",
    paddingVertical: space.xxs,
  },
  value: {
    flexShrink: 1,
    textAlign: "right",
  },
});
