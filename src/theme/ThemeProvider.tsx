import { createContext, useContext, type PropsWithChildren } from "react";

import { themes, type Theme } from "./colors";

const ThemeContext = createContext<Theme | null>(null);

/**
 * The design system is dark only and `app.json` pins `userInterfaceStyle` to
 * `"dark"`, so the palette is fixed rather than read from the OS. The provider
 * stays so components never import a palette directly.
 */
export function ThemeProvider({ children }: PropsWithChildren) {
  return <ThemeContext.Provider value={themes.dark}>{children}</ThemeContext.Provider>;
}

/** The resolved colour roles. */
export function useTheme(): Theme {
  const colors = useContext(ThemeContext);
  if (colors === null) throw new Error("useTheme must be used within ThemeProvider");
  return colors;
}
