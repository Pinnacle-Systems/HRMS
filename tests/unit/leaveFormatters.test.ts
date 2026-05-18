import { describe, expect, it } from "vitest";
import { formatDate, formatDay } from "../../src/pages/leave/leaveFormatters";

describe("formatDate", () => {
  it("formats a known date in en-IN display format", () => {
    expect(formatDate("2026-05-18")).toBe("18 May 2026");
  });

  it("formats a Date object", () => {
    expect(formatDate(new Date(2026, 0, 1))).toBe("01 Jan 2026");
  });

  it("returns empty string for null", () => {
    expect(formatDate(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(formatDate(undefined)).toBe("");
  });

  it("returns empty string for empty string", () => {
    expect(formatDate("")).toBe("");
  });
});

describe("formatDay", () => {
  it("formats a known date as the full weekday name", () => {
    expect(formatDay("2026-05-18")).toBe("Monday");
  });

  it("returns empty string for null", () => {
    expect(formatDay(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(formatDay(undefined)).toBe("");
  });

  it("returns empty string for empty string", () => {
    expect(formatDay("")).toBe("");
  });
});
