import { describe, expect, it } from "vitest";
import { getCompOffStatusMeta } from "../../src/pages/leave/compOffStatusMeta";

describe("getCompOffStatusMeta", () => {
  it("returns correct label and tone for AVAILABLE", () => {
    const meta = getCompOffStatusMeta("AVAILABLE");
    expect(meta.label).toBe("Available");
    expect(meta.tone).toBe("success");
  });

  it("returns correct label and tone for AVAILED", () => {
    const meta = getCompOffStatusMeta("AVAILED");
    expect(meta.label).toBe("Availed");
    expect(meta.tone).toBe("info");
  });

  it("returns correct label and tone for EXPIRED", () => {
    const meta = getCompOffStatusMeta("EXPIRED");
    expect(meta.label).toBe("Expired");
    expect(meta.tone).toBe("neutral");
  });

  it("returns correct label and tone for PENDING", () => {
    const meta = getCompOffStatusMeta("PENDING");
    expect(meta.label).toBe("Pending");
    expect(meta.tone).toBe("info");
  });

  it("returns correct label and tone for APPROVED", () => {
    const meta = getCompOffStatusMeta("APPROVED");
    expect(meta.label).toBe("Approved");
    expect(meta.tone).toBe("success");
  });

  it("returns correct label and tone for REJECTED", () => {
    const meta = getCompOffStatusMeta("REJECTED");
    expect(meta.label).toBe("Rejected");
    expect(meta.tone).toBe("error");
  });

  it("returns a safe fallback for unknown statuses", () => {
    const meta = getCompOffStatusMeta("SOME_FUTURE_STATUS");
    expect(meta.label).toBe("Some Future Status");
    expect(meta.tone).toBe("default");
  });

  it("handles empty string without throwing", () => {
    const meta = getCompOffStatusMeta("");
    expect(meta.label).toBe("Unknown");
    expect(meta.tone).toBe("default");
  });
});
