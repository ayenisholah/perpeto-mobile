import { useCallback, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";

import { useResource } from "@/api/useResource";
import { useAuth } from "@/auth/AuthContext";
import { Card, EmptyState, ErrorState, Screen, SkeletonRow } from "@/components";
import { space } from "@/theme";

import { useCanTrade } from "../access";
import { EmergencyControls } from "../controls/EmergencyControls";
import { PositionCard } from "./PositionCard";

export function PositionsScreen() {
  const { controller } = useAuth();
  const canTrade = useCanTrade();
  const router = useRouter();
  const [actionError, setActionError] = useState<unknown>(undefined);

  const load = useCallback(() => controller.client.listPositions(), [controller]);
  const positions = useResource(load);

  const close = useCallback(
    async (id: string) => {
      setActionError(undefined);
      try {
        await controller.client.closePosition(id);
        await positions.reload();
      } catch (cause) {
        setActionError(cause);
      }
    },
    [controller, positions],
  );

  const list = positions.data?.positions ?? [];

  return (
    <Screen
      onRefresh={positions.reload}
      subtitle="Opened paper positions, their simulated fills, and realized PnL after close."
      title="Positions"
    >
      <EmergencyControls />

      {positions.error === undefined ? null : (
        <ErrorState error={positions.error} onRetry={() => void positions.reload()} />
      )}
      {actionError === undefined ? null : <ErrorState error={actionError} />}

      {positions.loading && positions.data === undefined ? (
        <Card>
          <SkeletonRow rows={3} />
        </Card>
      ) : list.length === 0 && positions.error === undefined ? (
        <Card>
          <EmptyState
            actionLabel={canTrade ? "Open the scanner" : undefined}
            detail={
              canTrade
                ? "Positions start from an eligible route in the scanner."
                : "Positions appear here once a Trader opens one."
            }
            onAction={canTrade ? () => router.push("/scanner") : undefined}
            title="No open positions"
          />
        </Card>
      ) : (
        <View style={{ gap: space.xs }}>
          {list.map((position) => (
            <PositionCard canTrade={canTrade} key={position.id} onClose={close} position={position} />
          ))}
        </View>
      )}
    </Screen>
  );
}
