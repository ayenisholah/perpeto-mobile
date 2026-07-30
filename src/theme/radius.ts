/**
 * Corner radii. Section 12.1 fixes cards at 12-16 px; `sm` and `pill` cover
 * badges and filter chips. These four values replace the five unrelated ones
 * (8/10/14/24/999) that had accumulated in the screen stylesheet.
 */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export type Radius = keyof typeof radius;
