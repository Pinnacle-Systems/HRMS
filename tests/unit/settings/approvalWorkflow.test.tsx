import "@testing-library/jest-dom/vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ApprovalWorkflowHome from "../../../src/pages/settings/general/approvalWorkflow/approvalWorkflowHome";
import { renderWithProviders } from "../../helpers/render";

const getModules = vi.fn();
const getOperators = vi.fn();
const getPendingApprovalsForMe = vi.fn();
const getEmployees = vi.fn();

vi.mock("../../../src/services/modules/approvalWorkflow", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../src/services/modules/approvalWorkflow")>();

  return {
    ...actual,
    approvalWorkflowService: {
      ...actual.approvalWorkflowService,
      getModules,
      getOperators,
      getFields: vi.fn(),
      getConfigurations: vi.fn(),
      getPendingApprovalsForMe,
      getApprovalRequestById: vi.fn(),
    },
  };
});

vi.mock("../../../src/services/modules/employees", () => ({
  employeeService: {
    getEmployees,
  },
}));

describe("ApprovalWorkflowHome", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getModules.mockResolvedValue({
      data: { content: [] },
    });
    getOperators.mockResolvedValue({
      data: [],
    });
    getPendingApprovalsForMe.mockResolvedValue({
      data: [],
    });
    getEmployees.mockResolvedValue({
      data: { content: [] },
    });
  });

  it("renders the workflow administration tabs", async () => {
    renderWithProviders(<ApprovalWorkflowHome />);

    expect(await screen.findByRole("tab", { name: /configurations/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /modules/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /operators/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /pending approvals/i })).toBeInTheDocument();
  });

  it("loads the initial module and operator data on mount", async () => {
    renderWithProviders(<ApprovalWorkflowHome />);

    await waitFor(() => {
      expect(getModules).toHaveBeenCalledWith({ size: 100 });
      expect(getOperators).toHaveBeenCalledWith({ activeOnly: true });
      expect(getEmployees).toHaveBeenCalledWith({
        size: 500,
        includeInactive: true,
      });
    });
  });

  it("switches to the pending approvals tab when selected", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ApprovalWorkflowHome />);

    await user.click(screen.getByRole("tab", { name: /pending approvals/i }));

    await waitFor(() => {
      expect(getPendingApprovalsForMe).toHaveBeenCalledTimes(1);
    });
  });
});
