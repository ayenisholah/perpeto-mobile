import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";

import { useResource } from "@/api/useResource";
import { useAuth } from "@/auth/AuthContext";
import { Badge, IconButton, Row, Text } from "@/components";
import { useMasking } from "@/state/masking";
import { space, useScheme, useTheme } from "@/theme";

const markDark = require("../../../assets/brand/mark-dark.png");
const markLight = require("../../../assets/brand/mark-light.png");

/**
 * The chrome section 11.2 requires on every authenticated screen: the
 * environment badge, the backend risk state, the unread critical-alert count,
 * and the sensitive-value toggle.
 *
 * It lives above the tab navigator so those four never scroll away — the state
 * of the deployment should not depend on where the operator has scrolled to.
 */
export function ShellHeader() {
  const { controller } = useAuth();
  const scheme = useScheme();
  const theme = useTheme();
  const router = useRouter();
  const { masked, toggle } = useMasking();

  const loadControls = useCallback(() => controller.client.getControls(), [controller]);
  const controls = useResource(loadControls);

  const loadAlerts = useCallback(() => controller.client.listAlerts(), [controller]);
  const alerts = useResource(loadAlerts);

  const breakers = controls.data?.breakers ?? [];
  const unread = (alerts.data ?? []).filter(
    (alert) => alert.severity === "CRITICAL" && alert.acknowledged_at === null,
  ).length;

  return (
    <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
      <Row gap={space.xs}>
        <Image
          accessibilityIgnoresInvertColors
          contentFit="contain"
          source={scheme === "light" ? markLight : markDark}
          style={styles.mark}
        />
        <Text variant="bodyStrong">Perpeto</Text>
        <Badge label="Paper" tone="signal" />
      </Row>

      <Row gap={space.xxs}>
        {breakers.length === 0 ? null : (
          <Badge icon="critical" label={`${breakers.length} breaker`} tone="critical" />
        )}
        <IconButton
          hint="Opens the alerts screen"
          label={unread === 0 ? "Alerts" : `Alerts, ${unread} unread critical`}
          name="alerts"
          onPress={() => router.push("/alerts")}
          color={unread === 0 ? undefined : theme.critical}
        />
        <IconButton
          hint="Hides balances and profit and loss"
          label={masked ? "Show sensitive values" : "Hide sensitive values"}
          name={masked ? "reveal" : "conceal"}
          onPress={toggle}
        />
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
  mark: {
    height: 22,
    width: 22,
  },
});
