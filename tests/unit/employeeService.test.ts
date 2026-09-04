import { beforeEach, describe, expect, it, vi } from "vitest";

const apiGet = vi.fn();
const apiPost = vi.fn();
const apiDelete = vi.fn();
const apiPatch = vi.fn();
const apiAxiosGet = vi.fn();

vi.mock("../../src/services/api/api.config", () => ({
  apiService: {
    get: apiGet,
    post: apiPost,
    put: vi.fn(),
    patch: apiPatch,
    delete: apiDelete,
    axiosInstance: {
      get: apiAxiosGet,
    },
  },
}));

describe("employeeService", () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiPost.mockReset();
  });

  it("sends only supported employee list query params", async () => {
    const { employeeService } = await import("../../src/services/modules/employees");
    apiGet.mockResolvedValue({ data: { content: [] } });

    await employeeService.getEmployees({
      page: 2,
      size: 50,
      sort: ["name,ASC", "employeeId,DESC"],
      search: "ava",
      dept: "Engineering",
      branch: "HQ",
      designationId: "desig-1",
      empTypeId: "type-1",
      employeeStatusId: "status-active",
      managerId: "manager-1",
      joinedFrom: "2026-01-01",
      joinedTo: "2026-05-21",
      includeInactive: false,
      limit: 100,
      sortBy: "name",
    } as any);

    expect(apiGet).toHaveBeenCalledWith(
      "/employees",
      expect.objectContaining({
        params: {
          page: 2,
          size: 50,
          sort: ["name,ASC", "employeeId,DESC"],
          search: "ava",
          dept: "Engineering",
          branch: "HQ",
          designationId: "desig-1",
          empTypeId: "type-1",
          employeeStatusId: "status-active",
          managerId: "manager-1",
          joinedFrom: "2026-01-01",
          joinedTo: "2026-05-21",
          includeInactive: false,
        },
      }),
    );
  });

  it("normalizes a Spring Page employee response", async () => {
    const { normalizeEmployeePageResponse } = await import(
      "../../src/services/modules/employees"
    );

    const page = normalizeEmployeePageResponse({
      data: {
        content: [
          {
            id: "employee-1",
            employeeCode: "E-001",
            firstName: "Ava",
            lastName: "Patel",
          },
        ],
        totalElements: 42,
        totalPages: 3,
        size: 20,
        number: 1,
        numberOfElements: 1,
        first: false,
        last: false,
        empty: false,
      },
    });

    expect(page.content).toEqual([
      expect.objectContaining({
        id: "employee-1",
        employeeId: "E-001",
        name: "Ava Patel",
      }),
    ]);
    expect(page.totalElements).toBe(42);
    expect(page.totalPages).toBe(3);
    expect(page.number).toBe(1);
    expect(page.size).toBe(20);
    expect(page.first).toBe(false);
    expect(page.last).toBe(false);
    expect(page.empty).toBe(false);
  });
});

describe("bulkUploadEmployees", () => {
  beforeEach(() => {
    apiPost.mockReset();
  });

  it("sends FormData with only the file field", async () => {
    apiPost.mockResolvedValue({ data: { successCount: 2, errors: [] } });
    const appendSpy = vi.spyOn(FormData.prototype, "append");

    const file = new File(["a,b\n1,2"], "employees.csv", { type: "text/csv" });
    const { employeeService } = await import("../../src/services/modules/employees");
    await employeeService.bulkUploadEmployees(file);

    const appendedKeys = appendSpy.mock.calls.map((c) => c[0]);
    expect(appendedKeys).toEqual(["file"]);
    expect(appendSpy.mock.calls[0][1]).toBe(file);

    appendSpy.mockRestore();
  });

  it("does not send extra legacy fields", async () => {
    apiPost.mockResolvedValue({ data: { successCount: 1, errors: [] } });
    const appendSpy = vi.spyOn(FormData.prototype, "append");

    const file = new File(["a,b\n1,2"], "employees.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const { employeeService } = await import("../../src/services/modules/employees");
    await employeeService.bulkUploadEmployees(file);

    const appendedKeys = appendSpy.mock.calls.map((c) => c[0]);
    const disallowed = [
      "hasEmpIdColumn",
      "empCodeMode",
      "empCodeType",
      "empPrefix",
      "empStartNumber",
      "empDigitCount",
      "tenant",
      "userId",
      "uploadedBy",
    ];
    for (const key of disallowed) {
      expect(appendedKeys).not.toContain(key);
    }

    appendSpy.mockRestore();
  });

  it("posts to /employees/bulk-upload", async () => {
    apiPost.mockResolvedValue({ data: { successCount: 0, errors: [] } });

    const file = new File([""], "emp.csv", { type: "text/csv" });
    const { employeeService } = await import("../../src/services/modules/employees");
    await employeeService.bulkUploadEmployees(file);

    expect(apiPost).toHaveBeenCalledWith(
      "/employees/bulk-upload",
      expect.any(FormData),
      expect.any(Object),
    );
  });
});

describe("downloadBulkUploadTemplate", () => {
  beforeEach(() => {
    apiAxiosGet.mockReset();
  });

  it("fetches /employees/bulk-upload/template", async () => {
    const blob = new Blob(["PK\x03\x04"], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    apiAxiosGet.mockResolvedValue({ 
      data: blob,
      headers: { "content-disposition": "attachment; filename=custom_template.xlsx" }
    });

    const createObjectURL = vi.fn().mockReturnValue("blob:fake");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(window, "URL", {
      value: { createObjectURL, revokeObjectURL },
      writable: true,
    });

    const clickSpy = vi.fn();
    const linkEl = {
      href: "",
      setAttribute: vi.fn(),
      click: clickSpy,
      remove: vi.fn(),
    } as unknown as HTMLAnchorElement;
    vi.spyOn(document, "createElement").mockReturnValueOnce(linkEl);
    vi.spyOn(document.body, "appendChild").mockImplementationOnce(() => linkEl);

    const { employeeService } = await import("../../src/services/modules/employees");
    await employeeService.downloadBulkUploadTemplate();

    expect(apiAxiosGet).toHaveBeenCalledWith(
      "/employees/bulk-upload/template",
      expect.objectContaining({ responseType: "blob" }),
    );
    expect(linkEl.setAttribute).toHaveBeenCalledWith("download", "custom_template.xlsx");
    expect(clickSpy).toHaveBeenCalled();
  });

  it("rejects empty blob", async () => {
    const blob = new Blob([], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    apiAxiosGet.mockResolvedValue({ data: blob, headers: {} });

    const { employeeService } = await import("../../src/services/modules/employees");
    await expect(employeeService.downloadBulkUploadTemplate()).rejects.toThrow("Downloaded file is empty");
  });

  it("rejects application/json blob with error message", async () => {
    const blob = new Blob(['{"message": "Internal Server Error"}'], { type: "application/json" });
    blob.text = vi.fn().mockResolvedValue('{"message": "Internal Server Error"}');
    apiAxiosGet.mockResolvedValue({ data: blob, headers: {} });

    const { employeeService } = await import("../../src/services/modules/employees");
    await expect(employeeService.downloadBulkUploadTemplate()).rejects.toThrow("Internal Server Error");
  });
});

describe("normalizeBulkUploadResponse", () => {
  it("maps successCount and errors from data envelope", async () => {
    const { normalizeBulkUploadResponse } = await import("../../src/services/modules/employees");

    const result = normalizeBulkUploadResponse({
      data: {
        successCount: 5,
        failureCount: 2,
        errors: [{ row: 3, field: "email", message: "Invalid email" }],
        welcomeEmailsSent: 5,
        welcomeEmailsFailed: 0,
        welcomeEmailFailures: [],
      },
    });

    expect(result.successCount).toBe(5);
    expect(result.failureCount).toBe(2);
    expect(result.errors).toHaveLength(1);
    expect(result.errors![0]).toEqual({ row: 3, field: "email", message: "Invalid email" });
    expect(result.welcomeEmailsSent).toBe(5);
    expect(result.welcomeEmailsFailed).toBe(0);
  });

  it("falls back to importedCount when successCount absent", async () => {
    const { normalizeBulkUploadResponse } = await import("../../src/services/modules/employees");

    const result = normalizeBulkUploadResponse({ data: { importedCount: 3 } });
    expect(result.successCount).toBe(3);
  });

  it("returns empty errors array when absent", async () => {
    const { normalizeBulkUploadResponse } = await import("../../src/services/modules/employees");

    const result = normalizeBulkUploadResponse({ data: {} });
    expect(result.errors).toEqual([]);
  });
});

describe("deactivateEmployee", () => {
  beforeEach(() => {
    apiDelete.mockReset();
  });

  it("calls DELETE /employees/{id}", async () => {
    apiDelete.mockResolvedValue({});
    const { employeeService } = await import("../../src/services/modules/employees");

    await employeeService.deactivateEmployee("emp-42",{ reason: "Resigned" });

    expect(apiDelete).toHaveBeenCalledWith("/employees/emp-42");
  });
});

describe("reactivateEmployee", () => {
  beforeEach(() => {
    apiPatch.mockReset();
  });

  it("calls PATCH /employees/{id}/reactivate", async () => {
    apiPatch.mockResolvedValue({ data: { id: "emp-42", name: "Ava Patel", isActive: true } });
    const { employeeService } = await import("../../src/services/modules/employees");

    const result = await employeeService.reactivateEmployee("emp-42");

    expect(apiPatch).toHaveBeenCalledWith("/employees/emp-42/reactivate", {});
    expect(result).toMatchObject({ id: "emp-42", name: "Ava Patel", isActive: true });
  });

  it("returns the response data envelope", async () => {
    apiPatch.mockResolvedValue({ data: { id: "emp-7", isActive: true } });
    const { employeeService } = await import("../../src/services/modules/employees");

    const result = await employeeService.reactivateEmployee("emp-7");

    expect(result.isActive).toBe(true);
  });
});
