import "@testing-library/jest-dom/vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../helpers/render";
import { GlobalSort } from "../../../src/components/GlobalSort";

const sortOptions = [
  { value: "name", label: "Name" },
  { value: "date", label: "Date" },
  { value: "status", label: "Status" },
];

describe("GlobalSort — rendering", () => {
  it("renders the sort button", () => {
    renderWithProviders(
      <GlobalSort
        options={sortOptions}
        currentSortBy="name"
        currentSortOrder="asc"
        onSortChange={vi.fn()}
      />
    );
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("shows current sort label with ascending direction", () => {
    renderWithProviders(
      <GlobalSort
        options={sortOptions}
        currentSortBy="name"
        currentSortOrder="asc"
        onSortChange={vi.fn()}
      />
    );
    expect(screen.getByText(/name.*ascending/i)).toBeInTheDocument();
  });

  it("shows current sort label with descending direction", () => {
    renderWithProviders(
      <GlobalSort
        options={sortOptions}
        currentSortBy="date"
        currentSortOrder="desc"
        onSortChange={vi.fn()}
      />
    );
    expect(screen.getByText(/date.*descending/i)).toBeInTheDocument();
  });

  it("shows 'Sort' when currentSortBy does not match any option", () => {
    renderWithProviders(
      <GlobalSort
        options={sortOptions}
        currentSortBy="unknown"
        currentSortOrder="asc"
        onSortChange={vi.fn()}
      />
    );
    expect(screen.getByText(/^sort$/i)).toBeInTheDocument();
  });
});

describe("GlobalSort — menu", () => {
  it("opens the menu on button click and shows all options", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <GlobalSort
        options={sortOptions}
        currentSortBy="name"
        currentSortOrder="asc"
        onSortChange={vi.fn()}
      />
    );
    await user.click(screen.getByRole("button"));
    expect(await screen.findByRole("menuitem", { name: /date/i })).toBeInTheDocument();
    expect(await screen.findByRole("menuitem", { name: /status/i })).toBeInTheDocument();
  });

  it("calls onSortChange with selected field and asc when a new field is picked", async () => {
    const onSortChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <GlobalSort
        options={sortOptions}
        currentSortBy="name"
        currentSortOrder="asc"
        onSortChange={onSortChange}
      />
    );
    await user.click(screen.getByRole("button"));
    await user.click(await screen.findByRole("menuitem", { name: /date/i }));
    await waitFor(() => {
      expect(onSortChange).toHaveBeenCalledWith("date", "asc");
    });
  });

  it("toggles to desc when the same field is re-selected while asc", async () => {
    const onSortChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <GlobalSort
        options={sortOptions}
        currentSortBy="name"
        currentSortOrder="asc"
        onSortChange={onSortChange}
      />
    );
    await user.click(screen.getByRole("button"));
    await user.click(await screen.findByRole("menuitem", { name: /^name$/i }));
    await waitFor(() => {
      expect(onSortChange).toHaveBeenCalledWith("name", "desc");
    });
  });

  it("toggles to asc when the same field is re-selected while desc", async () => {
    const onSortChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <GlobalSort
        options={sortOptions}
        currentSortBy="name"
        currentSortOrder="desc"
        onSortChange={onSortChange}
      />
    );
    await user.click(screen.getByRole("button"));
    await user.click(await screen.findByRole("menuitem", { name: /^name$/i }));
    await waitFor(() => {
      expect(onSortChange).toHaveBeenCalledWith("name", "asc");
    });
  });

  it("closes the menu after selecting an option", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <GlobalSort
        options={sortOptions}
        currentSortBy="name"
        currentSortOrder="asc"
        onSortChange={vi.fn()}
      />
    );
    await user.click(screen.getByRole("button"));
    await screen.findByRole("menuitem", { name: /date/i });
    await user.click(screen.getByRole("menuitem", { name: /date/i }));
    await waitFor(() => {
      expect(screen.queryByRole("menuitem", { name: /date/i })).not.toBeInTheDocument();
    });
  });
});
