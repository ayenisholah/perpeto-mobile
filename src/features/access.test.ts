import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The access hooks only shape the interface; the server enforces every rule.
 * They read nothing but the auth state, so the context is replaced and the
 * hooks run as plain functions.
 */
let state: unknown = { kind: "SIGNED_OUT" };
vi.mock("@/auth/AuthContext", () => ({ useAuth: () => ({ state }) }));

const { useCanTrade, useIsDemo, useIsOwner, useIsPrivileged, useIsReadOnly } = await import("./access");

function signedIn(roles: readonly string[], demo?: boolean): void {
  state = { kind: "AUTHENTICATED", user: { roles, ...(demo === undefined ? {} : { demo }) } };
}

beforeEach(() => {
  state = { kind: "SIGNED_OUT" };
});

describe("access hooks", () => {
  it("grants nothing while signed out", () => {
    expect(useCanTrade()).toBe(false);
    expect(useIsOwner()).toBe(false);
    expect(useIsPrivileged()).toBe(false);
    expect(useIsDemo()).toBe(false);
    expect(useIsReadOnly()).toBe(true);
  });

  it("treats the demo principal as read-only", () => {
    signedIn(["VIEWER"], true);
    expect(useIsDemo()).toBe(true);
    expect(useIsReadOnly()).toBe(true);
    expect(useCanTrade()).toBe(false);
  });

  it("treats a Viewer-only account as read-only", () => {
    signedIn(["VIEWER"]);
    expect(useIsDemo()).toBe(false);
    expect(useIsReadOnly()).toBe(true);
  });

  it("keeps the demo read-only even if it were ever given a privileged role", () => {
    signedIn(["OWNER"], true);
    expect(useIsReadOnly()).toBe(true);
  });

  it("lets privileged roles act", () => {
    signedIn(["OWNER", "TRADER", "APPROVER"], false);
    expect(useCanTrade()).toBe(true);
    expect(useIsOwner()).toBe(true);
    expect(useIsPrivileged()).toBe(true);
    expect(useIsReadOnly()).toBe(false);
  });

  it("separates trading from approval", () => {
    signedIn(["APPROVER"]);
    expect(useCanTrade()).toBe(false);
    expect(useIsPrivileged()).toBe(true);
    expect(useIsReadOnly()).toBe(false);
  });
});
