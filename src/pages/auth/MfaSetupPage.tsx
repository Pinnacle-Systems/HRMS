import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/authContext";
import { useUI } from "../../context/Snackbar";
import { authService } from "../../services/modules/auth";
import { getDefaultRoute, redirectAfterAuth } from "../../auth/authMapper";

export default function MfaSetupPage() {
  const { session, isAuthenticated, refreshSession } = useAuth();
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const navigate = useNavigate();

  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [accountName, setAccountName] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isEnabling, setIsEnabling] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }

    // Initialize MFA setup
    initializeMfaSetup();
  }, [isAuthenticated, navigate]);

  const initializeMfaSetup = async () => {
    setIsLoading(true);
    showSpinner();

    try {
      const response: any = await authService.mfaSetup({ mfaType: "TOTP" });

      if (response.success && response.data) {
        setQrCode(response.data.qrCodeImageBase64 || response.data.qrCodeUri);
        setSecret(response.data.secret);
        setAccountName(response.data.accountName);
        showSnackbar("Scan the QR code with your authenticator app", "info");
      } else {
        showSnackbar(response.message || "Failed to setup MFA", "error");
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      showSnackbar("Error setting up MFA", "error");
    } finally {
      hideSpinner();
      setIsLoading(false);
    }
  };

  const handleEnable = async () => {
    if (!code || code.length < 6) {
      showSnackbar("Please enter a valid 6-digit code", "warning");
      return;
    }

    // Type guard: Ensure session and user exist
    if (!session?.user) {
      showSnackbar("Session expired. Please login again.", "error");
      navigate("/login", { replace: true });
      return;
    }

    setIsEnabling(true);
    showSpinner();

    try {
      const response = await authService.enableMfa({
        code,
        mfaType: "TOTP"
      });

      if (response.success) {
        showSnackbar("MFA enabled successfully!", "success");
        const refreshed = await refreshSession();
        if (refreshed) {
          redirectAfterAuth(refreshed, navigate);
        } else {
          redirectAfterAuth(session, navigate);
        }
        // await refreshSession();
        // const currentSession = useAuth().session;
        // redirectAfterAuth(currentSession, navigate);
        // navigate(getDefaultRoute(session.user), { replace: true });
      } else {
        showSnackbar(response.message || "Invalid code. Please try again.", "error");
        setCode(""); // Clear the input
      }
    } catch (error) {
      showSnackbar("Failed to enable MFA. Please try again.", "error");
    } finally {
      hideSpinner();
      setIsEnabling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-500">Setting up MFA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-2">
          Set Up Two-Factor Authentication
        </h2>
        <p className="text-center text-gray-500 text-sm mb-6">
          Enhance your account security with 2FA
        </p>

        <div className="space-y-6">
          {/* QR Code Section */}
          <div className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              {qrCode ? (
                <img
                  src={qrCode}
                  alt="MFA QR Code"
                  className="w-48 h-48 object-contain"
                />
              ) : (
                <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400">QR Code</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Scan with Google Authenticator, Authy, or similar app
            </p>
          </div>

          {/* Manual Secret */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Manual Setup Key</p>
            <code className="text-sm font-mono bg-white px-3 py-2 rounded border border-gray-200 block text-center">
              {secret}
            </code>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Account: {accountName}
            </p>
          </div>

          {/* Verification Code Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                setCode(value.slice(0, 6));
              }}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-center text-lg tracking-widest"
              disabled={isEnabling}
            />
            <p className="text-xs text-gray-400 mt-1">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleEnable}
              disabled={!code || code.length < 6 || isEnabling}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isEnabling ? "Enabling..." : "Verify & Enable MFA"}
            </button>

            <button
              onClick={() => {
                if (session?.user) {
                  navigate(getDefaultRoute(session.user), { replace: true });
                } else {
                  navigate("/login", { replace: true });
                }
              }}
              className="w-full text-gray-500 text-sm hover:text-gray-700 transition"
            >
              Skip for now
            </button>
          </div>

          {/* Security Note */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <p className="text-xs text-blue-700">
              🔒 After enabling MFA, you'll need to enter a verification code
              from your authenticator app each time you sign in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}