import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { redactSensitiveParams } from "../../src/utils/logger";
import { assertSafeQueryParams } from "../../src/utils/apiGuards";

// ---------------------------------------------------------------------------
// redactSensitiveParams
// ---------------------------------------------------------------------------

describe("redactSensitiveParams", () => {
  it("redacts password", () => {
    const result = redactSensitiveParams({ password: "secret123" }) as Record<string, unknown>;
    expect(result.password).toBe("[REDACTED]");
  });

  it("redacts token", () => {
    const result = redactSensitiveParams({ token: "abc" }) as Record<string, unknown>;
    expect(result.token).toBe("[REDACTED]");
  });

  it("redacts accessToken (substring match)", () => {
    const result = redactSensitiveParams({ accessToken: "jwt" }) as Record<string, unknown>;
    expect(result.accessToken).toBe("[REDACTED]");
  });

  it("redacts refreshToken (substring match)", () => {
    const result = redactSensitiveParams({ refreshToken: "rt" }) as Record<string, unknown>;
    expect(result.refreshToken).toBe("[REDACTED]");
  });

  it("redacts email", () => {
    const result = redactSensitiveParams({ email: "user@example.com" }) as Record<string, unknown>;
    expect(result.email).toBe("[REDACTED]");
  });

  it("redacts userId", () => {
    const result = redactSensitiveParams({ userId: 42 }) as Record<string, unknown>;
    expect(result.userId).toBe("[REDACTED]");
  });

  it("redacts tenantId", () => {
    const result = redactSensitiveParams({ tenantId: "t1" }) as Record<string, unknown>;
    expect(result.tenantId).toBe("[REDACTED]");
  });

  it("redacts roles", () => {
    const result = redactSensitiveParams({ roles: ["ADMIN"] }) as Record<string, unknown>;
    expect(result.roles).toBe("[REDACTED]");
  });

  it("redacts permissions", () => {
    const result = redactSensitiveParams({ permissions: ["READ"] }) as Record<string, unknown>;
    expect(result.permissions).toBe("[REDACTED]");
  });

  it("redacts authorization", () => {
    const result = redactSensitiveParams({ authorization: "Bearer x" }) as Record<string, unknown>;
    expect(result.authorization).toBe("[REDACTED]");
  });

  it("redacts credential", () => {
    const result = redactSensitiveParams({ credential: "cred" }) as Record<string, unknown>;
    expect(result.credential).toBe("[REDACTED]");
  });

  it("redacts secret", () => {
    const result = redactSensitiveParams({ secret: "s3cr3t" }) as Record<string, unknown>;
    expect(result.secret).toBe("[REDACTED]");
  });

  it("redacts otp", () => {
    const result = redactSensitiveParams({ otp: "123456" }) as Record<string, unknown>;
    expect(result.otp).toBe("[REDACTED]");
  });

  it("is case-insensitive for keys", () => {
    const result = redactSensitiveParams({ PASSWORD: "x", Email: "y" }) as Record<string, unknown>;
    expect(result.PASSWORD).toBe("[REDACTED]");
    expect(result.Email).toBe("[REDACTED]");
  });

  it("leaves safe keys untouched", () => {
    const result = redactSensitiveParams({ page: 1, size: 20, sort: "name" }) as Record<string, unknown>;
    expect(result.page).toBe(1);
    expect(result.size).toBe(20);
    expect(result.sort).toBe("name");
  });

  it("handles nested objects recursively", () => {
    const input = { user: { email: "a@b.com", name: "Alice" } };
    const result = redactSensitiveParams(input) as { user: Record<string, unknown> };
    expect(result.user.email).toBe("[REDACTED]");
    expect(result.user.name).toBe("Alice");
  });

  it("handles arrays at the top level", () => {
    const input = [{ email: "a@b.com" }, { page: 1 }];
    const result = redactSensitiveParams(input) as Array<Record<string, unknown>>;
    expect(result[0].email).toBe("[REDACTED]");
    expect(result[1].page).toBe(1);
  });

  it("handles arrays nested inside objects", () => {
    const input = { users: [{ password: "pw" }, { password: "pw2" }] };
    const result = redactSensitiveParams(input) as { users: Array<Record<string, unknown>> };
    expect(result.users[0].password).toBe("[REDACTED]");
    expect(result.users[1].password).toBe("[REDACTED]");
  });

  it("does not mutate the original object", () => {
    const input = { password: "original", page: 1 };
    redactSensitiveParams(input);
    expect(input.password).toBe("original");
    expect(input.page).toBe(1);
  });

  it("does not mutate nested objects", () => {
    const inner = { email: "user@example.com" };
    const input = { user: inner };
    redactSensitiveParams(input);
    expect(inner.email).toBe("user@example.com");
  });

  it("passes through primitives unchanged", () => {
    expect(redactSensitiveParams(42)).toBe(42);
    expect(redactSensitiveParams("hello")).toBe("hello");
    expect(redactSensitiveParams(null)).toBe(null);
    expect(redactSensitiveParams(undefined)).toBe(undefined);
  });
});

// ---------------------------------------------------------------------------
// assertSafeQueryParams
// ---------------------------------------------------------------------------

describe("assertSafeQueryParams", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("does not warn for safe params", () => {
    assertSafeQueryParams({ page: 0, size: 20, sort: "name" });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("warns when password is a query param", () => {
    assertSafeQueryParams({ password: "pw" });
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("password"),
    );
  });

  it("warns when email is a query param", () => {
    assertSafeQueryParams({ email: "a@b.com" });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("email"));
  });

  it("warns when userId is a query param", () => {
    assertSafeQueryParams({ userId: "123" });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("userId"));
  });

  it("warns when tenantId is a query param", () => {
    assertSafeQueryParams({ tenantId: "t1" });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("tenantId"));
  });

  it("warns when roles is a query param", () => {
    assertSafeQueryParams({ roles: "ADMIN" });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("roles"));
  });

  it("warns when permissions is a query param", () => {
    assertSafeQueryParams({ permissions: "READ" });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("permissions"));
  });

  it("warns when token is a query param", () => {
    assertSafeQueryParams({ token: "abc" });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("token"));
  });

  it("is case-insensitive for param keys", () => {
    assertSafeQueryParams({ EMAIL: "a@b.com" });
    expect(warnSpy).toHaveBeenCalled();
  });

  it("does not warn for null or undefined params", () => {
    assertSafeQueryParams(null);
    assertSafeQueryParams(undefined);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("includes all forbidden key names in the warning message", () => {
    assertSafeQueryParams({ email: "x", userId: "y" });
    const msg: string = warnSpy.mock.calls[0][0];
    expect(msg).toContain("email");
    expect(msg).toContain("userId");
  });
});
