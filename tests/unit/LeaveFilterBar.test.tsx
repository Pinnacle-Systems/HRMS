import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import LeaveFilterBar from "../../src/pages/leave/components/LeaveFilterBar";

describe("LeaveFilterBar", () => {
  it("renders children", () => {
    render(
      <LeaveFilterBar>
        <label htmlFor="status">Status</label>
        <input id="status" />
      </LeaveFilterBar>,
    );

    expect(screen.getByLabelText("Status")).toBeInTheDocument();
  });

  it("renders reset action when provided", async () => {
    const onReset = vi.fn();
    const user = userEvent.setup();

    render(
      <LeaveFilterBar onReset={onReset} resetLabel="Clear filters">
        <input aria-label="Status" />
      </LeaveFilterBar>,
    );

    await user.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("does not render reset action when not provided", () => {
    render(
      <LeaveFilterBar>
        <input aria-label="Status" />
      </LeaveFilterBar>,
    );

    expect(screen.queryByRole("button", { name: "Reset" })).not.toBeInTheDocument();
  });
});
