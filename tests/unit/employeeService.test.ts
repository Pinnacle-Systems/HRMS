import { beforeEach, describe, expect, it, vi } from "vitest";

const apiGet = vi.fn();

vi.mock("../../src/services/api/api.config", () => ({
  apiService: {
    get: apiGet,
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("employeeService", () => {
  beforeEach(() => {
    apiGet.mockReset();
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
