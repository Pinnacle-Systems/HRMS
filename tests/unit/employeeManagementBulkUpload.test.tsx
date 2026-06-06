import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { beforeAll } from "vitest";
import EmployeeManagement from "../../src/pages/employees/employeeManagement";

// ── Stub heavy/unrelated modules ─────────────────────────────────────────────
vi.mock("../../src/components/FilterPopup.tsx", () => ({ default: () => null }));
vi.mock("../../src/components/GlobalPagination", () => ({ GlobalPagination: () => null }));
vi.mock("@mui/x-date-pickers/LocalizationProvider", () => ({
  LocalizationProvider: ({ children }: any) => <>{children}</>,
}));
vi.mock("@mui/x-date-pickers/AdapterDayjs", () => ({ AdapterDayjs: class {} }));
vi.mock("@mui/x-date-pickers/DatePicker", () => ({
  DatePicker: ({ label }: any) => <input aria-label={label} />,
}));
vi.mock("../../src/materialModule", () => {
  const Noop = () => null;
  const El =
    (tag: string) =>
    ({ children, ...props }: any) => {
      const T = tag as any;
      ["startIcon","className","color","size","variant","sx","elevation","component",
       "fullWidth","maxWidth","multiline","rows","spacing","container","align"].forEach(k => delete props[k]);
      return <T {...props}>{children}</T>;
    };
  const Btn = ({ children, onClick, disabled, ...rest }: any) => {
    ["startIcon","className","color","size","variant","fullWidth","sx"].forEach(k => delete rest[k]);
    return <button onClick={onClick} disabled={!!disabled} {...rest}>{children}</button>;
  };
  return {
    default: {
      Button: Btn,
      Box: El("div"),
      Dialog: ({ open, children }: any) =>
        open ? <div role="dialog">{children}</div> : null,
      DialogContent: El("div"),
      DialogActions: El("div"),
      DialogTitle: El("div"),
      IconButton: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
      Alert: ({ children }: any) => <div role="alert">{children}</div>,
      Typography: ({ children }: any) => <p>{children}</p>,
      LinearProgress: ({ value }: any) => <span role="progressbar" aria-valuenow={value} />,
      TextField: ({ label, value, onChange, placeholder }: any) => (
        <input aria-label={label} value={value ?? ""} onChange={onChange} placeholder={placeholder} />
      ),
      Select: ({ children, label, value, onChange }: any) => (
        <select aria-label={label} value={value} onChange={onChange}>{children}</select>
      ),
      MenuItem: ({ children, value }: any) => <option value={value}>{children}</option>,
      FormControl: El("div"),
      FormControlLabel: ({ label, control }: any) => <label>{control}{label}</label>,
      Switch: ({ checked, onChange }: any) => (
        <input type="checkbox" role="switch" checked={!!checked} onChange={onChange} />
      ),
      Checkbox: ({ checked, onChange }: any) => (
        <input type="checkbox" checked={!!checked} onChange={onChange} />
      ),
      InputLabel: El("label"),
      Table: El("table"),
      TableBody: El("tbody"),
      TableCell: El("td"),
      TableContainer: El("div"),
      TableHead: El("thead"),
      TableRow: El("tr"),
      Paper: El("div"),
      Chip: ({ label }: any) => <span>{label}</span>,
      Tooltip: ({ children }: any) => <>{children}</>,
      Grid: El("div"),
      Avatar: El("div"),
      Accordion: El("div"),
      AccordionSummary: El("div"),
      AccordionDetails: El("div"),
      Menu: ({ open, children }: any) => open ? <div>{children}</div> : null,
      CheckCircleOutlineIcon: Noop,
      // Icons
      CloseOutlined: Noop,
      CloudUploadIcon: Noop,
      DownloadIcon: Noop,
      FileUploadIcon: Noop,
      EditIcon: Noop,
      DeleteIcon: Noop,
      VisibilityOutlined: Noop,
      ArrowUpward: Noop,
      ArrowDownward: Noop,
      NoAccountsIcon: Noop,
      HowToRegIcon: Noop,
    },
  };
});

// ── Service mocks ─────────────────────────────────────────────────────────────
const { mockBulkUploadEmployees, mockDownloadBulkUploadTemplate, mockGetEmployees } = vi.hoisted(() => ({
  mockBulkUploadEmployees: vi.fn(),
  mockDownloadBulkUploadTemplate: vi.fn(),
  mockGetEmployees: vi.fn(),
}));

vi.mock("../../src/services/modules/employees", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/services/modules/employees")>();
  return {
    ...actual,
    employeeService: {
      getEmployees: mockGetEmployees,
      bulkUploadEmployees: mockBulkUploadEmployees,
      downloadBulkUploadTemplate: mockDownloadBulkUploadTemplate,
      deleteEmployee: vi.fn(),
      deactivateEmployee: vi.fn(),
      reactivateEmployee: vi.fn(),
      getEmployeeId: vi.fn().mockResolvedValue({}),
    },
  };
});

vi.mock("../../src/services/modules/department", () => ({
  departmentService: { getDepartments: vi.fn().mockResolvedValue({ data: [] }) },
}));
vi.mock("../../src/services/modules/branch", () => ({
  branchService: { getBranches: vi.fn().mockResolvedValue({ data: [] }) },
}));
vi.mock("../../src/services/modules/category", () => ({
  categoryService: { getCategoryItems: vi.fn().mockResolvedValue({ data: [] }) },
}));

const mockShowSnackbar = vi.fn();
const mockShowSpinner = vi.fn();
const mockHideSpinner = vi.fn();
const mockShowConfirmDialog = vi.fn();

vi.mock("../../src/context/Snackbar", () => ({
  useUI: () => ({
    showSnackbar: mockShowSnackbar,
    showSpinner: mockShowSpinner,
    hideSpinner: mockHideSpinner,
    showConfirmDialog: mockShowConfirmDialog,
  }),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => vi.fn() };
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const emptyPage = {
  data: { content: [], totalElements: 0, totalPages: 0, size: 0, number: 0, numberOfElements: 0, first: true, last: true, empty: true },
};

async function renderAndOpenBulkDialog() {
  mockGetEmployees.mockResolvedValue(emptyPage);
  render(
    <MemoryRouter>
      <EmployeeManagement />
    </MemoryRouter>,
  );
  const bulkBtn = await screen.findByRole("button", { name: /bulk upload/i });
  await userEvent.click(bulkBtn);
  expect(screen.getByRole("dialog")).toBeInTheDocument();
}

beforeAll(() => {
  window.URL.createObjectURL = vi.fn().mockReturnValue("blob:x");
  window.URL.revokeObjectURL = vi.fn();
});

beforeEach(() => {
  vi.clearAllMocks();
  mockGetEmployees.mockResolvedValue(emptyPage);
});

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("Bulk Upload Dialog", () => {
  const getFileInput = () =>
    document.querySelector('input[type="file"]') as HTMLInputElement;

  const setFile = async (file: File) => {
    const input = getFileInput();
    Object.defineProperty(input, 'files', { value: [file], writable: true });
    fireEvent.change(input);
  };

  it("rejects a file exceeding 10 MB", async () => {
    await renderAndOpenBulkDialog();

    const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], "big.csv", { type: "text/csv" });
    await setFile(largeFile);
    await userEvent.click(screen.getByRole("button", { name: /upload & send/i }));

    await waitFor(() => {
      expect(mockShowSnackbar).toHaveBeenCalledWith(
        expect.stringMatching(/10 mb/i),
        "error",
      );
    });
    expect(mockBulkUploadEmployees).not.toHaveBeenCalled();
  });

  it("accepts a valid CSV file and shows success summary", async () => {
    mockBulkUploadEmployees.mockResolvedValue({
      data: {
        successCount: 3,
        failureCount: 0,
        errors: [],
        welcomeEmailsSent: 3,
        welcomeEmailsFailed: 0,
        welcomeEmailFailures: [],
      },
    });
    await renderAndOpenBulkDialog();

    const csvFile = new File(["name,email\nJohn,john@x.com"], "emp.csv", { type: "text/csv" });
    await setFile(csvFile);
    await userEvent.click(screen.getByRole("button", { name: /upload & send/i }));

    await waitFor(() => {
      expect(mockBulkUploadEmployees).toHaveBeenCalledWith(csvFile, expect.any(Function));
    });
    await waitFor(() => {
      expect(screen.getByText(/imported:/i)).toBeInTheDocument();
    });
    expect(mockShowSnackbar).toHaveBeenCalledWith(
      expect.stringMatching(/3 employees imported/i),
      "success",
    );
  });

  it("accepts a valid XLSX file", async () => {
    mockBulkUploadEmployees.mockResolvedValue({ data: { successCount: 1, errors: [] } });
    await renderAndOpenBulkDialog();

    const xlsxFile = new File(["PK"], "emp.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    await setFile(xlsxFile);
    await userEvent.click(screen.getByRole("button", { name: /upload & send/i }));

    await waitFor(() => {
      expect(mockBulkUploadEmployees).toHaveBeenCalledWith(xlsxFile, expect.any(Function));
    });
  });

  it("shows row errors when backend returns failures", async () => {
    mockBulkUploadEmployees.mockResolvedValue({
      data: {
        successCount: 1,
        failureCount: 1,
        errors: [{ row: 2, field: "email", message: "Invalid email format" }],
        welcomeEmailsSent: 1,
      },
    });
    await renderAndOpenBulkDialog();

    setFile( new File(["data"], "emp.csv", { type: "text/csv" }));
    await userEvent.click(screen.getByRole("button", { name: /upload & send/i }));

    await waitFor(() => {
      expect(screen.getByText(/row errors/i)).toBeInTheDocument();
      expect(screen.getByText(/Invalid email format/)).toBeInTheDocument();
    });
    expect(mockShowSnackbar).toHaveBeenCalledWith(
      expect.stringMatching(/1 row error/i),
      "warning",
    );
  });

  it("shows welcome email counts in result summary", async () => {
    mockBulkUploadEmployees.mockResolvedValue({
      data: {
        successCount: 4,
        failureCount: 0,
        errors: [],
        welcomeEmailsSent: 4,
        welcomeEmailsFailed: 1,
        welcomeEmailFailures: ["bad@x.com"],
      },
    });
    await renderAndOpenBulkDialog();

    setFile( new File(["data"], "emp.csv", { type: "text/csv" }));
    await userEvent.click(screen.getByRole("button", { name: /upload & send/i }));

    await waitFor(() => {
      expect(screen.getByText(/welcome emails sent/i)).toBeInTheDocument();
      expect(screen.getByText(/welcome emails failed/i)).toBeInTheDocument();
    });
  });

  it("shows error snackbar on backend failure", async () => {
    mockBulkUploadEmployees.mockRejectedValue(new Error("Server error"));
    await renderAndOpenBulkDialog();

    setFile( new File(["data"], "emp.csv", { type: "text/csv" }));
    await userEvent.click(screen.getByRole("button", { name: /upload & send/i }));

    await waitFor(() => {
      expect(mockShowSnackbar).toHaveBeenCalledWith("Server error", "error");
    });
  });

  it("template download button calls downloadBulkUploadTemplate", async () => {
    mockDownloadBulkUploadTemplate.mockResolvedValue(undefined);
    await renderAndOpenBulkDialog();

    const downloadBtn = screen.getByRole("button", { name: /download template/i });
    await userEvent.click(downloadBtn);

    expect(mockDownloadBulkUploadTemplate).toHaveBeenCalledTimes(1);
  });

  it("template download button shows error on failure", async () => {
    mockDownloadBulkUploadTemplate.mockRejectedValue(new Error("Failed to download template."));
    await renderAndOpenBulkDialog();

    const downloadBtn = screen.getByRole("button", { name: /download template/i });
    await userEvent.click(downloadBtn);

    await waitFor(() => {
      expect(mockShowSnackbar).toHaveBeenCalledWith("Failed to download template.", "error");
    });
  });
});
