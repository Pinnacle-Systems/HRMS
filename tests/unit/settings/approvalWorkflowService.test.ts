import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiService } from "../../../src/services/api/api.config";
import { approvalWorkflowService } from "../../../src/services/modules/approvalWorkflow";

describe("approvalWorkflowService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches workflow modules with pagination parameters", async () => {
    const getSpy = vi.spyOn(apiService, "get").mockResolvedValue({
      success: true,
      message: "ok",
      data: { content: [] },
    } as any);

    await approvalWorkflowService.getModules({
      search: "employee",
      active: true,
      page: 1,
      size: 25,
    });

    expect(getSpy).toHaveBeenCalledWith("/approval/modules", {
      params: {
        search: "employee",
        active: true,
        page: 1,
        size: 25,
      },
    });
  });

  it("creates a configuration using the approval workflow endpoint", async () => {
    const payload = {
      workflowName: "Employee change approval",
      moduleId: "employees",
      priorityWeight: 1,
      noRulesRequired: false,
      active: true,
      rules: [
        {
          fieldId: "employeeId",
          operatorId: "eq",
          valueType: "static" as const,
          value: "123",
        },
      ],
      levels: [
        {
          levelTitle: "Manager review",
          approvalCondition: "any" as const,
          approverType: "user" as const,
          approverEmployeeIds: ["emp-1"],
          approverRoles: [],
        },
      ],
    };

    const postSpy = vi.spyOn(apiService, "post").mockResolvedValue({
      success: true,
      message: "created",
      data: { id: "config-1" },
    } as any);

    await approvalWorkflowService.createConfiguration(payload);

    expect(postSpy).toHaveBeenCalledWith("/approval/configurations", payload);
  });

  it("loads pending approvals for the current user", async () => {
    const getSpy = vi.spyOn(apiService, "get").mockResolvedValue({
      success: true,
      message: "ok",
      data: [],
    } as any);

    await approvalWorkflowService.getPendingApprovalsForMe({
      userId: "u-1",
      active: true,
    });

    expect(getSpy).toHaveBeenCalledWith("/approval/requests/pending-for-me", {
      params: {
        userId: "u-1",
        active: true,
      },
    });
  });
});
