import { useCallback, useState } from "react";
import { View } from "react-native";
import type { Venue } from "@ayenisholah/perpeto-api-client";

import { useResource } from "@/api/useResource";
import { useAuth } from "@/auth/AuthContext";
import { Badge, Button, Card, ErrorState, Row, Text } from "@/components";
import { HoldToConfirm, PermissionGate, RiskBanner } from "@/components/domain";
import { space } from "@/theme";

import { useCanTrade, useIsOwner } from "../access";

const VENUES: readonly Venue[] = ["BINANCE", "BYBIT", "OKX"];

/**
 * Operator safety controls.
 *
 * The weighting is deliberate and is the main correction to the previous
 * build, where halting, going read-only and resuming were three identical
 * green fills. Protective actions are ordinary buttons; the two actions that
 * *remove* protection — flattening every position, and resuming entries after
 * a halt — require hold-to-confirm with their scope stated first.
 */
export function EmergencyControls() {
  const { controller } = useAuth();
  const canTrade = useCanTrade();
  const owner = useIsOwner();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<unknown>(undefined);

  const load = useCallback(() => controller.client.getControls(), [controller]);
  const controls = useResource(load);

  const run = useCallback(
    async (action: () => Promise<unknown>) => {
      setBusy(true);
      setActionError(undefined);
      try {
        await action();
        await controls.reload();
      } catch (cause) {
        setActionError(cause);
      } finally {
        setBusy(false);
      }
    },
    [controls],
  );

  const breakers = controls.data?.breakers ?? [];

  return (
    <Card>
      <Text variant="heading">Safety controls</Text>

      {breakers.length === 0 ? (
        <Badge icon="healthy" label="No active breakers" tone="healthy" />
      ) : (
        <View style={{ gap: space.xxs }}>
          {breakers.map((breaker) => (
            <RiskBanner
              detail={`Action: ${breaker.action.replaceAll("_", " ").toLowerCase()}`}
              icon="critical"
              key={breaker.id}
              title={`Breaker tripped · ${breaker.scope_key ?? breaker.scope}`}
              tone="critical"
            />
          ))}
        </View>
      )}

      {controls.error === undefined ? null : (
        <ErrorState error={controls.error} onRetry={() => void controls.reload()} />
      )}
      {actionError === undefined ? null : <ErrorState error={actionError} />}

      <PermissionGate
        allowed={canTrade}
        requirement="Trader access is required to use the safety controls."
      >
        <View style={{ gap: space.xs }}>
          <Button
            busy={busy}
            icon="pause"
            label="Halt new entries"
            onPress={() => void run(() => controller.client.halt())}
            variant="secondary"
          />
          <Button
            busy={busy}
            icon="conceal"
            label="Go read-only"
            onPress={() => void run(() => controller.client.halt("READ_ONLY"))}
            variant="secondary"
          />

          <Text tone="textSecondary" variant="caption">
            Stop using a single venue without halting the rest.
          </Text>
          <Row>
            {VENUES.map((venue) => (
              <Button
                busy={busy}
                inline
                key={venue}
                label={`Disable ${venue}`}
                onPress={() => void run(() => controller.client.disableVenue(venue))}
                variant="secondary"
              />
            ))}
          </Row>

          {owner ? (
            <HoldToConfirm
              busy={busy}
              label="Hold to flatten every position"
              onConfirm={() => void run(() => controller.client.flatten())}
              scope="Unwinds all open paper positions and keeps new risk halted until you resume."
            />
          ) : null}

          <HoldToConfirm
            busy={busy}
            label="Hold to resume entries"
            onConfirm={() => void run(() => controller.client.resumeControls())}
            scope="Clears operator halts and lets strategies open new positions again."
          />
        </View>
      </PermissionGate>
    </Card>
  );
}
