import { useCallback, useState } from "react";
import type { PilotStatus } from "@ayenisholah/perpeto-api-client";

import { useResource } from "@/api/useResource";
import { useAuth } from "@/auth/AuthContext";
import { getPasskeyAssertion } from "@/auth/passkeys";
import { Badge, Button, Card, ErrorState, Field, Row, Text } from "@/components";
import { HoldToConfirm } from "@/components/domain";

type EligibleRoute = PilotStatus["eligible"][number];

/**
 * Pilot arming. Typing the account alias is the deliberate friction here — a
 * hold gesture alone would not prove the operator knows *which* account they
 * are arming, and arming is the step that lets the server act with real funds.
 */
export function PilotCard() {
  const { controller } = useAuth();
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<unknown>(undefined);

  const load = useCallback(() => controller.client.getPilotStatus(), [controller]);
  const pilot = useResource(load);

  const run = useCallback(
    async (action: () => Promise<unknown>) => {
      setBusy(true);
      setActionError(undefined);
      try {
        await action();
        await pilot.reload();
      } catch (cause) {
        setActionError(cause);
      } finally {
        setBusy(false);
      }
    },
    [pilot],
  );

  const arm = useCallback(
    (route: EligibleRoute) =>
      void run(async () => {
        const challenge = await controller.client.startPilotArm({
          venue_account_id: route.venue_account_id,
          product: route.product,
        });
        const assertion = await getPasskeyAssertion(challenge.options);
        await controller.client.finishPilotArm({
          challenge_id: challenge.challenge_id,
          venue_account_id: route.venue_account_id,
          product: route.product,
          assertion,
          confirmation,
        });
        setConfirmation("");
      }),
    [confirmation, controller, run],
  );

  const state = pilot.data?.state;
  const eligible = pilot.data?.eligible ?? [];

  return (
    <Card>
      <Row spread>
        <Text variant="heading">Pilot arming</Text>
        {state === undefined ? null : (
          <Badge
            label={state.replaceAll("_", " ")}
            tone={state === "PILOT_ARMED" ? "warning" : "textSecondary"}
          />
        )}
      </Row>
      <Text tone="textSecondary" variant="caption">
        Arming is control-plane only until live trading is certified.
      </Text>

      {pilot.error === undefined ? null : (
        <ErrorState error={pilot.error} onRetry={() => void pilot.reload()} />
      )}
      {actionError === undefined ? null : <ErrorState error={actionError} />}

      {state === "PAPER_ONLY" ? (
        <Button
          busy={busy}
          disabled={eligible.length === 0}
          label="Request pilot eligibility"
          onPress={() => void run(() => controller.client.grantPilotEligibility())}
          variant="secondary"
        />
      ) : null}

      {state === "PILOT_ELIGIBLE" ? (
        <>
          <Field
            autoCapitalize="none"
            autoCorrect={false}
            hint="Type the alias of the account you are arming."
            label="Confirm account alias"
            onChangeText={setConfirmation}
            value={confirmation}
          />
          {eligible.length === 0 ? (
            <Text tone="textSecondary" variant="caption">
              No route has passed preflight yet.
            </Text>
          ) : (
            eligible.map((route) => (
              <Row key={`${route.venue_account_id}:${route.product}`} spread>
                <Text variant="label">
                  {route.alias} · {route.product}
                </Text>
                <Button
                  busy={busy}
                  disabled={confirmation.trim() !== route.alias}
                  inline
                  label="Arm"
                  onPress={() => arm(route)}
                  variant="secondary"
                />
              </Row>
            ))
          )}
        </>
      ) : null}

      {state === "PILOT_ARMED" ? (
        <HoldToConfirm
          busy={busy}
          label="Hold to disarm"
          onConfirm={() => void run(() => controller.client.disarmPilot())}
          scope="Disarms the pilot and halts new risk immediately."
        />
      ) : null}
    </Card>
  );
}
