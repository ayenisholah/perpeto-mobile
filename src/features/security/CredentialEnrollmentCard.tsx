import { useCallback, useState } from "react";
import type { Venue } from "@ayenisholah/perpeto-api-client";

import { useAuth } from "@/auth/AuthContext";
import { getPasskeyAssertion } from "@/auth/passkeys";
import { Button, Card, ErrorState, Field, Pill, Row, Text } from "@/components";
import { HoldToConfirm, RiskBanner } from "@/components/domain";

const VENUES: readonly Venue[] = ["BYBIT", "BINANCE", "OKX"];

interface Enrolled {
  readonly id: string;
  readonly product: string;
}

/**
 * One-use, passkey-authorized credential enrollment.
 *
 * The key and secret live in component state only for the length of the
 * submission and are cleared the moment it succeeds — `docs/ENGINEERING.md`
 * forbids retaining any raw credential on the device, and the server never
 * returns one.
 */
export function CredentialEnrollmentCard() {
  const { controller } = useAuth();
  const [venue, setVenue] = useState<Venue>("BYBIT");
  const [alias, setAlias] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(undefined);
  const [done, setDone] = useState<string>();
  const [enrolled, setEnrolled] = useState<Enrolled>();

  const enroll = useCallback(async () => {
    setBusy(true);
    setError(undefined);
    setDone(undefined);
    const fields = { venue, alias, product: "LINEAR_PERPETUAL", environment: "TESTNET" } as const;
    try {
      const challenge = await controller.client.startCredentialEnrollment(fields);
      const assertion = await getPasskeyAssertion(challenge.options);
      const account = await controller.client.finishCredentialEnrollment({
        challenge_id: challenge.challenge_id,
        ...fields,
        assertion,
        credential: { api_key: apiKey, api_secret: apiSecret },
      });
      setDone(`Enrolled ${account.masked_identity}. Preflight is pending.`);
      setEnrolled({ id: account.id, product: fields.product });
      setAlias("");
      setApiKey("");
      setApiSecret("");
    } catch (cause) {
      setError(cause);
    } finally {
      setBusy(false);
    }
  }, [alias, apiKey, apiSecret, controller, venue]);

  const preflight = useCallback(async () => {
    if (enrolled === undefined) return;
    setBusy(true);
    setError(undefined);
    try {
      const report = await controller.client.runPreflight(enrolled.id, { product: enrolled.product });
      setDone(`Preflight ${report.status.replaceAll("_", " ").toLowerCase()}.`);
    } catch (cause) {
      setError(cause);
    } finally {
      setBusy(false);
    }
  }, [controller, enrolled]);

  const remove = useCallback(async () => {
    if (enrolled === undefined) return;
    setBusy(true);
    setError(undefined);
    try {
      const challenge = await controller.client.startCredentialDeletion(enrolled.id);
      const assertion = await getPasskeyAssertion(challenge.options);
      await controller.client.finishCredentialDeletion(enrolled.id, {
        challenge_id: challenge.challenge_id,
        assertion,
      });
      setDone("Credential deleted.");
      setEnrolled(undefined);
    } catch (cause) {
      setError(cause);
    } finally {
      setBusy(false);
    }
  }, [controller, enrolled]);

  const ready = alias.trim() !== "" && apiKey.trim() !== "" && apiSecret.trim() !== "";

  return (
    <Card>
      <Text variant="heading">Enroll an exchange credential</Text>
      <RiskBanner
        detail="Keys are sent once, encrypted on the server, and never stored on this device. A passkey authorizes the enrollment."
        icon="warning"
        title="Testnet only"
      />

      {error === undefined ? null : <ErrorState error={error} />}
      {done === undefined ? null : (
        <Text tone="signal" variant="caption">
          {done}
        </Text>
      )}

      <Row>
        {VENUES.map((option) => (
          <Pill
            active={venue === option}
            key={option}
            label={option}
            onPress={() => setVenue(option)}
          />
        ))}
      </Row>

      <Field
        autoCapitalize="none"
        autoCorrect={false}
        label="Account alias"
        onChangeText={setAlias}
        value={alias}
      />
      <Field
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect={false}
        label="API key"
        onChangeText={setApiKey}
        secureTextEntry
        value={apiKey}
      />
      <Field
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect={false}
        label="API secret"
        onChangeText={setApiSecret}
        secureTextEntry
        value={apiSecret}
      />

      <Button
        busy={busy}
        disabled={!ready}
        label="Enroll on testnet"
        onPress={() => void enroll()}
      />

      {enrolled === undefined ? null : (
        <>
          <Button
            busy={busy}
            label="Run preflight"
            onPress={() => void preflight()}
            variant="secondary"
          />
          <HoldToConfirm
            busy={busy}
            label="Hold to delete credential"
            onConfirm={() => void remove()}
            scope="Removes the enrolled credential from the server vault. Re-enrolling requires the key and secret again."
          />
        </>
      )}
    </Card>
  );
}
