import { useCallback, useState } from "react";

import { useResource } from "@/api/useResource";
import { useAuth } from "@/auth/AuthContext";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Row,
  Screen,
  SkeletonRow,
  Text,
} from "@/components";
import type { ColorRole } from "@/theme";
import { formatClock } from "@/utils/decimal";

const severityTones: Readonly<Record<string, ColorRole>> = {
  CRITICAL: "critical",
  HIGH: "critical",
  WARNING: "warning",
  INFORMATIONAL: "informational",
};

export function AlertsScreen() {
  const { controller } = useAuth();
  const [actionError, setActionError] = useState<unknown>(undefined);

  const load = useCallback(() => controller.client.listAlerts(), [controller]);
  const alerts = useResource(load);

  const acknowledge = useCallback(
    async (id: string) => {
      setActionError(undefined);
      try {
        await controller.client.acknowledgeAlert(id);
        await alerts.reload();
      } catch (cause) {
        setActionError(cause);
      }
    },
    [alerts, controller],
  );

  const list = alerts.data ?? [];

  return (
    <Screen
      onRefresh={alerts.reload}
      subtitle="Deduplicated risk and strategy events. Acknowledging records that you saw it; it does not resolve the underlying incident."
      title="Alerts"
    >
      {alerts.error === undefined ? null : (
        <ErrorState error={alerts.error} onRetry={() => void alerts.reload()} />
      )}
      {actionError === undefined ? null : <ErrorState error={actionError} />}

      {alerts.loading && alerts.data === undefined ? (
        <Card>
          <SkeletonRow rows={3} />
        </Card>
      ) : list.length === 0 && alerts.error === undefined ? (
        <Card>
          <EmptyState
            detail="Perpeto raises one here when a venue degrades, a limit is breached, or a strategy changes state."
            title="Nothing needs your attention"
          />
        </Card>
      ) : (
        list.map((alert) => (
          <Card key={alert.id}>
            <Row spread>
              <Text style={{ flexShrink: 1 }} variant="heading">
                {alert.title}
              </Text>
              <Badge label={alert.severity} tone={severityTones[alert.severity] ?? "textSecondary"} />
            </Row>
            <Text tone="textSecondary" variant="body">
              {alert.message}
            </Text>
            {alert.acknowledged_at === null ? (
              <Button
                inline
                label="Acknowledge"
                onPress={() => void acknowledge(alert.id)}
                variant="secondary"
              />
            ) : (
              <Text tone="textSecondary" variant="caption">
                Acknowledged {formatClock(alert.acknowledged_at)}
              </Text>
            )}
          </Card>
        ))
      )}
    </Screen>
  );
}
