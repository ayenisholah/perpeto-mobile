import { useState } from "react";
import { View } from "react-native";
import type { Opportunity } from "@ayenisholah/perpeto-api-client";

import {
  BottomSheet,
  Button,
  ErrorState,
  Row,
  Text,
} from "@/components";
import {
  DeltaGauge,
  DetailLine,
  FundingCountdown,
  HoldToConfirm,
  RiskBanner,
  VenueBadge,
  YieldBreakdown,
} from "@/components/domain";
import { space } from "@/theme";
import { formatDecimal, formatPercent, formatUsd } from "@/utils/decimal";

interface OpportunityDetailSheetProps {
  readonly opportunity: Opportunity | undefined;
  readonly canOpen: boolean;
  readonly onClose: () => void;
  readonly onOpen: (opportunity: Opportunity) => Promise<void>;
}

function legSummary(leg: Opportunity["long_leg"]): string {
  return `${formatPercent(leg.predicted_rate)} predicted · p10 ${formatPercent(leg.p10_rate)} · p90 ${formatPercent(leg.p90_rate)}`;
}

/**
 * The full route breakdown (section 11.6). Opening a position is a
 * hold-to-confirm action with its exact scope stated first — a scanner figure
 * is indicative, and committing capital should not share a gesture with
 * scrolling past it.
 */
export function OpportunityDetailSheet({
  opportunity,
  canOpen,
  onClose,
  onOpen,
}: OpportunityDetailSheetProps) {
  const [error, setError] = useState<unknown>(undefined);
  const [opening, setOpening] = useState(false);

  if (opportunity === undefined) return null;

  const open = async () => {
    setOpening(true);
    setError(undefined);
    try {
      await onOpen(opportunity);
    } catch (cause) {
      setError(cause);
      setOpening(false);
    }
  };

  return (
    <BottomSheet onClose={onClose} title={`${opportunity.underlying} route`} visible>
      <Row gap={space.xs}>
        <VenueBadge venue={`LONG ${opportunity.long_venue}`} />
        <VenueBadge venue={`SHORT ${opportunity.short_venue}`} />
        <VenueBadge venue={opportunity.route_type === "SPOT_PERP" ? "SPOT · PERP" : "PERP · PERP"} />
      </Row>

      <Text tone="textSecondary" variant="caption">
        {opportunity.funding_direction.toLowerCase()} funding
      </Text>

      <FundingCountdown nextFundingAt={opportunity.next_funding_at} />

      <DeltaGauge
        longVenue={opportunity.long_venue}
        notionalUsd={opportunity.reserved_notional}
        residualUsd="0"
        shortVenue={opportunity.short_venue}
      />

      <YieldBreakdown opportunity={opportunity} />

      <View style={{ gap: space.xxs }}>
        <DetailLine label="Profitability" value={formatPercent(opportunity.profitability_probability)} />
        <DetailLine label="Expected net PnL" value={formatUsd(opportunity.expected_net_pnl)} />
        <DetailLine label="Entry basis" value={`${formatDecimal(opportunity.entry_basis_bps, 1)} bps`} />
        <DetailLine label="Leverage" value={`${formatDecimal(opportunity.leverage, 1)}×`} />
        <DetailLine label="Required capital" value={formatUsd(opportunity.required_capital)} />
        <DetailLine label="Available capacity" value={formatUsd(opportunity.available_capacity)} />
        <DetailLine label="Reserved notional" value={formatUsd(opportunity.reserved_notional)} />
        <DetailLine label="Reserved capital" value={formatUsd(opportunity.reserved_capital)} />
        <DetailLine label="Portfolio use" value={formatPercent(opportunity.capital_fraction)} />
      </View>

      <Text tone="textSecondary" variant="caption">
        Long {opportunity.long_venue}: {legSummary(opportunity.long_leg)}
      </Text>
      <Text tone="textSecondary" variant="caption">
        Short {opportunity.short_venue}: {legSummary(opportunity.short_leg)}
      </Text>

      {opportunity.within_limits ? null : (
        <RiskBanner
          detail="This route breaches an active risk limit, so it cannot be opened."
          title="Outside risk limits"
        />
      )}

      {error === undefined ? null : <ErrorState error={error} />}

      {canOpen && opportunity.within_limits ? (
        <HoldToConfirm
          busy={opening}
          label="Hold to open paper position"
          onConfirm={() => void open()}
          scope={`Simulated fill on ${opportunity.underlying}: long ${opportunity.long_venue}, short ${opportunity.short_venue}, ${formatUsd(opportunity.reserved_notional)} notional. Paper only — no live orders are placed.`}
        />
      ) : (
        <Text tone="textSecondary" variant="caption">
          {opportunity.within_limits
            ? "Monitoring only. Trader access is required to open a position."
            : "Not open-eligible while it sits outside the active limits."}
        </Text>
      )}

      <Button inline label="Close" onPress={onClose} variant="text" />
    </BottomSheet>
  );
}
