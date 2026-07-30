import { useCallback } from "react";

import { useResource } from "@/api/useResource";
import { useAuth } from "@/auth/AuthContext";
import { Card, EmptyState, ErrorState, Row, Screen, SkeletonRow, Text } from "@/components";
import { HealthStatus } from "@/components/domain";
import { space } from "@/theme";

const HEALTH_STALE_AFTER_MS = 45_000;

export function HealthScreen() {
  const { controller } = useAuth();
  const load = useCallback(() => controller.client.getSystemHealth(), [controller]);
  const health = useResource(load, { staleAfterMs: HEALTH_STALE_AFTER_MS });

  return (
    <Screen
      onRefresh={health.reload}
      subtitle="Venue data freshness, connection state, clock drift, and service heartbeats."
      title="System health"
    >
      {health.error === undefined ? null : (
        <ErrorState error={health.error} onRetry={() => void health.reload()} />
      )}

      {health.data === undefined ? (
        health.error === undefined ? (
          <Card>
            <SkeletonRow rows={3} />
          </Card>
        ) : null
      ) : (
        <>
          <Card>
            <Text variant="heading">Venues</Text>
            {health.data.venues.length === 0 ? (
              <EmptyState detail="No venue is reporting yet." title="Nothing to report" />
            ) : (
              health.data.venues.map((venue) => (
                <Row key={venue.venue} spread>
                  <Text variant="label">{venue.venue}</Text>
                  <Row gap={space.xs}>
                    <Text tone="textSecondary" variant="numericCaption">
                      {venue.market_data_age_seconds}s old · {venue.clock_drift_ms}ms drift
                    </Text>
                    <HealthStatus status={venue.status} />
                  </Row>
                </Row>
              ))
            )}
          </Card>

          <Card>
            <Text variant="heading">Services</Text>
            {health.data.services.length === 0 ? (
              <EmptyState detail="No service heartbeat has arrived yet." title="Nothing to report" />
            ) : (
              health.data.services.map((service) => (
                <Row key={service.service} spread>
                  <Text variant="label">{service.service}</Text>
                  <Row gap={space.xs}>
                    <Text tone="textSecondary" variant="numericCaption">
                      {new Date(service.observed_at).toLocaleTimeString()}
                    </Text>
                    <HealthStatus status={service.status} />
                  </Row>
                </Row>
              ))
            )}
          </Card>
        </>
      )}
    </Screen>
  );
}
