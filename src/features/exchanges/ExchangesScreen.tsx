import { useCallback, useState } from "react";
import { View } from "react-native";
import type {
  ConnectorAccounting,
  ConnectorOrder,
  ReconciliationRun,
  VenueAccount,
  VenueSummary,
} from "@ayenisholah/perpeto-api-client";

import { useResource } from "@/api/useResource";
import { useAuth } from "@/auth/AuthContext";
import {
  Badge,
  Button,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  Row,
  Screen,
  SkeletonRow,
  Text,
} from "@/components";
import { DetailLine, HoldToConfirm, RiskBanner } from "@/components/domain";
import { space } from "@/theme";

import { useCanTrade, useIsOwner } from "../access";
import { ConnectorOrderCard } from "./ConnectorOrderCard";

/** One load for the whole screen, so the accounting snapshots arrive with their accounts. */
interface ExchangeData {
  readonly venues: readonly VenueSummary[];
  readonly accounts: readonly VenueAccount[];
  readonly orders: readonly ConnectorOrder[];
  readonly reconciliations: readonly ReconciliationRun[];
  readonly accounting: Readonly<Record<string, ConnectorAccounting>>;
}

export function ExchangesScreen() {
  const { controller } = useAuth();
  const canTrade = useCanTrade();
  const owner = useIsOwner();
  const [busy, setBusy] = useState<string>();
  const [result, setResult] = useState<Readonly<Record<string, string>>>({});
  const [actionError, setActionError] = useState<unknown>(undefined);

  const load = useCallback(async (): Promise<ExchangeData> => {
    const [venues, accounts, orders, reconciliations] = await Promise.all([
      controller.client.listVenues(),
      controller.client.listVenueAccounts(),
      controller.client.listConnectorOrders(),
      controller.client.listReconciliations(),
    ]);
    const snapshots = await Promise.all(
      accounts.map(async (account) => [account.id, await controller.client.getConnectorAccounting(account.id)] as const),
    );
    return { venues, accounts, orders, reconciliations, accounting: Object.fromEntries(snapshots) };
  }, [controller]);

  const exchanges = useResource(load);

  const run = useCallback(
    async (id: string, action: () => Promise<unknown>, message: string) => {
      setBusy(id);
      setActionError(undefined);
      try {
        await action();
        setResult((current) => ({ ...current, [id]: message }));
        await exchanges.reload();
      } catch (cause) {
        setActionError(cause);
      } finally {
        setBusy(undefined);
      }
    },
    [exchanges],
  );

  const data = exchanges.data;

  return (
    <Screen
      onRefresh={exchanges.reload}
      subtitle="Masked exchange connections for sandbox and read-only operation. Credentials are imported and rotated with the audited server CLI, never from this app."
      title="Exchanges"
    >
      {exchanges.error === undefined ? null : (
        <ErrorState error={exchanges.error} onRetry={() => void exchanges.reload()} />
      )}
      {actionError === undefined ? null : <ErrorState error={actionError} />}

      {data === undefined ? (
        exchanges.error === undefined ? (
          <Card>
            <SkeletonRow rows={4} />
          </Card>
        ) : null
      ) : (
        <>
          <Card>
            <Text variant="heading">Connector coverage</Text>
            {data.venues.map((venue) => (
              <Row key={venue.venue} spread>
                <View>
                  <Text variant="label">{venue.display_name}</Text>
                  <Text tone="textSecondary" variant="caption">
                    {venue.products.join(" + ")} · {venue.sandbox_environment}
                  </Text>
                </View>
                <Badge
                  label={`${venue.configured_accounts} configured`}
                  tone={venue.configured_accounts > 0 ? "signal" : "textSecondary"}
                />
              </Row>
            ))}
          </Card>

          {data.accounts.length === 0 ? (
            <Card>
              <EmptyState
                detail="Import one with the server CLI. For safety, exchange credentials can never be entered on a phone."
                title="No exchange accounts yet"
              />
            </Card>
          ) : (
            data.accounts.map((account) => (
              <Card key={account.id}>
                <Row spread>
                  <View>
                    <Text variant="heading">{account.alias}</Text>
                    <Text tone="textSecondary" variant="caption">
                      {account.venue} · {account.masked_identity}
                    </Text>
                  </View>
                  <Badge
                    label={account.enabled ? account.certification_state : "Disabled"}
                    tone={account.enabled ? "signal" : "critical"}
                  />
                </Row>

                {account.connections.map((connection) => (
                  <View key={connection.id} style={{ gap: 2 }}>
                    <Text variant="label">
                      {connection.product} · {connection.environment}
                    </Text>
                    <Row gap={space.xs}>
                      <Badge label={connection.status} tone="textSecondary" />
                      <Badge
                        label={connection.read_permission ? "Read" : "No read"}
                        tone={connection.read_permission ? "healthy" : "warning"}
                      />
                      <Badge
                        label={connection.trade_permission ? "Trade" : "No trade"}
                        tone={connection.trade_permission ? "healthy" : "textSecondary"}
                      />
                      {connection.withdrawal_permission === true ? (
                        <Badge icon="critical" label="Withdrawal enabled" tone="critical" />
                      ) : null}
                    </Row>
                  </View>
                ))}

                {connectionWithdrawalWarning(account) ? (
                  <RiskBanner
                    detail="A trading key must not permit withdrawals. Rotate it with the server CLI."
                    icon="critical"
                    title="Withdrawal permission detected"
                    tone="critical"
                  />
                ) : null}

                {(data.accounting[account.id]?.balances ?? []).length === 0 ? null : (
                  <>
                    <Divider />
                    <Text variant="label">Balances</Text>
                    {(data.accounting[account.id]?.balances ?? []).map((balance) => (
                      <DetailLine
                        key={balance.asset}
                        label={balance.asset}
                        value={`${balance.total} total · ${balance.available} available · ${balance.locked} locked`}
                      />
                    ))}
                  </>
                )}

                {(data.accounting[account.id]?.positions ?? []).length === 0 ? null : (
                  <>
                    <Text variant="label">Venue positions</Text>
                    {(data.accounting[account.id]?.positions ?? []).map((position) => (
                      <DetailLine
                        key={`${position.symbol}:${position.product}`}
                        label={position.symbol}
                        value={`qty ${position.quantity} · entry ${position.entry_price} · mark ${position.mark_price}`}
                      />
                    ))}
                  </>
                )}

                {data.accounting[account.id]?.run_id === null ? (
                  <Text tone="warning" variant="caption">
                    Awaiting the first reconciliation snapshot.
                  </Text>
                ) : null}

                {result[account.id] === undefined ? null : (
                  <Text tone="signal" variant="caption">
                    {result[account.id]}
                  </Text>
                )}

                {canTrade && account.enabled ? (
                  <Button
                    busy={busy === account.id}
                    label="Test configuration"
                    onPress={() =>
                      void run(
                        account.id,
                        async () => {
                          const test = await controller.client.testVenueAccount(account.id);
                          if (test.status !== "PASS") throw new Error(test.checks.join(" · "));
                        },
                        "Configuration passed",
                      )
                    }
                    variant="secondary"
                  />
                ) : null}

                {owner && account.enabled ? (
                  <HoldToConfirm
                    busy={busy === account.id}
                    label="Hold to disable account"
                    onConfirm={() =>
                      void run(
                        account.id,
                        () => controller.client.disableVenueAccount(account.id),
                        "Account disabled",
                      )
                    }
                    scope={`Stops connector use for every product on ${account.alias}. Credentials stay encrypted for audited recovery.`}
                  />
                ) : null}

                {canTrade && account.enabled ? (
                  <>
                    <Divider />
                    <ConnectorOrderCard account={account} />
                  </>
                ) : null}
              </Card>
            ))
          )}

          <Card>
            <Text variant="heading">Recent connector orders</Text>
            {data.orders.length === 0 ? (
              <Text tone="textSecondary" variant="caption">
                No connector order has been submitted yet.
              </Text>
            ) : (
              data.orders.slice(0, 10).map((order) => (
                <View key={order.id} style={{ gap: 2 }}>
                  <Text variant="label">
                    {order.venue} · {order.side} {order.symbol} · {order.state}
                  </Text>
                  <Text selectable tone="textSecondary" variant="numericCaption">
                    Native {order.native_quantity} @ {order.native_price} · base{" "}
                    {order.equivalent_base_quantity} · Δ ${order.projected_delta_usd}
                  </Text>
                  <Text numberOfLines={1} selectable tone="textSecondary" variant="mono">
                    {order.payload_hash}
                  </Text>
                </View>
              ))
            )}
          </Card>

          <Card>
            <Text variant="heading">Reconciliation</Text>
            {data.reconciliations.length === 0 ? (
              <Text tone="textSecondary" variant="caption">
                No reconciliation run has been recorded yet.
              </Text>
            ) : (
              data.reconciliations.slice(0, 10).map((entry) => (
                <Row key={entry.id} spread>
                  <Text variant="label">{entry.venue}</Text>
                  <Row gap={space.xs}>
                    <Text tone="textSecondary" variant="numericCaption">
                      {entry.discrepancies} discrepancies · {entry.fills_seen} fills
                    </Text>
                    <Badge
                      label={entry.status}
                      tone={entry.discrepancies === 0 ? "healthy" : "critical"}
                    />
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

function connectionWithdrawalWarning(account: VenueAccount): boolean {
  return account.connections.some((connection) => connection.withdrawal_permission === true);
}
