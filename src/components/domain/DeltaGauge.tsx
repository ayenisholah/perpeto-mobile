import { StyleSheet, View } from "react-native";
import type { DecimalString } from "@ayenisholah/perpeto-api-client";

import { radius, space, useTheme } from "@/theme";
import { displayDecimal, formatUsd } from "@/utils/decimal";

import { Text } from "../Text";
import {
  BAND_LEFT_PERCENT,
  BAND_WIDTH_PERCENT,
  DEFAULT_HEDGE_LIMIT,
  hedgeReadout,
} from "./hedge";

interface DeltaGaugeProps {
  readonly longVenue: string;
  readonly shortVenue: string;
  readonly residualUsd: DecimalString;
  readonly notionalUsd: DecimalString;
  /** Fraction of notional the operator tolerates before the hedge is breached. */
  readonly limitFraction?: number;
  readonly compact?: boolean;
}

/**
 * The hedge balance bar: long venue anchored left, short venue right, a centred
 * zero, and residual delta drawn as an offset marker inside the tolerance band.
 *
 * It is the one place this interface spends visual boldness, and it earns it by
 * showing the product's actual thesis — market neutrality — rather than a
 * yield figure. Position, the signed number and the "within/outside limit"
 * wording each carry the state independently, so it survives both colour
 * blindness and Reduce Motion (nothing here animates).
 */
export function DeltaGauge({
  longVenue,
  shortVenue,
  residualUsd,
  notionalUsd,
  limitFraction = DEFAULT_HEDGE_LIMIT,
  compact = false,
}: DeltaGaugeProps) {
  const theme = useTheme();
  const residual = displayDecimal(residualUsd);
  const { fraction, offset, breached } = hedgeReadout(
    residual,
    displayDecimal(notionalUsd),
    limitFraction,
  );
  const markerTone = breached ? theme.critical : theme.signal;

  const summary = `Residual delta ${formatUsd(residualUsd)}, ${(fraction * 100).toFixed(2)} percent of notional, ${
    breached ? "outside" : "within"
  } the hedge limit. Long ${longVenue}, short ${shortVenue}.`;

  return (
    <View accessibilityLabel={summary} accessible style={styles.container}>
      {compact ? null : (
        <View style={styles.venues}>
          <Text tone="long" variant="overline">
            LONG {longVenue}
          </Text>
          <Text tone="short" variant="overline">
            SHORT {shortVenue}
          </Text>
        </View>
      )}

      <View style={[styles.rail, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
        {/* The tolerance band: anything inside it is an acceptable hedge. */}
        <View
          style={[
            styles.band,
            {
              backgroundColor: theme.field,
              left: `${BAND_LEFT_PERCENT}%`,
              width: `${BAND_WIDTH_PERCENT}%`,
            },
          ]}
        />
        <View style={[styles.zero, { backgroundColor: theme.border }]} />
        <View
          style={[
            styles.marker,
            { backgroundColor: markerTone, left: `${50 + offset * 50}%` },
          ]}
        />
      </View>

      <View style={styles.readout}>
        <Text tone={breached ? "critical" : "textSecondary"} variant="numericCaption">
          {`Δ ${residual > 0 ? "+" : ""}${formatUsd(residualUsd)} · ${(fraction * 100).toFixed(2)}% of notional`}
        </Text>
        <Text tone={breached ? "critical" : "textSecondary"} variant="caption">
          {breached ? "Outside limit" : "Within limit"}
        </Text>
      </View>
    </View>
  );
}

const MARKER_WIDTH = 3;

const styles = StyleSheet.create({
  container: {
    gap: space.xxs,
  },
  venues: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rail: {
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    height: 10,
    justifyContent: "center",
    overflow: "hidden",
  },
  band: {
    bottom: 0,
    position: "absolute",
    top: 0,
  },
  zero: {
    bottom: 0,
    left: "50%",
    position: "absolute",
    top: 0,
    width: StyleSheet.hairlineWidth,
  },
  marker: {
    borderRadius: MARKER_WIDTH / 2,
    bottom: 1,
    marginLeft: -MARKER_WIDTH / 2,
    position: "absolute",
    top: 1,
    width: MARKER_WIDTH,
  },
  readout: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.xs,
    justifyContent: "space-between",
  },
});
