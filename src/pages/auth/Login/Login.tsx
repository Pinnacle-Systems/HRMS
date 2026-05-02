import { useState } from "react";
import type { FormEvent } from "react";
import { motion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/authContext";
import { getDefaultRoute } from "../../../auth/authMapper";

type LoginLocationState = {
  tenantId?: string;
  email?: string;
};

function getLoginErrorMessage(error: unknown) {
  const status = typeof error === "object" && error && "status" in error
    ? Number((error as { status?: number }).status)
    : 0;

  if (status === 400 || status === 401 || status === 403) {
    return "Invalid email or password.";
  }

  if (status === 0) {
    return "Unable to connect. Please check your internet connection.";
  }

  return "Something went wrong. Please try again.";
}

export default function Login() {
  const location = useLocation();
  const locationState = (location.state || {}) as LoginLocationState;
  const [email, setEmail] = useState(locationState.email || "");
  const [password, setPassword] = useState("");
  const [visible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const outcome = await login({
        loginId: email,
        password,
        tenantId: locationState.tenantId,
      });

      switch (outcome.type) {
        case "authenticated":
          navigate(getDefaultRoute(outcome.session.user), { replace: true });
          break;
        case "mfaRequired":
          navigate("/mfa", {
            replace: true,
            state: {
              sessionToken: outcome.sessionToken,
              mfaType: outcome.mfaType,
            },
          });
          break;
        case "tenantSelection":
          navigate("/select-tenant", {
            replace: true,
            state: {
              tenants: outcome.tenants,
              email: outcome.email || email,
            },
          });
          break;
        case "mustChangePassword":
          navigate("/reset-password", {
            replace: true,
            state: {
              email: outcome.email || email,
            },
          });
          break;
        case "failed":
          setError(outcome.message || "Invalid email or password.");
          break;
      }
    } catch (loginError) {
      setError(getLoginErrorMessage(loginError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl h-[85vh] bg-white rounded-sm p-[25px] shadow-xl grid grid-cols-1 gap-6 md:grid-cols-2 overflow-hidden"
      >
        <div className="rounded-xl p-10 flex flex-col justify-between bg-gradient-to-bl from-primary-50 to-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-4 h-4 bg-primary rounded-sm rotate-45"></div>
              <span className="font-bold text-gray-700">
                Vibe<span className="text-primary">HR</span>
              </span>
            </div>
            <h1 className="text-2xl font-semibold leading-snug mb-6">
              Sign in to <br />
              Vibe<span className="text-primary">HR</span>
            </h1>
            <div className="flex items-center justify-center">
              <img src="src/assets/grp.png" width="50" height="100" alt="" />
              <p className="text-gray-600 max-w-sm text-[11px] ml-4 text-justify">
                Access payroll, attendance, onboarding, employee records, and
                company workflows from one secure HRMS workspace.
              </p>
            </div>
          </div>
          <div className="mb-10 text-[12px] bg-white text-gray-400 rounded-sm shadow px-2 py-6 grid grid-cols-3 gap-2">
            <div className="border-r border-gray-300 text-center pr-2">
              <div>10+</div>
              <div>Years</div>
            </div>
            <div className="border-r border-gray-300 text-center pr-2">
              <div>500+</div>
              <div>Employees</div>
            </div>
            <div className="text-center pr-2">
              <div>98%</div>
              <div>Satisfaction</div>
            </div>
          </div>
        </div>

        <div className="p-10 flex flex-col justify-center relative">
          <h2 className="text-2xl font-semibold mb-2">
            <img
              src="src/assets/pinnacle.jpg"
              width="40%"
              className="absolute top-[0] right-[0]"
              alt="Pinnacle"
            />
            Welcome to <br />
            Vibe<span className="text-primary">HR</span> Platform
          </h2>
          <div className="text-[12px] mb-8 text-gray-400">
            Enter your credentials to access your dashboard
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-sm mb-2">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="employee@company.com"
                className="w-full bg-white text-sm px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none transition"
                required
              />
            </div>
            <div className="relative">
              <label htmlFor="login-password" className="block text-sm mb-2">
                Password
              </label>
              <input
                id="login-password"
                type={visible ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="w-full bg-white text-sm px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none transition"
                required
              />
              <button
                type="button"
                className="absolute top-[35px] right-[8px] text-primary hover:text-primary-dark text-xs"
                onClick={() => setIsVisible((current) => !current)}
              >
                {visible ? "Hide" : "Show"}
              </button>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-500">
                <input type="checkbox" className="accent-primary" />
                Remember this device
              </label>
              <Link
                to="/forgot-password"
                className="text-primary hover:text-primary-dark"
              >
                Forgot password?
              </Link>
            </div>
            {error && (
              <div className="text-sm text-error bg-red-50 border border-red-100 rounded-sm px-3 py-2">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 text-sm bg-primary text-white py-3 rounded-sm font-semibold transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
