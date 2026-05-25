import "@testing-library/jest-dom/vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../helpers/render";
import { DynamicSelectWithAdd } from "../../../src/components/SelectField";

describe("DynamicSelectWithAdd — rendering", () => {
  it("renders with a label", () => {
    renderWithProviders(
      <DynamicSelectWithAdd
        label="Department"
        value=""
        onChange={vi.fn()}
        options={["Engineering", "HR"]}
        onAddOption={vi.fn()}
      />
    );
    // MUI OutlinedInput renders label text in both <label> and <legend><span> for the border notch
    expect(screen.getByText("Department", { selector: "label" })).toBeInTheDocument();
  });

  it("renders helper text when provided", () => {
    renderWithProviders(
      <DynamicSelectWithAdd
        label="Role"
        value=""
        onChange={vi.fn()}
        options={[]}
        onAddOption={vi.fn()}
        helperText="Select a role"
      />
    );
    expect(screen.getByText("Select a role")).toBeInTheDocument();
  });

  it("renders a combobox input", () => {
    renderWithProviders(
      <DynamicSelectWithAdd
        label="Branch"
        value=""
        onChange={vi.fn()}
        options={["Bangalore"]}
        onAddOption={vi.fn()}
      />
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("is disabled when disabled=true", () => {
    renderWithProviders(
      <DynamicSelectWithAdd
        label="Branch"
        value=""
        onChange={vi.fn()}
        options={["Bangalore"]}
        onAddOption={vi.fn()}
        disabled
      />
    );
    expect(screen.getByRole("combobox")).toHaveAttribute("aria-disabled", "true");
  });
});

describe("DynamicSelectWithAdd — add new option dialog", () => {
  it("opens the add dialog when 'Add New' menu item is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <DynamicSelectWithAdd
        label="Department"
        value=""
        onChange={vi.fn()}
        options={["Engineering"]}
        onAddOption={vi.fn()}
        showAddButton
      />
    );
    await user.click(screen.getByRole("combobox"));
    const addItem = await screen.findByText(/add new department/i);
    await user.click(addItem);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("dialog title includes the label", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <DynamicSelectWithAdd
        label="Department"
        value=""
        onChange={vi.fn()}
        options={[]}
        onAddOption={vi.fn()}
        showAddButton
      />
    );
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByText(/add new department/i));
    // After dialog opens, find the h2 dialog title specifically
    expect(await screen.findByText(/add new department/i, { selector: "h2" })).toBeInTheDocument();
  });

  it("calls onAddOption when a new value is submitted", async () => {
    const onAddOption = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(
      <DynamicSelectWithAdd
        label="Department"
        value=""
        onChange={vi.fn()}
        options={["Engineering"]}
        onAddOption={onAddOption}
        showAddButton
      />
    );
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByText(/add new department/i));
    await screen.findByRole("dialog");
    const input = screen.getByRole("textbox");
    await user.type(input, "Finance");
    await user.click(screen.getByRole("button", { name: /^add$/i }));
    await waitFor(() => {
      expect(onAddOption).toHaveBeenCalledWith("Finance");
    });
  });

  it("keeps Add button disabled when input is empty", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <DynamicSelectWithAdd
        label="Department"
        value=""
        onChange={vi.fn()}
        options={[]}
        onAddOption={vi.fn()}
        showAddButton
      />
    );
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByText(/add new department/i));
    await screen.findByRole("dialog");
    expect(screen.getByRole("button", { name: /^add$/i })).toBeDisabled();
  });

  it("closes dialog on Cancel without calling onAddOption", async () => {
    const onAddOption = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <DynamicSelectWithAdd
        label="Department"
        value=""
        onChange={vi.fn()}
        options={["Engineering"]}
        onAddOption={onAddOption}
        showAddButton
      />
    );
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByText(/add new department/i));
    await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(onAddOption).not.toHaveBeenCalled();
  });

  it("shows error when duplicate option name is typed", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <DynamicSelectWithAdd
        label="Department"
        value=""
        onChange={vi.fn()}
        options={["Engineering"]}
        onAddOption={vi.fn()}
        showAddButton
      />
    );
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByText(/add new department/i));
    await screen.findByRole("dialog");
    await user.type(screen.getByRole("textbox"), "Engineering");
    expect(await screen.findByText(/already exists/i)).toBeInTheDocument();
  });
});
