import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ApprovalActionBar from "../../../src/components/ApprovalActionBar";

describe("ApprovalActionBar — buttons variant (default)", () => {
  it("renders Approve button with default label", () => {
    render(<ApprovalActionBar onApprove={vi.fn()} />);
    expect(screen.getByRole("button", { name: /approve/i })).toBeInTheDocument();
  });

  it("renders Reject button", () => {
    render(<ApprovalActionBar onReject={vi.fn()} />);
    expect(screen.getByRole("button", { name: /reject/i })).toBeInTheDocument();
  });

  it("renders Clarify button", () => {
    render(<ApprovalActionBar onClarify={vi.fn()} />);
    expect(screen.getByRole("button", { name: /request clarification/i })).toBeInTheDocument();
  });

  it("renders Close button", () => {
    render(<ApprovalActionBar onClose={vi.fn()} />);
    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
  });

  it("renders only provided action buttons", () => {
    render(<ApprovalActionBar onApprove={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole("button", { name: /approve/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /reject/i })).not.toBeInTheDocument();
  });

  it("calls onApprove when Approve is clicked", async () => {
    const onApprove = vi.fn();
    const user = userEvent.setup();
    render(<ApprovalActionBar onApprove={onApprove} />);
    await user.click(screen.getByRole("button", { name: /approve/i }));
    expect(onApprove).toHaveBeenCalledTimes(1);
  });

  it("calls onReject when Reject is clicked", async () => {
    const onReject = vi.fn();
    const user = userEvent.setup();
    render(<ApprovalActionBar onReject={onReject} />);
    await user.click(screen.getByRole("button", { name: /reject/i }));
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it("calls onClarify when Clarify is clicked", async () => {
    const onClarify = vi.fn();
    const user = userEvent.setup();
    render(<ApprovalActionBar onClarify={onClarify} />);
    await user.click(screen.getByRole("button", { name: /request clarification/i }));
    expect(onClarify).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Close is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<ApprovalActionBar onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("disables all buttons when disabled=true", () => {
    render(<ApprovalActionBar onApprove={vi.fn()} onReject={vi.fn()} disabled />);
    screen.getAllByRole("button").forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it("disables all buttons when loading=true", () => {
    render(<ApprovalActionBar onApprove={vi.fn()} onReject={vi.fn()} loading />);
    screen.getAllByRole("button").forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it("uses custom labels when provided", () => {
    render(<ApprovalActionBar onApprove={vi.fn()} approveLabel="Accept" onReject={vi.fn()} rejectLabel="Decline" />);
    expect(screen.getByRole("button", { name: /accept/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /decline/i })).toBeInTheDocument();
  });

  it("renders nothing when no handlers are provided", () => {
    render(<ApprovalActionBar />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("ApprovalActionBar — icons variant", () => {
  it("renders icon buttons with aria-labels", () => {
    render(<ApprovalActionBar variant="icons" onApprove={vi.fn()} onReject={vi.fn()} />);
    expect(screen.getByRole("button", { name: /approve/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reject/i })).toBeInTheDocument();
  });

  it("calls onApprove when icon approve button is clicked", async () => {
    const onApprove = vi.fn();
    const user = userEvent.setup();
    render(<ApprovalActionBar variant="icons" onApprove={onApprove} />);
    await user.click(screen.getByRole("button", { name: /approve/i }));
    expect(onApprove).toHaveBeenCalledTimes(1);
  });

  it("disables icon buttons when disabled=true", () => {
    render(
      <ApprovalActionBar variant="icons" onApprove={vi.fn()} onReject={vi.fn()} disabled />
    );
    screen.getAllByRole("button").forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });
});
