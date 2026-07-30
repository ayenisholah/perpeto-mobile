import { createContext, useContext, useMemo, type PropsWithChildren } from "react";
import { useColorScheme } from "react-native";

import { themes, type Theme } from "./colors";

export type SchemeName = "light" | "dark";

interface ThemeContextValue {
  readonly scheme: SchemeName;
  readonly colors: Theme;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * `app.json` sets `userInterfaceStyle: "automatic"`, so both schemes must be
 * correct. Resolving the scheme once here replaces the copy of this ternary
 * that every component used to carry.
 */
export function ThemeProvider({ children }: PropsWithChildren) {
  const scheme: SchemeName = useColorScheme() === "light" ? "light" : "dark";
  const value = useMemo<ThemeContextValue>(
    () => ({ scheme, colors: themes[scheme] }),
    [scheme],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function useThemeContext(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (value === null) throw new Error("useTheme must be used within ThemeProvider");
  return value;
}

/** The resolved colour roles. */
export function useTheme(): Theme {
  return useThemeContext().colors;
}

/** Needed where a platform API wants the scheme itself, such as the status bar. */
export function useScheme(): SchemeName {
  return useThemeContext().scheme;
}
