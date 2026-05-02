import "@testing-library/jest-dom/vitest";
import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../helpers/render";
import Login from "../../src/pages/auth/Login/Login";

const { mockLogin } = vi.hoisted(() => ({
  mockLogin: vi.fn(),
}));

vi.mock("../../src/auth/authContext", () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

describe("Login", () => {
  beforeEach(() => {
    mockLogin.mockReset();
  });

  it("renders the sign-in form", () => {
    renderWithProviders(<Login />, { route: "/login" });

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("shows an error when login fails", async () => {
    mockLogin.mockResolvedValue({ type: "failed", message: "Login failed" });

    renderWithProviders(<Login />, { route: "/login" });

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "admin@company.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "wrong-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText("Login failed")).toBeInTheDocument();
  });
});
