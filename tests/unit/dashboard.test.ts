import { describe, it, expect, vi, beforeEach } from "vitest";
import { API_ENDPOINTS } from "../../src/services/api/endpoints";
import { dashboardService } from "../../src/services/modules/dashboard";

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPut = vi.fn();
const mockDelete = vi.fn();

vi.mock("../api/api.config", () => ({
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

    expect(mockGet).toHaveBeenCalledWith(API_ENDPOINTS.DASHBOARD.REPORTS.GET);
  });
});
