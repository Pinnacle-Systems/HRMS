import "@testing-library/jest-dom/vitest";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Route, Routes } from "react-router-dom";
import { AuthContext } from "../../src/auth/authContext";
import Layout from "../../src/components/Layout";
import { createAuthContextValue, createMockAuthSession } from "../helpers/mockAuthSession";
import { renderWithProviders } from "../helpers/render";

describe("Layout", () => {
  it("renders admin-visible navigation items", () => {
    renderWithProviders(
      <AuthContext.Provider value={createAuthContextValue(createMockAuthSession())}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/admin/dashboard" element={<div>Dashboard content</div>} />
          </Route>
        </Routes>
      </AuthContext.Provider>,
      { route: "/admin/dashboard" },
    );

    expect(screen.getByText("Admin Console")).toBeInTheDocument();
    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Employees")).toBeInTheDocument();
    expect(screen.getByText("Leave")).toBeInTheDocument();
    expect(screen.getByText("Attendance")).toBeInTheDocument();
    expect(screen.getByText("Payroll")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });
});
