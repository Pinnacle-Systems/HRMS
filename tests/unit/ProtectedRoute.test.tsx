import "@testing-library/jest-dom/vitest";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Route, Routes } from "react-router-dom";
import { AuthContext } from "../../src/auth/authContext";
import ProtectedRoute from "../../src/auth/ProtectedRoute";
import { createAuthContextValue, createMockAuthSession } from "../helpers/mockAuthSession";
import { renderWithProviders } from "../helpers/render";

describe("ProtectedRoute", () => {
  it("redirects unauthenticated users to login", async () => {
    renderWithProviders(
      <AuthContext.Provider value={createAuthContextValue(null)}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/employees" element={<div>Employees secure content</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </AuthContext.Provider>,
      { route: "/employees" },
    );

    expect(await screen.findByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Employees secure content")).not.toBeInTheDocument();
  });

  it("allows authenticated admin users", () => {
    renderWithProviders(
      <AuthContext.Provider value={createAuthContextValue(createMockAuthSession())}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/employees" element={<div>Employees secure content</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </AuthContext.Provider>,
      { route: "/employees" },
    );

    expect(screen.getByText("Employees secure content")).toBeInTheDocument();
  });
});
