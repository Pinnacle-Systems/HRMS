import "@testing-library/jest-dom/vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../helpers/render";
import { GlobalPagination } from "../../../src/components/GlobalPagination";

describe("GlobalPagination — table variant (default)", () => {
  it("renders rows per page label", () => {
    renderWithProviders(
      <GlobalPagination total={100} page={1} limit={10} onPageChange={vi.fn()} onLimitChange={vi.fn()} />
    );
    expect(screen.getByText(/rows per page/i)).toBeInTheDocument();
  });

  it("displays range and total count", () => {
    renderWithProviders(
      <GlobalPagination total={50} page={1} limit={10} onPageChange={vi.fn()} onLimitChange={vi.fn()} />
    );
    expect(screen.getByText(/1-10 of 50/i)).toBeInTheDocument();
  });

  it("calls onPageChange with next page when next button is clicked", async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <GlobalPagination total={100} page={1} limit={10} onPageChange={onPageChange} onLimitChange={vi.fn()} />
    );
    const nextBtn = screen.getByTitle(/next page/i);
    await user.click(nextBtn);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("disables previous page button on first page", () => {
    renderWithProviders(
      <GlobalPagination total={100} page={1} limit={10} onPageChange={vi.fn()} onLimitChange={vi.fn()} />
    );
    expect(screen.getByTitle(/previous page/i)).toBeDisabled();
  });

  it("renders with custom page size options", () => {
    renderWithProviders(
      <GlobalPagination
        total={100}
        page={1}
        limit={10}
        onPageChange={vi.fn()}
        onLimitChange={vi.fn()}
        pageSizeOptions={[10, 25, 50]}
      />
    );
    expect(screen.getByText(/rows per page/i)).toBeInTheDocument();
  });
});

describe("GlobalPagination — simple variant", () => {
  it("renders total count text", () => {
    renderWithProviders(
      <GlobalPagination
        total={42}
        page={1}
        limit={10}
        onPageChange={vi.fn()}
        onLimitChange={vi.fn()}
        variant="simple"
        showTotal
      />
    );
    expect(screen.getByText(/total: 42 items/i)).toBeInTheDocument();
  });

  it("hides total when showTotal=false", () => {
    renderWithProviders(
      <GlobalPagination
        total={42}
        page={1}
        limit={10}
        onPageChange={vi.fn()}
        onLimitChange={vi.fn()}
        variant="simple"
        showTotal={false}
      />
    );
    expect(screen.queryByText(/total.*items/i)).not.toBeInTheDocument();
  });

  it("renders pagination nav", () => {
    renderWithProviders(
      <GlobalPagination
        total={100}
        page={1}
        limit={10}
        onPageChange={vi.fn()}
        onLimitChange={vi.fn()}
        variant="simple"
      />
    );
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("calls onPageChange when a page button is clicked", async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <GlobalPagination
        total={100}
        page={1}
        limit={10}
        onPageChange={onPageChange}
        onLimitChange={vi.fn()}
        variant="simple"
      />
    );
    const page2Btn = screen.getByRole("button", { name: /page 2/i });
    await user.click(page2Btn);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
