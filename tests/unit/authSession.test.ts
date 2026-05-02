import { describe, expect, it } from "vitest";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  loadSession,
  saveSession,
  updateAccessToken,
} from "../../src/auth/authSession";
import { AUTH_STORAGE_KEY, createMockAuthSession } from "../helpers/mockAuthSession";

describe("authSession", () => {
  it("saves and loads a valid session", () => {
    const session = createMockAuthSession();

    saveSession(session);

    expect(loadSession()).toEqual(session);
    expect(getAccessToken()).toBe(session.accessToken);
    expect(getRefreshToken()).toBe(session.refreshToken);
  });

  it("clears the stored session", () => {
    saveSession(createMockAuthSession());

    clearSession();

    expect(loadSession()).toBeNull();
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it("removes invalid JSON and returns null", () => {
    localStorage.setItem(AUTH_STORAGE_KEY, "{bad-json");

    expect(loadSession()).toBeNull();
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it("removes incomplete session data and returns null", () => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ accessToken: "token" }));

    expect(loadSession()).toBeNull();
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it("updates access token and expiry on an existing session", () => {
    saveSession(createMockAuthSession({ expiresIn: 100 }));

    const updated = updateAccessToken("new-access-token", 60);

    expect(updated?.accessToken).toBe("new-access-token");
    expect(updated?.expiresIn).toBe(60);
    expect(loadSession()?.accessToken).toBe("new-access-token");
  });

  it("returns null when updating without a stored session", () => {
    expect(updateAccessToken("new-access-token")).toBeNull();
  });
});
