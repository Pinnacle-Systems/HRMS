import { Link, useLocation } from "react-router-dom";

type MfaLocationState = {
  sessionToken?: string;
  mfaType?: string;
};

export default function MfaPage() {
  const location = useLocation();
  const state = (location.state || {}) as MfaLocationState;

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
        <Link
          to="/login"
          className="inline-block w-full text-center bg-primary text-white text-sm py-3 rounded-sm font-semibold"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
