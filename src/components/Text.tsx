import { Text as RNText, type TextProps as RNTextProps } from "react-native";

import {
  maxFontSizeMultiplier,
  typography,
  useTheme,
  type ColorRole,
  type TypeVariant,
} from "@/theme";

/**
 * Variants that name a structural heading. Declaring the role here is what
 * stops sections from shipping without one, which happened repeatedly in the
 * screen file this replaces.
 */
const headingVariants: ReadonlySet<TypeVariant> = new Set(["display", "title", "heading"]);

/** Variants that are supporting copy, and so default to secondary text. */
const secondaryVariants: ReadonlySet<TypeVariant> = new Set([
  "caption",
  "numericCaption",
  "overline",
]);

interface TextProps extends Omit<RNTextProps, "style"> {
  readonly variant?: TypeVariant;
  readonly tone?: ColorRole;
  readonly style?: RNTextProps["style"];
}

/**
 * The only text primitive. It carries the type scale, the colour role and the
 * accessibility defaults so no call site has to remember them:
 * `maxFontSizeMultiplier` is always applied (section 12.3 requires scaling to
 * 200%), and headings always announce as headings.
 *
 * Values wrap rather than truncate, so `numberOfLines` is never defaulted here
 * — section 12.3 prohibits silently clipping a figure.
 */
export function Text({ variant = "body", tone, style, ...rest }: TextProps) {
  const theme = useTheme();
  const role = tone ?? (secondaryVariants.has(variant) ? "textSecondary" : "textPrimary");

  return (
    <RNText
      accessibilityRole={headingVariants.has(variant) ? "header" : undefined}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[typography[variant], { color: theme[role] }, style]}
      {...rest}
    />
  );
}
