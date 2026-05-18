import { beforeEach, describe, expect, it, vi } from "vitest";

const apiGet = vi.fn();

vi.mock("../../src/services/api/api.config", () => ({
  apiService: {
    get: apiGet,
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

async function importLeaveService(useMock: boolean) {
  vi.resetModules();
  vi.stubEnv("VITE_USE_MOCK_LEAVE_SERVICE", useMock ? "true" : "false");
  return import("../../src/services/modules/leave");
}

describe("leaveService manager approvals", () => {
  beforeEach(() => {
    apiGet.mockReset();
    vi.unstubAllEnvs();
  });

  it("keeps mock manager approvals working without a session employee id", async () => {
    const { DEFAULT_MOCK_MANAGER_ID, leaveService } =
      await importLeaveService(true);

    const response = await leaveService.getMyManagerLeaveApprovals({
      page: 0,
      size: 100,
    });

    expect(response.data?.content.length).toBeGreaterThan(0);
    expect(
      response.data?.content.every(
        (request) => request.managerId === DEFAULT_MOCK_MANAGER_ID,
      ),
    ).toBe(true);
  });

  it("does not use the mock manager id on the real API path", async () => {
    const { leaveService } = await importLeaveService(false);
    apiGet.mockResolvedValue({
      success: true,
      data: {
        content: [],
        totalElements: 0,
        totalPages: 0,
        page: 0,
        size: 20,
      },
    });

    await leaveService.getMyManagerLeaveApprovals(
      {
        page: 0,
        size: 20,
        sort: "createdAt,DESC",
      },
      "manager-from-session",
    );

    expect(apiGet).toHaveBeenCalledWith(
      "/leaves",
      expect.objectContaining({
        params: expect.objectContaining({
          managerId: "manager-from-session",
        }),
      }),
    );
    expect(JSON.stringify(apiGet.mock.calls)).not.toContain("emp-200");
  });

  it("uses the current-user approvals endpoint in real mode when no manager id is available", async () => {
    const { leaveService } = await importLeaveService(false);
    apiGet.mockResolvedValue({
      success: true,
      data: {
        content: [],
        totalElements: 0,
        totalPages: 0,
        page: 0,
        size: 20,
      },
    });

    await leaveService.getMyManagerLeaveApprovals({
      page: 0,
      size: 20,
    });

    expect(apiGet).toHaveBeenCalledWith(
      "/leaves/approvals/my",
      expect.any(Object),
    );
    expect(JSON.stringify(apiGet.mock.calls)).not.toContain("emp-200");
  });
});

describe("leaveService real-API guards", () => {
  beforeEach(() => {
    apiGet.mockReset();
    vi.unstubAllEnvs();
  });

  it("selectOptionalHoliday throws when USE_MOCK_LEAVE_SERVICE is false", async () => {
    const { leaveService } = await importLeaveService(false);
    await expect(leaveService.selectOptionalHoliday("any-id")).rejects.toThrow(
      "selectOptionalHoliday: real API not implemented",
    );
  });

  it("getTeamCalendar throws when USE_MOCK_LEAVE_SERVICE is false", async () => {
    const { leaveService } = await importLeaveService(false);
    await expect(leaveService.getTeamCalendar()).rejects.toThrow(
      "getTeamCalendar: real API not implemented",
    );
  });
});
