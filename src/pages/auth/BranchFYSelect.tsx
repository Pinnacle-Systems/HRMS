// pages/BranchFiscalYearSelectPage.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/authContext";
import { getDefaultRoute, redirectAfterSelect } from "../../auth/authMapper";
import { getSessionContext, selectSessionContext } from "../../auth/authApi";
import type { AuthSession } from "../../auth/authTypes";

export default function BranchFiscalYearSelectPage() {
  const navigate = useNavigate();
  const { session, setSessionCall } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Context options
  const [branchAssociated, setBranchAssociated] = useState(false);
  const [assignedBranchId, setAssignedBranchId] = useState<string | null>(null);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [fiscalYears, setFiscalYears] = useState<{ id: string; label: string; active: boolean }[]>([]);
  const [activeFiscalYearId, setActiveFiscalYearId] = useState<string | null>(null);

  // Selected values
  const [selectedBranchId, setSelectedBranchId] = useState<string | "">("");
  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState<string | "">("");

  // Fetch context options on mount
  useEffect(() => {
    const fetchContext = async () => {
      try {
        const response = await getSessionContext();
        if (!response.success) {
          setError(response.message || "Failed to load branch and fiscal year options.");
          return;
        }
        const data = response.data;
        setBranchAssociated(data.branchAssociated);
        setAssignedBranchId(data.assignedBranchId || null);
        setBranches(data.branches);
        setFiscalYears(data.fiscalYears);
        setActiveFiscalYearId(data.activeFiscalYearId || null);

        // Pre-select values
        if (data.branchAssociated && data.assignedBranchId) {
          setSelectedBranchId(data.assignedBranchId);
        } else if (data.branches.length > 0) {
          // Default to first branch (or "All" if not associated)
          setSelectedBranchId(data.branches[0].id);
        }

        if (data.activeFiscalYearId) {
          setSelectedFiscalYearId(data.activeFiscalYearId);
        } else if (data.fiscalYears.length > 0) {
          setSelectedFiscalYearId(data.fiscalYears[0].id);
        }
      } catch (err) {
        setError("Unable to fetch context options. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchContext();
  }, []);

  const handleSubmit = async () => {
    if (!selectedFiscalYearId) {
      setError("Please select a financial year.");
      return;
    }

    const payload: { branchId?: string; fiscalYearId: string } = {
      fiscalYearId: selectedFiscalYearId,
    };

    // For unassociated users, branchId can be omitted for "All branches"
    if (selectedBranchId && !branchAssociated) {
      payload.branchId = selectedBranchId;
    } else if (branchAssociated && assignedBranchId) {
      payload.branchId = assignedBranchId;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await selectSessionContext(payload);
      if (!response.success) {
        setError(response.message || "Failed to select context.");
        return;
      }

      const {
        accessToken,
        branchId,
        branchName,
        branchScoped,
        fiscalYearId,
        fiscalYearLabel,
      } = response.data;

      if (!session) {
        throw new Error("No active session");
      }

      // Create updated session with new token and context details
      const updatedSession: AuthSession = {
        ...session,
        accessToken,
        branchId,
        branchName,
        branchScoped,
        fiscalYearId,
        fiscalYearLabel,
      };

      setSessionCall(updatedSession);

      // Navigate to default route
      navigate(getDefaultRoute(updatedSession.user), { replace: true });
    } catch (err) {
      setError("Unable to select context. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-primary" />
          <p className="mt-2 text-gray-600">Loading workspace settings...</p>
        </div>
      </div>
    );
  }

  if (branches.length === 0 || fiscalYears.length === 0) {
    const isAdmin = session?.user?.roles?.includes("ADMIN") || session?.user?.roles?.includes("HR");

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-sm shadow-xl p-8 max-w-md w-full text-center">
          {isAdmin ? (
            <>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🏗️</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Company Setup Required</h2>
              <p className="text-gray-500 mt-2 text-sm">
                <span className="font-bold text-lg"> Welcome to <span className="text-primary">Dot</span>HR!</span> <br></br> To access the dashboard, you need to configure your <span className="font-bold text-red-500">company details,
                branches, and financial year</span>  first.
              </p>
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => navigate(redirectAfterSelect())}
                  className="w-full bg-primary text-white text-sm py-3 rounded-sm font-semibold hover:bg-primary-dark transition"
                >
                  Start Company Setup
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="w-full text-gray-500 text-sm py-2 hover:text-primary transition underline"
                >
                  Back to Login
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⏳</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Workspace Pending Setup</h2>
              <p className="text-gray-500 mt-2 text-sm">
                Your company workspace is currently being configured.
                Please contact your system administrator.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => navigate("/logout")}
                  className="w-full bg-gray-600 text-white text-sm py-3 rounded-sm font-semibold hover:bg-gray-700 transition"
                >
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-sm shadow-xl p-8">
        <h1 className="text-2xl font-semibold text-gray-900 text-center">
          Select Workspace
        </h1>
        <p className="text-sm text-gray-500 text-center mt-2">
          Choose the branch and financial year for your session.
        </p>

        <div className="mt-6 space-y-4">
          {/* Branch selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Branch
            </label>
            {branchAssociated ? (
              <div className="mt-1 text-sm text-gray-900 bg-gray-100 px-3 py-2 rounded-sm border border-gray-200">
                {branches.find(b => b.id === assignedBranchId)?.name || "Assigned branch"}
                <span className="ml-2 text-xs text-gray-500">(locked)</span>
              </div>
            ) : (
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="mt-1 w-full bg-white text-sm px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                disabled={submitting}
              >
                <option value="">All branches</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Fiscal Year selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Financial Year
            </label>
            <select
              value={selectedFiscalYearId}
              onChange={(e) => setSelectedFiscalYearId(e.target.value)}
              className="mt-1 w-full bg-white text-sm px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              disabled={submitting}
            >
              {fiscalYears.map((fy) => (
                <option key={fy.id} value={fy.id}>
                  {fy.label} {fy.active ? "(Active)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-sm px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !selectedFiscalYearId}
          className="mt-6 w-full bg-primary text-white text-sm py-3 rounded-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Applying...
            </span>
          ) : (
            "Continue"
          )}
        </button>
      </div>
    </div>
  );
}