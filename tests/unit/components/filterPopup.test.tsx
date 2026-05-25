import "@testing-library/jest-dom/vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../helpers/render";
import FilterPopup from "../../../src/components/FilterPopup";
import type { FilterField } from "../../../src/types/filter";

// Stub DatePicker to avoid calendar rendering complexity
vi.mock("@mui/x-date-pickers/DatePicker", () => ({
  DatePicker: ({ label, onChange }: { label?: string; onChange?: (v: unknown) => void }) => (
    <input
      aria-label={label ?? "date-picker"}
      placeholder={label}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}));

vi.mock("@mui/x-date-pickers/LocalizationProvider", () => ({
  LocalizationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@mui/x-date-pickers/AdapterDayjs", () => ({
  AdapterDayjs: class {},
}));

const textFields: FilterField[] = [
  { id: "name", label: "Name", type: "text" },
  { id: "email", label: "Email", type: "text" },
];

const mixedFields: FilterField[] = [
  { id: "name", label: "Name", type: "text" },
  {
    id: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "ACTIVE", label: "Active" },
      { value: "INACTIVE", label: "Inactive" },
    ],
  },
];

describe("FilterPopup — rendering", () => {
  it("does not render when open=false", () => {
    renderWithProviders(
      <FilterPopup open={false} onClose={vi.fn()} onApply={vi.fn()} fields={textFields} />
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the dialog when open=true", () => {
    renderWithProviders(
      <FilterPopup open onClose={vi.fn()} onApply={vi.fn()} fields={textFields} />
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders the default title 'Advanced Filters'", () => {
    renderWithProviders(
      <FilterPopup open onClose={vi.fn()} onApply={vi.fn()} fields={textFields} />
    );
    expect(screen.getByText(/advanced filters/i)).toBeInTheDocument();
  });

  it("renders a custom title when provided", () => {
    renderWithProviders(
      <FilterPopup open onClose={vi.fn()} onApply={vi.fn()} fields={textFields} title="My Filters" />
    );
    expect(screen.getByText("My Filters")).toBeInTheDocument();
  });

  it("renders the Add Filter button", () => {
    renderWithProviders(
      <FilterPopup open onClose={vi.fn()} onApply={vi.fn()} fields={textFields} />
    );
    expect(screen.getByRole("button", { name: /add filter/i })).toBeInTheDocument();
  });

  it("renders Apply Filters button", () => {
    renderWithProviders(
      <FilterPopup open onClose={vi.fn()} onApply={vi.fn()} fields={textFields} />
    );
    expect(screen.getByRole("button", { name: /apply filters/i })).toBeInTheDocument();
  });

  it("renders Cancel button", () => {
    renderWithProviders(
      <FilterPopup open onClose={vi.fn()} onApply={vi.fn()} fields={textFields} />
    );
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("shows empty state message when no rules exist", () => {
    renderWithProviders(
      <FilterPopup open onClose={vi.fn()} onApply={vi.fn()} fields={textFields} />
    );
    expect(screen.getByText(/no filters applied/i)).toBeInTheDocument();
  });
});

describe("FilterPopup — interactions", () => {
  it("adds a rule row when Add Filter is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <FilterPopup open onClose={vi.fn()} onApply={vi.fn()} fields={textFields} />
    );
    await user.click(screen.getByRole("button", { name: /add filter/i }));
    await waitFor(() => {
      expect(screen.getAllByTestId("DeleteIcon").length).toBeGreaterThan(0);
    });
  });

  it("removes a rule row when the delete icon is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <FilterPopup open onClose={vi.fn()} onApply={vi.fn()} fields={textFields} />
    );
    await user.click(screen.getByRole("button", { name: /add filter/i }));
    await waitFor(() => screen.getAllByTestId("DeleteIcon").length > 0);
    const deleteBtn = screen.getAllByTestId("DeleteIcon")[0].closest("button")!;
    await user.click(deleteBtn);
    await waitFor(() => {
      expect(screen.queryByTestId("DeleteIcon")).not.toBeInTheDocument();
    });
  });

  it("shows Clear All button after adding a rule", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <FilterPopup open onClose={vi.fn()} onApply={vi.fn()} fields={textFields} />
    );
    await user.click(screen.getByRole("button", { name: /add filter/i }));
    expect(await screen.findByRole("button", { name: /clear all/i })).toBeInTheDocument();
  });

  it("clears all rules when Clear All is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <FilterPopup open onClose={vi.fn()} onApply={vi.fn()} fields={textFields} />
    );
    await user.click(screen.getByRole("button", { name: /add filter/i }));
    await screen.findByRole("button", { name: /clear all/i });
    await user.click(screen.getByRole("button", { name: /clear all/i }));
    await waitFor(() => {
      expect(screen.queryByTestId("DeleteIcon")).not.toBeInTheDocument();
    });
  });

  it("calls onClose when Cancel is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <FilterPopup open onClose={onClose} onApply={vi.fn()} fields={textFields} />
    );
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onApply with empty rules when Apply Filters is clicked with no rules", async () => {
    const onApply = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <FilterPopup open onClose={vi.fn()} onApply={onApply} fields={textFields} />
    );
    await user.click(screen.getByRole("button", { name: /apply filters/i }));
    await waitFor(() => {
      expect(onApply).toHaveBeenCalledWith(
        expect.objectContaining({ condition: "AND", rules: [] })
      );
    });
  });

  it("shows AND/OR toggle after adding two rules", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <FilterPopup open onClose={vi.fn()} onApply={vi.fn()} fields={textFields} />
    );
    await user.click(screen.getByRole("button", { name: /add filter/i }));
    await user.click(screen.getByRole("button", { name: /add filter/i }));
    expect(await screen.findByRole("button", { name: /^and$/i })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /^or$/i })).toBeInTheDocument();
  });

  it("initialises rules from initialFilters", () => {
    renderWithProviders(
      <FilterPopup
        open
        onClose={vi.fn()}
        onApply={vi.fn()}
        fields={textFields}
        initialFilters={{
          condition: "AND",
          rules: [{ id: "r1", field: "name", operator: "equals", value: "Alice" }],
        }}
      />
    );
    // There should be a delete icon for the pre-populated rule
    expect(screen.getByTestId("DeleteIcon")).toBeInTheDocument();
  });
});
