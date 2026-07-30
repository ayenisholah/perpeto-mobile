import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "@/auth/AuthContext";
import { MaskingProvider } from "@/state/masking";
import { ThemeProvider, useScheme, useTheme } from "@/theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <MaskingProvider>
            <RootNavigator />
          </MaskingProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

/**
 * Route guarding is declarative: `Stack.Protected` keeps the authenticated
 * routes unmounted until the state machine says the session is good, so there
 * is no window in which a screen renders and then redirects.
 *
 * The server remains the authority (section 11.2). This only decides what the
 * interface offers.
 */
function RootNavigator() {
  const { state } = useAuth();
  const scheme = useScheme();
  const theme = useTheme();
  const authenticated = state.kind === "AUTHENTICATED";

  const detailScreen = {
    headerBackTitle: "Back",
    headerShadowVisible: false,
    headerShown: true,
    headerStyle: { backgroundColor: theme.background },
    headerTintColor: theme.accent,
    // The screen renders its own large title, so the bar carries only the
    // back affordance.
    headerTitle: "",
  } as const;

  return (
    <>
      <StatusBar style={scheme === "light" ? "dark" : "light"} />
      <Stack screenOptions={{ contentStyle: { backgroundColor: theme.background }, headerShown: false }}>
        <Stack.Protected guard={authenticated}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="portfolio" options={detailScreen} />
          <Stack.Screen name="exchanges" options={detailScreen} />
          <Stack.Screen name="alerts" options={detailScreen} />
          <Stack.Screen name="health" options={detailScreen} />
          <Stack.Screen name="security" options={detailScreen} />
        </Stack.Protected>

        <Stack.Protected guard={!authenticated}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}
