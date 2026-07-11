import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUI } from "../../../context/Snackbar";
import { useAuth } from "../../../auth/authContext";
import { getDefaultRoute } from "../../../auth/authMapper";
import { buildLoginRequest } from "../../../auth/authApi";
import grp from '../../../assets/grp.png';
import pinnacle from '../../../assets/pinnacle.jpg';

type LoginLocationState = {
  tenantId?: string;
  email?: string;
};

export default function Login() {
  const location = useLocation();
  const locationState = (location.state || {}) as LoginLocationState;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [visible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [_isOtpSent, setIsOtpSent] = useState(false);
  const [error, setError] = useState("");
  // const [otpTimer, setOtpTimer] = useState(0);
  const navigate = useNavigate();
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const { login } = useAuth();

  // Auto-navigate to OTP page when OTP is sent
  const navigateToOtp = (mobileNumber: string) => {
    navigate("/verify-otp", {
      replace: true,
      state: {
        mobileNumber: mobileNumber,
        type: "MOBILE_LOGIN",
        fromLogin: true
      }
    });
  };

  // Handle mobile number submission (Send OTP)
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileNumber || mobileNumber.length < 10) {
      showSnackbar("Please enter a valid mobile number", "warning");
      return;
    }

    setError("");
    showSpinner();

    try {
      // Step 1: Send OTP by calling login without OTP
      const outcome = await login(
        buildLoginRequest({
          mobileNumber: mobileNumber,
          // No mobileOtp - this triggers OTP sending
        })
      );

      // Handle response
      switch (outcome.type) {
        case "authenticated":
          // User might already have session or doesn't need OTP
          navigate(getDefaultRoute(outcome.session.user), { replace: true });
          break;

        case "mfaRequired":
          // If MFA is also required, handle it
          navigate("/mfa", {
            replace: true,
            state: {
              sessionToken: outcome.sessionToken,
              mfaType: outcome.mfaType,
            },
          });
          break;

        case "tenantSelection":
          navigate("/select-tenant", {
            replace: true,
            state: {
              tenants: outcome.tenants,
              email: outcome.email || mobileNumber,
              sessionToken: outcome.sessionToken,
            },
          });
          break;

        case "mustChangePassword":
          navigate("/reset-password", {
            replace: true,
            state: {
              email: outcome.email || mobileNumber,
            },
          });
          break;

        case "failed":
          // If login fails, it might mean OTP was sent successfully
          // or there was an error
          if (outcome.message?.includes("OTP")) {
            // OTP sent successfully - navigate to OTP page
            setIsOtpSent(true);
            showSnackbar("OTP sent to your mobile number", "success");
            navigateToOtp(mobileNumber);
          } else {
            setError(outcome.message || "Failed to send OTP");
            showSnackbar(outcome.message, "error");
          }
          break;

        default:
          // Assume OTP was sent successfully
          setIsOtpSent(true);
          showSnackbar("OTP sent to your mobile number", "success");
          navigateToOtp(mobileNumber);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to send OTP";
      setError(errMsg);
      showSnackbar(errMsg, "error");
    } finally {
      hideSpinner();
    }
  };

  // Handle email/password login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showSnackbar("Please enter email and password", "warning");
      return;
    }

    setError("");
    showSpinner();

    try {
      const outcome = await login(
        buildLoginRequest({
          loginId: email,
          password,
          tenantId: locationState.tenantId,
        })
      );

      switch (outcome.type) {
        case "authenticated":
           if (outcome.mfaSetupRequired) {
            // Show notification or redirect to MFA setup
            showSnackbar("Please set up Multi-Factor Authentication for enhanced security", "warning");
            navigate("/mfa-setup", {
              replace: true,
              state: {
                session: outcome.session,
                fromLogin: true
              }
            });
          } else {
            navigate(getDefaultRoute(outcome.session.user), { replace: true });
          }
          // navigate(getDefaultRoute(outcome.session.user), { replace: true });
          break;
        case "mfaRequired":
          navigate("/mfa", {
            replace: true,
            state: {
              sessionToken: outcome.sessionToken,
              mfaType: outcome.mfaType,
            },
          });
          break;
        case "tenantSelection":
          navigate("/select-tenant", {
            replace: true,
            state: {
              tenants: outcome.tenants,
              email: outcome.email || email,
              sessionToken: outcome.sessionToken,
            },
          });
          break;
        case "mustChangePassword":
          navigate("/reset-password", {
            replace: true,
            state: {
              email: outcome.email || email,
            },
          });
          break;
        case "failed":
          showSnackbar(outcome.message, "error");
          setError(outcome.message);
          break;
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An error occurred";
      showSnackbar(errMsg, "error");
      setError("Invalid email or password");
    } finally {
      hideSpinner();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl h-[85vh] bg-white rounded-sm p-[25px] shadow-xl grid grid-cols-1 gap-6 md:grid-cols-2 overflow-hidden"
      >
        {/* Left Section */}
        <div className="rounded-xl p-10 flex flex-col justify-between bg-gradient-to-bl from-primary-50 to-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-4 h-4 bg-primary rounded-sm rotate-45"></div>
              <span className="font-bold text-gray-700">
                Vibe<span className="text-primary">HR</span>
              </span>
            </div>
            <h1 className="text-2xl font-semibold leading-snug mb-6">
              Sign in to <br />
              Vibe<span className="text-primary">HR</span>
            </h1>
            <div className="flex items-center justify-center">
              <img src={grp} width="50" height="100" alt="group" />
              <p className="text-gray-600 max-w-sm text-[11px] ml-4 text-justify">
                Access payroll, attendance, onboarding, employee records, and
                company workflows from one secure HRMS workspace.
              </p>
            </div>
          </div>
          <div className="mb-10 text-[12px] bg-white text-gray-400 rounded-sm shadow px-2 py-6 grid grid-cols-3 justify gap-2">
            <div className="border-r border-gray-300 text-center pr-2">
              <div>🏆</div>
              <div>10+</div>
              <div>Years</div>
            </div>
            <div className="border-r border-gray-300 text-center pr-2">
              <div>👥</div>
              <div>500+</div>
              <div>Employees</div>
            </div>
            <div className="text-center pr-2">
              <div>⭐</div>
              <div>98%</div>
              <div>Satisfaction</div>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="p-10 flex flex-col justify-center relative">
          <h2 className="text-2xl font-semibold mb-2">
            <img
              src={pinnacle}
              width="40%"
              className="absolute top-[0] right-[0]"
              alt="pinnacle"
            />
            Welcome in <br />
            Vibe<span className="text-primary">HR</span> Platform
          </h2>
          <div className="text-[12px] mb-8 text-gray-400">
            Enter your credentials to access your dashboard
          </div>

          <form onSubmit={isMobile ? handleSendOtp : handleEmailLogin} className="space-y-5">
            {!isMobile ? (
              <>
                {/* Email/Login ID */}
                <div>
                  <label className="block text-sm mb-2" htmlFor="email">
                    Email or Employee ID
                  </label>
                  <input
                    id="email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="employee@company.com OR Emp ID"
                    className="w-full bg-white text-sm px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none transition"
                    required
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <label className="block text-sm mb-2" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    type={visible ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-white text-sm px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none transition"
                    required
                  />
                  <div className="absolute top-[38px] right-[0]">
                    <i
                      className="material-icons mr-2 !text-[16px] text-primary hover:text-primary-dark cursor-pointer"
                      onClick={() => setIsVisible(!visible)}
                    >
                      {visible ? "visibility" : "visibility_off"}
                    </i>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-gray-500">
                    <input type="checkbox" className="accent-primary" />
                    Remember this device
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-primary hover:text-primary-dark"
                  >
                    Forgot password?
                  </Link>
                </div>

                {error && (
                  <div className="text-sm text-error bg-red-50 border border-red-100 rounded-sm px-3 py-2">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full mt-2 text-sm bg-primary text-white py-3 rounded-sm font-semibold transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                {/* Mobile Number Input */}
                <div>
                  <label className="block text-sm mb-2" htmlFor="mobileNumber">
                    Mobile Number
                  </label>
                  <input
                    id="mobileNumber"
                    type="tel"
                    inputMode="tel"
                    value={mobileNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      setMobileNumber(value);
                    }}
                    placeholder="Enter your mobile number"
                    className="w-full bg-white text-sm px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none transition"
                    required
                    maxLength={10}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    OTP will be sent to this number for verification
                  </p>
                </div>

                {error && (
                  <div className="text-sm text-error bg-red-50 border border-red-100 rounded-sm px-3 py-2">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full mt-2 text-sm bg-primary text-white py-3 rounded-sm font-semibold transition cursor-pointer hover:bg-primary-dark"
                >
                  Send OTP
                </button>
              </>
            )}
          </form>

          <div>
            <button
              type="button"
              onClick={() => {
                setIsMobile(!isMobile);
                setError("");
                setMobileNumber("");
                setEmail("");
                setPassword("");
              }}
              className="w-full mt-6 text-sm text-primary border border-primary-dark py-3 rounded-sm font-semibold transition cursor-pointer hover:bg-primary-50"
            >
              {isMobile ? "Back to Email Sign In" : "Login with Mobile Number"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}