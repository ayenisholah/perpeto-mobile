import { useCallback } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import type {
  Alert as ApiAlert,
  Opportunity,
  Portfolio,
  Position,
  SystemHealth,
} from "@ayenisholah/perpeto-api-client";

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
import {
  DeltaGauge,
  FreshnessBadge,
  FundingCountdown,
  HealthStatus,
  MetricCard,
  MoneyText,
  RateText,
  RiskBanner,
} from "@/components/domain";
import { space } from "@/theme";
import { displayDecimal, formatUsd } from "@/utils/decimal";

import { useCanTrade } from "../access";

const HOME_STALE_AFTER_MS = 60_000;

interface HomeData {
  readonly portfolio: Portfolio;
  readonly positions: readonly Position[];
  readonly opportunities: readonly Opportunity[];
  readonly health: SystemHealth;
  readonly alerts: readonly ApiAlert[];
}

/**
 * The operations overview from section 11.4: equity first, then what is at
 * risk, then what could be acted on.
 *
 * Every figure carries its currency and a freshness marker, and per-venue
 * allocation is shown as its own line rather than folded into a total — a
 * partial venue read must never look like a complete one.
 */
export function HomeScreen() {
  const { controller, state } = useAuth();
  const canTrade = useCanTrade();
  const router = useRouter();

  const load = useCallback(async (): Promise<HomeData> => {
    const [portfolio, positions, scan, health, alerts] = await Promise.all([
      controller.client.getPortfolio(),
      controller.client.listPositions(),
      controller.client.listOpportunities({}),
      controller.client.getSystemHealth(),
      controller.client.listAlerts(),
    ]);
    return {
      portfolio,
      positions: positions.positions,
      opportunities: scan.opportunities,
      health,
      alerts,
    };
  }, [controller]);

  const home = useResource(load, { staleAfterMs: HOME_STALE_AFTER_MS });
  const data = home.data;

  const name = state.kind === "AUTHENTICATED" ? state.user.display_name : null;
  const open = (data?.positions ?? []).filter((position) => position.state === "OPEN");
  const critical = (data?.alerts ?? []).filter(
    (alert) => alert.severity === "CRITICAL" && alert.acknowledged_at === null,
  );
  const degraded = (data?.health.venues ?? []).filter((venue) => venue.status !== "HEALTHY");
  // Positions do not carry a settlement time; the scan does, so the soonest
  // one there is the next funding event the backend knows about.
  const nextFunding = (data?.opportunities ?? [])
    .map((opportunity) => opportunity.next_funding_at)
    .filter((value) => value !== "")
    .sort()[0];

  return (
    <Screen
      onRefresh={home.reload}
      subtitle="Paper equity, what is deployed, and what needs attention."
      title={name === null ? "Overview" : `Hello, ${name}`}
    >
      <Row spread>
        <Text tone="textSecondary" variant="caption">
          All figures in USD
        </Text>
        <FreshnessBadge loadedAt={home.loadedAt} stale={home.stale} />
      </Row>

      {home.error === undefined ? null : (
        <ErrorState error={home.error} onRetry={() => void home.reload()} />
      )}

      {data === undefined ? (
        home.error === undefined ? (
          <Card>
            <SkeletonRow rows={5} />
          </Card>
        ) : null
      ) : (
        <>
          {critical.length === 0 ? null : (
            <RiskBanner
              detail={critical[0]?.title}
              icon="critical"
              title={`${critical.length} unacknowledged critical alert${critical.length === 1 ? "" : "s"}`}
              tone="critical"
            />
          )}

          <Row gap={space.xs}>
            <MetricCard
              label="Equity"
              value={<MoneyText value={data.portfolio.equity} variant="metric" />}
            />
            <MetricCard
              caption={`${formatUsd(data.portfolio.deployed_capital)} deployed`}
              label="Available"
              value={<MoneyText value={data.portfolio.deployable_equity} variant="metric" />}
            />
          </Row>

          <Row gap={space.xs}>
            <MetricCard
              label="Net PnL"
              value={<MoneyText directional value={data.portfolio.pnl.net} variant="metric" />}
            />
            <MetricCard
              caption="Realized funding"
              label="Funding income"
              value={<MoneyText value={data.portfolio.pnl.realized_funding} variant="metric" />}
            />
          </Row>

          {nextFunding === undefined ? null : (
            <Card>
              <FundingCountdown nextFundingAt={nextFunding} />
            </Card>
          )}

          <Card>
            <Text variant="heading">Quick actions</Text>
            <Row gap={space.xs}>
              <Button
                icon="scanner"
                inline
                label="Scan"
                onPress={() => router.push("/scanner")}
                variant="secondary"
              />
              <Button
                icon="strategies"
                inline
                label="Strategies"
                onPress={() => router.push("/strategies")}
                variant="secondary"
              />
              <Button
                icon="portfolio"
                inline
                label="Portfolio"
                onPress={() => router.push("/portfolio")}
                variant="secondary"
              />
              {canTrade ? (
                <Button
                  icon="pause"
                  inline
                  label="Pause entries"
                  onPress={() => router.push("/positions")}
                  variant="secondary"
                />
              ) : null}
            </Row>
          </Card>

          <Card>
            <Row spread>
              <Text variant="heading">Open positions</Text>
              <Badge label={`${open.length}`} tone="textSecondary" />
            </Row>
            {open.length === 0 ? (
              <EmptyState
                actionLabel="Open the scanner"
                detail="Nothing is deployed right now."
                onAction={() => router.push("/scanner")}
                title="No open positions"
              />
            ) : (
              open.slice(0, 3).map((position) => (
                <View key={position.id} style={{ gap: space.xxs }}>
                  <Row spread>
                    <Text variant="label">{position.underlying}</Text>
                    <MoneyText value={position.target_notional} variant="numericCaption" />
                  </Row>
                  <DeltaGauge
                    compact
                    longVenue={position.long_leg.venue}
                    notionalUsd={position.target_notional}
                    residualUsd={position.residual_delta_usd}
                    shortVenue={position.short_leg.venue}
                  />
                </View>
              ))
            )}
            {open.length > 3 ? (
              <Button
                inline
                label={`See all ${open.length}`}
                onPress={() => router.push("/positions")}
                variant="text"
              />
            ) : null}
          </Card>

          <Card>
            <Text variant="heading">Best eligible routes</Text>
            {data.opportunities.length === 0 ? (
              <Text tone="textSecondary" variant="caption">
                Nothing cleared the active risk limits in the latest scan.
              </Text>
            ) : (
              data.opportunities
                .filter((opportunity) => opportunity.within_limits)
                .slice(0, 3)
                .map((opportunity) => (
                  <Row key={opportunity.route_id} spread>
                    <Text variant="label">{opportunity.underlying}</Text>
                    <Row gap={space.xs}>
                      <Text tone="textSecondary" variant="caption">
                        {opportunity.long_venue} → {opportunity.short_venue}
                      </Text>
                      <RateText
                        directional={displayDecimal(opportunity.net_apr) < 0}
                        value={opportunity.net_apr}
                        variant="metricSmall"
                      />
                    </Row>
                  </Row>
                ))
            )}
            <Button
              inline
              label="Open the scanner"
              onPress={() => router.push("/scanner")}
              variant="text"
            />
          </Card>

          <Card>
            <Row spread>
              <Text variant="heading">Venue health</Text>
              {degraded.length === 0 ? (
                <Badge icon="healthy" label="All healthy" tone="healthy" />
              ) : (
                <Badge icon="warning" label={`${degraded.length} degraded`} tone="warning" />
              )}
            </Row>
            {degraded.slice(0, 3).map((venue) => (
              <Row key={venue.venue} spread>
                <Text variant="label">{venue.venue}</Text>
                <HealthStatus status={venue.status} />
              </Row>
            ))}
            <Button
              inline
              label="Open system health"
              onPress={() => router.push("/health")}
              variant="text"
            />
          </Card>
        </>
      )}
    </Screen>
  );
}
