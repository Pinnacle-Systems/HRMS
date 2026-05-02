import { describe, expect, it } from "vitest";
import { validateAllFields, validateField } from "../../src/utils/validation";

describe("validation utilities", () => {
  it("accepts valid field formats", () => {
    expect(validateField("pan", "ABCDE1234F")).toBe("");
    expect(validateField("tan_no", "ABCD12345E")).toBe("");
    expect(validateField("email", "company@example.com")).toBe("");
    expect(validateField("pf_no", "MH/12345/1234")).toBe("");
  });

  it("returns format examples for invalid values", () => {
    expect(validateField("pan", "bad-pan")).toBe("Format: ABCDE1234F");
    expect(validateField("esi_no", "123")).toBe("Format: 12345678901234567");
    expect(validateField("registration_no", "bad-registration")).toBe(
      "Format: ROC-1234567890",
    );
  });

  it("treats unknown and empty values as valid", () => {
    expect(validateField("unknown", "anything")).toBe("");
    expect(validateField("pan", "")).toBe("");
    expect(validateField("pan", "   ")).toBe("");
  });

  it("validates every known field in an object", () => {
    expect(
      validateAllFields({
        pan: "bad-pan",
        email: "company@example.com",
        unrelated: 123,
      }),
    ).toEqual({
      pan: "Format: ABCDE1234F",
    });
  });
});
