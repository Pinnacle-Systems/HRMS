import "@testing-library/jest-dom/vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ApprovalWorkflowConfig from "../../../src/pages/settings/general/approvalWorkflow";
import {
  APPROVAL_ACTIONS,
  APPROVAL_MODULES,
  type ApprovalRequest,
  type ApprovalSettings,
} from "../../../src/services/modules/approvalWorkflow";
import { renderWithProviders } from "../../helpers/render";

const { getSettings, updateSettings, getPendingRequests, decideRequest } = vi.hoisted(
  () => ({
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
    getPendingRequests: vi.fn(),
    decideRequest: vi.fn(),
  }),
);

vi.mock("../../../src/services/modules/approvalWorkflow", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("../../../src/services/modules/approvalWorkflow")>();
  return {
    ...original,
    approvalWorkflowService: {
      getSettings,
      updateSettings,
      getPendingRequests,
      decideRequest,
    },
  };
});

const makeSettings = (): ApprovalSettings => ({
  enabled: false,
  workflows: APPROVAL_MODULES.flatMap(({ id: module }) =>
    APPROVAL_ACTIONS.map(({ id: action }) => ({
      id: `${module}:${action}`,
      workflowName: `${module} ${action}`,
      module,
      action,
      priorityWeight: 1,
      approvalRequired: false,
      status: true,
      levels:
        module === "employees" && action === "DELETE"
          ? [
              {
                id: "level-1",
                levelTitle: "Level 1 Approval",
                condition: "ANY",
                approvers: ["admin"],
              },
            ]
          : [],
    })),
  ),
});

const mockRequest: ApprovalRequest = {
  id: "request-1",
  module: "employees",
  action: "DELETE",
  summary: "Delete employee E-102",
  entityType: "Employee",
  entityId: "E-102",
  status: "PENDING",
  requestedBy: { id: "hr-1", name: "HR User" },
  requestedAt: "2026-10-06T09:00:00Z",
};

describe("ApprovalWorkflowConfig", () => {
  beforeEach(() => {
    getSettings.mockReset().mockResolvedValue(makeSettings());
    updateSettings
      .mockReset()
      .mockImplementation((settings) => Promise.resolve(settings));
    getPendingRequests.mockReset().mockResolvedValue([mockRequest]);
    decideRequest.mockReset().mockResolvedValue({
      request: { ...mockRequest, status: "APPROVED" },
      changeApplied: true,
      message: "Request approved and the change was applied.",
    });
  });

  it("edits and saves a per-form workflow with approval levels", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ApprovalWorkflowConfig />);

    await screen.findByRole("combobox", { name: /form \/ action/i });
    await user.click(screen.getByRole("combobox", { name: /form \/ action/i }));
    await user.click(screen.getByRole("option", { name: "Employees — Delete" }));
    await user.click(
      screen.getByRole("checkbox", {
        name: /approval required for all matching actions/i,
      }),
    );
    await user.click(screen.getByRole("button", { name: /save configuration/i }));

    await waitFor(() => expect(updateSettings).toHaveBeenCalledTimes(1));
    const saved = updateSettings.mock.calls[0][0] as ApprovalSettings;
    expect(saved.enabled).toBe(false);
    expect(saved.workflows.find(({ id }) => id === "employees:DELETE")).toMatchObject({
      approvalRequired: true,
      levels: [
        expect.objectContaining({
          levelTitle: "Level 1 Approval",
          condition: "ANY",
          approvers: ["admin"],
        }),
      ],
    });
  });

  it("allows an administrator to approve a pending request", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ApprovalWorkflowConfig />);

    await screen.findByRole("tab", { name: /workflow configuration/i });
    await user.click(screen.getByRole("tab", { name: /pending approvals/i }));
    const requestRow = await screen.findByText("Delete employee E-102").then((cell) =>
      cell.closest("tr"),
    );
    expect(requestRow).not.toBeNull();
    await user.click(
      within(requestRow as HTMLTableRowElement).getByRole("button", {
        name: /approve/i,
      }),
    );
    await user.click(screen.getByRole("button", { name: /^approve$/i }));

    await waitFor(() => {
      expect(decideRequest).toHaveBeenCalledWith("request-1", {
        decision: "APPROVE",
      });
    });
  });
});
