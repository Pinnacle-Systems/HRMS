import { describe, expect, it } from "vitest";
import {
  calculateCompOffExpiryDate,
  canRequestCancellation,
  canWithdrawLeave,
  DEFAULT_COMP_OFF_VALIDITY_DAYS,
  formatDateForApi,
  getTeamOverlap,
  isUpcomingApprovedLeave,
  requiresLeaveAttachment,
} from "../../src/pages/leave/leaveRules";

describe("leaveRules", () => {
  it("allows withdrawal only for pending leave", () => {
    expect(canWithdrawLeave({ status: "PENDING" })).toBe(true);
    expect(canWithdrawLeave({ status: "APPROVED" })).toBe(false);
    expect(canWithdrawLeave(null)).toBe(false);
  });

  it("allows cancellation only for approved future or same-day leave", () => {
    const today = new Date("2026-05-18T12:00:00");

    expect(
      canRequestCancellation(
        { status: "APPROVED", fromDate: "2026-05-18" },
        today,
      ),
    ).toBe(true);
    expect(
      canRequestCancellation(
        { status: "APPROVED", fromDate: "2026-05-19" },
        today,
      ),
    ).toBe(true);
    expect(
      canRequestCancellation(
        { status: "APPROVED", fromDate: "2026-05-17" },
        today,
      ),
    ).toBe(false);
    expect(
      canRequestCancellation(
        { status: "PENDING", fromDate: "2026-05-19" },
        today,
      ),
    ).toBe(false);
  });

  it("uses the same rule for upcoming approved leave", () => {
    expect(
      isUpcomingApprovedLeave(
        { status: "APPROVED", fromDate: "2026-05-19" },
        new Date("2026-05-18T08:00:00"),
      ),
    ).toBe(true);
  });

  it("preserves existing sick leave attachment behavior", () => {
    expect(
      requiresLeaveAttachment({
        leaveTypeCode: "SL",
        totalDays: 4,
        requiresDocumentAfterDays: 3,
      }),
    ).toBe(true);
    expect(
      requiresLeaveAttachment({
        leaveTypeCode: "SL",
        totalDays: 3,
        requiresDocumentAfterDays: 3,
      }),
    ).toBe(false);
    expect(
      requiresLeaveAttachment({
        leaveTypeCode: "SICK",
        leaveTypeName: "Sick Leave",
        totalDays: 4,
        requiresDocumentAfterDays: 3,
      }),
    ).toBe(false);
  });

  it("calculates comp-off expiry with a 90 day default and handles year rollover", () => {
    const expiryDate = calculateCompOffExpiryDate("2026-11-15");

    expect(DEFAULT_COMP_OFF_VALIDITY_DAYS).toBe(90);
    expect(formatDateForApi(expiryDate)).toBe("2027-02-13");
  });

  it("calculates comp-off expiry with a custom validity", () => {
    expect(formatDateForApi(calculateCompOffExpiryDate("2026-01-31", 1))).toBe(
      "2026-02-01",
    );
  });

  it("detects overlapping team leave and excludes same, rejected, and cancelled requests", () => {
    const request = {
      id: "lv-1",
      status: "PENDING",
      fromDate: "2026-05-10",
      toDate: "2026-05-12",
    };
    const teamRequests = [
      {
        id: "lv-1",
        status: "APPROVED",
        fromDate: "2026-05-10",
        toDate: "2026-05-12",
      },
      {
        id: "lv-2",
        status: "APPROVED",
        fromDate: "2026-05-12",
        toDate: "2026-05-14",
      },
      {
        id: "lv-3",
        status: "PENDING",
        fromDate: "2026-05-01",
        toDate: "2026-05-09",
      },
      {
        id: "lv-4",
        status: "REJECTED",
        fromDate: "2026-05-11",
        toDate: "2026-05-13",
      },
      {
        id: "lv-5",
        status: "CANCELLED",
        fromDate: "2026-05-11",
        toDate: "2026-05-13",
      },
    ];

    expect(getTeamOverlap(request, teamRequests).map((item) => item.id)).toEqual([
      "lv-2",
    ]);
  });
});
