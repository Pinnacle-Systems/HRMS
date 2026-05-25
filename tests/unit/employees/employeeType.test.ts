import { describe, expect, it } from "vitest";
import {
  toTitleCase,
  employeeStatusColors,
  employeeStatusLabels,
} from "../../../src/pages/employees/type";

describe("toTitleCase", () => {
  it("capitalizes the first letter of each word", () => {
    expect(toTitleCase("hello world")).toBe("Hello World");
  });

  it("handles already-uppercase strings", () => {
    expect(toTitleCase("JOHN DOE")).toBe("John Doe");
  });

  it("handles mixed case strings", () => {
    expect(toTitleCase("jOHN dOE")).toBe("John Doe");
  });

  it("handles a single word", () => {
    expect(toTitleCase("alice")).toBe("Alice");
  });

  it("returns empty string for empty input", () => {
    expect(toTitleCase("")).toBe("");
  });

  it("handles null-like value gracefully", () => {
    // The implementation does String(value || "") so undefined/null becomes ""
    expect(toTitleCase(null as unknown as string)).toBe("");
    expect(toTitleCase(undefined as unknown as string)).toBe("");
  });

  it("handles strings with extra whitespace", () => {
    expect(toTitleCase("  hello  world  ")).toBe("  Hello  World  ");
  });

  it("handles numeric characters within strings", () => {
    expect(toTitleCase("emp001 id")).toBe("Emp001 Id");
  });
});

describe("employeeStatusColors", () => {
  it("has color mappings for all four statuses", () => {
    expect(employeeStatusColors).toHaveProperty("PENDING", "warning");
    expect(employeeStatusColors).toHaveProperty("ACTIVE", "success");
    expect(employeeStatusColors).toHaveProperty("INACTIVE", "error");
    expect(employeeStatusColors).toHaveProperty("ONBOARDING", "info");
  });

  it("contains exactly four entries", () => {
    expect(Object.keys(employeeStatusColors)).toHaveLength(4);
  });
});

describe("employeeStatusLabels", () => {
  it("has human-readable labels for all four statuses", () => {
    expect(employeeStatusLabels).toHaveProperty("PENDING", "Pending");
    expect(employeeStatusLabels).toHaveProperty("ACTIVE", "Active");
    expect(employeeStatusLabels).toHaveProperty("INACTIVE", "Inactive");
    expect(employeeStatusLabels).toHaveProperty("ONBOARDING", "Onboarding");
  });

  it("has matching keys with employeeStatusColors", () => {
    const colorKeys = Object.keys(employeeStatusColors).sort();
    const labelKeys = Object.keys(employeeStatusLabels).sort();
    expect(colorKeys).toEqual(labelKeys);
  });
});
