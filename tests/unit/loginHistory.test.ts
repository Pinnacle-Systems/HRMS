import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatDateTime } from "../../src/utils/dateFormatter";

// ---------------------------------------------------------------------------
// formatDateTime
// ---------------------------------------------------------------------------

describe("formatDateTime", () => {
  it("returns '-' for null", () => {
    expect(formatDateTime(null)).toBe("-");
  });

  it("returns '-' for undefined", () => {
    expect(formatDateTime(undefined)).toBe("-");
  });

  it("returns '-' for empty string", () => {
    expect(formatDateTime("")).toBe("-");
  });

  it("returns a non-empty string for a valid ISO datetime", () => {
    const result = formatDateTime("2026-05-19T10:30:00.000Z");
    expect(result).not.toBe("-");
    expect(result).toContain("2026");
  });

  it("returns a non-empty string for a Date object", () => {
    const result = formatDateTime(new Date(2026, 0, 15, 9, 5));
    expect(result).not.toBe("-");
    expect(result).toContain("2026");
  });

  it("includes hour and minute components", () => {
    // Any valid datetime should produce a string with a colon (HH:MM)
    const result = formatDateTime("2026-03-01T14:45:00.000Z");
    expect(result).toMatch(/\d{2}:\d{2}/);
  });
});

// ---------------------------------------------------------------------------
// Page-aware serial number formula
// ---------------------------------------------------------------------------

describe("login history serial number", () => {
  const serialNumber = (page: number, limit: number, index: number) =>
    page * limit + index + 1;

  it("starts at 1 on the first page", () => {
    expect(serialNumber(0, 20, 0)).toBe(1);
    expect(serialNumber(0, 20, 19)).toBe(20);
  });

  it("continues from 21 on the second page with limit 20", () => {
    expect(serialNumber(1, 20, 0)).toBe(21);
    expect(serialNumber(1, 20, 9)).toBe(30);
  });

  it("works with limit 10", () => {
    expect(serialNumber(0, 10, 0)).toBe(1);
    expect(serialNumber(1, 10, 0)).toBe(11);
    expect(serialNumber(2, 10, 4)).toBe(25);
  });
});

// ---------------------------------------------------------------------------
// authService.getLoginHistory — param forwarding
// ---------------------------------------------------------------------------

const apiGet = vi.fn();

vi.mock("../../src/services/api/api.config", () => ({
  apiService: {
    get: apiGet,
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("authService.getLoginHistory", () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiGet.mockResolvedValue({ success: true, data: { content: [], totalElements: 0 } });
  });

  it("forwards page and size to the login-history endpoint", async () => {
    const { authService } = await import("../../src/services/modules/auth");
    await authService.getLoginHistory({ page: 0, size: 20 });
    expect(apiGet).toHaveBeenCalledWith("/login-history", {
      params: { page: 0, size: 20 },
    });
  });

  it("forwards sort when provided", async () => {
    const { authService } = await import("../../src/services/modules/auth");
    await authService.getLoginHistory({ page: 1, size: 10, sort: "createdAt,DESC" });
    expect(apiGet).toHaveBeenCalledWith("/login-history", {
      params: { page: 1, size: 10, sort: "createdAt,DESC" },
    });
  });

  it("calls the endpoint with no params when called without arguments", async () => {
    const { authService } = await import("../../src/services/modules/auth");
    await authService.getLoginHistory();
    expect(apiGet).toHaveBeenCalledWith("/login-history", {
      params: undefined,
    });
  });
});
