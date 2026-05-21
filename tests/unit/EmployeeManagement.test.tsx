import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../helpers/render";
import EmployeeManagement from "../../src/pages/employees/employeeManagement";
import { employeeService } from "../../src/services/modules/employees";

vi.mock("../../src/services/modules/employees", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../src/services/modules/employees")>();

  return {
    ...actual,
    employeeService: {
      getEmployees: vi.fn(),
      createEmployee: vi.fn(),
      updateEmployee: vi.fn(),
      deleteEmployee: vi.fn(),
      bulkUploadEmployees: vi.fn(),
    },
  };
});

vi.mock("../../src/services/modules/department", () => ({
  departmentService: {
    getDepartments: vi.fn().mockResolvedValue({ data: { content: [] } }),
  },
}));

vi.mock("../../src/services/modules/branch", () => ({
  branchService: {
    getBranches: vi.fn().mockResolvedValue({ data: { content: [] } }),
  },
}));

vi.mock("../../src/services/modules/category", () => ({
  categoryService: {
    getCategoryItems: vi.fn().mockResolvedValue({ data: { content: [] } }),
  },
}));

const employeePage = (overrides: Record<string, unknown> = {}) => ({
  data: {
    content: [
      {
        id: "employee-1",
        employeeId: "E-001",
        name: "Ava Patel",
        emailAddress: "ava@example.com",
        mobileNumber: "555",
        department: "Engineering",
        designation: "Developer",
        branch: "HQ",
        joiningDate: "2026-01-15",
        employeeStatus: "ACTIVE",
      },
    ],
    totalElements: 42,
    totalPages: 3,
    size: 20,
    number: 0,
    numberOfElements: 1,
    first: true,
    last: false,
    empty: false,
    ...overrides,
  },
});

describe("EmployeeManagement", () => {
  beforeEach(() => {
    vi.mocked(employeeService.getEmployees).mockResolvedValue(employeePage() as any);
  });

  it("renders rows from data.content and total count from totalElements", async () => {
    renderWithProviders(<EmployeeManagement />);

    expect(await screen.findByText("Ava Patel")).toBeInTheDocument();
    expect(screen.getByText("E-001")).toBeInTheDocument();
    expect(screen.getAllByText("42")[0]).toBeInTheDocument();
    expect(screen.getByText("1-20 of 42")).toBeInTheDocument();
  });

  it("sends zero-based page and updated page size", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EmployeeManagement />);

    await screen.findByText("Ava Patel");
    await user.click(screen.getByLabelText("Go to next page"));

    await waitFor(() => {
      expect(employeeService.getEmployees).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, size: 20 }),
      );
    });

    await user.click(screen.getByRole("combobox", { name: /rows per page/i }));
    await user.click(await screen.findByRole("option", { name: "50" }));

    await waitFor(() => {
      expect(employeeService.getEmployees).toHaveBeenCalledWith(
        expect.objectContaining({ page: 0, size: 50 }),
      );
    });
  });

  it("forwards search to employee list query", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EmployeeManagement />);

    await screen.findByText("Ava Patel");
    await user.type(
      screen.getByPlaceholderText("Search by name, email, or employee ID..."),
      "mira",
    );

    await waitFor(() => {
      expect(employeeService.getEmployees).toHaveBeenCalledWith(
        expect.objectContaining({ search: "mira" }),
      );
    });
  });
});
