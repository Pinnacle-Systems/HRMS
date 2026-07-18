import { describe, expect, it, vi } from "vitest";
import {
  resolveEmployeeIdFromProfile,
  resolveEmployeeIdFromSession,
} from "../../src/auth/sessionIdentity";
import type { AuthSession } from "../../src/auth/authTypes";

function makeSession(userId: string): AuthSession {
  return {
    accessToken: "tok",
    refreshToken: "ref",
    tokenType: "Bearer",
    expiresIn: 3600,
    expiresAt: Date.now() + 3600_000,
    user: {
      userId,
      tenantId: "t1",
      email: "user@example.com",
      roles: ["EMPLOYEE"],
      rawRoles: ["EMPLOYEE"],
      permissions: [],
    },
    company: {
      companyId:"c-001",
      companyName:'acme',
      logoUrl:""
    }
  };
}

function makeAuthService(profileData: unknown) {
  return { getProfile: vi.fn().mockResolvedValue(profileData) };
}

describe("resolveEmployeeIdFromSession", () => {
  it("returns the session userId when present", () => {
    expect(resolveEmployeeIdFromSession(makeSession("emp-1"))).toBe("emp-1");
  });

  it("returns undefined when session is null", () => {
    expect(resolveEmployeeIdFromSession(null)).toBeUndefined();
  });
});

describe("resolveEmployeeIdFromProfile", () => {
  it("returns the first candidate field when profile succeeds", async () => {
    const session = makeSession("user-99");
    const authService = makeAuthService({
      data: { employeeId: "emp-10", employee: { employeeId: "emp-11" } },
    });

    const result = await resolveEmployeeIdFromProfile(session, authService);

    expect(result).toBe("emp-10");
  });

  it("falls back to next candidate when first candidate field is empty", async () => {
    const session = makeSession("user-99");
    const authService = makeAuthService({
      data: {
        employeeId: "",
        employee: { employeeId: "", id: "emp-nested-id" },
      },
    });

    const result = await resolveEmployeeIdFromProfile(session, authService);

    expect(result).toBe("emp-nested-id");
  });

  it("falls back to currentUserId when all profile candidate fields are empty", async () => {
    const session = makeSession("user-99");
    const authService = makeAuthService({
      data: {
        employeeId: "",
        id: "",
        userId: "",
        employee: { id: "", employeeId: "", userId: "" },
      },
    });

    const result = await resolveEmployeeIdFromProfile(session, authService);

    expect(result).toBe("user-99");
  });

  it("falls back to currentUserId when profile call throws access denied without rethrowing", async () => {
    const session = makeSession("user-99");
    const authService = {
      getProfile: vi.fn().mockRejectedValue(new Error("Access Denied")),
    };

    const result = await resolveEmployeeIdFromProfile(session, authService);

    expect(result).toBe("user-99");
  });

  it("falls back to currentUserId when profile call throws any other error without rethrowing", async () => {
    const session = makeSession("user-99");
    const authService = {
      getProfile: vi.fn().mockRejectedValue(new Error("Network error")),
    };

    const result = await resolveEmployeeIdFromProfile(session, authService);

    expect(result).toBe("user-99");
  });

  it("uses employee.employeeId when top-level employeeId is missing", async () => {
    const session = makeSession("user-99");
    const authService = makeAuthService({
      data: { employee: { employeeId: "emp-from-nested" } },
    });

    const result = await resolveEmployeeIdFromProfile(session, authService);

    expect(result).toBe("emp-from-nested");
  });

  it("returns currentUserId when profile data is empty object", async () => {
    const session = makeSession("user-fallback");
    const authService = makeAuthService({ data: {} });

    const result = await resolveEmployeeIdFromProfile(session, authService);

    expect(result).toBe("user-fallback");
  });
});
