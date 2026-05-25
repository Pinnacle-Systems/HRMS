import "@testing-library/jest-dom/vitest";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../helpers/render";
import { MasterSelect } from "../../../src/components/MasterSelect";

const countries = [
  { id: "1", name: "India" },
  { id: "2", name: "USA" },
  { id: "3", name: "UK" },
];

const states = [
  { id: "s1", name: "Maharashtra" },
  { id: "s2", name: "Karnataka" },
];

const cities = [
  { id: "c1", name: "Mumbai" },
  { id: "c2", name: "Pune" },
];

describe("MasterSelect — rendering", () => {
  it("renders with a label", () => {
    renderWithProviders(
      <MasterSelect
        type="country"
        countries={countries}
        value=""
        onChange={vi.fn()}
        label="Country"
      />
    );
    // MUI OutlinedInput renders label text in both <label> and <legend><span> for the border notch
    expect(screen.getByText("Country", { selector: "label" })).toBeInTheDocument();
  });

  it("renders a combobox element", () => {
    renderWithProviders(
      <MasterSelect
        type="state"
        states={states}
        value=""
        onChange={vi.fn()}
        label="State"
      />
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("shows the selected country name when a value is set", () => {
    renderWithProviders(
      <MasterSelect
        type="country"
        countries={countries}
        value="1"
        onChange={vi.fn()}
        label="Country"
      />
    );
    expect(screen.getByText("India")).toBeInTheDocument();
  });

  it("shows the selected state name when a value is set", () => {
    renderWithProviders(
      <MasterSelect
        type="state"
        states={states}
        value="s2"
        onChange={vi.fn()}
        label="State"
      />
    );
    expect(screen.getByText("Karnataka")).toBeInTheDocument();
  });

  it("shows the selected city name when a value is set", () => {
    renderWithProviders(
      <MasterSelect
        type="city"
        cities={cities}
        value="c1"
        onChange={vi.fn()}
        label="City"
      />
    );
    expect(screen.getByText("Mumbai")).toBeInTheDocument();
  });
});

describe("MasterSelect — propOptions override", () => {
  it("uses propOptions over type-based options when provided", () => {
    const customOptions = [{ id: "x1", name: "Custom Region" }];
    renderWithProviders(
      <MasterSelect
        options={customOptions}
        value="x1"
        onChange={vi.fn()}
        label="Region"
      />
    );
    expect(screen.getByText("Custom Region")).toBeInTheDocument();
  });
});

describe("MasterSelect — disabled and required", () => {
  it("is disabled when disabled=true", () => {
    renderWithProviders(
      <MasterSelect
        type="country"
        countries={countries}
        value=""
        onChange={vi.fn()}
        label="Country"
        disabled
      />
    );
    expect(screen.getByRole("combobox")).toHaveAttribute("aria-disabled", "true");
  });

  it("renders helper text when provided", () => {
    renderWithProviders(
      <MasterSelect
        type="country"
        countries={countries}
        value=""
        onChange={vi.fn()}
        label="Country"
        helperText="Select your country"
      />
    );
    expect(screen.getByText("Select your country")).toBeInTheDocument();
  });
});
