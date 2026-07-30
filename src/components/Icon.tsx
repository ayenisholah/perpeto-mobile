import type { ColorValue } from "react-native";
import { SymbolView, type AndroidSymbol, type SFSymbol } from "expo-symbols";

import { useTheme } from "@/theme";

/**
 * A closed icon vocabulary. Every entry names a concept in the operations
 * domain rather than a shape, so a screen asks for `stale` and cannot quietly
 * drift to a different glyph for the same state on another surface.
 *
 * `expo-symbols` resolves these to SF Symbols on iOS and Material Symbols on
 * Android and web. Both name spaces are typed, so an invalid glyph fails
 * `npm run typecheck` rather than rendering as a blank box on a device.
 */
const glyphs = {
  // Navigation
  home: { ios: "house", android: "home" },
  scanner: { ios: "magnifyingglass", android: "search" },
  strategies: { ios: "slider.horizontal.3", android: "tune" },
  /** Two legs pointing opposite ways — the hedge, and the Positions tab. */
  positions: { ios: "arrow.left.arrow.right", android: "swap_horiz" },
  more: { ios: "ellipsis", android: "more_horiz" },

  // Destinations behind More
  portfolio: { ios: "chart.pie", android: "monitoring" },
  exchanges: { ios: "building.columns", android: "account_balance" },
  health: { ios: "waveform.path.ecg", android: "monitor_heart" },
  alerts: { ios: "bell", android: "notifications" },
  security: { ios: "lock.shield", android: "shield" },
  audit: { ios: "list.bullet.rectangle", android: "receipt_long" },

  // State
  healthy: { ios: "checkmark.circle", android: "check_circle" },
  warning: { ios: "exclamationmark.triangle", android: "warning" },
  critical: { ios: "exclamationmark.octagon", android: "error" },
  stale: { ios: "clock.arrow.circlepath", android: "history" },
  offline: { ios: "wifi.slash", android: "wifi_off" },
  signal: { ios: "bolt", android: "bolt" },

  // Actions
  refresh: { ios: "arrow.clockwise", android: "refresh" },
  close: { ios: "xmark", android: "close" },
  back: { ios: "chevron.left", android: "arrow_back" },
  disclose: { ios: "chevron.right", android: "chevron_right" },
  reveal: { ios: "eye", android: "visibility" },
  conceal: { ios: "eye.slash", android: "visibility_off" },
  pause: { ios: "pause.fill", android: "pause" },
  resume: { ios: "play.fill", android: "play_arrow" },
  filter: { ios: "line.3.horizontal.decrease", android: "filter_list" },
} satisfies Record<string, { readonly ios: SFSymbol; readonly android: AndroidSymbol }>;

export type IconName = keyof typeof glyphs;

interface IconProps {
  readonly name: IconName;
  readonly size?: number;
  /**
   * Defaults to secondary text, so an icon never outweighs the label beside it.
   * Typed as `ColorValue` because navigators hand their tint colours through
   * opaque platform values rather than strings.
   */
  readonly color?: ColorValue;
  /**
   * Supply only when the icon is the sole carrier of meaning. Alongside a text
   * label, leave it undefined so screen readers do not announce the same thing
   * twice.
   */
  readonly label?: string;
}

export function Icon({ name, size = 20, color, label }: IconProps) {
  const theme = useTheme();
  const glyph = glyphs[name];
  const decorative = label === undefined;

  return (
    <SymbolView
      accessibilityElementsHidden={decorative}
      accessibilityLabel={label}
      accessibilityRole={decorative ? undefined : "image"}
      importantForAccessibility={decorative ? "no-hide-descendants" : "yes"}
      name={{ ios: glyph.ios, android: glyph.android, web: glyph.android }}
      size={size}
      tintColor={color ?? theme.textSecondary}
    />
  );
}
