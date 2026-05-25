import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import DetailsDialog from "../../../src/components/DetailsDialog";

describe("DetailsDialog — rendering", () => {
  it("renders the dialog when open=true", () => {
    render(
      <DetailsDialog open title="Test Dialog" onClose={vi.fn()}>
        <p>Dialog content</p>
      </DetailsDialog>
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Test Dialog")).toBeInTheDocument();
    expect(screen.getByText("Dialog content")).toBeInTheDocument();
  });

  it("does not render when open=false", () => {
    render(
      <DetailsDialog open={false} title="Hidden Dialog" onClose={vi.fn()}>
        <p>Content</p>
      </DetailsDialog>
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders subtitle when provided", () => {
    render(
      <DetailsDialog open title="My Dialog" subtitle="Subtitle text" onClose={vi.fn()}>
        <p>Body</p>
      </DetailsDialog>
    );
    expect(screen.getByText("Subtitle text")).toBeInTheDocument();
  });

  it("renders actions when provided", () => {
    render(
      <DetailsDialog
        open
        title="With Actions"
        onClose={vi.fn()}
        actions={<button>Save</button>}
      >
        <p>Body</p>
      </DetailsDialog>
    );
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });

  it("does not render action area when actions prop is omitted", () => {
    render(
      <DetailsDialog open title="No Actions" onClose={vi.fn()}>
        <p>Content</p>
      </DetailsDialog>
    );
    expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument();
  });
});

describe("DetailsDialog — interactions", () => {
  it("calls onClose when the close icon button is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <DetailsDialog open title="Closeable" onClose={onClose}>
        <p>Content</p>
      </DetailsDialog>
    );
    // The close icon button is the only button in the header
    const buttons = screen.getAllByRole("button");
    await user.click(buttons[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders children in the dialog content area", () => {
    render(
      <DetailsDialog open title="Children Test" onClose={vi.fn()}>
        <input placeholder="test-input" />
      </DetailsDialog>
    );
    expect(screen.getByPlaceholderText("test-input")).toBeInTheDocument();
  });
});
