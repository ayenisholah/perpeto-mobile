import { Pressable, StyleSheet, View } from "react-native";
import { useRouter, type Href } from "expo-router";

import { Card, Icon, Screen, Text, type IconName } from "@/components";
import { minimumTouchTarget, space, useTheme } from "@/theme";

interface Destination {
  readonly href: Href;
  readonly icon: IconName;
  readonly title: string;
  readonly detail: string;
}

const DESTINATIONS: readonly Destination[] = [
  {
    href: "/portfolio",
    icon: "portfolio",
    title: "Portfolio",
    detail: "Equity, allocation by venue, and the PnL breakdown",
  },
  {
    href: "/exchanges",
    icon: "exchanges",
    title: "Exchanges",
    detail: "Connector coverage, masked accounts, and reconciliation",
  },
  {
    href: "/alerts",
    icon: "alerts",
    title: "Alerts",
    detail: "Risk and strategy events awaiting acknowledgement",
  },
  {
    href: "/health",
    icon: "health",
    title: "System health",
    detail: "Venue freshness, clock drift, and service heartbeats",
  },
  {
    href: "/security",
    icon: "security",
    title: "Security",
    detail: "Providers, devices, sessions, and account deletion",
  },
];

export function MoreScreen() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <Screen subtitle="Everything that does not need a tab of its own." title="More">
      <Card padded={false}>
        {DESTINATIONS.map((destination, index) => (
          <Pressable
            accessibilityHint={destination.detail}
            accessibilityRole="link"
            key={String(destination.href)}
            onPress={() => router.push(destination.href)}
            style={({ pressed }) => [
              styles.row,
              index === 0 ? null : { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth },
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Icon color={theme.accent} name={destination.icon} size={22} />
            <View style={styles.copy}>
              <Text variant="label">{destination.title}</Text>
              <Text tone="textSecondary" variant="caption">
                {destination.detail}
              </Text>
            </View>
            <Icon name="disclose" size={18} />
          </Pressable>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.sm,
    minHeight: minimumTouchTarget + space.xs,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
});
