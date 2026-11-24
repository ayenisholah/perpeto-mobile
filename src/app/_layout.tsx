import { SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from "@expo-google-fonts/space-grotesk";
import { SpaceMono_400Regular, SpaceMono_700Bold } from "@expo-google-fonts/space-mono";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "@/auth/AuthContext";
import { MaskingProvider } from "@/state/masking";
import { ThemeProvider, useTheme } from "@/theme";

// Hold the native splash until the design-system faces are registered, so no
// screen ever paints in a fallback font and then reflows.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Keys must match `fontFamilies` in src/theme/typography.ts.
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
  });
  const fontsSettled = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (fontsSettled) void SplashScreen.hideAsync();
  }, [fontsSettled]);

  // A font failure falls back to the system face rather than blocking the app.
  if (!fontsSettled) return null;

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
      <StatusBar style="light" />
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
