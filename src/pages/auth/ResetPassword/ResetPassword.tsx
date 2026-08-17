import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authService } from "../../../services/modules/auth";
import { useUI } from "../../../context/Snackbar";
import reset from '../../../assets/reset.png';
import pinnacle from '../../../assets/pinnacle.jpg';
import { passwordPolicyService, type PasswordPolicyResponse } from "../../../services/modules/passwordPolicy";
import {
  FALLBACK_PASSWORD_POLICY,
  validatePasswordAgainstPolicy,
} from "../../../utils/passwordPolicyValidation";

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const tokenFromUrl = searchParams.get("token");
  // const emailFromUrl = searchParams.get("email");
  const tenantIdFromUrl = searchParams.get("tenantId");
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visible1, setVisible1] = useState(false);
  const [visible2, setVisible2] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [passwordPolicy, setPasswordPolicy] = useState<PasswordPolicyResponse>(
    FALLBACK_PASSWORD_POLICY,
  );
  
  const token = tokenFromUrl || localStorage.getItem("resetToken");
  // const email = emailFromUrl || localStorage.getItem("resetEmail");
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const passwordValidationMessages = validatePasswordAgainstPolicy(
    newPassword,
    passwordPolicy,
  );
  const passwordMatch = confirmPassword === "" || newPassword === confirmPassword;
  const isPasswordValid = passwordValidationMessages.length === 0;

  useEffect(() => {
    if (!token) {
      showSnackbar("Reset token is missing. Please use the password reset link from your email.", "warning");
      return;
    }

    let isMounted = true;

    // Fetch password policy with tenantId if available
    const fetchPolicy = async () => {
      try {
        const policy = await passwordPolicyService.getPasswordPolicy({
          tenantId: tenantIdFromUrl || undefined, ///02870784-b41e-4e4f-b3f9-5f66757d1481
        });
        if (isMounted) {
          setPasswordPolicy(policy);
        }
      } catch (error) {
        if (isMounted) {
          setPasswordPolicy(FALLBACK_PASSWORD_POLICY);
        }
      }
    };

    fetchPolicy();

    return () => {
      isMounted = false;
    };
  }, [showSnackbar, token, tenantIdFromUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      showSnackbar("Reset token is missing. Please use the password reset link from your email.", "warning");
      return;
    }

    if (!isPasswordValid) {
      showSnackbar("Please meet all password requirements", "warning");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showSnackbar("Passwords do not match", "warning");
      return;
    }

    showSpinner();
    
    try {
      const response = await authService.resetPassword({
        resetToken: token,
        newPassword,
        confirmPassword,
        tenantId: tenantIdFromUrl || undefined,
      });
      
      if (response.success) {
        showSnackbar(response.message || "Password updated successfully!", "success");
        setSubmitted(true);
        
        // Clear stored reset data
        localStorage.removeItem("resetToken");
        localStorage.removeItem("resetEmail");
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/login", { 
            replace: true,
            state: { passwordReset: true }
          });
        }, 3000);
      } else {
        showSnackbar(response.message || "Failed to reset password. Please try again.", "error");
      }
    } catch (err: any) {
      showSnackbar(err.message || 'An error occurred while resetting password', "error");
    } finally {
      hideSpinner();
    }
  };

  // Get all password requirements with their status
  const getPasswordRequirements = () => {
    const requirements = [];

    // Minimum length
    requirements.push({
      message: `At least ${passwordPolicy.minPasswordLength} characters`,
      isValid: newPassword.length >= passwordPolicy.minPasswordLength
    });

    // Uppercase (if required)
    if (passwordPolicy.requireUppercase) {
      requirements.push({
        message: "Contains uppercase letter (A-Z)",
        isValid: /[A-Z]/.test(newPassword)
      });
    }

    // Lowercase (if required)
    if (passwordPolicy.requireLowercase) {
      requirements.push({
        message: "Contains lowercase letter (a-z)",
        isValid: /[a-z]/.test(newPassword)
      });
    }

    // Digit (if required)
    if (passwordPolicy.requireDigit) {
      requirements.push({
        message: "Contains number (0-9)",
        isValid: /\d/.test(newPassword)
      });
    }

    // Special character (if required)
    if (passwordPolicy.requireSpecialChar) {
      requirements.push({
        message: "Contains special character (!@#$%^&*(),.?\":{}|<>)",
        isValid: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
      });
    }

    return requirements;
  };

  const requirements = getPasswordRequirements();
  const allRequirementsMet = requirements.every(req => req.isValid);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl h-[85vh] bg-white rounded-sm p-[25px] shadow-xl grid grid-cols-1 gap-6 md:grid-cols-2 overflow-hidden"
      >
        {/* Left Section */}
        <div className="bg-gradient-to-bl rounded-xl from-primary-50 to-gray-100 p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-4 h-4 bg-primary rounded-sm rotate-45"></div>
              <span className="font-bold text-gray-700">
                Dot<span className="text-primary">HR</span>
              </span>
            </div>
            <p className="text-2xl font-bold mb-4">
              Fresh <span className="text-primary">Start. </span>
              <br />
              <span className="">Stronger access. </span>
            </p>
            <div className="flex items-center justify-center mb-4">
              <p className="text-gray-600 max-w-sm text-[12px] text-justify">
                Your new password must be different from previously used
                passwords.
              </p>
            </div>
            <img src={reset} width="30%" alt="Reset" />
          </div>
          <div className="space-y-4 text-sm mb-8">
            <p className="mb-2 font-semibold text-primary-dark">
              Password Reset Tips
            </p>
            <p className="text-[12px] text-gray-600 text-justify">
              Choose a strong password that you haven't used before. A strong
              password helps keep your account secure and protected.
            </p>
            <div className="bg-white/50 p-3 rounded-lg text-[11px] text-gray-500">
              <p>🔒 Password must meet all security requirements</p>
              <p className="mt-1">🔄 Cannot reuse previous passwords</p>
            </div>
          </div>
        </div>

        {/* Right Section - Reset Password Form */}
        <div className="p-10 flex flex-col justify-center relative">
          <img
            src={pinnacle}
            width="40%"
            className="absolute top-[0] right-[0]"
            alt="pinnacle"
          />
          {!submitted ? (
            <>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Reset Your <span className="text-primary">Password</span>
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
                    className={`w-full bg-white text-sm px-4 py-2 border ${
                      newPassword && !allRequirementsMet
                        ? 'border-red-500'
                        : newPassword && allRequirementsMet
                          ? 'border-green-500'
                          : 'border-gray-300'
                    } rounded-sm focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none transition`}
                    required
                  />
                  <div className="absolute top-[38px] right-[0]">
                    <i
                      className="material-icons mr-2 !text-[16px] text-primary hover:text-primary-dark cursor-pointer"
                      onClick={() => setVisible1(!visible1)}
                    >
                      {visible1 ? "visibility" : "visibility_off"}
                    </i>
                  </div>
                </div>

                {/* Password Requirements */}
                {newPassword && (
                  <div className="mb-4">
                    <div className="text-[12px] text-gray-600 mb-2">
                      Password requirements:
                    </div>
                    <div className="text-[11px] grid grid-cols-1 gap-1 text-gray-500">
                      {requirements.map((req, index) => (
                        <p
                          key={index}
                          className={`flex items-center gap-2 ${
                            req.isValid ? 'text-green-600' : 'text-gray-500'
                          }`}
                        >
                          <span className="text-[14px]">
                            {req.isValid ? '✓' : '○'}
                          </span>
                          {req.message}
                        </p>
                      ))}
                    </div>
                    {newPassword && !allRequirementsMet && (
                      <p className="text-[11px] text-red-500 mt-1">
                        Please meet all password requirements
                      </p>
                    )}
                  </div>
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
                    className={`w-full bg-white text-sm px-4 py-2 border ${
                      confirmPassword && !passwordMatch
                        ? 'border-red-500'
                        : confirmPassword && passwordMatch
                          ? 'border-green-500'
                          : 'border-gray-300'
                    } rounded-sm focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none transition`}
                    required
                  />
                  <div className="absolute top-[38px] right-[0]">
                    <i
                      className="material-icons mr-2 !text-[16px] text-primary hover:text-primary-dark cursor-pointer"
                      onClick={() => setVisible2(!visible2)}
                    >
                      {visible2 ? "visibility" : "visibility_off"}
                    </i>
                  </div>
                  {!passwordMatch && confirmPassword && (
                    <div className="mt-1 text-[11px] text-red-500 flex items-center gap-1">
                      <span>✗</span> Passwords do not match
                    </div>
                  )}
                  {passwordMatch && confirmPassword && (
                    <div className="mt-1 text-[11px] text-green-500 flex items-center gap-1">
                      <span>✓</span> Passwords match
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className={`w-full mt-4 text-sm text-white py-3 rounded-sm font-semibold cursor-pointer ${
                    allRequirementsMet && passwordMatch 
                      ? 'bg-primary hover:bg-primary-dark'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                  disabled={!allRequirementsMet || !passwordMatch}
                >
                  Reset Password
                </button>

                {/* Back to Login */}
                <div className="text-center mt-4">
                  <Link
                    to="/login"
                    className="text-sm text-primary hover:text-primary-dark"
                  >
                    ← Back to Sign In
                  </Link>
                </div>
              </form>
            </>
          ) : (
            // Success State
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Password <span className="text-primary">Reset</span>
              </h2>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Successfully!
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Your password has been reset successfully.
                <br />
                Redirecting you to login...
              </p>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mb-6">
                <div className="bg-primary h-1.5 rounded-full animate-pulse" style={{ width: '100%' }}></div>
              </div>
              <Link
                to="/login"
                className="inline-block w-full text-sm bg-primary text-white py-3 rounded-sm font-semibold transition cursor-pointer text-center hover:bg-primary-dark"
              >
                Go to Sign In
              </Link>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}