import { useCallback, useState } from "react";
import { Alert } from "react-native";
import type { AccessRequest, AuditLog, LinkedIdentity, Session } from "@ayenisholah/perpeto-api-client";

import { useResource } from "@/api/useResource";
import { useAuth } from "@/auth/AuthContext";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Field,
  Row,
  Screen,
  SkeletonRow,
  Text,
} from "@/components";
import { HoldToConfirm } from "@/components/domain";
import { auditEnabled, passkeysEnabled } from "@/config/featureFlags";
import { formatClock } from "@/utils/decimal";

import { useIsOwner, useIsPrivileged } from "../access";
import { CredentialEnrollmentCard } from "./CredentialEnrollmentCard";
import { PasskeysCard } from "./PasskeysCard";
import { PilotCard } from "./PilotCard";

const PROVIDERS = ["APPLE", "GOOGLE"] as const;

interface SecurityData {
  readonly sessions: readonly Session[];
  readonly identities: readonly LinkedIdentity[];
  readonly requests: readonly AccessRequest[];
  readonly audit: AuditLog | undefined;
}

export function SecurityScreen() {
  const { state, controller, logout, deleteAccount } = useAuth();
  const owner = useIsOwner();
  const privileged = useIsPrivileged();
  const [linkTotp, setLinkTotp] = useState("");
  const [actionError, setActionError] = useState<unknown>(undefined);

  const load = useCallback(async (): Promise<SecurityData> => {
    const [sessions, identities] = await Promise.all([
      controller.client.listSessions(),
      controller.client.listIdentities(),
    ]);
    return {
      sessions,
      identities,
      // Owner-only reads stay inside the same load so a failure surfaces as an
      // error rather than as a convincing-looking empty list.
      requests: owner ? await controller.client.listAccessRequests() : [],
      audit: owner && auditEnabled() ? await controller.client.getAuditLog() : undefined,
    };
  }, [controller, owner]);

  const security = useResource(load);

  const run = useCallback(
    async (action: () => Promise<unknown>) => {
      setActionError(undefined);
      try {
        await action();
        await security.reload();
      } catch (cause) {
        setActionError(cause);
      }
    },
    [security],
  );

  const user = state.kind === "AUTHENTICATED" ? state.user : null;
  if (user === null) return null;

  const data = security.data;
  const identities = data?.identities ?? [];
  const unlinked = PROVIDERS.filter(
    (provider) => !identities.some((identity) => identity.provider === provider),
  );

  const confirmDelete = () =>
    Alert.alert(
      "Delete your Perpeto account?",
      "This revokes every session and provider credential and erases your profile. The final Owner must transfer ownership first.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => void deleteAccount() },
      ],
    );

  return (
    <Screen
      onRefresh={security.reload}
      subtitle="Access tokens stay in memory; only the rotating refresh credential is kept in the device keychain."
      title="Security"
    >
      <Card>
        <Text variant="heading">{user.tenant.display_name}</Text>
        <Text tone="textSecondary" variant="caption">
          Personal tenant · {user.tenant.base_currency} ·{" "}
          {user.tenant.state.replaceAll("_", " ").toLowerCase()}
        </Text>
        <Text tone="textSecondary" variant="caption">
          Your tenant comes from this authenticated session and cannot be chosen in the app.
        </Text>
      </Card>

      {security.error === undefined ? null : (
        <ErrorState error={security.error} onRetry={() => void security.reload()} />
      )}
      {actionError === undefined ? null : <ErrorState error={actionError} />}

      {data === undefined ? (
        security.error === undefined ? (
          <Card>
            <SkeletonRow rows={3} />
          </Card>
        ) : null
      ) : (
        <>
          <Card>
            <Text variant="heading">Linked providers</Text>
            {identities.map((identity) => (
              <Row key={identity.provider} spread>
                <Text variant="label">{identity.provider === "APPLE" ? "Apple" : "Google"}</Text>
                <Text style={{ flexShrink: 1 }} tone="textSecondary" variant="caption">
                  {identity.profile_email ?? "Private profile"}
                </Text>
                {identities.length < 2 ? null : (
                  <Button
                    inline
                    label="Unlink"
                    onPress={() => void run(() => controller.client.unlinkIdentity(identity.provider))}
                    variant="secondary"
                  />
                )}
              </Row>
            ))}

            {unlinked.length === 0 ? null : (
              <>
                {privileged ? (
                  <Field
                    hint="Linking a second provider needs a current authenticator code."
                    keyboardType="number-pad"
                    label="Authenticator code"
                    maxLength={6}
                    onChangeText={setLinkTotp}
                    value={linkTotp}
                  />
                ) : null}
                {unlinked.map((provider) => (
                  <Button
                    disabled={privileged && linkTotp.length !== 6}
                    key={provider}
                    label={`Link ${provider === "APPLE" ? "Apple" : "Google"}`}
                    onPress={() =>
                      void run(() => controller.linkIdentity(provider, linkTotp || undefined))
                    }
                    variant="secondary"
                  />
                ))}
              </>
            )}
          </Card>

          <Card>
            <Text variant="heading">Devices and sessions</Text>
            {data.sessions.map((session) => (
              <Row key={session.id} spread>
                <Text variant="label">{session.device_name}</Text>
                {session.current ? (
                  <Badge label="This device" tone="signal" />
                ) : (
                  <>
                    <Text tone="textSecondary" variant="caption">
                      Last used {formatClock(session.last_seen_at)}
                    </Text>
                    <Button
                      inline
                      label="Revoke"
                      onPress={() => void run(() => controller.client.revokeSession(session.id))}
                      variant="secondary"
                    />
                  </>
                )}
              </Row>
            ))}
          </Card>

          {passkeysEnabled() ? <PasskeysCard /> : null}
          {passkeysEnabled() ? <CredentialEnrollmentCard /> : null}
          {passkeysEnabled() ? <PilotCard /> : null}

          {owner ? (
            <Card>
              <Text variant="heading">Pending access</Text>
              {data.requests.length === 0 ? (
                <Text tone="textSecondary" variant="caption">
                  Nobody is waiting for access.
                </Text>
              ) : (
                data.requests.map((request) => (
                  <Row key={request.user_id} spread>
                    <Text style={{ flexShrink: 1 }} variant="label">
                      {request.display_name ?? request.email ?? request.provider}
                    </Text>
                    <Button
                      inline
                      label="Approve as Viewer"
                      onPress={() =>
                        void run(() => controller.client.approveAccessRequest(request.user_id))
                      }
                      variant="secondary"
                    />
                  </Row>
                ))
              )}
            </Card>
          ) : null}

          {owner && auditEnabled() && data.audit !== undefined ? (
            <Card>
              <Row spread>
                <Text variant="heading">Recent activity</Text>
                <Badge
                  icon={data.audit.intact ? "healthy" : "critical"}
                  label={data.audit.intact ? "Chain verified" : "Integrity check failed"}
                  tone={data.audit.intact ? "healthy" : "critical"}
                />
              </Row>
              {data.audit.events.length === 0 ? (
                <Text tone="textSecondary" variant="caption">
                  No activity has been recorded yet.
                </Text>
              ) : (
                data.audit.events.slice(0, 8).map((entry) => (
                  <Row key={entry.event_hash} spread>
                    <Text variant="label">{entry.event_type.replaceAll("_", " ").toLowerCase()}</Text>
                    <Text tone="textSecondary" variant="caption">
                      {formatClock(entry.occurred_at)}
                    </Text>
                  </Row>
                ))
              )}
            </Card>
          ) : null}
        </>
      )}

      <Button label="Sign out" onPress={() => void logout()} variant="secondary" />
      <HoldToConfirm
        label="Hold to delete account"
        onConfirm={confirmDelete}
        scope="Revokes every session and provider credential and erases your profile."
      />
    </Screen>
  );
}
