import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DataState from "../../../src/components/DataState";

describe("DataState — loading", () => {
  it("renders default loading title", () => {
    render(<DataState type="loading" />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders a CircularProgress spinner", () => {
    render(<DataState type="loading" />);
    expect(document.querySelector("[role='progressbar']")).toBeInTheDocument();
  });

  it("renders a custom title", () => {
    render(<DataState type="loading" title="Fetching data..." />);
    expect(screen.getByText("Fetching data...")).toBeInTheDocument();
  });

  it("renders an optional message", () => {
    render(<DataState type="loading" message="Please wait" />);
    expect(screen.getByText("Please wait")).toBeInTheDocument();
  });
});

describe("DataState — empty", () => {
  it("renders default empty title", () => {
    render(<DataState type="empty" />);
    expect(screen.getByText("No records found.")).toBeInTheDocument();
  });

  it("does not render a spinner", () => {
    render(<DataState type="empty" />);
    expect(document.querySelector("[role='progressbar']")).not.toBeInTheDocument();
  });

  it("renders an optional message", () => {
    render(<DataState type="empty" message="Try adjusting your filters." />);
    expect(screen.getByText("Try adjusting your filters.")).toBeInTheDocument();
  });

  it("renders an action node", () => {
    render(<DataState type="empty" action={<button>Refresh</button>} />);
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
  });
});

describe("DataState — error", () => {
  it("renders default error title", () => {
    render(<DataState type="error" />);
    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
  });

  it("renders a custom error message", () => {
    render(<DataState type="error" message="Network timeout." />);
    expect(screen.getByText("Network timeout.")).toBeInTheDocument();
  });

  it("renders an action node", () => {
    render(<DataState type="error" action={<button>Retry</button>} />);
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});

describe("DataState — compact mode", () => {
  it("renders in compact mode without crashing", () => {
    render(<DataState type="loading" compact />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders compact empty state", () => {
    render(<DataState type="empty" compact title="Nothing here" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });
});
