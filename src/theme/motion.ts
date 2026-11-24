import { AccessibilityInfo } from "react-native";
import { useEffect, useState } from "react";

/**
 * Durations from PRODUCT_SPEC section 12.1, shared with AgentFloor. Motion
 * reinforces a state change and then stops: a signal may travel once from
 * detection to approval to execution. The only loop permitted is the live
 * status dot (`livePulse`), and animated PnL is prohibited.
 */
export const duration = {
  /** Press feedback (AgentFloor `.tc-btn` transform). */
  feedback: 160,
  /** Colour and state transitions. */
  standard: 200,
  /** Panels and sheets. */
  deliberate: 240,
  /** One-shot entrance (AgentFloor `tc-rise`). */
  rise: 700,
  /** One cycle of the live status dot (AgentFloor `tc-live`). */
  livePulse: 1400,
} as const;

/** AgentFloor's ease-out curve, `cubic-bezier(0.2, 0.7, 0.2, 1)`. */
export const easing = { x1: 0.2, y1: 0.7, x2: 0.2, y2: 1 } as const;

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
