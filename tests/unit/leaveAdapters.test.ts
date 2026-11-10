import { describe, expect, it } from "vitest";
import { mapLeaveTypeResponseToViewModel } from "../../src/services/modules/leaveAdapters";

describe("mapLeaveTypeResponseToViewModel", () => {
  it("preserves half-day and related policy values from the API", () => {
    const leaveType = mapLeaveTypeResponseToViewModel({
      id: "leave-type-1",
      code: "CL",
      name: "Casual Leave",
      description: "",
      paid: true,
      active: true,
      allowHalfDay: true,
      allowNegativeBalance: true,
      encashable: true,
      payrollTreatment: "PAID",
      requiresAttachment: true,
      requiresHrVerification: true,
    });

    expect(leaveType).toMatchObject({
      allowHalfDay: true,
      allowNegativeBalance: true,
      encashable: true,
      payrollTreatment: "PAID",
      requiresAttachment: true,
      requiresHrVerification: true,
    });
  });

  it("keeps half-day disabled when the API policy disallows it", () => {
    const leaveType = mapLeaveTypeResponseToViewModel({
      id: "leave-type-2",
      code: "EL",
      name: "Earned Leave",
      description: "",
      paid: true,
      active: true,
      allowHalfDay: false,
      allowNegativeBalance: false,
      encashable: false,
      payrollTreatment: "PAID",
      requiresAttachment: false,
      requiresHrVerification: false,
    });

    expect(leaveType.allowHalfDay).toBe(false);
  });
});
