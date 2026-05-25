import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ValidatedTextField } from "../../../src/components/validateTextFields";

describe("ValidatedTextField — rendering", () => {
  it("renders a text input with the given label", () => {
    render(
      <ValidatedTextField fieldKey="panNo" value="" onChange={vi.fn()} label="PAN Number" />
    );
    expect(screen.getByLabelText(/pan number/i)).toBeInTheDocument();
  });

  it("shows format example as placeholder for a known fieldKey", () => {
    render(
      <ValidatedTextField fieldKey="panNo" value="" onChange={vi.fn()} label="PAN Number" />
    );
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("placeholder", expect.stringContaining("ABCDE1234F"));
  });

  it("uses a custom placeholder when provided", () => {
    render(
      <ValidatedTextField
        fieldKey="unknownKey"
        value=""
        onChange={vi.fn()}
        label="Field"
        placeholder="Enter value here"
      />
    );
    expect(screen.getByPlaceholderText("Enter value here")).toBeInTheDocument();
  });

  it("does not have aria-invalid when value is empty", () => {
    render(
      <ValidatedTextField fieldKey="panNo" value="" onChange={vi.fn()} label="PAN Number" />
    );
    expect(screen.getByRole("textbox")).not.toHaveAttribute("aria-invalid", "true");
  });
});

describe("ValidatedTextField — validation", () => {
  it("shows error state for an invalid PAN value", () => {
    render(
      <ValidatedTextField fieldKey="panNo" value="INVALID" onChange={vi.fn()} label="PAN" />
    );
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("does not show error state for a valid PAN value", () => {
    render(
      <ValidatedTextField fieldKey="panNo" value="ABCDE1234F" onChange={vi.fn()} label="PAN" />
    );
    expect(screen.getByRole("textbox")).not.toHaveAttribute("aria-invalid", "true");
  });

  it("shows error state for an invalid GST number", () => {
    render(
      <ValidatedTextField fieldKey="gstNo" value="INVALID_GST" onChange={vi.fn()} label="GST" />
    );
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("shows no error for an unknown fieldKey regardless of value", () => {
    render(
      <ValidatedTextField fieldKey="freeTextField" value="any-value" onChange={vi.fn()} label="Custom" />
    );
    expect(screen.getByRole("textbox")).not.toHaveAttribute("aria-invalid", "true");
  });

  it("shows no error when value is empty for a known fieldKey", () => {
    render(
      <ValidatedTextField fieldKey="gstNo" value="" onChange={vi.fn()} label="GST" />
    );
    expect(screen.getByRole("textbox")).not.toHaveAttribute("aria-invalid", "true");
  });
});

describe("ValidatedTextField — onChange", () => {
  it("calls onChange when the user types", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ValidatedTextField fieldKey="unknownKey" value="" onChange={onChange} label="Field" />
    );
    await user.type(screen.getByRole("textbox"), "A");
    expect(onChange).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith("A");
  });

  it("calls onChange for each character typed", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ValidatedTextField fieldKey="unknownKey" value="" onChange={onChange} label="Field" />
    );
    await user.type(screen.getByRole("textbox"), "abc");
    expect(onChange).toHaveBeenCalledTimes(3);
  });
});
