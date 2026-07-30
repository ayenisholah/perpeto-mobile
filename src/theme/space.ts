/** The 8-point grid required by PRODUCT_SPEC section 12.1. */
export const space = {
  none: 0,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
} as const;

export type Space = keyof typeof space;

/**
 * The minimum touch target from section 12.1. Controls smaller than this get
 * `hitSlop` rather than extra padding, so layout stays on the grid.
 */
export const minimumTouchTarget = 48;
