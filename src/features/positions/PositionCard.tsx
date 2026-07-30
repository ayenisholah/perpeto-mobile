import { useState } from "react";
import { StyleSheet, View } from "react-native";
import type { Position } from "@ayenisholah/perpeto-api-client";

import { Badge, Row, Text } from "@/components";
import { DeltaGauge, HoldToConfirm, LegCard, MoneyText } from "@/components/domain";
import { exitReasonLabel, wasRehedged } from "@/components/positionPresentation";
import { radius, space, useTheme } from "@/theme";
import { formatClock, formatUsd } from "@/utils/decimal";

interface PositionCardProps {
  readonly position: Position;
  readonly canTrade: boolean;
  readonly onClose: (id: string) => Promise<void>;
}

export function PositionCard({ position, canTrade, onClose }: PositionCardProps) {
  const theme = useTheme();
  const [closing, setClosing] = useState(false);
  const open = position.state === "OPEN";

  const close = async () => {
    setClosing(true);
    try {
      await onClose(position.id);
    } finally {
      setClosing(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
      <Row spread>
        <Text variant="bodyStrong">{position.underlying}</Text>
        <Row gap={space.xxs}>
          {wasRehedged(position) ? <Badge label="Re-hedged" tone="velocity" /> : null}
          <Badge label={position.state} tone={open ? "signal" : "textSecondary"} />
        </Row>
      </Row>

      {position.strategy_id === null ? null : (
        <Text tone="textSecondary" variant="caption">
          Strategy {position.strategy_id}
        </Text>
      )}

      <DeltaGauge
        longVenue={position.long_leg.venue}
        notionalUsd={position.target_notional}
        residualUsd={position.residual_delta_usd}
        shortVenue={position.short_leg.venue}
      />

      <Row gap={space.md}>
        <Figure label="Notional" value={formatUsd(position.target_notional)} />
        <Figure label="Reserved" value={formatUsd(position.reserved_capital)} />
      </Row>

      {open ? null : (
        <Row gap={space.md}>
          <View style={styles.figure}>
            <Text tone="textSecondary" variant="overline">
              FUNDING
            </Text>
            <MoneyText value={position.funding_captured} variant="numericCaption" />
          </View>
          <View style={styles.figure}>
            <Text tone="textSecondary" variant="overline">
              REALIZED PNL
            </Text>
            <MoneyText directional value={position.realized_pnl} variant="numericCaption" />
          </View>
          {position.exit_reason === null ? null : (
            <Figure label="Exit" value={exitReasonLabel(position.exit_reason)} />
          )}
          {position.closed_at === undefined ? null : (
            <Figure label="Closed" value={formatClock(position.closed_at)} />
          )}
        </Row>
      )}

      <LegCard leg={position.long_leg} side="LONG" />
      <LegCard leg={position.short_leg} side="SHORT" />

      {open && canTrade ? (
        <HoldToConfirm
          busy={closing}
          label="Hold to close position"
          onConfirm={() => void close()}
          scope={`Unwinds both legs of ${position.underlying} — long ${position.long_leg.venue}, short ${position.short_leg.venue}. Realized PnL is settled on close.`}
        />
      ) : null}
    </View>
  );
}

function Figure({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <View style={styles.figure}>
      <Text tone="textSecondary" variant="overline">
        {label.toUpperCase()}
      </Text>
      <Text variant="numericCaption">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space.xs,
    padding: space.sm,
  },
  figure: {
    gap: 2,
  },
});
