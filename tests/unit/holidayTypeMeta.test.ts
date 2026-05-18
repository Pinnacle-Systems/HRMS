import { describe, expect, it } from "vitest";
import { getHolidayTypeMeta } from "../../src/pages/leave/holidayTypeMeta";

describe("getHolidayTypeMeta", () => {
  it("returns correct label and tone for PUBLIC", () => {
    const meta = getHolidayTypeMeta("PUBLIC");
    expect(meta.label).toBe("Public Holiday");
    expect(meta.tone).toBe("success");
  });

  it("returns correct label and tone for NATIONAL", () => {
    const meta = getHolidayTypeMeta("NATIONAL");
    expect(meta.label).toBe("Public Holiday");
    expect(meta.tone).toBe("success");
  });

  it("PUBLIC and NATIONAL share the same label and tone", () => {
    const pub = getHolidayTypeMeta("PUBLIC");
    const nat = getHolidayTypeMeta("NATIONAL");
    expect(pub.label).toBe(nat.label);
    expect(pub.tone).toBe(nat.tone);
  });

  it("returns correct label and tone for COMPANY", () => {
    const meta = getHolidayTypeMeta("COMPANY");
    expect(meta.label).toBe("Company Holiday");
    expect(meta.tone).toBe("info");
  });

  it("returns correct label and tone for OPTIONAL", () => {
    const meta = getHolidayTypeMeta("OPTIONAL");
    expect(meta.label).toBe("Optional Holiday");
    expect(meta.tone).toBe("info");
  });

  it("returns correct label and tone for RESTRICTED", () => {
    const meta = getHolidayTypeMeta("RESTRICTED");
    expect(meta.label).toBe("Restricted Holiday");
    expect(meta.tone).toBe("warning");
  });

  it("returns correct label and tone for REGIONAL", () => {
    const meta = getHolidayTypeMeta("REGIONAL");
    expect(meta.label).toBe("Restricted Holiday");
    expect(meta.tone).toBe("warning");
  });

  it("REGIONAL and RESTRICTED share the same label and tone", () => {
    const reg = getHolidayTypeMeta("REGIONAL");
    const res = getHolidayTypeMeta("RESTRICTED");
    expect(reg.label).toBe(res.label);
    expect(reg.tone).toBe(res.tone);
  });

  it("returns a safe fallback for unknown types", () => {
    const meta = getHolidayTypeMeta("SOME_FUTURE_TYPE");
    expect(meta.label).toBe("Some Future Type");
    expect(meta.tone).toBe("default");
  });

  it("handles empty string without throwing", () => {
    const meta = getHolidayTypeMeta("");
    expect(meta.label).toBe("Unknown");
    expect(meta.tone).toBe("default");
  });
});
