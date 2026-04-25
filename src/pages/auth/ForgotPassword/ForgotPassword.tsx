// ForgotPassword.jsx
import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    console.log("Reset password for:", email);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen  bg-gray-100 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl h-[85vh]  bg-white rounded-sm p-[25px] shadow-xl grid grid-cols-1 gap-6 md:grid-cols-2 overflow-hidden"
      >
        {/* Left Section */}
        <div className="bg-gradient-to-bl rounded-xl from-orange-50 to-gray-100 p-10 flex flex-col justify-between">
          <div>
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-8">
                <div className="w-4 h-4 bg-[#e16a3d] rounded-sm rotate-45"></div>
                <span className="font-bold text-gray-700">
                  Vibe<span className="text-[#e16a3d]">HR</span>
                </span>
              </div>
            </div>
            <p className="text-2xl font-bold mb-4">
              No{" "}
              <span className="text-[#e16a3d]">
                Worries. <br />
              </span>
              These things happen.
            </p>
            <div className="mb-8 text-[12px] text-gray-600">
              <p></p>
              <p>Enter your Login ID and we'll help you reset</p>
            </div>
            <div className="flex items-center">
              <img src="src/assets/forgot.png" width="30%" />
            </div>
          </div>
          <div className="space-y-4 text-sm mb-8">
            <p className="mb-2 font-semibold  text-orange-600">Security Tip</p>
            <p className="text-[12px] text-gray-600">
              Always use a strong and unique password for your account.
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="p-10 flex flex-col justify-center relative">
          <img
            src="src/assets/pinnacle.jpg"
            width="40%"
            className="absolute top-[0] right-[0]"
          />
          {!submitted ? (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  Forgot <span className="text-[#e16a3d]">Password?</span>
                </h2>
                <p className="text-gray-400 text-[12px]">
                  Enter your email to reset your password
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="tuhelrana@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-sm px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>
                {/* Reset Password Button */}
                <button
                  type="submit"
                  className="w-full bg-[#e16a3d] text-white text-sm py-2.5 rounded-lg font-semibold cursor-pointer"
                >
                  Send Reset Link
                </button>
                {/* Back to Login Link */}
                <div className="text-center pt-4">
                  <Link
                    to="/login"
                    className="text-sm text-[#e16a3d] hover:text-orange-600 font-medium"
                  >
                    ← Back to Sign In
                  </Link>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-[#e16a3d]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Check your Inbox
                </h3>
                <p className="text-gray-500 text-sm">
                  We've sent a password reset link to
                  <br />
                  <span className="font-medium text-green-700">{email}</span>
                </p>
              </div>
              <Link
                to="/login"
                className="text-sm inline-block w-full bg-[#e16a3d] text-white py-2.5 rounded-lg font-semibold transition duration-200 text-center"
              >
                Back to Sign In
              </Link>
            </div>
          )}
          {/* Footer Text */}
          <div className="text-center pt-8 mt-4">
            <p className="text-xs text-gray-400">
              One platform for all HR needs
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default ForgotPassword;