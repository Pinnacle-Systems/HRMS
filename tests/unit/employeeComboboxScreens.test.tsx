import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BranchSettings from "../../src/pages/settings/general/branchSettings";
import DepartmentSettings from "../../src/pages/settings/employee/depSettings";
import { branchService } from "../../src/services/modules/branch";
import { departmentService } from "../../src/services/modules/department";

vi.mock("@mui/material", () => {
  const Element =
    (tag: string) =>
    ({ children, ...props }: any) => {
      const Component = tag as any;
      delete props.className;
      delete props.color;
      delete props.component;
      delete props.container;
      delete props.elevation;
      delete props.fullWidth;
      delete props.maxWidth;
      delete props.multiline;
      delete props.rows;
      delete props.size;
      delete props.spacing;
      delete props.sx;
      delete props.variant;
      return <Component {...props}>{children}</Component>;
    };

  const Button = ({ children, component, ...props }: any) => {
    delete props.className;
    delete props.color;
    delete props.size;
    delete props.startIcon;
    delete props.sx;
    delete props.variant;

    if (component === "span") {
      return <span {...props}>{children}</span>;
    }

    return <button {...props}>{children}</button>;
  };

  const TextField = ({ label, name, onChange, placeholder, value, type }: any) => (
    <input
      aria-label={label || placeholder}
      name={name}
      onChange={onChange}
      placeholder={placeholder}
      type={type || "text"}
      value={value || ""}
    />
  );

  const Select = ({ children, label, onChange, value }: any) => (
    <select aria-label={label} onChange={onChange} value={value || ""}>
      {children}
    </select>
  );

  const Switch = ({ checked, onChange }: any) => (
    <input checked={Boolean(checked)} onChange={onChange} type="checkbox" />
  );

  return {
    Alert: Element("div"),
    Autocomplete: Element("div"),
    Box: Element("div"),
    Button,
    Card: Element("div"),
    CardContent: Element("div"),
    Chip: ({ label }: any) => <span>{label}</span>,
    CircularProgress: Element("span"),
    Dialog: ({ children, open }: any) =>
      open ? <div role="dialog">{children}</div> : null,
    DialogActions: Element("div"),
    DialogContent: Element("div"),
    DialogTitle: Element("div"),
    FormControl: Element("div"),
    FormControlLabel: ({ control, label }: any) => (
      <label>
        {control}
        {label}
      </label>
    ),
    IconButton: Element("button"),
    InputLabel: Element("label"),
    MenuItem: ({ children, value }: any) => <option value={value}>{children}</option>,
    Paper: Element("div"),
    Select,
    Switch,
    Table: Element("table"),
    TableBody: Element("tbody"),
    TableCell: Element("td"),
    TableContainer: Element("div"),
    TableHead: Element("thead"),
    TableRow: Element("tr"),
    TextField,
    Tooltip: ({ children }: any) => <>{children}</>,
    Typography: Element("p"),
  };
});

vi.mock("../../src/context/Snackbar", () => ({
  useUI: () => ({
    hideSpinner: vi.fn(),
    showConfirmDialog: ({ onConfirm }: any) => onConfirm(),
    showSnackbar: vi.fn(),
    showSpinner: vi.fn(),
  }),
}));

vi.mock("../../src/components/GlobalPagination", () => ({
  GlobalPagination: () => <div data-testid="pagination" />,
}));

vi.mock("../../src/components/GlobalSort", () => ({
  GlobalSort: () => <div data-testid="sort" />,
}));

vi.mock("../../src/components/Map", () => ({
  default: () => <div data-testid="map" />,
}));

vi.mock("../../src/components/employees/EmployeeAsyncCombobox", () => ({
  default: ({ label, onChange }: any) => (
    <select
      aria-label={label}
      onChange={(event) => {
        const employeeId = event.target.value;
        onChange(
          employeeId || null,
          employeeId
            ? { id: employeeId, employeeId: "E-001", name: "Ava Patel" }
            : null,
        );
      }}
    >
      <option value="">Select</option>
      <option value="employee-1">Ava Patel (E-001)</option>
    </select>
  ),
}));

vi.mock("../../src/services/modules/branch", () => ({
  branchService: {
    createBranch: vi.fn(),
    deleteBranchById: vi.fn(),
    getBranches: vi.fn(),
    getDropdownBranches: vi.fn(),
    updateBranch: vi.fn(),
  },
}));

vi.mock("../../src/services/modules/department", () => ({
  departmentService: {
    createDepartment: vi.fn(),
    deleteDepartmentById: vi.fn(),
    getDepartments: vi.fn(),
    updateDepartment: vi.fn(),
  },
}));

const mockedBranchService = vi.mocked(branchService);
const mockedDepartmentService = vi.mocked(departmentService);

describe("employee async combobox screen migrations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue([]),
      }),
    );

    mockedBranchService.getBranches.mockResolvedValue({
      success: true,
      data: {
        content: [{ id: "branch-1", branchName: "HQ", branchCode: "HQ" }],
        totalElements: 1,
      },
    });
    mockedBranchService.getDropdownBranches.mockResolvedValue({
      data: [{ id: "branch-1", branchName: "HQ", branchCode: "HQ" }],
    });
    mockedBranchService.createBranch.mockResolvedValue({
      success: true,
      message: "Created",
    });
    mockedDepartmentService.getDepartments.mockResolvedValue({
      success: true,
      data: { content: [], totalElements: 0 },
    });
    mockedDepartmentService.createDepartment.mockResolvedValue({
      success: true,
      message: "Created",
    });
  });

  it("saves the selected branch head employee id", async () => {
    const user = userEvent.setup();
    render(<BranchSettings />);

    await user.click(screen.getByRole("button", { name: "Add New Branch" }));
    await user.type(screen.getByLabelText("Branch Name"), "North Branch");
    await user.type(screen.getByLabelText("Branch Code"), "NB");
    await user.type(screen.getByLabelText("Branch Address"), "Main Road");
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Assign Branch Head" }),
      "employee-1",
    );
    await user.click(screen.getByRole("button", { name: "Save Branch" }));

    await waitFor(() => {
      expect(mockedBranchService.createBranch).toHaveBeenCalledWith(
        expect.objectContaining({ branchHeadId: "employee-1" }),
      );
    });
  });

  it("saves the selected department head employee id", async () => {
    const user = userEvent.setup();
    render(<DepartmentSettings />);

    await user.click(screen.getByRole("button", { name: "Add New Department" }));
    await user.type(screen.getByLabelText("Department Name"), "Engineering");
    await user.type(screen.getByLabelText("Department Code"), "ENG");
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Select Branch" }),
      "branch-1",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Assign Department Head" }),
      "employee-1",
    );
    await user.click(screen.getByRole("button", { name: "Save Department" }));

    await waitFor(() => {
      expect(mockedDepartmentService.createDepartment).toHaveBeenCalledWith(
        expect.objectContaining({
          branchId: "branch-1",
          departmentHeadId: "employee-1",
        }),
      );
    });
  });
});
