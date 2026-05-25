import "@testing-library/jest-dom/vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../helpers/render";
import { ThemePanel } from "../../../src/components/ThemePanel";

describe("ThemePanel — rendering", () => {
  it("renders the Theme Settings heading", () => {
    renderWithProviders(<ThemePanel />);
    expect(screen.getByText("Theme Settings")).toBeInTheDocument();
  });

  it("renders the Appearance Mode label", () => {
    renderWithProviders(<ThemePanel />);
    expect(screen.getByText(/appearance mode/i)).toBeInTheDocument();
  });

  it("renders Light mode button", () => {
    renderWithProviders(<ThemePanel />);
    expect(screen.getByRole("button", { name: /light/i })).toBeInTheDocument();
  });

  it("renders Dark mode button", () => {
    renderWithProviders(<ThemePanel />);
    expect(screen.getByRole("button", { name: /dark/i })).toBeInTheDocument();
  });

  it("renders the Primary Color label", () => {
    renderWithProviders(<ThemePanel />);
    expect(screen.getByText(/primary color/i)).toBeInTheDocument();
  });

  it("renders all five color theme buttons", () => {
    renderWithProviders(<ThemePanel />);
    const colorNames = ["Orange", "Red", "Blue", "Green", "Purple"];
    colorNames.forEach((color) => {
      expect(screen.getByTitle(color)).toBeInTheDocument();
    });
  });
});

describe("ThemePanel — interactions", () => {
  it("clicking Light button does not throw", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThemePanel />);
    await user.click(screen.getByRole("button", { name: /light/i }));
    expect(screen.getByText("Theme Settings")).toBeInTheDocument();
  });

  it("clicking Dark button does not throw", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThemePanel />);
    await user.click(screen.getByRole("button", { name: /dark/i }));
    expect(screen.getByText("Theme Settings")).toBeInTheDocument();
  });

  it("clicking a color button does not throw", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThemePanel />);
    await user.click(screen.getByTitle("Blue"));
    expect(screen.getByText("Theme Settings")).toBeInTheDocument();
  });
});
