import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { radius, space, useTheme } from "@/theme";
import { formatClock, formatCountdown, minutesUntil } from "@/utils/decimal";

import { Text } from "../Text";

interface FundingCountdownProps {
  /** Server timestamp of the next settlement. Never a device-computed time. */
  readonly nextFundingAt: string;
  /** Venue funding interval, used to scale the remaining-time track. */
  readonly intervalMinutes?: number;
}

const DEFAULT_INTERVAL_MINUTES = 480;
const TICK_MS = 30_000;

/**
 * Time to the next funding settlement, on server time.
 *
 * The track depletes toward settlement and is redrawn on a 30-second tick — it
 * does not animate. Section 12.1 prohibits looping velocity effects, and a
 * countdown is exactly where one would otherwise creep in.
 */
export function FundingCountdown({
  nextFundingAt,
  intervalMinutes = DEFAULT_INTERVAL_MINUTES,
}: FundingCountdownProps) {
  const theme = useTheme();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const remaining = minutesUntil(nextFundingAt, now);
  if (remaining === undefined) {
    return (
      <Text tone="stale" variant="caption">
        Next funding unknown
      </Text>
    );
  }

  const fraction = Math.max(0, Math.min(1, remaining / intervalMinutes));
  const imminent = remaining <= 15;

  return (
    <View
      accessibilityLabel={`Next funding in ${formatCountdown(remaining)}, at ${formatClock(nextFundingAt)}`}
      accessible
      style={styles.container}
    >
      <View style={styles.header}>
        <Text tone="textSecondary" variant="caption">
          Next funding
        </Text>
        <Text tone={imminent ? "signal" : "textPrimary"} variant="metricSmall">
          {formatCountdown(remaining)}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: theme.surfaceElevated }]}>
        <View
          style={[
            styles.fill,
            { backgroundColor: imminent ? theme.signal : theme.velocity, width: `${fraction * 100}%` },
          ]}
        />
      </View>
      <Text tone="textSecondary" variant="caption">
        {formatClock(nextFundingAt)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: space.xxs,
  },
  header: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: space.xs,
    justifyContent: "space-between",
  },
  track: {
    borderRadius: radius.sm,
    height: 4,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
  },
});
