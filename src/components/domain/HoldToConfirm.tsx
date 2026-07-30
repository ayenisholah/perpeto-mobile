import { useCallback, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, View } from "react-native";

import {
  duration,
  easing,
  minimumTouchTarget,
  radius,
  space,
  useReduceMotion,
  useTheme,
} from "@/theme";

import { Text } from "../Text";

interface HoldToConfirmProps {
  readonly label: string;
  /** Exactly what this will affect. Shown before the gesture, never after. */
  readonly scope: string;
  readonly onConfirm: () => void | Promise<void>;
  readonly holdMs?: number;
  readonly disabled?: boolean;
  readonly busy?: boolean;
}

const DEFAULT_HOLD_MS = 1500;

/**
 * The confirmation gesture for anything that removes capital or cancels
 * protection — closing, unwinding, flattening, disarming (sections 11.6, 11.9
 * and 11.10 all require hold-to-confirm).
 *
 * A tap does nothing. Releasing early rewinds and fires nothing. The fill is
 * progress rather than decoration, so it is kept under Reduce Motion: section
 * 12.3 requires order progress to stay readable when motion is disabled, and
 * removing it would leave no cue that holding is what completes the action.
 */
export function HoldToConfirm({
  label,
  scope,
  onConfirm,
  holdMs = DEFAULT_HOLD_MS,
  disabled = false,
  busy = false,
}: HoldToConfirmProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  // Held in state rather than a ref: the value is read during render to drive
  // the fill, which is exactly what refs are not for.
  const [progress] = useState(() => new Animated.Value(0));
  const [holding, setHolding] = useState(false);
  const inert = disabled || busy;

  const start = useCallback(() => {
    if (inert) return;
    setHolding(true);
    Animated.timing(progress, {
      duration: holdMs,
      easing: Easing.linear,
      toValue: 1,
      useNativeDriver: false,
    }).start(({ finished }) => {
      setHolding(false);
      progress.setValue(0);
      if (finished) void onConfirm();
    });
  }, [holdMs, inert, onConfirm, progress]);

  // Releasing early rewinds instead of snapping, so it is obvious the action
  // did not fire. Under Reduce Motion it resets immediately.
  const cancel = useCallback(() => {
    progress.stopAnimation((value: number) => {
      setHolding(false);
      if (reduceMotion || value === 0) {
        progress.setValue(0);
        return;
      }
      Animated.timing(progress, {
        duration: duration.feedback,
        easing: Easing.bezier(easing.x1, easing.y1, easing.x2, easing.y2),
        toValue: 0,
        useNativeDriver: false,
      }).start();
    });
  }, [progress, reduceMotion]);

  return (
    <View style={styles.container}>
      <Text tone="textSecondary" variant="caption">
        {scope}
      </Text>
      <Pressable
        accessibilityHint={`Press and hold for ${Math.round(holdMs / 1000)} seconds to confirm`}
        accessibilityRole="button"
        accessibilityState={{ busy, disabled: inert }}
        disabled={inert}
        onPressIn={start}
        onPressOut={cancel}
        style={[
          styles.control,
          { backgroundColor: theme.surfaceElevated, borderColor: theme.critical, opacity: inert ? 0.45 : 1 },
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: theme.critical,
              width: progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
            },
          ]}
        />
        <Text style={styles.label} tone="critical" variant="label">
          {busy ? "Working…" : holding ? "Keep holding…" : label}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: space.xxs,
  },
  control: {
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    minHeight: minimumTouchTarget,
    overflow: "hidden",
    paddingHorizontal: space.md,
  },
  fill: {
    bottom: 0,
    left: 0,
    opacity: 0.25,
    position: "absolute",
    top: 0,
  },
  label: {
    textAlign: "center",
  },
});
