import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUI } from "../../context/Snackbar";
import { authService } from "../../services/modules/auth";
import { getDefaultRoute, mapAuthResponseToSession } from "../../auth/authMapper";
import { saveSession } from "../../auth/authSession";

type MfaLocationState = {
  sessionToken?: string;
  mfaType?: string;
};

export default function MfaPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state || {}) as MfaLocationState;
  const [code, setCode] = useState("");
  const { showSnackbar, showSpinner, hideSpinner } = useUI();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!state.sessionToken || !code) {
      showSnackbar("Enter the verification code to continue.", "warning");
      return;
    }

    showSpinner();
    try {
      const response = await authService.mfaVerify({
        sessionToken: state.sessionToken,
        code,
      });

      if (response.success && response.data?.accessToken) {
        const session = mapAuthResponseToSession(response.data);
        saveSession(session);
        navigate(getDefaultRoute(session.user), { replace: true });
        return;
      }

      showSnackbar(response.message || "MFA verification failed.", "error");
    } catch (err: unknown) {
      showSnackbar(err instanceof Error ? err.message : "Unable to verify MFA code.", "error");
    } finally {
      hideSpinner();
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
          {state.mfaType ? `Verification type: ${state.mfaType}` : "Verification type will be provided by your account settings."}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Enter MFA code"
            className="w-full bg-white text-sm px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none transition"
          />
          <button
            type="submit"
            className="inline-block w-full text-center bg-primary text-white text-sm py-3 rounded-sm font-semibold"
          >
            Verify code
          </button>
        </form>
        <Link
          to="/login"
          className="inline-block w-full text-center text-primary text-sm py-3 rounded-sm font-semibold mt-3"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
