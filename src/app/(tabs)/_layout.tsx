import { useCallback } from "react";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";

import { describeIncompatibility } from "@/api/compatibility";
import { useResource } from "@/api/useResource";
import { useAuth } from "@/auth/AuthContext";
import { Icon, type IconName } from "@/components";
import { RiskBanner } from "@/components/domain";
import { ShellHeader } from "@/features/shell/ShellHeader";
import { space, useTheme } from "@/theme";

const TABS: readonly { readonly name: string; readonly title: string; readonly icon: IconName }[] = [
  { name: "index", title: "Home", icon: "home" },
  { name: "scanner", title: "Scanner", icon: "scanner" },
  { name: "strategies", title: "Strategies", icon: "strategies" },
  { name: "positions", title: "Positions", icon: "positions" },
  { name: "more", title: "More", icon: "more" },
];

/**
 * Five bottom tabs, per PRODUCT_SPEC section 11.2.
 *
 * This replaces the row of eight equal-width pills that forced "Strategies"
 * and "Exchanges" to wrap onto three lines. A platform tab bar sizes its own
 * labels, so the labels stay on one line at every text size, and the four
 * surfaces that do not warrant a tab moved behind More.
 */
export default function TabsLayout() {
  const theme = useTheme();
  const { controller } = useAuth();

  const probe = useCallback(() => controller.client.health(), [controller]);
  const health = useResource(probe);
  const mismatch =
    health.data === undefined ? undefined : describeIncompatibility(health.data.stage);

  return (
    <View style={styles.container}>
      <ShellHeader />
      {mismatch === undefined ? null : (
        <View style={styles.banner}>
          <RiskBanner detail={mismatch.detail} icon="critical" title={mismatch.title} tone="critical" />
        </View>
      )}
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: theme.background },
          tabBarActiveTintColor: theme.accent,
          tabBarInactiveTintColor: theme.textSecondary,
          tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.border },
        }}
      >
        {TABS.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              tabBarIcon: ({ color }) => <Icon color={color} name={tab.icon} size={24} />,
              title: tab.title,
            }}
          />
        ))}
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  banner: {
    paddingHorizontal: space.md,
    paddingTop: space.xs,
  },
});
