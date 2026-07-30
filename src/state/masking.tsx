import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { AppState } from "react-native";

interface MaskingValue {
  readonly masked: boolean;
  readonly toggle: () => void;
}

const MaskingContext = createContext<MaskingValue | null>(null);

/**
 * The sensitive-value visibility toggle from PRODUCT_SPEC section 11.2.
 * Balances and PnL re-mask automatically whenever the app leaves the
 * foreground, so a figure is never left on screen in the app switcher.
 */
export function MaskingProvider({ children }: PropsWithChildren) {
  const [masked, setMasked] = useState(false);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => {
      if (next !== "active") setMasked(true);
    });
    return () => subscription.remove();
  }, []);

  const toggle = useCallback(() => setMasked((current) => !current), []);
  const value = useMemo<MaskingValue>(() => ({ masked, toggle }), [masked, toggle]);

  return <MaskingContext.Provider value={value}>{children}</MaskingContext.Provider>;
}

export function useMasking(): MaskingValue {
  const value = useContext(MaskingContext);
  if (value === null) throw new Error("useMasking must be used within MaskingProvider");
  return value;
}

/** Same width as a typical figure, so masking does not reflow the layout. */
export const MASK = "••••••";
