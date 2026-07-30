import { useCallback, useState } from "react";
import { Platform } from "react-native";

import { useResource } from "@/api/useResource";
import { useAuth } from "@/auth/AuthContext";
import { Button, Card, ErrorState, Row, Text } from "@/components";
import { HoldToConfirm } from "@/components/domain";
import { createPasskeyCredential } from "@/auth/passkeys";
import { formatClock } from "@/utils/decimal";

export function PasskeysCard() {
  const { controller } = useAuth();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<unknown>(undefined);

  const load = useCallback(() => controller.client.listPasskeys(), [controller]);
  const passkeys = useResource(load);

  const register = useCallback(async () => {
    setBusy(true);
    setActionError(undefined);
    try {
      const challenge = await controller.client.startPasskeyRegistration();
      const credential = await createPasskeyCredential(challenge.options);
      await controller.client.finishPasskeyRegistration({
        challenge_id: challenge.challenge_id,
        label: `${Platform.OS === "ios" ? "iPhone" : "Device"} passkey`,
        credential,
      });
      await passkeys.reload();
    } catch (cause) {
      setActionError(cause);
    } finally {
      setBusy(false);
    }
  }, [controller, passkeys]);

  const revoke = useCallback(
    async (id: string) => {
      setActionError(undefined);
      try {
        await controller.client.revokePasskey(id);
        await passkeys.reload();
      } catch (cause) {
        setActionError(cause);
      }
    },
    [controller, passkeys],
  );

  const list = passkeys.data ?? [];

  return (
    <Card>
      <Text variant="heading">Passkeys</Text>
      <Text tone="textSecondary" variant="caption">
        A passkey authorizes credential and live-trading actions on the server. It cannot retrieve or
        decrypt an enrolled exchange secret.
      </Text>

      {passkeys.error === undefined ? null : (
        <ErrorState error={passkeys.error} onRetry={() => void passkeys.reload()} />
      )}
      {actionError === undefined ? null : <ErrorState error={actionError} />}

      {list.length === 0 ? (
        <Text tone="textSecondary" variant="caption">
          No passkey is registered on this account yet.
        </Text>
      ) : (
        list.map((passkey) => (
          <Row key={passkey.id} spread>
            <Text style={{ flexShrink: 1 }} variant="label">
              {passkey.label}
            </Text>
            <Text tone="textSecondary" variant="caption">
              Added {formatClock(passkey.created_at)}
              {passkey.last_used_at === null ? "" : ` · used ${formatClock(passkey.last_used_at)}`}
            </Text>
            <HoldToConfirm
              label="Hold to remove"
              onConfirm={() => void revoke(passkey.id)}
              scope={`Removes ${passkey.label}. Actions needing a passkey will require another one.`}
            />
          </Row>
        ))
      )}

      <Button
        busy={busy}
        label="Add a passkey"
        onPress={() => void register()}
        variant="secondary"
      />
    </Card>
  );
}
