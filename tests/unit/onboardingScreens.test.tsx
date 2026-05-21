import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../helpers/render";
import { AssignOnboarding } from "../../src/pages/settings/employee/onBoardingProcess/assignOnBoarding";
import { DocumentsUpload } from "../../src/pages/settings/employee/onBoardingProcess/documentUpload";
import { ProgressTracking } from "../../src/pages/settings/employee/onBoardingProcess/progressTracking";
import { onBoardService } from "../../src/services/modules/onBoard";

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

vi.mock("../../src/services/modules/employees", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../src/services/modules/employees")>();

  return {
    ...actual,
    employeeService: {
      getEmployees: vi.fn(),
    },
  };
});

const mockedOnboardingService = vi.mocked(onBoardService);

const assignments = [
  {
    id: "assignment-1",
    employeeId: "employee-1",
    employeeName: "Ava Patel",
    checklistName: "Engineering onboarding",
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
      data: [{ id: "checklist-1", name: "Engineering onboarding", tasks: [] }],
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

    const { employeeService } = await import(
      "../../src/services/modules/employees"
    );
    vi.mocked(employeeService.getEmployees).mockResolvedValue({
      data: [{ id: "employee-1", name: "Ava Patel", employeeId: "E-001" }],
    });
  });

  it("send welcome passes employeeId only", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AssignOnboarding />);

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

  it("employee select renders employees from a non-paginated firstName/lastName response", async () => {
    const { employeeService } = await import(
      "../../src/services/modules/employees"
    );
    vi.mocked(employeeService.getEmployees).mockResolvedValue({
      data: [
        {
          id: "employee-2",
          employeeId: "E-002",
          firstName: "Mira",
          lastName: "Shah",
        },
      ],
    });
    const user = userEvent.setup();
    renderWithProviders(<AssignOnboarding />);

    await user.click(screen.getByRole("button", { name: "Assign New Onboarding" }));
    await user.click(await screen.findByRole("combobox", { name: "Select Employee" }));

    expect(await screen.findByRole("option", { name: "Mira Shah (E-002)" })).toBeInTheDocument();
  });

  it("employee select still renders when assignments lookup fails", async () => {
    mockedOnboardingService.getAssignments.mockRejectedValue(
      new Error("Onboarding assignments endpoint unavailable"),
    );
    const user = userEvent.setup();
    renderWithProviders(<AssignOnboarding />);

    await user.click(screen.getByRole("button", { name: "Assign New Onboarding" }));
    await user.click(await screen.findByRole("combobox", { name: "Select Employee" }));

    expect(await screen.findByRole("option", { name: "Ava Patel (E-001)" })).toBeInTheDocument();
  });

  it("assignment list loads through the assignments service and deactivates by onboarding id", async () => {
    mockedOnboardingService.deleteEmployeeOnboarding.mockResolvedValue({ data: {} });
    const user = userEvent.setup();
    renderWithProviders(<AssignOnboarding />);

    const row = await screen.findByText("Ava Patel");
    await user.click(
      within(row.closest("tr") as HTMLTableRowElement).getByLabelText(
        "Deactivate assignment for Ava Patel",
      ),
    );
    await user.click(await screen.findByRole("button", { name: "Deactivate" }));

    expect(mockedOnboardingService.getAssignments).toHaveBeenCalledWith({ size: 100 });
    expect(mockedOnboardingService.deleteEmployeeOnboarding).toHaveBeenCalledWith(
      "assignment-1",
    );
  });

  it("assignment details request progress with employeeId", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AssignOnboarding />);

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
    renderWithProviders(<ProgressTracking />);

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
    renderWithProviders(<ProgressTracking />);

    await user.click(await screen.findByRole("button", { name: /view details/i }));

    await waitFor(() => {
      expect(mockedOnboardingService.getProgress).not.toHaveBeenCalled();
    });
    expect(
      await screen.findByText("Cannot load progress: employee id is missing."),
    ).toBeInTheDocument();
  });

  it("document upload uses the assigned task instance id", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DocumentsUpload />);

    await user.click(await screen.findByText("Ava Patel"));
    await user.click(await screen.findByText("Engineering onboarding"));
    await user.click(await screen.findByRole("button", { name: /upload first document/i }));

    const dialog = await screen.findByRole("dialog");
    const [taskSelect, documentTypeSelect] = within(dialog).getAllByRole("combobox");
    await user.click(taskSelect);
    await user.click(await screen.findByRole("option", { name: /Upload ID/ }));
    await user.click(documentTypeSelect);
    await user.click(await screen.findByRole("option", { name: /ID Proof/ }));
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
