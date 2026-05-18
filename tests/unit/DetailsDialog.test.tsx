import { render, screen } from "@testing-library/react";
import { Button } from "@mui/material";
import { describe, expect, it, vi } from "vitest";
import DetailsDialog from "../../src/components/DetailsDialog";

describe("DetailsDialog", () => {
  it("renders title and children when open", () => {
    render(
      <DetailsDialog open title="Leave Details" onClose={vi.fn()}>
        <div>Request summary</div>
      </DetailsDialog>,
    );

    expect(screen.getByText("Leave Details")).toBeInTheDocument();
    expect(screen.getByText("Request summary")).toBeInTheDocument();
  });

  it("renders actions when provided", () => {
    render(
      <DetailsDialog
        open
        title="Leave Details"
        onClose={vi.fn()}
        actions={<Button>Close</Button>}
      >
        <div>Request summary</div>
      </DetailsDialog>,
    );

    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });
});
