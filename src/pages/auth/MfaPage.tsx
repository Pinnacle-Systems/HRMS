import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUI } from "../../context/Snackbar";
import { authService } from "../../services/modules/auth";
import { getDefaultRoute, mapAuthResponseToSession } from "../../auth/authMapper";
import { saveSession } from "../../auth/authSession";

type MfaLocationState = {
  sessionToken?: string;
  mfaType?: string;
  email?: string;
};

export default function MfaPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state || {}) as MfaLocationState;
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const { showSnackbar, showSpinner, hideSpinner } = useUI();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!state.sessionToken || !code || code.length < 6) {
      showSnackbar("Please enter a valid 6-digit verification code.", "warning");
      return;
    }

    setIsVerifying(true);
    showSpinner();

    try {
      const response = await authService.mfaVerify({
        sessionToken: state.sessionToken,
        code,
      });

      if (response.success && response.data?.accessToken) {
        const session = mapAuthResponseToSession(response.data);
        saveSession(session);
        
        // Check if MFA setup is required
        if (response.data.mfaSetupRequired) {
          showSnackbar("Please set up Multi-Factor Authentication", "warning");
          navigate("/mfa-setup", {
            replace: true,
            state: { session, fromLogin: true }
          });
        } else {
          showSnackbar("MFA verified successfully!", "success");
          navigate(getDefaultRoute(session.user), { replace: true });
        }
        return;
      }

      showSnackbar(response.message || "Invalid verification code. Please try again.", "error");
      setCode(""); // Clear input on error
    } catch (err: unknown) {
      showSnackbar(err instanceof Error ? err.message : "Unable to verify MFA code.", "error");
      setCode("");
    } finally {
      hideSpinner();
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-sm shadow-xl p-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Verify your sign in
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Multi-factor verification is required for this account.
        </p>
        <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-sm p-3 mb-6">
          {state.mfaType ? `Verification type: ${state.mfaType}` : "Enter the code from your authenticator app."}
          {state.email && (
            <span className="block mt-1">Account: {state.email}</span>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(event) => {
              const value = event.target.value.replace(/\D/g, "");
              setCode(value.slice(0, 6));
            }}
            placeholder="Enter 6-digit MFA code"
            maxLength={6}
            className="w-full bg-white text-center text-lg tracking-widest px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none transition"
            disabled={isVerifying}
          />
          <button
            type="submit"
            disabled={isVerifying || code.length < 6}
            className="inline-block w-full text-center bg-primary text-white text-sm py-3 rounded-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? "Verifying..." : "Verify code"}
          </button>
        </form>
        <Link
          to="/login"
          className="inline-block w-full text-center text-primary text-sm py-3 rounded-sm font-semibold mt-3 hover:text-primary-dark"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}