import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visible1, setVisible1] = useState(false);
  const [visible2, setVisible2] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(true);
  const navigate = useNavigate();

  const [validation, setValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
  });
  const isPasswordValid =
    validation.length &&
    validation.uppercase &&
    validation.lowercase &&
    validation.number;

  useEffect(() => {
    setValidation({
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
    });
  }, [newPassword]);

  useEffect(() => {
    if (confirmPassword !== "") {
      setPasswordMatch(newPassword === confirmPassword);
    } else {
      setPasswordMatch(true);
    }
  }, [newPassword, confirmPassword]);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (!isPasswordValid) {
      alert("Please meet all password requirements");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMatch(false);
      return;
    }
    console.log("Password reset successfully:", { newPassword });
    setSubmitted(true);
    setTimeout(() => {
      navigate("/login");
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl h-[85vh] bg-white rounded-sm p-[25px] shadow-xl grid grid-cols-1 gap-6 md:grid-cols-2 overflow-hidden"
      >
        {/* Left Section */}
        <div className="bg-gradient-to-bl rounded-xl from-orange-50 to-gray-100 p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-4 h-4 bg-[#e16a3d] rounded-sm rotate-45"></div>
              <span className="font-bold text-gray-700">
                Vibe<span className="text-[#e16a3d]">HR</span>
              </span>
            </div>
            <p className="text-2xl font-bold mb-4">
              Fresh <span className="text-[#e16a3d]">Start. </span>
              <br />
              <span className="">Stronger access. </span>
            </p>
            <div className="flex items-center justify-center mb-4">
              <p className="text-gray-600 max-w-sm text-[12px]">
                Your new password must be different from previously used
                passwords.
              </p>
            </div>
            <img src="src/assets/reset.png" width="30%" />
          </div>
          <div className="space-y-4 text-sm mb-8">
            <p className="mb-2 font-semibold  text-orange-600">
              Password Reset Tips
            </p>
            <p className="text-[12px] text-gray-600">
              Choose a strong password that you haven't used before. A strong
              password helps keep your account secure and protected.
            </p>
          </div>
        </div>

        {/* Right Section - Reset Password Form */}
        <div className="p-10 flex flex-col justify-center relative">
          <img
            src="src/assets/pinnacle.jpg"
            width="40%"
            className="absolute top-[0] right-[0]"
            alt="pinnacle"
          />
          {!submitted ? (
            <>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Reset Your <span className="text-[#e16a3d]">Password</span>
              </h2>
              <div className="text-[12px] mb-8 text-gray-400">
                Create a new secure password for your account
              </div>
              <form onSubmit={handleSubmit}>
                {/* New Password */}
                <div className="relative mb-4">
                  <label className="block text-sm mb-2 text-gray-700">
                    New Password
                  </label>
                  <input
                    type={visible1 ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-4 text-sm py-2 border border-gray-400 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#e16a3d] pr-10"
                    required
                  />
                  <div className="absolute top-[38px] right-[0]">
                    <i
                      className="material-icons mr-2 !text-[16px] text-[#e16a3d] hover:text-orange-600 cursor-pointer"
                      onClick={() => setVisible1(!visible1)}
                    >
                      {visible1 ? "visibility" : "visibility_off"}
                    </i>
                  </div>
                </div>
                {/* Password Requirements */}
                {!!newPassword && !isPasswordValid && (
                  <>
                    <div className="text-[12px]  text-gray-600 mb-2">
                      Password strength:
                    </div>
                    <div className="text-[11px] grid grid-cols-2 text-gray-500 mb-8">
                      <p className={validation.length ? "text-green-600" : ""}>
                        ✓ At least 8 characters
                      </p>
                      <p
                        className={validation.uppercase ? "text-green-600" : ""}
                      >
                        ✓ At least one uppercase letter
                      </p>
                      <p
                        className={validation.lowercase ? "text-green-600" : ""}
                      >
                        ✓ At least one lowercase letter
                      </p>
                      <p className={validation.number ? "text-green-600" : ""}>
                        ✓ At least one number
                      </p>
                    </div>
                  </>
                )}
                {/* Confirm Password */}
                <div className="relative mb-6">
                  <label className="block text-sm mb-2 text-gray-700">
                    Confirm Password
                  </label>
                  <input
                    type={visible2 ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-4 text-sm py-2 border border-gray-400 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#e16a3d] pr-10"
                    required
                  />
                  <div className="absolute top-[38px] right-[0]">
                    <i
                      className="material-icons mr-2 !text-[16px] text-[#e16a3d] hover:text-orange-600 cursor-pointer"
                      onClick={() => setVisible2(!visible2)}
                    >
                      {visible2 ? "visibility" : "visibility_off"}
                    </i>
                  </div>
                </div>
                {!passwordMatch && confirmPassword && (
                  <div className="mt-2 text-[11px] text-red-500 flex items-center gap-1">
                    Passwords do not match
                  </div>
                )}
                <button
                  type="submit"
                  className={`w-full mt-4 text-sm text-white py-3 rounded-sm font-semibold cursor-pointer bg-[#e16a3d]`}
                >
                  Reset Password
                </button>
                {/* Back to Login */}
                <div className="text-center mt-4">
                  <Link
                    to="/login"
                    className="text-sm text-[#e16a3d] hover:text-orange-600"
                  >
                    ← Back to Sign In
                  </Link>
                </div>
              </form>
            </>
          ) : (
            // Success State
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-orange-500">✓</span>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Password <span className="text-[#e16a3d]">Reset</span>
              </h2>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Successfully!
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Your password has been reset successfully.
                <br />
                Redirecting you to login...
              </p>
              <Link
                to="/login"
                className="inline-block w-full text-sm bg-[#e16a3d] text-white py-3 rounded-sm font-semibold transition cursor-pointer text-center"
              >
                Go to Sign In
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}