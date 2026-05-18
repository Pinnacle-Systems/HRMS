import { describe, expect, it } from "vitest";
import { getLeaveStatusMeta } from "../../src/pages/leave/leaveStatusMeta";

describe("getLeaveStatusMeta", () => {
  it("keeps withdrawn and cancellation requested as distinct labels", () => {
    expect(getLeaveStatusMeta("WITHDRAWN").label).toBe("Withdrawn");
    expect(getLeaveStatusMeta("CANCEL_REQUESTED").label).toBe(
      "Cancellation Requested",
    );
    expect(getLeaveStatusMeta("CANCELLED").label).toBe("Cancelled");
  });

  it("formats unknown statuses as a safe fallback", () => {
    expect(getLeaveStatusMeta("WAITING_FOR_FINANCE").label).toBe(
      "Waiting For Finance",
    );
  });
});
