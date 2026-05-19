import { beforeEach, describe, expect, it, vi } from "vitest";

const apiPost = vi.fn();
const apiPut = vi.fn();
const apiGet = vi.fn();

vi.mock("../../src/services/api/api.config", () => ({
  apiService: {
    get: apiGet,
    post: apiPost,
    put: apiPut,
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("onBoardService Swagger payload adapters", () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiPost.mockReset();
    apiPut.mockReset();
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

    await onBoardService.sendWelcomeMessage("employee-1");

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

  it("maps checklist task form fields to Swagger task payload fields", async () => {
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
});
