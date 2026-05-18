import { render, screen } from "@testing-library/react";
import { Button } from "@mui/material";
import { describe, expect, it } from "vitest";
import DataState from "../../src/components/DataState";

describe("DataState", () => {
  it("renders a loading title and message", () => {
    render(
      <DataState
        type="loading"
        title="Loading leave requests..."
        message="Please wait"
      />,
    );

    expect(screen.getByText("Loading leave requests...")).toBeInTheDocument();
    expect(screen.getByText("Please wait")).toBeInTheDocument();
  });

  it("renders an empty state with an action", () => {
    render(
      <DataState
        type="empty"
        title="No leave requests found"
        action={<Button>Apply Leave</Button>}
      />,
    );

    expect(screen.getByText("No leave requests found")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apply Leave" })).toBeInTheDocument();
  });

  it("renders an error state with an action", () => {
    render(
      <DataState
        type="error"
        title="Unable to load leave requests"
        action={<Button>Retry</Button>}
      />,
    );

    expect(screen.getByText("Unable to load leave requests")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("renders compact mode", () => {
    render(<DataState compact type="empty" title="Nothing here" />);

    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });
});
