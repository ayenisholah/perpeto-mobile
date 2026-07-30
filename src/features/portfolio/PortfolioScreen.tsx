import { useCallback } from "react";
import { View } from "react-native";

import { useResource } from "@/api/useResource";
import { useAuth } from "@/auth/AuthContext";
import { Card, ErrorState, Row, Screen, SkeletonRow, Text } from "@/components";
import { DetailLine, FreshnessBadge, MetricCard, MoneyText, RateText } from "@/components/domain";
import { space } from "@/theme";
import { formatUsd } from "@/utils/decimal";

const PORTFOLIO_STALE_AFTER_MS = 60_000;

export function PortfolioScreen() {
  const { controller } = useAuth();
  const load = useCallback(() => controller.client.getPortfolio(), [controller]);
  const portfolio = useResource(load, { staleAfterMs: PORTFOLIO_STALE_AFTER_MS });

  return (
    <Screen
      onRefresh={portfolio.reload}
      subtitle="Paper equity, allocation, and PnL from positions, fills, fees, and captured funding."
      title="Portfolio"
    >
      <Row spread>
        <Text tone="textSecondary" variant="caption">
          All figures in USD
        </Text>
        <FreshnessBadge loadedAt={portfolio.loadedAt} stale={portfolio.stale} />
      </Row>

      {portfolio.error === undefined ? null : (
        <ErrorState error={portfolio.error} onRetry={() => void portfolio.reload()} />
      )}

      {portfolio.data === undefined ? (
        portfolio.error === undefined ? (
          <Card>
            <SkeletonRow rows={4} />
          </Card>
        ) : null
      ) : (
        <>
          <Row gap={space.xs}>
            <MetricCard
              label="Equity"
              value={<MoneyText value={portfolio.data.equity} variant="metric" />}
            />
            <MetricCard
              caption={`${formatUsd(portfolio.data.deployed_capital)} deployed`}
              label="Deployable"
              value={<MoneyText value={portfolio.data.deployable_equity} variant="metric" />}
            />
          </Row>

          <Card>
            <Text variant="heading">Profit and loss</Text>
            <MoneyText directional value={portfolio.data.pnl.net} variant="metric" />
            <View style={{ gap: 2 }}>
              <DetailLine label="Realized funding" value={formatUsd(portfolio.data.pnl.realized_funding)} />
              <DetailLine label="Realized trading" value={formatUsd(portfolio.data.pnl.realized_trading)} />
              <DetailLine label="Unrealized on legs" value={formatUsd(portfolio.data.pnl.unrealized_leg)} />
              <DetailLine label="Fees" value={`− ${formatUsd(portfolio.data.pnl.fees)}`} />
            </View>
          </Card>

          <Card>
            <Text variant="heading">Allocation by venue</Text>
            {portfolio.data.by_venue.length === 0 ? (
              <Text tone="textSecondary" variant="caption">
                No capital is deployed to a venue yet.
              </Text>
            ) : (
              portfolio.data.by_venue.map((item) => (
                <Row key={item.key} spread>
                  <Text variant="label">{item.key}</Text>
                  <Row gap={space.sm}>
                    <MoneyText value={item.deployed_capital} variant="numericCaption" />
                    <RateText value={item.fraction} variant="numericCaption" />
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
