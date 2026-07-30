import { useCallback, useState } from "react";
import { View } from "react-native";
import type {
  ConnectorOrderPreview,
  ConnectorOrderRequest,
  VenueAccount,
} from "@ayenisholah/perpeto-api-client";

import { useAuth } from "@/auth/AuthContext";
import { Button, ErrorState, Field, Pill, Row, Text } from "@/components";
import { DetailLine, HoldToConfirm, RiskBanner } from "@/components/domain";
import { space } from "@/theme";

/** The venue's own symbol spelling; the app never invents one. */
function symbolFor(venue: string, product: string): string {
  if (venue !== "OKX") return "BTCUSDT";
  return product === "SPOT" ? "BTC-USDT" : "BTC-USDT-SWAP";
}

/**
 * Exact sandbox order preview and submission (section 11.6): the server issues
 * the rounded native quantities and the payload hash, and the app submits that
 * preview rather than constructing a venue payload itself. Editing any input
 * discards the preview, so a stale preview can never be submitted.
 */
export function ConnectorOrderCard({ account }: { readonly account: VenueAccount }) {
  const { controller } = useAuth();
  const connection = account.connections[0];
  const product = connection?.product ?? "LINEAR_PERPETUAL";
  const symbol = symbolFor(account.venue, product);

  const [quantity, setQuantity] = useState("0.001");
  const [price, setPrice] = useState("60000");
  const [side, setSide] = useState<"BUY" | "SELL">("SELL");
  const [clientOrderId, setClientOrderId] = useState(() => `mobile-${Date.now().toString(36)}`);
  const [preview, setPreview] = useState<ConnectorOrderPreview>();
  const [status, setStatus] = useState<string>();
  const [error, setError] = useState<unknown>(undefined);
  const [busy, setBusy] = useState(false);

  const request = useCallback(
    (): ConnectorOrderRequest => ({
      product,
      symbol,
      side,
      base_quantity: quantity,
      limit_price: price,
      client_order_id: clientOrderId,
    }),
    [clientOrderId, price, product, quantity, side, symbol],
  );

  const loadPreview = useCallback(async () => {
    setBusy(true);
    setError(undefined);
    setStatus(undefined);
    try {
      setPreview(await controller.client.previewConnectorOrder(account.id, request()));
    } catch (cause) {
      setPreview(undefined);
      setError(cause);
    } finally {
      setBusy(false);
    }
  }, [account.id, controller, request]);

  const submit = useCallback(async () => {
    setBusy(true);
    setError(undefined);
    try {
      const result = await controller.client.submitConnectorOrder(account.id, request());
      setStatus(
        `${result.state}${result.venue_order_id === null ? "" : ` · ${result.venue_order_id}`}`,
      );
      setClientOrderId(`mobile-${Date.now().toString(36)}`);
      setPreview(undefined);
    } catch (cause) {
      setError(cause);
    } finally {
      setBusy(false);
    }
  }, [account.id, controller, request]);

  // Any edit invalidates the server-issued preview.
  const edit = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPreview(undefined);
  };

  if (connection === undefined) return null;
  const production = connection.environment === "PRODUCTION";

  return (
    <View style={{ gap: space.xs }}>
      <Text variant="label">
        Exact order preview · {product} · {symbol}
      </Text>

      <Row>
        {(["BUY", "SELL"] as const).map((value) => (
          <Pill
            active={side === value}
            key={value}
            label={value}
            onPress={() => {
              setSide(value);
              setPreview(undefined);
            }}
          />
        ))}
      </Row>

      <Field
        keyboardType="decimal-pad"
        label="Base quantity"
        onChangeText={edit(setQuantity)}
        value={quantity}
      />
      <Field
        keyboardType="decimal-pad"
        label="Limit price"
        onChangeText={edit(setPrice)}
        value={price}
      />

      <Button
        busy={busy}
        label="Preview native order"
        onPress={() => void loadPreview()}
        variant="secondary"
      />

      {preview === undefined ? null : (
        <View style={{ gap: 2 }}>
          <DetailLine label="Native quantity" value={preview.native_quantity} />
          <DetailLine label="Equivalent base" value={preview.equivalent_base_quantity} />
          <DetailLine label="Projected delta" value={`$${preview.projected_delta_usd}`} />
          <Text numberOfLines={2} selectable tone="textSecondary" variant="mono">
            {preview.payload_hash}
          </Text>
        </View>
      )}

      {production ? (
        <RiskBanner
          detail="Production accounts are read-only in this build. The preview above is not submittable."
          title="Shadow mode — preview only"
        />
      ) : preview === undefined ? null : (
        <HoldToConfirm
          busy={busy}
          label={`Hold to submit ${side}`}
          onConfirm={() => void submit()}
          scope={`${side} ${preview.native_quantity} ${symbol} at ${price} on ${account.venue} ${connection.environment}. Non-production funds only.`}
        />
      )}

      {status === undefined ? null : (
        <Text tone="signal" variant="caption">
          {status}
        </Text>
      )}
      {error === undefined ? null : <ErrorState error={error} />}
    </View>
  );
}
