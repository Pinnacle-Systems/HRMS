import { describe, it, expect, vi, beforeEach } from "vitest";
import { API_ENDPOINTS } from "../../src/services/api/endpoints";
import { dashboardService } from "../../src/services/modules/dashboard";

const { mockGet, mockPost, mockPut, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPut: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock("../../src/services/api/api.config", () => ({
  apiService: {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    delete: mockDelete,
  },
}));

describe("dashboardService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists BI reports through the dashboard endpoint", async () => {
    mockGet.mockResolvedValue({ success: true, data: [] });

    await dashboardService.listBIReports();

    expect(mockGet).toHaveBeenCalledWith(
      API_ENDPOINTS.DASHBOARD.REPORTS.LIST_REPORTS(),
    );
  });
});
