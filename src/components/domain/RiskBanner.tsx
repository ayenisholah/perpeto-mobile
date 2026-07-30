import type { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";

import { radius, space, useTheme, type ColorRole } from "@/theme";

import { Icon, type IconName } from "../Icon";
import { Text } from "../Text";

interface RiskBannerProps {
  readonly title: string;
  readonly detail?: string;
  readonly tone?: ColorRole;
  readonly icon?: IconName;
}

/**
 * Standing notice about the state of the deployment — entries halted, a
 * breaker tripped, read-only mode. Distinct from `ErrorState`, which is about
 * a request that failed; this is about the system being deliberately
 * constrained, and it stays on screen while that remains true.
 */
export function RiskBanner({ title, detail, tone = "warning", icon = "warning" }: RiskBannerProps) {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="alert"
      style={[styles.banner, { backgroundColor: theme.surfaceElevated, borderColor: theme[tone] }]}
    >
      <Icon color={theme[tone]} name={icon} size={18} />
      <View style={styles.copy}>
        <Text tone={tone} variant="label">
          {title}
        </Text>
        {detail === undefined ? null : (
          <Text tone="textSecondary" variant="caption">
            {detail}
          </Text>
        )}
      </View>
    </View>
  );
}

interface PermissionGateProps extends PropsWithChildren {
  readonly allowed: boolean;
  /** Which role unlocks this, in the operator's words. */
  readonly requirement: string;
}

/**
 * Server-side authorization is authoritative (section 11.2); this only keeps
 * the interface honest about what the current role can do, rather than
 * offering a control that will be refused.
 */
export function PermissionGate({ allowed, requirement, children }: PermissionGateProps) {
  if (allowed) return <>{children}</>;
  return (
    <Text tone="textSecondary" variant="caption">
      {requirement}
    </Text>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignItems: "flex-start",
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: space.xs,
    padding: space.sm,
  },
  copy: {
    flex: 1,
    gap: space.xxs,
  },
});
