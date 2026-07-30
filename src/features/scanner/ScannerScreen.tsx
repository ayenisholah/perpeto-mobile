import { useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import type {
  Opportunity,
  OpportunityFilter,
  OpportunitySort,
  RouteType,
} from "@ayenisholah/perpeto-api-client";

import { useResource } from "@/api/useResource";
import { useAuth } from "@/auth/AuthContext";
import {
  Card,
  EmptyState,
  ErrorState,
  Pill,
  Row,
  Screen,
  SkeletonRow,
  Text,
} from "@/components";
import { FreshnessBadge, OpportunityCard } from "@/components/domain";
import { space } from "@/theme";
import { formatDecimal, formatPercent } from "@/utils/decimal";

import { useCanTrade } from "../access";
import { OpportunityDetailSheet } from "./OpportunityDetailSheet";

const ROUTE_FILTERS: readonly { readonly key: "ALL" | RouteType; readonly label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PERP_PERP", label: "Perp · Perp" },
  { key: "SPOT_PERP", label: "Spot · Perp" },
];

const SORTS: readonly { readonly key: OpportunitySort; readonly label: string }[] = [
  { key: "default", label: "Rank" },
  { key: "net_apr", label: "APR" },
  { key: "next_funding", label: "Funding" },
  { key: "capacity", label: "Capacity" },
];

/** A scan older than this stops being trustworthy for an entry decision. */
const SCAN_STALE_AFTER_MS = 120_000;

export function ScannerScreen() {
  const { controller } = useAuth();
  const canTrade = useCanTrade();
  const router = useRouter();
  const [route, setRoute] = useState<"ALL" | RouteType>("ALL");
  const [sort, setSort] = useState<OpportunitySort>("default");
  const [selected, setSelected] = useState<Opportunity>();

  const filter = useMemo<OpportunityFilter>(
    () => ({
      ...(route === "ALL" ? {} : { route_type: route }),
      ...(sort === "default" ? {} : { sort }),
    }),
    [route, sort],
  );

  const loadScan = useCallback(() => controller.client.listOpportunities(filter), [controller, filter]);
  const scan = useResource(loadScan, { staleAfterMs: SCAN_STALE_AFTER_MS });

  const loadLimits = useCallback(() => controller.client.getRiskLimits(), [controller]);
  const limits = useResource(loadLimits);

  const open = useCallback(
    async (opportunity: Opportunity) => {
      await controller.client.createPosition({ route_id: opportunity.route_id });
      setSelected(undefined);
      router.push("/positions");
    },
    [controller, router],
  );

  const opportunities = scan.data?.opportunities ?? [];

  return (
    <Screen
      onRefresh={scan.reload}
      subtitle="Ranked funding-arbitrage routes from the paper scanner. Tap a route for the full breakdown."
      title="Opportunities"
    >
      <Row spread>
        <Text tone="textSecondary" variant="caption">
          {scan.loading && scan.data === undefined ? "Scanning…" : `${opportunities.length} eligible`}
        </Text>
        <FreshnessBadge loadedAt={scan.loadedAt} stale={scan.stale} />
      </Row>

      {limits.data === undefined ? null : (
        <Card>
          <Text variant="heading">Active risk limits</Text>
          <Row gap={space.md}>
            <Text tone="textSecondary" variant="numericCaption">
              Min APR {formatPercent(limits.data.min_net_apr)}
            </Text>
            <Text tone="textSecondary" variant="numericCaption">
              Min win {formatPercent(limits.data.min_profitability)}
            </Text>
            <Text tone="textSecondary" variant="numericCaption">
              Max leverage {formatDecimal(limits.data.max_leverage, 1)}×
            </Text>
            <Text tone="textSecondary" variant="numericCaption">
              Max basis {formatDecimal(limits.data.max_entry_basis_bps, 0)} bps
            </Text>
            <Text tone="textSecondary" variant="numericCaption">
              Max per route {formatPercent(limits.data.max_opportunity_fraction)}
            </Text>
          </Row>
        </Card>
      )}

      <View style={{ gap: space.xs }}>
        <Row>
          {ROUTE_FILTERS.map((entry) => (
            <Pill
              active={route === entry.key}
              key={entry.key}
              label={entry.label}
              onPress={() => setRoute(entry.key)}
            />
          ))}
        </Row>
        <Row>
          {SORTS.map((entry) => (
            <Pill
              active={sort === entry.key}
              key={entry.key}
              label={entry.label}
              onPress={() => setSort(entry.key)}
            />
          ))}
        </Row>
      </View>

      {scan.error === undefined ? null : <ErrorState error={scan.error} onRetry={() => void scan.reload()} />}

      {scan.loading && scan.data === undefined ? (
        <Card>
          <SkeletonRow rows={4} />
        </Card>
      ) : opportunities.length === 0 && scan.error === undefined ? (
        <Card>
          <EmptyState
            actionLabel={route === "ALL" ? undefined : "Show every route type"}
            detail={
              route === "ALL"
                ? "Nothing cleared the active risk limits in this scan. Rates move continuously — pull down to scan again."
                : "Nothing cleared the limits for this route type. Widening the filter usually surfaces more."
            }
            onAction={route === "ALL" ? undefined : () => setRoute("ALL")}
            title="No eligible routes right now"
          />
        </Card>
      ) : (
        <View style={{ gap: space.xs }}>
          {opportunities.map((opportunity) => (
            <OpportunityCard
              key={opportunity.route_id}
              onPress={() => setSelected(opportunity)}
              opportunity={opportunity}
            />
          ))}
        </View>
      )}

      <OpportunityDetailSheet
        canOpen={canTrade}
        onClose={() => setSelected(undefined)}
        onOpen={open}
        opportunity={selected}
      />
    </Screen>
  );
}
