import { describe, expect, it } from "vitest";
import {
  getDefaultRoute,
  mapApiRoleToAppRole,
  mapAuthResponseToSession,
  mapLoginResponseToOutcome,
} from "../../src/auth/authMapper";
import type { AuthUser, LoginApiResponse } from "../../src/auth/authTypes";

function createJwt(payload: Record<string, unknown>) {
  const encodedPayload = window
    .btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `header.${encodedPayload}.signature`;
}

function createLoginResponse(data: LoginApiResponse["data"]): LoginApiResponse {
  return {
    success: true,
    data,
  };
}

describe("authMapper", () => {
  it("maps API roles to app roles", () => {
    expect(mapApiRoleToAppRole("ADMIN")).toBe("ADMIN");
    expect(mapApiRoleToAppRole("HR")).toBe("HR");
    expect(mapApiRoleToAppRole("MANAGER")).toBe("MANAGER");
    expect(mapApiRoleToAppRole("ESS")).toBe("EMPLOYEE");
    expect(mapApiRoleToAppRole("UNKNOWN")).toBe("EMPLOYEE");
  });

  it("maps an auth response into a session", () => {
    const token = createJwt({
      roles: ["ADMIN"],
      permissions: ["EMPLOYEE_READ"],
    });

    const session = mapAuthResponseToSession({
      accessToken: token,
      refreshToken: "refresh",
      userId: "user-1",
      tenantId: "tenant-1",
      email: "admin@company.com",
      expiresIn: 3600,
    });

    expect(session.user.roles).toEqual(["ADMIN"]);
    expect(session.user.permissions).toEqual(["EMPLOYEE_READ"]);
    expect(session.tokenType).toBe("Bearer");
  });

  it("maps authenticated login responses", () => {
    const outcome = mapLoginResponseToOutcome(
      createLoginResponse({
        accessToken: createJwt({ roles: ["HR"] }),
        refreshToken: "refresh",
        userId: "user-1",
        tenantId: "tenant-1",
        email: "hr@company.com",
        expiresIn: 3600,
      }),
      "hr@company.com",
    );

    expect(outcome.type).toBe("authenticated");
  });

  it("maps MFA, tenant selection, must-change-password, and failed outcomes", () => {
    expect(
      mapLoginResponseToOutcome(
        createLoginResponse({
          mfaRequired: true,
          sessionToken: "mfa-session",
          mfaType: "email",
        }),
      ),
    ).toEqual({
      type: "mfaRequired",
      sessionToken: "mfa-session",
      mfaType: "email",
    });

    expect(
      mapLoginResponseToOutcome(
        createLoginResponse({
          multiTenant: true,
          email: "admin@company.com",
          tenants: [{ id: "tenant-1", name: "Tenant One" }],
        }),
      ),
    ).toEqual({
      type: "tenantSelection",
      email: "admin@company.com",
      tenants: [{ id: "tenant-1", name: "Tenant One" }],
    });

    expect(
      mapLoginResponseToOutcome(
        createLoginResponse({
          mustChangePassword: true,
          email: "admin@company.com",
        }),
      ),
    ).toEqual({
      type: "mustChangePassword",
      email: "admin@company.com",
    });

    expect(mapLoginResponseToOutcome({ success: false, message: "Nope" })).toEqual({
      type: "failed",
      message: "Nope",
    });
  });

  it("returns default routes by role", () => {
    const baseUser: AuthUser = {
      userId: "user-1",
      tenantId: "tenant-1",
      email: "user@company.com",
      roles: ["EMPLOYEE"],
      rawRoles: ["EMPLOYEE"],
      permissions: [],
    };

    expect(getDefaultRoute({ ...baseUser, roles: ["ADMIN"] })).toBe("/admin/dashboard");
    expect(getDefaultRoute({ ...baseUser, roles: ["HR"] })).toBe("/hr/dashboard");
    expect(getDefaultRoute({ ...baseUser, roles: ["MANAGER"] })).toBe("/manager/dashboard");
    expect(getDefaultRoute(baseUser)).toBe("/employee/dashboard");
  });
});
