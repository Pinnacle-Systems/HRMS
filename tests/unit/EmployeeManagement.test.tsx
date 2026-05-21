import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EmployeeManagement from "../../src/pages/employees/employeeManagement";
import { employeeService } from "../../src/services/modules/employees";

vi.mock("../../src/components/FilterPopup.tsx", () => ({
  default: ({ open }: any) =>
    open ? <div data-testid="filter-popup" /> : null,
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

const mockShowSnackbar = vi.fn();
const mockShowConfirmDialog = vi.fn();

vi.mock("../../src/context/Snackbar", () => ({
  useUI: () => ({
    showSnackbar: mockShowSnackbar,
    showSpinner: vi.fn(),
    hideSpinner: vi.fn(),
    showConfirmDialog: mockShowConfirmDialog,
  }),
}));

vi.mock("../../src/components/GlobalPagination", () => ({
  GlobalPagination: ({
    total,
    page,
    limit,
    onPageChange,
    onLimitChange,
  }: any) => (
    <div>
      <span>{`${(page - 1) * limit + 1}-${page * limit} of ${total}`}</span>
      <button
        aria-label="Go to next page"
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
      <label>
        Rows Per Page:
        <select
          aria-label="Rows Per Page:"
          value={limit}
          onChange={(event) => onLimitChange(Number(event.target.value))}
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </label>
    </div>
  ),
}));

vi.mock("../../src/materialModule", () => {
  const Element =
    (tag: string) =>
    ({ children, ...props }: any) => {
      const Component = tag as any;
      delete props.startIcon;
      delete props.stickyHeader;
      delete props.component;
      delete props.hover;
      delete props.elevation;
      delete props.sx;
      return <Component {...props}>{children}</Component>;
    };
  const Icon = () => <span />;

  return {
    default: {
      Button: Element("button"),
      TextField: ({ value, onChange, placeholder, label }: any) => (
        <input
          aria-label={label}
          placeholder={placeholder}
          value={value || ""}
          onChange={onChange}
        />
      ),
      Switch: ({ checked, onChange }: any) => (
        <input
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={onChange}
        />
      ),
      FormControlLabel: ({ control, label }: any) => (
        <label>
          {control}
          {label}
        </label>
      ),
      Chip: ({ label }: any) => <span>{label}</span>,
      Box: Element("div"),
      Typography: Element("span"),
      TableContainer: Element("div"),
      Paper: Element("div"),
      Table: Element("table"),
      TableHead: Element("thead"),
      TableRow: Element("tr"),
      TableCell: Element("td"),
      TableBody: Element("tbody"),
      Tooltip: ({ title, children }: any) => (
        <span title={title}>{children}</span>
      ),
      IconButton: Element("button"),
      Dialog: ({ open, children }: any) =>
        open ? <div role="dialog">{children}</div> : null,
      DialogContent: Element("div"),
      DialogActions: Element("div"),
      CloseOutlined: Icon,
      FileUploadIcon: Icon,
      VisibilityOutlined: Icon,
      DeleteIcon: Icon,
      NoAccountsIcon: Icon,
      HowToRegIcon: Icon,
      ArrowUpward: Icon,
      ArrowDownward: Icon,
    },
  };
});

vi.mock("../../src/services/modules/employees", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("../../src/services/modules/employees")
    >();

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
    mockShowSnackbar.mockReset();
    mockShowConfirmDialog.mockReset();
    vi.mocked(employeeService.getEmployees).mockResolvedValue(
      employeePage() as any,
    );
  });

  it("renders rows from data.content and total count from totalElements", async () => {
    render(<EmployeeManagement />);

    expect(await screen.findByText("Ava Patel")).toBeInTheDocument();
    expect(screen.getByText("E-001")).toBeInTheDocument();
    expect(screen.getAllByText("42")[0]).toBeInTheDocument();
    expect(screen.getByText("1-20 of 42")).toBeInTheDocument();
  });

  it("sends zero-based page and updated page size", async () => {
    const user = userEvent.setup();
    render(<EmployeeManagement />);

    await screen.findByText("Ava Patel");
    await user.click(screen.getByLabelText("Go to next page"));

    await waitFor(() => {
      expect(employeeService.getEmployees).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, size: 20 }),
      );
    });

    await user.selectOptions(
      screen.getByRole("combobox", { name: /rows per page/i }),
      "50",
    );

    await waitFor(() => {
      expect(employeeService.getEmployees).toHaveBeenCalledWith(
        expect.objectContaining({ page: 0, size: 50 }),
      );
    });
  });

  it("forwards search to employee list query", async () => {
    const user = userEvent.setup();
    render(<EmployeeManagement />);

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

  it("active row shows Deactivate tooltip, not Reactivate", async () => {
    render(<EmployeeManagement />);
    await screen.findByText("Ava Patel");

    expect(screen.getByTitle("Deactivate")).toBeInTheDocument();
    expect(screen.queryByTitle("Reactivate")).not.toBeInTheDocument();
  });

  it("inactive row (employeeStatus=INACTIVE) shows Reactivate tooltip, not Deactivate", async () => {
    vi.mocked(employeeService.getEmployees).mockResolvedValue(
      employeePage({ content: [{ id: "employee-2", employeeId: "E-002", name: "Bo Rao", emailAddress: "bo@example.com", mobileNumber: "", department: "", designation: "", branch: "", joiningDate: "", employeeStatus: "INACTIVE" }] }) as any,
    );
    render(<EmployeeManagement />);
    await screen.findByText("Bo Rao");

    expect(screen.getByTitle("Reactivate")).toBeInTheDocument();
    expect(screen.queryByTitle("Deactivate")).not.toBeInTheDocument();
  });

  it("includeInactive toggle sends includeInactive=true to getEmployees", async () => {
    const user = userEvent.setup();
    render(<EmployeeManagement />);
    await screen.findByText("Ava Patel");

    const toggle = screen.getByRole("switch");
    await user.click(toggle);

    await waitFor(() => {
      expect(employeeService.getEmployees).toHaveBeenCalledWith(
        expect.objectContaining({ includeInactive: true }),
      );
    });
  });

  it("confirmation dialog for deactivate uses deactivate wording, not delete", async () => {
    render(<EmployeeManagement />);
    await screen.findByText("Ava Patel");

    await userEvent.setup().click(
      within(screen.getByTitle("Deactivate")).getByRole("button"),
    );

    expect(mockShowConfirmDialog).toHaveBeenCalledOnce();
    const opts = mockShowConfirmDialog.mock.calls[0][0];
    expect(opts.title).not.toMatch(/delete/i);
    expect(opts.message).not.toMatch(/delete/i);
    expect(opts.confirmText).not.toMatch(/delete/i);
    expect(opts.title).toMatch(/deactivate/i);
    expect(opts.confirmText).toMatch(/deactivate/i);
  });

  it("deactivate action calls deactivateEmployee service method", async () => {
    mockShowConfirmDialog.mockImplementation((opts: any) => opts.onConfirm());
    vi.mocked(employeeService.deactivateEmployee).mockResolvedValue(undefined as any);

    render(<EmployeeManagement />);
    await screen.findByText("Ava Patel");

    await userEvent.setup().click(
      within(screen.getByTitle("Deactivate")).getByRole("button"),
    );

    await waitFor(() => {
      expect(employeeService.deactivateEmployee).toHaveBeenCalledWith("employee-1");
    });
  });

  it("reactivate action calls reactivateEmployee service method", async () => {
    vi.mocked(employeeService.getEmployees).mockResolvedValue(
      employeePage({ content: [{ id: "emp-inactive", employeeId: "E-003", name: "Cy Lin", emailAddress: "cy@example.com", mobileNumber: "", department: "", designation: "", branch: "", joiningDate: "", employeeStatus: "INACTIVE" }] }) as any,
    );
    mockShowConfirmDialog.mockImplementation((opts: any) => opts.onConfirm());
    vi.mocked(employeeService.reactivateEmployee).mockResolvedValue({ name: "Cy Lin" } as any);

    render(<EmployeeManagement />);
    await screen.findByText("Cy Lin");

    await userEvent.setup().click(
      within(screen.getByTitle("Reactivate")).getByRole("button"),
    );

    await waitFor(() => {
      expect(employeeService.reactivateEmployee).toHaveBeenCalledWith("emp-inactive");
    });
  });
});
