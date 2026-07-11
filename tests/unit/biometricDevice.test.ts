import { beforeEach, describe, expect, it, vi } from "vitest";

const { postMock, getMock, putMock } = vi.hoisted(() => ({
  postMock: vi.fn(),
  getMock: vi.fn(),
  putMock: vi.fn(),
}));

vi.mock("../../src/services/api/api.config", () => ({
  apiService: {
    post: postMock,
    get: getMock,
    put: putMock,
  },
}));

import { biometricService } from "../../src/services/modules/biometricDevice";

describe("biometricService", () => {
  beforeEach(() => {
    postMock.mockReset();
    getMock.mockReset();
    putMock.mockReset();
  });

  it("returns the inner payload for webhook processing when the API returns a direct object", async () => {
    postMock.mockResolvedValueOnce({
      accepted: true,
      employeeId: "emp-1",
      status: "checked_in",
    });

    const result = await biometricService.processWebhookPunch({
      deviceSerial: "DEV-1",
      employeeCode: "EMP-001",
      punchTime: "2026-07-10T07:45:39.139Z",
      punchType: "check_in",
      verificationMode: "fingerprint",
    });

    expect(postMock).toHaveBeenCalledWith(
      "/integration/biometric/webhook",
      {
        deviceSerial: "DEV-1",
        employeeCode: "EMP-001",
        punchTime: "2026-07-10T07:45:39.139Z",
        punchType: "check_in",
        verificationMode: "fingerprint",
      },
    );
    expect(result).toEqual({
      accepted: true,
      employeeId: "emp-1",
      status: "checked_in",
    });
  });

  it("returns the mapped employee payload when the API returns a direct object", async () => {
    postMock.mockResolvedValueOnce({
      isActive: true,
      id: "map-1",
      deviceId: "device-1",
      deviceEmployeeCode: "EMP-001",
      hrmsEmployeeId: "emp-1",
      employeeName: "Asha",
      employeeCode: "EMP-001",
    });

    const result = await biometricService.mapEmployeeToDevice({
      deviceId: "device-1",
      deviceEmployeeCode: "EMP-001",
      hrmsEmployeeId: "emp-1",
      isActive: true,
    });

    expect(postMock).toHaveBeenCalledWith(
      "/integration/biometric/map",
      {
        deviceId: "device-1",
        deviceEmployeeCode: "EMP-001",
        hrmsEmployeeId: "emp-1",
        isActive: true,
      },
    );
    expect(result).toEqual({
      isActive: true,
      id: "map-1",
      deviceId: "device-1",
      deviceEmployeeCode: "EMP-001",
      hrmsEmployeeId: "emp-1",
      employeeName: "Asha",
      employeeCode: "EMP-001",
    });
  });
});
