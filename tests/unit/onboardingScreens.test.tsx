import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../helpers/render";
import { AssignOnboarding } from "../../src/pages/settings/employee/onBoardingProcess/assignOnBoarding";
import { ProgressTracking } from "../../src/pages/settings/employee/onBoardingProcess/progressTracking";
import { onBoardService } from "../../src/services/modules/onBoard";

vi.mock("../../src/services/modules/onBoard", () => ({
  onBoardService: {
    getChecklists: vi.fn(),
    getEmployeeOnboardings: vi.fn(),
    assignOnboarding: vi.fn(),
    deleteEmployeeOnboarding: vi.fn(),
    getProgress: vi.fn(),
    sendWelcomeMessage: vi.fn(),
  },
}));

vi.mock("../../src/services/modules/employees", () => ({
  employeeService: {
    getEmployees: vi.fn(),
  },
}));

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
    mockedOnboardingService.getEmployeeOnboardings.mockResolvedValue({
      data: assignments,
    });
    mockedOnboardingService.getProgress.mockResolvedValue({
      data: { overallProgress: 10, tasks: [] },
    });
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
    mockedOnboardingService.getEmployeeOnboardings.mockResolvedValue({
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
});
