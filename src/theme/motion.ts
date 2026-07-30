import { AccessibilityInfo } from "react-native";
import { useEffect, useState } from "react";

/**
 * Durations from PRODUCT_SPEC section 12.1. Motion reinforces a state change
 * and then stops: a signal may travel once from detection to approval to
 * execution, but persistent pulsing, looping velocity effects and animated PnL
 * are prohibited.
 */
export const duration = {
  feedback: 120,
  standard: 180,
  deliberate: 240,
} as const;

/** Restrained ease-out, as section 12.1 specifies. */
export const easing = { x1: 0.22, y1: 1, x2: 0.36, y2: 1 } as const;

/**
 * Tracks the OS reduced-motion preference. Section 12.3 requires order
 * progress, leg imbalance and stale-data warnings to stay readable with all
 * motion disabled, so callers multiply their durations by this rather than
 * branching on it.
 */
export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}
