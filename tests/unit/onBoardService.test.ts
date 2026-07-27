import { beforeEach, describe, expect, it, vi } from "vitest";

const apiPost = vi.fn();
const apiPut = vi.fn();
const apiGet = vi.fn();
const apiPatch = vi.fn();
const apiDelete = vi.fn();

vi.mock("../../src/services/api/api.config", () => ({
  apiService: {
    get: apiGet,
    post: apiPost,
    put: apiPut,
    patch: apiPatch,
    delete: apiDelete,
  },
}));

describe("onBoardService Swagger payload adapters", () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiPost.mockReset();
    apiPut.mockReset();
    apiPatch.mockReset();
    apiDelete.mockReset();
  });

  it("assignOnboarding sends checklistIds and does not send legacy startDate", async () => {
    const { onBoardService } = await import("../../src/services/modules/onBoard");
    apiPost.mockResolvedValue({ data: {} });

    await onBoardService.assignOnboarding({
      employeeId: "employee-1",
      checklistId: "checklist-1",
      startDate: "2026-05-19",
      notes: "Bring ID",
    });

    expect(apiPost).toHaveBeenCalledWith("/onboarding/assign", {
      employeeId: "employee-1",
      checklistIds: ["checklist-1"],
      notes: "Bring ID",
    });
  });

  it("sendWelcomeMessage sends employeeIds array only", async () => {
    const { onBoardService } = await import("../../src/services/modules/onBoard");
    apiPost.mockResolvedValue({ data: {} });

    await onBoardService.sendWelcomeMessage({employeeIds: ["employee-1"]});

    expect(apiPost).toHaveBeenCalledWith("/onboarding/send-welcome", {
      employeeIds: ["employee-1"],
    });
    expect(JSON.stringify(apiPost.mock.calls)).not.toContain("onboardingId");
  });

  it("getProgress uses employeeId in the progress URL", async () => {
    const { onBoardService } = await import("../../src/services/modules/onBoard");
    apiGet.mockResolvedValue({ data: {} });

    await onBoardService.getProgress("employee-1");

    expect(apiGet).toHaveBeenCalledWith("/onboarding/progress/employee-1");
  });

  it("getAssignments uses the Swagger assignments endpoint", async () => {
    const { onBoardService } = await import("../../src/services/modules/onBoard");
    apiGet.mockResolvedValue({ data: { content: [] } });

    await onBoardService.getAssignments({ page: 0, size: 20, status: "In Progress" });

    expect(apiGet).toHaveBeenCalledWith("/onboarding/assignments", {
      params: { page: 0, size: 20, status: "In Progress" },
    });
  });

  it("getEmployeeTasks uses onboardingId and checklistId in the assigned task path", async () => {
    const { onBoardService } = await import("../../src/services/modules/onBoard");
    apiGet.mockResolvedValue({ data: { tasks: [] } });

    await onBoardService.getEmployeeTasks("onboarding-1", "checklist-1");

    expect(apiGet).toHaveBeenCalledWith(
      "/onboarding/onboarding-1/checklist/checklist-1/tasks",
    );
  });

  it("getDocuments uses onboardingId in the document list path", async () => {
    const { onBoardService } = await import("../../src/services/modules/onBoard");
    apiGet.mockResolvedValue({ data: { content: [] } });

    await onBoardService.getDocuments("onboarding-1");

    expect(apiGet).toHaveBeenCalledWith("/onboarding/onboarding-1/documents");
  });

  it("uploads documents with taskInstanceId and employeeId query params", async () => {
    const { onBoardService } = await import("../../src/services/modules/onBoard");
    const file = new File(["hello"], "hello.pdf", { type: "application/pdf" });
    apiPost.mockResolvedValue({ data: {} });

    await onBoardService.createDocument({
      file,
      taskInstanceId: "task-instance-1",
      employeeId: "employee-1",
      notes: "Signed",
    });

    expect(apiPost).toHaveBeenCalledWith(
      "/onboarding/documents",
      expect.any(FormData),
      expect.objectContaining({
        params: {
          taskInstanceId: "task-instance-1",
          employeeId: "employee-1",
          notes: "Signed",
        },
      }),
    );
  });

  it("rejects document upload without taskInstanceId or employeeId", async () => {
    const { onBoardService } = await import("../../src/services/modules/onBoard");
    const file = new File(["hello"], "hello.pdf", { type: "application/pdf" });

    await expect(
      onBoardService.createDocument({
        file,
        taskInstanceId: "",
        employeeId: "employee-1",
      }),
    ).rejects.toThrow("taskInstanceId is required");

    await expect(
      onBoardService.createDocument({
        file,
        taskInstanceId: "task-instance-1",
        employeeId: "",
      }),
    ).rejects.toThrow("employeeId is required");
  });

  it("deletes documents by taskInstanceId", async () => {
    const { onBoardService } = await import("../../src/services/modules/onBoard");
    apiDelete.mockResolvedValue({ data: {} });

    await onBoardService.deleteDocument("task-instance-1");

    expect(apiDelete).toHaveBeenCalledWith(
      "/onboarding/documents/task-instance-1",
    );
  });

  it("deactivates and reactivates onboarding assignments by onboarding id", async () => {
    const { onBoardService } = await import("../../src/services/modules/onBoard");
    apiDelete.mockResolvedValue({ data: {} });
    apiPatch.mockResolvedValue({ data: {} });

    await onBoardService.deleteEmployeeOnboarding("onboarding-1");
    await onBoardService.reactivateOnboarding("onboarding-1");

    expect(apiDelete).toHaveBeenCalledWith("/onboarding/onboarding-1");
    expect(apiPatch).toHaveBeenCalledWith(
      "/onboarding/onboarding-1/reactivate",
    );
  });

  it("maps checklist task form fields to Swagger task payload fields and task type enum", async () => {
    const { onBoardService } = await import("../../src/services/modules/onBoard");
    apiPost.mockResolvedValue({ data: {} });

    await onBoardService.createTask(
      "checklist-1",
      {
        taskName: "Upload tax form",
        description: "Collect tax declaration",
        documentName: "W-4",
        taskType: "DOCUMENT",
      },
      2,
    );

    expect(apiPost).toHaveBeenCalledWith(
      "/onboarding/checklist/checklist-1/tasks",
      {
        title: "Upload tax form",
        description: "Collect tax declaration",
        documentName: "W-4",
        taskType: "DOCUMENT",
        sortOrder: 2,
        required: true,
      },
    );
  });

  it("falls back invalid checklist task types to CUSTOM", async () => {
    const { onBoardService } = await import("../../src/services/modules/onBoard");
    apiPost.mockResolvedValue({ data: {} });

    await onBoardService.createTask(
      "checklist-1",
      {
        taskName: "Custom step",
        taskType: "GENERAL" as any,
      },
      1,
    );

    expect(apiPost).toHaveBeenCalledWith(
      "/onboarding/checklist/checklist-1/tasks",
      expect.objectContaining({ taskType: "CUSTOM" }),
    );
  });

  it("completeTask and reorderTasks use the Swagger patch endpoints", async () => {
    const { onBoardService } = await import("../../src/services/modules/onBoard");
    apiPatch.mockResolvedValue({ data: {} });

    await onBoardService.completeTask("task-instance-1");
    // await onBoardService.reorderTasks("checklist-1", {
    //   taskIds: ["task-template-1", "task-template-2"],
    // });
    await onBoardService.reorderTasks("checklist-1", [
      { taskId: "task-template-1", sortOrder: 0 },
      { taskId: "task-template-2", sortOrder: 1 },
    ]);

    expect(apiPatch).toHaveBeenCalledWith(
      "/onboarding/task/task-instance-1/complete",
      undefined,
    );
    expect(apiPatch).toHaveBeenCalledWith(
      "/onboarding/checklist/checklist-1/tasks/reorder",
      { taskIds: ["task-template-1", "task-template-2"] },
    );
  });
});
