import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { TenantInfo } from "../../auth/authTypes";

type TenantLocationState = {
  tenants?: TenantInfo[];
  email?: string;
};

export default function TenantSelectPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state || {}) as TenantLocationState;
  const tenants = state.tenants || [];
  const [tenantId, setTenantId] = useState(tenants[0]?.id || "");

  const handleContinue = () => {
    navigate("/login", {
      replace: true,
      state: {
        tenantId,
        email: state.email,
      },
    });
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
        <button
          type="button"
          disabled={!tenantId}
          onClick={handleContinue}
          className="w-full bg-primary text-white text-sm py-3 rounded-sm font-semibold disabled:opacity-60"
        >
          Continue
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
