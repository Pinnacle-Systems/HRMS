import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ApprovalActionBar from "../../src/components/ApprovalActionBar";

describe("ApprovalActionBar", () => {
  it("renders only provided actions", () => {
    render(<ApprovalActionBar onApprove={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reject" })).not.toBeInTheDocument();
  });

  it("calls the correct handlers", async () => {
    const onApprove = vi.fn();
    const onReject = vi.fn();
    const user = userEvent.setup();

    render(<ApprovalActionBar onApprove={onApprove} onReject={onReject} />);

    await user.click(screen.getByRole("button", { name: "Approve" }));
    await user.click(screen.getByRole("button", { name: "Reject" }));

    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it("respects disabled state", () => {
    const onApprove = vi.fn();

    render(<ApprovalActionBar disabled onApprove={onApprove} />);

    expect(screen.getByRole("button", { name: "Approve" })).toBeDisabled();

    expect(onApprove).not.toHaveBeenCalled();
  });
});
