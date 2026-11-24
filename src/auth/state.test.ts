import { describe, expect, it } from "vitest";

import { canAccessPrivateData, initialAuthState, reduceAuthState } from "./state";

const pendingUser = {
  id: "user-1",
  status: "PENDING" as const,
  display_name: null,
  email: null,
  roles: [],
  linked_providers: ["APPLE" as const],
  tenant: { id: "tenant-id", display_name: "Personal portfolio", base_currency: "USD", state: "PAPER_ONLY" } as const,
  mfa_enrolled: false,
};

describe("authentication state machine", () => {
  it("isolates a newly registered pending account", () => {
    const state = reduceAuthState(initialAuthState, {
      type: "TRANSITION",
      transition: { next: "PENDING_APPROVAL", user: pendingUser },
    });
    expect(state.kind).toBe("PENDING_APPROVAL");
    expect(canAccessPrivateData(state)).toBe(false);
  });

  it("requires an explicit MFA challenge token", () => {
    const state = reduceAuthState(initialAuthState, {
      type: "TRANSITION",
      transition: { next: "MFA_REQUIRED", user: { ...pendingUser, status: "ACTIVE" } },
    });
    expect(state).toEqual({ kind: "ERROR", message: "The MFA challenge was incomplete." });
  });

  it("does not admit authenticated state without session credentials", () => {
    const state = reduceAuthState(initialAuthState, {
      type: "TRANSITION",
      transition: { next: "AUTHENTICATED", user: { ...pendingUser, status: "ACTIVE" } },
    });
    expect(canAccessPrivateData(state)).toBe(false);
  });

  it("clears protected state on revocation", () => {
    const active = reduceAuthState(initialAuthState, {
      type: "SESSION",
      session: {
        access_token: "memory",
        access_token_expires_at: "2026-07-14T12:15:00Z",
        refresh_token: "secure-store",
        session_id: "session",
        device_id: "device",
      },
      user: { ...pendingUser, status: "ACTIVE", roles: ["VIEWER"] },
    });
    expect(canAccessPrivateData(active)).toBe(true);
    expect(reduceAuthState(active, { type: "REVOKED" })).toEqual({ kind: "SIGNED_OUT" });
  });

  it("fails closed during offline restoration", () => {
    expect(reduceAuthState(initialAuthState, { type: "RESTORE_OFFLINE" }).kind).toBe("OFFLINE_LOCKED");
  });
});

describe("authentication state machine — remaining transitions", () => {
  const activeUser = { ...pendingUser, status: "ACTIVE" as const };

  it.each(["RESTORE_EMPTY", "REVOKED", "LOGOUT", "CANCEL"] as const)("%s signs out", (type) => {
    expect(reduceAuthState(initialAuthState, { type })).toEqual({ kind: "SIGNED_OUT" });
  });

  it("tracks the provider being authorized", () => {
    expect(reduceAuthState(initialAuthState, { type: "AUTHORIZE", provider: "GOOGLE" })).toEqual({
      kind: "AUTHORIZING",
      provider: "GOOGLE",
    });
  });

  it("restores an authenticated user", () => {
    const state = reduceAuthState(initialAuthState, { type: "RESTORED", user: activeUser });
    expect(state).toEqual({ kind: "AUTHENTICATED", user: activeUser });
    expect(canAccessPrivateData(state)).toBe(true);
  });

  it("routes an unseated deployment to bootstrap without private access", () => {
    const state = reduceAuthState(initialAuthState, { type: "BOOTSTRAP_AVAILABLE", user: pendingUser });
    expect(state.kind).toBe("BOOTSTRAP_REQUIRED");
    expect(canAccessPrivateData(state)).toBe(false);
  });

  it("surfaces a failure message", () => {
    expect(reduceAuthState(initialAuthState, { type: "FAIL", message: "boom" })).toEqual({
      kind: "ERROR",
      message: "boom",
    });
  });

  it("carries the enrollment challenge token", () => {
    const state = reduceAuthState(initialAuthState, {
      type: "TRANSITION",
      transition: { next: "MFA_ENROLLMENT_REQUIRED", user: activeUser, challenge_token: "enroll" },
    });
    expect(state).toEqual({ kind: "MFA_ENROLLMENT_REQUIRED", user: activeUser, challengeToken: "enroll" });
  });

  it("enters MFA_REQUIRED when the challenge token is present", () => {
    const state = reduceAuthState(initialAuthState, {
      type: "TRANSITION",
      transition: { next: "MFA_REQUIRED", user: activeUser, challenge_token: "challenge" },
    });
    expect(state).toEqual({ kind: "MFA_REQUIRED", user: activeUser, challengeToken: "challenge" });
  });

  it("admits an authenticated transition that carries a session", () => {
    const state = reduceAuthState(initialAuthState, {
      type: "TRANSITION",
      transition: {
        next: "AUTHENTICATED",
        user: activeUser,
        session: {
          access_token: "memory",
          access_token_expires_at: "2026-07-14T12:15:00Z",
          refresh_token: "secure-store",
          session_id: "session",
          device_id: "device",
        },
      },
    });
    expect(state).toEqual({ kind: "AUTHENTICATED", user: activeUser });
  });

  it("denies private data to a suspended user even when authenticated", () => {
    const state = reduceAuthState(initialAuthState, {
      type: "RESTORED",
      user: { ...pendingUser, status: "SUSPENDED" as const },
    });
    expect(canAccessPrivateData(state)).toBe(false);
  });
});
