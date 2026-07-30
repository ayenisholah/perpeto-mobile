import { useCallback, useState } from "react";
import type { Strategy } from "@ayenisholah/perpeto-api-client";

import { useResource } from "@/api/useResource";
import { useAuth } from "@/auth/AuthContext";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Row,
  Screen,
  SkeletonRow,
  Text,
} from "@/components";
import { PermissionGate } from "@/components/domain";
import { formatPercent, halfDecimal } from "@/utils/decimal";

import { useCanTrade } from "../access";

const DECIMAL_PATTERN = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/u;

/**
 * Builds the draft the server will normalise. The APR threshold stays a string
 * end to end — `halfDecimal` derives the exit threshold in `BigInt`, because
 * this value is sent back rather than merely displayed.
 */
function draftStrategy(name: string, threshold: string): Strategy {
  return {
    id: "00000000-0000-0000-0000-000000000000",
    name,
    enabled: false,
    current: {
      version: 1,
      creator: "server",
      created_at: new Date().toISOString(),
      mode: "PAPER",
      route_types: ["PERP_PERP"],
      allowed_venues: ["BINANCE", "BYBIT", "OKX"],
      allowed_assets: ["BTC", "ETH"],
      min_net_apr: threshold,
      min_profitability: "0.65",
      min_forecast_coverage: "0.65",
      max_time_to_funding_minutes: 480,
      max_basis_bps: "80",
      allocation: { method: "FIXED", value: "1000" },
      max_concurrent: 2,
      cooldown_seconds: 14400,
      hold_seconds: 1209600,
      auto_compound: { enabled: false, reinvest_fraction: "0.5", minimum_reinvest_amount: "25" },
      exit_net_apr: halfDecimal(threshold),
      max_drawdown_fraction: "0.03",
    },
  };
}

export function StrategiesScreen() {
  const { controller } = useAuth();
  const canTrade = useCanTrade();
  const [name, setName] = useState("BTC basis paper");
  const [minApr, setMinApr] = useState("0.08");
  const [actionError, setActionError] = useState<unknown>(undefined);
  const [invalid, setInvalid] = useState<string>();

  const load = useCallback(() => controller.client.listStrategies(), [controller]);
  const strategies = useResource(load);

  const create = useCallback(async () => {
    const threshold = minApr.trim();
    if (!DECIMAL_PATTERN.test(threshold) || !Number.isFinite(Number(threshold))) {
      setInvalid("Enter the threshold as a decimal fraction, such as 0.08 for 8%.");
      return;
    }
    setInvalid(undefined);
    setActionError(undefined);
    try {
      await controller.client.createStrategy(draftStrategy(name, threshold));
      await strategies.reload();
    } catch (cause) {
      setActionError(cause);
    }
  }, [controller, minApr, name, strategies]);

  const toggle = useCallback(
    async (strategy: Strategy) => {
      setActionError(undefined);
      try {
        if (strategy.enabled) await controller.client.disableStrategy(strategy.id);
        else await controller.client.enableStrategy(strategy.id);
        await strategies.reload();
      } catch (cause) {
        setActionError(cause);
      }
    },
    [controller, strategies],
  );

  const list = strategies.data ?? [];

  return (
    <Screen
      onRefresh={strategies.reload}
      subtitle="Versioned server-side paper automation. Editing creates an immutable version; enabling controls new entries."
      title="Strategies"
    >
      <PermissionGate
        allowed={canTrade}
        requirement="Trader access is required to create or change a strategy."
      >
        <Card>
          <Text variant="heading">New strategy</Text>

          <Field label="Name" onChangeText={setName} value={name} />

          <Field
            error={invalid}
            hint="A decimal fraction — 0.08 means 8%."
            keyboardType="decimal-pad"
            label="Minimum net APR"
            onChangeText={setMinApr}
            value={minApr}
          />

          <Button label="Create paper strategy" onPress={() => void create()} />
        </Card>
      </PermissionGate>

      {strategies.error === undefined ? null : (
        <ErrorState error={strategies.error} onRetry={() => void strategies.reload()} />
      )}
      {actionError === undefined ? null : <ErrorState error={actionError} />}

      {strategies.loading && strategies.data === undefined ? (
        <Card>
          <SkeletonRow rows={2} />
        </Card>
      ) : list.length === 0 && strategies.error === undefined ? (
        <Card>
          <EmptyState
            detail="Create one above to let the server open qualifying routes without you watching the scanner."
            title="No strategies yet"
          />
        </Card>
      ) : (
        list.map((strategy) => (
          <Card key={strategy.id}>
            <Row spread>
              <Text variant="heading">{strategy.name}</Text>
              <Badge
                label={strategy.enabled ? "Enabled" : "Paused"}
                tone={strategy.enabled ? "signal" : "textSecondary"}
              />
            </Row>
            <Text tone="textSecondary" variant="caption">
              Version {strategy.current.version} · opens at APR ≥{" "}
              {formatPercent(strategy.current.min_net_apr)}
            </Text>
            <Text tone="textSecondary" variant="caption">
              {strategy.current.allocation.method.toLowerCase()} allocation · at most{" "}
              {strategy.current.max_concurrent} concurrent positions
            </Text>
            {canTrade ? (
              <Button
                icon={strategy.enabled ? "pause" : "resume"}
                inline
                label={strategy.enabled ? "Pause new entries" : "Enable"}
                onPress={() => void toggle(strategy)}
                variant="secondary"
              />
            ) : null}
          </Card>
        ))
      )}
    </Screen>
  );
}
