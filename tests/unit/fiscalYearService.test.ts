import { beforeEach, describe, expect, it, vi } from "vitest";
import { fiscalYearService } from "../../src/services/modules/fiscalYear";
import { apiService } from "../../src/services/api/api.config";

vi.mock("../../src/services/api/api.config", () => ({
  apiService: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("fiscalYearService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("routes fiscal year requests to the expected endpoints", async () => {
    vi.mocked(apiService.get).mockResolvedValue({ success: true });
    vi.mocked(apiService.post).mockResolvedValue({ success: true });
    vi.mocked(apiService.put).mockResolvedValue({ success: true });
    vi.mocked(apiService.delete).mockResolvedValue({ success: true });
    vi.mocked(apiService.patch).mockResolvedValue({ success: true });

    await fiscalYearService.getFiscalYears("company-1", { page: 1, limit: 10 });
    await fiscalYearService.getActiveFiscalYears("company-1");
    await fiscalYearService.createFiscalYear("company-1", { yearLabel: "2024-25", startDate: "2024-04-01", endDate: "2025-03-31" });
    await fiscalYearService.updateFiscalYear("company-1", "fy-1", { yearLabel: "2025-26", startDate: "2025-04-01", endDate: "2026-03-31" });
    await fiscalYearService.activateFiscalYear("company-1", "fy-1");
    await fiscalYearService.deleteFiscalYear("company-1", "fy-1");

    expect(apiService.get).toHaveBeenCalledWith(
      "/org/company/company-1/fiscal-years",
      { params: { page: 1, limit: 10 } },
    );
    expect(apiService.get).toHaveBeenCalledWith(
      "/org/company/company-1/fiscal-years/active",
      { params: undefined },
    );
    expect(apiService.post).toHaveBeenCalledWith(
      "/org/company/company-1/fiscal-years",
      { yearLabel: "2024-25", startDate: "2024-04-01", endDate: "2025-03-31" },
    );
    expect(apiService.put).toHaveBeenCalledWith(
      "/org/company/company-1/fiscal-years/fy-1",
      { yearLabel: "2025-26", startDate: "2025-04-01", endDate: "2026-03-31" },
    );
    expect(apiService.patch).toHaveBeenCalledWith(
      "/org/company/company-1/fiscal-years/fy-1/activate",
    );
    expect(apiService.delete).toHaveBeenCalledWith(
      "/org/company/company-1/fiscal-years/fy-1",
    );
  });
});
