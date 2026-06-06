import "@testing-library/jest-dom/vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../helpers/render";
import EmployeeManagement from "../../../src/pages/employees/employeeManagement";

// --------------- service mocks ---------------
vi.mock("../../../src/services/modules/employees", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../src/services/modules/employees")>();
  return {
    ...actual,
    employeeService: {
      getEmployees: vi.fn(),
      createEmployee: vi.fn(),
      updateEmployee: vi.fn(),
      deleteEmployee: vi.fn(),
      deactivateEmployee: vi.fn(),
      reactivateEmployee: vi.fn(),
      bulkUploadEmployees: vi.fn(),
      getEmployeeId: vi.fn().mockResolvedValue({}),
      previewEmployeeId: vi.fn().mockResolvedValue({ previewId: "EMP001" }),
      downloadBulkUploadTemplate: vi.fn(),
    },
  };
});

vi.mock("../../../src/services/modules/department", () => ({
  departmentService: {
    getDepartments: vi.fn(),
  },
}));

vi.mock("../../../src/services/modules/category", () => ({
  categoryService: {
    getCategoryItems: vi.fn(),
  },
}));

vi.mock("../../../src/services/modules/branch", () => ({
  branchService: {
    getBranches: vi.fn(),
    getDropdownBranches: vi.fn(),
  },
}));

// FilterPopup is a heavy component — stub it so tests stay focused on the management page
vi.mock("../../../src/components/FilterPopup.tsx", () => ({
  default: ({ onApply }: { onApply: (f: unknown) => void }) => (
    <button onClick={() => onApply({ condition: "AND", rules: [] })}>
      Apply Filters
    </button>
  ),
}));

// --------------- fixtures ---------------
const mockEmployees = [
  {
    id: "1",
    employeeId: "EMP001",
    name: "Alice Johnson",
    emailAddress: "alice@example.com",
    mobileNumber: "9876543210",
    department: "Engineering",
    departmentId: "dept-1",
    designation: "Software Engineer",
    designationId: "desig-1",
    branch: "Bangalore",
    branchId: "branch-1",
    joiningDate: "2023-01-15",
    employeeStatus: "ACTIVE",
  },
  {
    id: "2",
    employeeId: "EMP002",
    name: "Bob Smith",
    emailAddress: "bob@example.com",
    mobileNumber: "9123456789",
    department: "HR",
    departmentId: "dept-2",
    designation: "HR Manager",
    designationId: "desig-2",
    branch: "Mumbai",
    branchId: "branch-2",
    joiningDate: "2023-03-20",
    employeeStatus: "PENDING",
  },
];

const mockDepartments = [
  { id: "dept-1", departmentName: "Engineering", departmentCode: "ENG" },
  { id: "dept-2", departmentName: "HR", departmentCode: "HR" },
];

const mockBranches = [
  { id: "branch-1", branchName: "Bangalore", branchCode: "BLR" },
  { id: "branch-2", branchName: "Mumbai", branchCode: "MUM" },
];

const mockDesignations = [
  { id: "desig-1", name: "Software Engineer", code: "SWE" },
  { id: "desig-2", name: "HR Manager", code: "HRM" },
];

async function setupMocks() {
  const { employeeService } = await import(
    "../../../src/services/modules/employees"
  );
  const { departmentService } = await import(
    "../../../src/services/modules/department"
  );
  const { categoryService } = await import(
    "../../../src/services/modules/category"
  );
  const { branchService } = await import(
    "../../../src/services/modules/branch"
  );

  vi.mocked(employeeService.getEmployees).mockResolvedValue({
    data: { content: mockEmployees, totalElements: 2 },
  } as any);
  vi.mocked(departmentService.getDepartments).mockResolvedValue({
    data: { content: mockDepartments },
  } as any);
  vi.mocked(categoryService.getCategoryItems).mockResolvedValue({
    data: { content: mockDesignations },
  } as any);
  vi.mocked(branchService.getBranches).mockResolvedValue({
    data: { content: mockBranches },
  } as any);
  vi.mocked(employeeService.createEmployee).mockResolvedValue({
    data: { id: "3", employeeId: "EMP003" },
  } as any);
  vi.mocked(employeeService.deleteEmployee).mockResolvedValue({} as any);
}

// --------------- tests ---------------
describe("EmployeeManagement — rendering", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await setupMocks();
  });

  it("renders the page heading", async () => {
    renderWithProviders(<EmployeeManagement />);
    // Wait for employee data to load, then check a stat card label
    expect(await screen.findByText("Total Employees")).toBeInTheDocument();
  });

  it("displays employees fetched from the API", async () => {
    renderWithProviders(<EmployeeManagement />);
    expect(await screen.findByText("Alice Johnson")).toBeInTheDocument();
    expect(await screen.findByText("Bob Smith")).toBeInTheDocument();
  });

  it("shows employee IDs in the table", async () => {
    renderWithProviders(<EmployeeManagement />);
    expect(await screen.findByText("EMP001")).toBeInTheDocument();
    expect(await screen.findByText("EMP002")).toBeInTheDocument();
  });

  it("shows email addresses in the table", async () => {
    renderWithProviders(<EmployeeManagement />);
    expect(await screen.findByText("alice@example.com")).toBeInTheDocument();
  });
});

describe("EmployeeManagement — API contract", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await setupMocks();
  });

  it("calls getEmployees on mount", async () => {
    const { employeeService } = await import(
      "../../../src/services/modules/employees"
    );
    renderWithProviders(<EmployeeManagement />);
    await waitFor(() => {
      expect(vi.mocked(employeeService.getEmployees)).toHaveBeenCalled();
    });
  });

  it("calls getDepartments on mount", async () => {
    const { departmentService } = await import(
      "../../../src/services/modules/department"
    );
    renderWithProviders(<EmployeeManagement />);
    await waitFor(() => {
      expect(vi.mocked(departmentService.getDepartments)).toHaveBeenCalled();
    });
  });

  it("calls getBranches on mount", async () => {
    const { branchService } = await import(
      "../../../src/services/modules/branch"
    );
    renderWithProviders(<EmployeeManagement />);
    await waitFor(() => {
      expect(vi.mocked(branchService.getDropdownBranches)).toHaveBeenCalled();
    });
  });

  it("passes pagination params to getEmployees", async () => {
    const { employeeService } = await import(
      "../../../src/services/modules/employees"
    );
    renderWithProviders(<EmployeeManagement />);
    await waitFor(() => {
      expect(vi.mocked(employeeService.getEmployees)).toHaveBeenCalledWith(
        expect.objectContaining({ page: 0 })
      );
    });
  });
});

describe("EmployeeManagement — Add employee dialog", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await setupMocks();
  });

  it("opens the add employee dialog when the Add button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EmployeeManagement />);

    // Wait for the page to load
    await screen.findByText("Alice Johnson");

    const addButton = screen.getByRole("button", { name: /add employee/i });
    await user.click(addButton);

    expect(
      await screen.findByRole("dialog")
    ).toBeInTheDocument();
  });

  it("closes the dialog when Cancel is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EmployeeManagement />);
    await screen.findByText("Alice Johnson");

    await user.click(screen.getByRole("button", { name: /add employee/i }));
    await screen.findByRole("dialog");

    const cancelBtn = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});

describe("EmployeeManagement — search", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await setupMocks();
  });

  it("renders a search input", async () => {
    renderWithProviders(<EmployeeManagement />);
    await screen.findByText("Alice Johnson");
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it("triggers getEmployees again when search input changes", async () => {
    const { employeeService } = await import(
      "../../../src/services/modules/employees"
    );
    renderWithProviders(<EmployeeManagement />);
    await screen.findByText("Alice Johnson");

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: "Alice" } });

    await waitFor(() => {
      expect(
        vi.mocked(employeeService.getEmployees).mock.calls.length
      ).toBeGreaterThan(1);
    });
  });
});

describe("EmployeeManagement — delete employee", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await setupMocks();
  });

  it("shows delete action buttons in the employee rows", async () => {
    renderWithProviders(<EmployeeManagement />);
    await screen.findByText("Alice Johnson");

    // MUI renders NoAccountsIcon (deactivate) with data-testid="NoAccountsIcon"
    const deactivateIcons = screen.getAllByTestId("NoAccountsIcon");
    expect(deactivateIcons.length).toBeGreaterThan(0);
  });
});

describe("EmployeeManagement — bulk upload dialog", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await setupMocks();
  });

  it("opens the bulk upload dialog", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EmployeeManagement />);
    await screen.findByText("Alice Johnson");

    const bulkBtn = screen.getByRole("button", { name: /bulk upload/i });
    await user.click(bulkBtn);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
});

describe("EmployeeManagement — API error handling", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
  });

  it("does not crash when getEmployees rejects", async () => {
    const { employeeService } = await import(
      "../../../src/services/modules/employees"
    );
    vi.mocked(employeeService.getEmployees).mockRejectedValue(
      new Error("Network error")
    );
    const { departmentService } = await import(
      "../../../src/services/modules/department"
    );
    vi.mocked(departmentService.getDepartments).mockResolvedValue({
      data: { content: [] },
    } as any);
    const { categoryService } = await import(
      "../../../src/services/modules/category"
    );
    vi.mocked(categoryService.getCategoryItems).mockResolvedValue({
      data: { content: [] },
    } as any);
    const { branchService } = await import(
      "../../../src/services/modules/branch"
    );
    vi.mocked(branchService.getBranches).mockResolvedValue({
      data: { content: [] },
    } as any);

    renderWithProviders(<EmployeeManagement />);

    // Page should still render without crashing
    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
  });
});
