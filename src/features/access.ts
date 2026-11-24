import { useAuth } from "@/auth/AuthContext";

/** The read-only public demo principal (DEC-0017). */
export function useIsDemo(): boolean {
  const { state } = useAuth();
  return state.kind === "AUTHENTICATED" && state.user.demo === true;
}

/**
 * True when the interface must offer no mutation at all: the demo principal,
 * or any account holding no role beyond Viewer. The server enforces the same
 * rule; this only keeps controls that would be refused off the screen.
 */
export function useIsReadOnly(): boolean {
  const demo = useIsDemo();
  const privileged = useIsPrivileged();
  return demo || !privileged;
}

function useRoles(): readonly string[] {
  const { state } = useAuth();
  return state.kind === "AUTHENTICATED" ? state.user.roles : [];
}

/** Trader or Owner. The server decides for real; this only shapes the interface. */
export function useCanTrade(): boolean {
  return useRoles().some((role) => role === "OWNER" || role === "TRADER");
}

export function useIsOwner(): boolean {
  return useRoles().includes("OWNER");
}

/** Provider linking and other privileged actions require a step-up-capable role. */
export function useIsPrivileged(): boolean {
  return useRoles().some((role) => role === "OWNER" || role === "TRADER" || role === "APPROVER");
}
