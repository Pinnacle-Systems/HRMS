import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/authContext";
import { getDefaultRoute } from "../../auth/authMapper";
import type { TenantInfo } from "../../auth/authTypes";

type TenantLocationState = {
  tenants?: TenantInfo[];
  email?: string;
  sessionToken?: string;
  loginResponse?: {
    multiTenant: boolean;
    tenants: TenantInfo[];
    expiresIn: number;
  };
};

export default function TenantSelectPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectTenant } = useAuth(); // Only need selectTenant since it handles session storage
  const state = (location.state || {}) as TenantLocationState;
  
  const tenants = state.tenants || state.loginResponse?.tenants || [];
  const email = state.email || "";
  
  const [tenantId, setTenantId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Set default tenant when component mounts
  useEffect(() => {
    if (tenants.length > 0 && !tenantId) {
      setTenantId(tenants[0].id);
    }
  }, [tenants]);

  // Redirect if no tenants or email
  useEffect(() => {
    if (tenants.length === 0) {
      setError("No companies available. Please sign in again.");
      const timer = setTimeout(() => {
        navigate("/login", { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
    
    if (!email) {
      setError("Session expired. Please sign in again.");
      const timer = setTimeout(() => {
        navigate("/login", { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [tenants, email, navigate]);

  const handleContinue = async () => {
    if (!tenantId) {
      setError("Please select a company.");
      return;
    }

    setError("");
    setLoading(true);

    try {      
      // selectTenant returns LoginOutcome and handles session storage internally
      const outcome = await selectTenant({
        tenantId,
        email: email,
      });
      // Handle the outcome based on LoginOutcome type
      switch (outcome.type) {
        case "authenticated": {          
          // Get the user from the session
          const user = outcome.session.user;
          const defaultRoute = getDefaultRoute(user);          
          // Navigate to the default route
          navigate(defaultRoute, { replace: true });
          break;
        }
        
        case "mfaRequired": {
          navigate("/mfa", {
            replace: true,
            state: {
              sessionToken: outcome.sessionToken,
              mfaType: outcome.mfaType || "totp",
              email: email,
            },
          });
          break;
        }
        
        case "tenantSelection": {
          setError("Please choose a company to continue.");
          break;
        }
        
        case "mustChangePassword": {
          navigate("/reset-password", {
            replace: true,
            state: {
              email: outcome.email || email,
            },
          });
          break;
        }
        
        case "failed": {
          setError(outcome.message || "Unable to select company. Please try again.");
          break;
        }
        
        default: {
          setError("An unexpected error occurred. Please try again.");
        }
      }
      
    } catch (err) {
      console.error("Tenant selection error:", err);
      setError("Unable to select company. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-sm shadow-xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Select Company
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Choose the company workspace to continue signing in.
          </p>
          {email && (
            <p className="text-xs text-gray-400 mt-1">
              Signed in as: <span className="font-medium">{email}</span>
            </p>
          )}
        </div>
        
        {tenants.length > 0 ? (
          <>
            <div className="space-y-2 mb-6">
              <label className="text-sm font-medium text-gray-700">
                Company
              </label>
              <select
                aria-label="Select company"
                value={tenantId}
                onChange={(event) => setTenantId(event.target.value)}
                className="w-full bg-white text-sm px-4 py-2.5 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                disabled={loading}
              >
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name} {tenant.subdomain ? `(${tenant.subdomain})` : ""}
                  </option>
                ))}
              </select>
            </div>
            
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-sm px-3 py-2 mb-4">
                {error}
              </div>
            )}
            
            <button
              type="button"
              disabled={!tenantId || loading}
              onClick={handleContinue}
              className="w-full bg-primary text-white text-sm py-3 rounded-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Continuing...
                </span>
              ) : (
                "Continue"
              )}
            </button>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-sm px-3 py-2">
              {error || "No companies available"}
            </div>
          </div>
        )}
        
        <Link
          to="/login"
          className="block text-center text-sm text-primary hover:text-primary-dark mt-6 transition-colors"
        >
          ← Back to Sign In
        </Link>
      </div>
    </div>
  );
}