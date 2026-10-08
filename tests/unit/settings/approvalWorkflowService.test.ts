import { describe, expect, it } from "vitest";
import {
  APPROVAL_ACTIONS,
  APPROVAL_MODULES,
  approvalWorkflowService,
  USE_MOCK_APPROVAL_WORKFLOW,
  type ApprovalSettings,
} from "../../../src/services/modules/approvalWorkflow";

const createSettings = (): ApprovalSettings => ({
  enabled: true,
  workflows: APPROVAL_MODULES.flatMap(({ id: module }) =>
    APPROVAL_ACTIONS.map(({ id: action }) => ({
      id: `${module}:${action}`,
      workflowName: `${module} ${action} approval`,
      module,
      action,
      priorityWeight: 1,
      approvalRequired: module === "employees" && action === "DELETE",
      status: true,
      levels:
        module === "employees" && action === "DELETE"
          ? [
              {
                id: "level-1",
                levelTitle: "Level 1 Approval",
                condition: "ANY" as const,
                approvers: ["admin"],
              },
            ]
          : [],
    })),
  ),
});

describe.runIf(USE_MOCK_APPROVAL_WORKFLOW)("approval workflow demo data", () => {
  it("loads seeded workflows and pending requests", async () => {
    const settings = await approvalWorkflowService.getSettings();
    const requests = await approvalWorkflowService.getPendingRequests();

    expect(settings.workflows).toHaveLength(
      APPROVAL_MODULES.length * APPROVAL_ACTIONS.length,
    );
    expect(
      settings.workflows.find(({ id }) => id === "employees:DELETE"),
    ).toMatchObject({ approvalRequired: true, status: true });
    expect(requests.length).toBeGreaterThanOrEqual(1);
    expect(requests[0]).toMatchObject({
      module: expect.any(String),
      action: expect.any(String),
      status: "PENDING",
    });
  });

  it("saves workflow levels and removes an approved request from pending", async () => {
    const settings = createSettings();
    await approvalWorkflowService.updateSettings(settings);
    const [request] = await approvalWorkflowService.getPendingRequests();

    const result = await approvalWorkflowService.decideRequest(request.id, {
      decision: "APPROVE",
      comments: "Confirmed by admin.",
    });

    expect(result).toMatchObject({
      request: { id: request.id, status: "APPROVED" },
      changeApplied: true,
    });
    expect(
      (await approvalWorkflowService.getPendingRequests()).map(({ id }) => id),
    ).not.toContain(request.id);
    expect((await approvalWorkflowService.getSettings()).workflows).toEqual(
      settings.workflows,
    );
  });
});
