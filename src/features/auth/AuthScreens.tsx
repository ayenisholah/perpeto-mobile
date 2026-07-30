import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";

import { useAuth } from "@/auth/AuthContext";
import {
  Button,
  Card,
  ErrorState,
  Field,
  ProviderButton,
  Screen,
  Text,
} from "@/components";
import { HoldToConfirm, RiskBanner } from "@/components/domain";
import { devAuthEnabled } from "@/config/featureFlags";
import { space, typography } from "@/theme";

/** Shown while the stored session is being restored or a provider is authorizing. */
export function StartingScreen() {
  return (
    <View style={styles.centred}>
      <ActivityIndicator accessibilityLabel="Signing in" size="large" />
    </View>
  );
}

export function SignInScreen() {
  const { signIn, signInDev } = useAuth();

  return (
    <Screen
      subtitle="Sign in with Apple or Google. Perpeto never creates a password account and never merges identities by email."
      title="Your control plane, securely yours"
    >
      <Card>
        {Platform.OS === "ios" ? (
          <View style={styles.providers}>
            <ProviderButton onPress={() => void signIn("APPLE")} provider="APPLE" />
            <ProviderButton onPress={() => void signIn("GOOGLE")} provider="GOOGLE" />
          </View>
        ) : (
          <Text tone="textSecondary" variant="caption">
            Sign-in is available on iOS only in this build.
          </Text>
        )}
        <Text tone="textSecondary" variant="caption">
          New accounts get access straight away.
        </Text>
      </Card>

      {/* Expo Go cannot load the native provider modules, so the buttons above
          fail there. This only appears in a build configured for local
          development against a PAPER backend started with dev auth. */}
      {devAuthEnabled() ? (
        <Card>
          <RiskBanner
            detail="No provider verification. Local PAPER backend only."
            icon="warning"
            title="Development sign-in"
          />
          <Button label="Sign in for development" onPress={() => void signInDev()} />
        </Card>
      ) : null}
    </Screen>
  );
}

export function PendingScreen() {
  const { state, bootstrap, logout } = useAuth();
  const [token, setToken] = useState("");

  if (state.kind !== "PENDING_APPROVAL" && state.kind !== "BOOTSTRAP_REQUIRED") return null;

  return (
    <Screen
      subtitle="Your provider identity is verified. Perpeto data stays locked until an Owner approves this account."
      title="Access request received"
    >
      <Card>
        <Text variant="heading">Setting up the first Owner?</Text>
        <Field
          autoCapitalize="none"
          autoCorrect={false}
          label="Deployment bootstrap token"
          onChangeText={setToken}
          secureTextEntry
          value={token}
        />
        <Button
          disabled={token.length < 32}
          label="Bootstrap the first Owner"
          onPress={() => void bootstrap(token)}
        />
      </Card>

      <Button label="Sign out" onPress={() => void logout()} variant="secondary" />
    </Screen>
  );
}

export function MfaScreen() {
  const { verifyMfa } = useAuth();
  const [code, setCode] = useState("");
  const [recovery, setRecovery] = useState(false);

  return (
    <Screen
      subtitle={
        recovery
          ? "Enter one unused recovery code."
          : "Enter the current six-digit code from your authenticator."
      }
      title="Verify it's you"
    >
      <Card>
        <Field
          autoComplete="one-time-code"
          keyboardType={recovery ? "default" : "number-pad"}
          label={recovery ? "Recovery code" : "Authenticator code"}
          maxLength={recovery ? 64 : 6}
          onChangeText={setCode}
          inputStyle={recovery ? undefined : typography.code}
          value={code}
        />
        <Button
          disabled={code.length < 6}
          label="Verify"
          onPress={() => void verifyMfa(code, recovery)}
        />
        <Button
          label={recovery ? "Use an authenticator code" : "Use a recovery code"}
          onPress={() => {
            setCode("");
            setRecovery(!recovery);
          }}
          variant="text"
        />
      </Card>
    </Screen>
  );
}

export function MfaEnrollmentScreen() {
  const { beginMfaEnrollment, confirmMfaEnrollment, acknowledgeRecoveryCodes } = useAuth();
  const [secret, setSecret] = useState<string>();
  const [code, setCode] = useState("");
  const [codes, setCodes] = useState<readonly string[]>();
  const [error, setError] = useState<unknown>(undefined);

  useEffect(() => {
    let active = true;
    void beginMfaEnrollment()
      .then((value) => {
        if (active) setSecret(value.secret);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause);
      });
    return () => {
      active = false;
    };
  }, [beginMfaEnrollment]);

  const confirm = async () => {
    try {
      setCodes(await confirmMfaEnrollment(code));
    } catch (cause) {
      setError(cause);
    }
  };

  return (
    <Screen
      subtitle="Owner, Trader, and Approver access needs an authenticator in addition to your social identity."
      title="Protect privileged access"
    >
      <Card>
        {error === undefined ? null : <ErrorState error={error} />}

        {codes === undefined ? (
          <>
            <Text tone="textSecondary" variant="caption">
              Add this secret to your authenticator app.
            </Text>
            <Text selectable variant="mono">
              {secret ?? "Preparing the authenticator secret…"}
            </Text>
            <Field
              keyboardType="number-pad"
              label="Authenticator code"
              maxLength={6}
              onChangeText={setCode}
              inputStyle={typography.code}
              value={code}
            />
            <Button
              disabled={code.length !== 6 || secret === undefined}
              label="Confirm authenticator"
              onPress={() => void confirm()}
            />
          </>
        ) : (
          <>
            <Text variant="heading">Save these one-use recovery codes now</Text>
            <Text tone="textSecondary" variant="caption">
              They are shown once. Each works a single time if you lose your authenticator.
            </Text>
            <Text selectable variant="monoLarge">
              {codes.join("\n")}
            </Text>
            <HoldToConfirm
              label="Hold to confirm I saved them"
              onConfirm={() => void acknowledgeRecoveryCodes(codes)}
              scope="These codes will not be shown again."
            />
          </>
        )}
      </Card>
    </Screen>
  );
}

export function LockedScreen() {
  const { state, retry } = useAuth();
  const message =
    state.kind === "OFFLINE_LOCKED" || state.kind === "ERROR"
      ? state.message
      : "Perpeto could not verify this session.";

  return (
    <Screen title="Perpeto is locked">
      <Card>
        <RiskBanner detail={message} icon="offline" title="Session unavailable" />
        <Button label="Try again" onPress={() => void retry()} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centred: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  providers: {
    alignItems: "center",
    gap: space.sm,
  },
});
