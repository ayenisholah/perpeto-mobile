import { useAuth } from "@/auth/AuthContext";

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
