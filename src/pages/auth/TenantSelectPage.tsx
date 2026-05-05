import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/authContext";
import { getDefaultRoute } from "../../auth/authMapper";
import type { TenantInfo } from "../../auth/authTypes";

type TenantLocationState = {
  tenants?: TenantInfo[];
  email?: string;
  sessionToken?: string;
};

export default function TenantSelectPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectTenant } = useAuth();
  const state = (location.state || {}) as TenantLocationState;
  const tenants = state.tenants || [];
  const [tenantId, setTenantId] = useState(tenants[0]?.id || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleContinue = async () => {
    if (!tenantId) {
      return;
    }

    if (!state.sessionToken) {
      setError("Unable to continue. Please sign in again.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const outcome = await selectTenant({
        tenantId,
        sessionToken: state.sessionToken,
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
        case "mustChangePassword":
          navigate("/reset-password", {
            replace: true,
            state: {
              email: outcome.email || state.email,
            },
          });
          break;
        case "tenantSelection":
          setError("Please choose a company to continue.");
          break;
        case "failed":
          setError(outcome.message || "Unable to select company.");
          break;
      }
    } catch {
      setError("Unable to select company. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-sm shadow-xl p-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Select company
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Choose the company workspace to continue signing in.
        </p>
        <select
          aria-label="Company"
          value={tenantId}
          onChange={(event) => setTenantId(event.target.value)}
          className="w-full bg-white text-sm px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none transition mb-6"
        >
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))}
        </select>
        {error && (
          <div className="text-sm text-error bg-red-50 border border-red-100 rounded-sm px-3 py-2 mb-4">
            {error}
          </div>
        )}
        <button
          type="button"
          disabled={!tenantId || loading}
          onClick={handleContinue}
          className="w-full bg-primary text-white text-sm py-3 rounded-sm font-semibold disabled:opacity-60"
        >
          {loading ? "Continuing..." : "Continue"}
        </button>
        <Link
          to="/login"
          className="block text-center text-sm text-primary hover:text-primary-dark mt-4"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
