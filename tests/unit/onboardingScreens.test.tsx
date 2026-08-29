import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AssignOnboarding } from "../../src/pages/settings/employee/onBoardingProcess/assignOnBoarding";
import { DocumentsUpload } from "../../src/pages/settings/employee/onBoardingProcess/documentUpload";
import { ProgressTracking } from "../../src/pages/settings/employee/onBoardingProcess/progressTracking";
import { onBoardService } from "../../src/services/modules/onBoard";

vi.mock("@mui/material", () => {
  const Element = (tag: string) =>
    ({ children, ...props }: any) => {
      const Component = tag as any;
      delete props.startIcon;
      delete props.className;
      delete props.color;
      delete props.size;
      delete props.variant;
      delete props.sx;
      delete props.spacing;
      delete props.container;
      delete props.align;
      delete props.fullWidth;
      delete props.maxWidth;
      delete props.multiline;
      delete props.rows;
      delete props.elevation;
      delete props.component;
      return <Component {...props}>{children}</Component>;
    };

  const Button = ({ children, component, ...props }: any) => {
    delete props.startIcon;
    delete props.className;
    delete props.color;
    delete props.size;
    delete props.variant;
    delete props.fullWidth;
    if (component === "span") {
      return <span {...props}>{children}</span>;
    }
    return <button {...props}>{children}</button>;
  };

  return {
    Button,
    Card: Element("div"),
    CardContent: Element("div"),
    Dialog: ({ open, children }: any) => (open ? <div role="dialog">{children}</div> : null),
    DialogTitle: Element("div"),
    DialogContent: Element("div"),
    DialogActions: Element("div"),
    Select: ({ children, label, value, onChange }: any) => (
      <select aria-label={label} value={value} onChange={onChange}>
        {children}
      </select>
    ),
    MenuItem: ({ children, value }: any) => <option value={value}>{children}</option>,
    FormControl: Element("div"),
    InputLabel: Element("label"),
    Grid: Element("div"),
    Chip: ({ label }: any) => <span>{label}</span>,
    Table: Element("table"),
    TableBody: Element("tbody"),
    TableCell: Element("td"),
    TableContainer: Element("div"),
    TableHead: Element("thead"),
    TableRow: Element("tr"),
    Paper: Element("div"),
    IconButton: Element("button"),
    Alert: Element("div"),
    Avatar: Element("div"),
    Typography: Element("p"),
    LinearProgress: Element("span"),
    Tooltip: ({ children }: any) => <>{children}</>,
    Accordion: Element("div"),
    AccordionSummary: Element("div"),
    AccordionDetails: Element("div"),
    TextField: ({ label, value, onChange }: any) => (
      <input aria-label={label} value={value || ""} onChange={onChange} />
    ),
  };
});

vi.mock("../../src/context/Snackbar", () => ({
  useUI: () => ({
    showSnackbar: vi.fn(),
    showSpinner: vi.fn(),
    hideSpinner: vi.fn(),
    showConfirmDialog: ({ onConfirm }: any) => onConfirm(),
  }),
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
      <option value="employee-2">Mira Shah (E-002)</option>
    </select>
  ),
}));

vi.mock("../../src/services/modules/onBoard", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../src/services/modules/onBoard")>();

  return {
    ...actual,
    onBoardService: {
      getChecklists: vi.fn(),
      getAssignments: vi.fn(),
      assignOnboarding: vi.fn(),
      deleteEmployeeOnboarding: vi.fn(),
      getProgress: vi.fn(),
      getEmployeeTasks: vi.fn(),
      getDocuments: vi.fn(),
      createDocument: vi.fn(),
      deleteDocument: vi.fn(),
      sendWelcomeMessage: vi.fn(),
    },
  };
});

const mockedOnboardingService = vi.mocked(onBoardService);

const assignments = [
  {
    id: "assignment-1",
    employeeId: "employee-1",
    employeeName: "Ava Patel",
    checklistName: "HR Documentation",
    checklistId: "checklist-1",
    status: "In Progress",
    progress: 10,
    startDate: "2026-05-19",
    expectedEndDate: "2026-05-30",
  },
];

describe("onboarding screens contract calls", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockedOnboardingService.getChecklists.mockResolvedValue({
      data: [{ id: "checklist-1", name: "HR Documentation", tasks: [] }],
    });
    mockedOnboardingService.getAssignments.mockResolvedValue({
      data: assignments,
    });
    mockedOnboardingService.getProgress.mockResolvedValue({
      data: { overallProgress: 10, tasks: [] },
    });
    mockedOnboardingService.getEmployeeTasks.mockResolvedValue({
      data: [
        {
          id: "task-instance-1",
          templateTaskId: "task-template-1",
          taskName: "Upload ID",
          status: "Pending",
        },
      ],
    });
    mockedOnboardingService.getDocuments.mockResolvedValue({ data: [] });
    mockedOnboardingService.createDocument.mockResolvedValue({ data: {} });
    mockedOnboardingService.sendWelcomeMessage.mockResolvedValue({ data: {} });
  });

  it("send welcome passes employeeId only", async () => {
    const user = userEvent.setup();
    render(<AssignOnboarding />);

    const row = await screen.findByText("Ava Patel");
    await user.click(
      within(row.closest("tr") as HTMLTableRowElement).getByLabelText(
        "Send welcome to Ava Patel",
      ),
    );

    expect(mockedOnboardingService.sendWelcomeMessage).toHaveBeenCalledWith(
      "employee-1",
    );
  });

  it("employee select uses the async combobox selection", async () => {
    const user = userEvent.setup();
    render(<AssignOnboarding />);

    await user.click(screen.getByRole("button", { name: "Assign New Onboarding" }));
    await user.selectOptions(
      await screen.findByRole("combobox", { name: "Select Employee" }),
      "employee-2",
    );

    expect(await screen.findByRole("option", { name: "Mira Shah (E-002)" })).toBeInTheDocument();
  });

  it("employee select still renders when assignments lookup fails", async () => {
    mockedOnboardingService.getAssignments.mockRejectedValue(
      new Error("Onboarding assignments endpoint unavailable"),
    );
    const user = userEvent.setup();
    render(<AssignOnboarding />);

    await user.click(screen.getByRole("button", { name: "Assign New Onboarding" }));
    await user.selectOptions(
      await screen.findByRole("combobox", { name: "Select Employee" }),
      "employee-1",
    );

    expect(await screen.findByRole("option", { name: "Ava Patel (E-001)" })).toBeInTheDocument();
  });

  it("assignment list loads through the assignments service and deactivates by onboarding id", async () => {
    mockedOnboardingService.deleteEmployeeOnboarding.mockResolvedValue({ data: {} });
    const user = userEvent.setup();
    render(<AssignOnboarding />);

    const row = await screen.findByText("Ava Patel");
    await user.click(
      within(row.closest("tr") as HTMLTableRowElement).getByLabelText(
        "Deactivate assignment for Ava Patel",
      ),
    );

    expect(mockedOnboardingService.getAssignments).toHaveBeenCalledWith({ size: 100 });
    expect(mockedOnboardingService.deleteEmployeeOnboarding).toHaveBeenCalledWith(
      "assignment-1",
    );
  });

  it("assignment details request progress with employeeId", async () => {
    const user = userEvent.setup();
    render(<AssignOnboarding />);

    const row = await screen.findByText("Ava Patel");
    await user.click(
      within(row.closest("tr") as HTMLTableRowElement).getByLabelText(
        "View progress for Ava Patel",
      ),
    );

    expect(mockedOnboardingService.getProgress).toHaveBeenCalledWith(
      "employee-1",
    );
    expect(mockedOnboardingService.getProgress).not.toHaveBeenCalledWith(
      "assignment-1",
    );
  });

  it("progress tracking requests progress with employeeId", async () => {
    const user = userEvent.setup();
    render(<ProgressTracking />);

    await user.click(await screen.findByRole("button", { name: /view details/i }));

    expect(mockedOnboardingService.getProgress).toHaveBeenCalledWith(
      "employee-1",
    );
    expect(mockedOnboardingService.getProgress).not.toHaveBeenCalledWith(
      "assignment-1",
    );
  });

  it("missing employeeId does not request progress with assignment id", async () => {
    mockedOnboardingService.getAssignments.mockResolvedValue({
      data: [{ ...assignments[0], employeeId: undefined }],
    });
    const user = userEvent.setup();
    render(<ProgressTracking />);

    await user.click(await screen.findByRole("button", { name: /view details/i }));

    await waitFor(() => {
      expect(mockedOnboardingService.getProgress).not.toHaveBeenCalled();
    });
  });

  it("document upload uses the assigned task instance id", async () => {
    const user = userEvent.setup();
    render(<DocumentsUpload />);

    await user.selectOptions(
      await screen.findByRole("combobox", { name: "Select Employee" }),
      "employee-1",
    );
    await user.click(await screen.findByText("HR Documentation"));
    await user.click(await screen.findByRole("button", { name: /upload first document/i }));

    const dialog = await screen.findByRole("dialog");
    const [taskSelect, documentTypeSelect] = within(dialog).getAllByRole("combobox");
    await user.selectOptions(taskSelect, "task-instance-1");
    await user.selectOptions(documentTypeSelect, "ID Proof");
    await user.upload(
      screen.getByLabelText(/choose file/i),
      new File(["hello"], "hello.pdf", { type: "application/pdf" }),
    );
    await user.click(screen.getByRole("button", { name: "Upload" }));

    await waitFor(() => {
      expect(mockedOnboardingService.createDocument).toHaveBeenCalledWith({
        file: expect.any(File),
        taskInstanceId: "task-instance-1",
        employeeId: "employee-1",
        notes: "",
      });
    });
  });
});
