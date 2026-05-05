import { Link } from "react-router-dom";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-sm shadow-xl p-8 text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Unable to determine access
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Your account is signed in, but this area is not available for your current access.
        </p>
        <Link
          to="/login"
          className="inline-block w-full bg-primary text-white text-sm py-3 rounded-sm font-semibold"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
