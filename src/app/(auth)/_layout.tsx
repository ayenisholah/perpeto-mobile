import { Stack } from "expo-router";

import { useAuth } from "@/auth/AuthContext";
import { useTheme } from "@/theme";

/**
 * The unauthenticated flow. Exactly one guard is true at a time, so the stack
 * always has a single available screen and the state machine — not a
 * navigation call — decides which step the person is on.
 */
export default function AuthLayout() {
  const { state } = useAuth();
  const theme = useTheme();
  const kind = state.kind;

  return (
    <Stack
      screenOptions={{ contentStyle: { backgroundColor: theme.background }, headerShown: false }}
    >
      <Stack.Protected guard={kind === "RESTORING" || kind === "AUTHORIZING"}>
        <Stack.Screen name="starting" />
      </Stack.Protected>

      <Stack.Protected guard={kind === "SIGNED_OUT"}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>

      <Stack.Protected guard={kind === "PENDING_APPROVAL" || kind === "BOOTSTRAP_REQUIRED"}>
        <Stack.Screen name="pending" />
      </Stack.Protected>

      <Stack.Protected guard={kind === "MFA_REQUIRED"}>
        <Stack.Screen name="mfa" />
      </Stack.Protected>

      <Stack.Protected guard={kind === "MFA_ENROLLMENT_REQUIRED"}>
        <Stack.Screen name="mfa-enroll" />
      </Stack.Protected>

      <Stack.Protected guard={kind === "OFFLINE_LOCKED" || kind === "ERROR"}>
        <Stack.Screen name="locked" />
      </Stack.Protected>
    </Stack>
  );
}
