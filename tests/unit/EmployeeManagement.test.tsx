import { render, screen, waitFor } from "@testing-library/react";
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

vi.mock("../../src/context/Snackbar", () => ({
  useUI: () => ({
    showSnackbar: vi.fn(),
    showSpinner: vi.fn(),
    hideSpinner: vi.fn(),
    showConfirmDialog: vi.fn(),
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
  const Passthrough = ({ children }: any) => <>{children}</>;
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
      Tooltip: Passthrough,
      IconButton: Element("button"),
      Dialog: ({ open, children }: any) =>
        open ? <div role="dialog">{children}</div> : null,
      DialogContent: Element("div"),
      DialogActions: Element("div"),
      CloseOutlined: Icon,
      FileUploadIcon: Icon,
      VisibilityOutlined: Icon,
      DeleteIcon: Icon,
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
});
