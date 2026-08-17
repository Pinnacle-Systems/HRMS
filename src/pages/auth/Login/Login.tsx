import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUI } from "../../../context/Snackbar";
import { useAuth } from "../../../auth/authContext";
import { redirectAfterAuth } from "../../../auth/authMapper";
import { buildLoginRequest } from "../../../auth/authApi";
import grp from '../../../assets/grp.png';
import pinnacle from '../../../assets/pinnacle.jpg';

type LoginLocationState = {
  tenantId?: string;
  email?: string;
  verified?: boolean;
  fromSignup?: boolean;
};

export default function Login() {
  const location = useLocation();
  const locationState = (location.state || {}) as LoginLocationState;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [mobileOtp, setMobileOtp] = useState("");
  const [visible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const { login } = useAuth();

  const navigateToOtpVerification = (identifier: string, type: string = "SIGNUP") => {
    navigate("/verify-otp", {
      replace: true,
      state: {
        email: type === "SIGNUP" ? identifier : undefined,
        mobileNumber: type === "MOBILE_LOGIN" ? identifier : undefined,
        type: type,
        fromLogin: true
      }
    });
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
      const outcome: any = await login(
        buildLoginRequest({
          loginId: email,
          password,
          tenantId: locationState.tenantId,
        })
      );

      switch (outcome.type) {
        case "authenticated":
          if (outcome.mfaSetupRequired) {
            showSnackbar("Please set up Multi-Factor Authentication", "warning");
            navigate("/mfa-setup", {
              replace: true,
              state: { session: outcome.session, fromLogin: true }
            });
          } else {
            redirectAfterAuth(outcome.session, navigate);
          }
          break;
        
        case "mfaRequired":
          navigate("/mfa", {
            replace: true,
            state: {
              sessionToken: outcome.sessionToken,
              mfaType: outcome.mfaType,
              email: email,
              password: password
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
              loginId: email,
              password: password,
              isMobileLogin: false,
            },
          });
          break;

        case "mustChangePassword":
          navigate("/reset-password", {
            replace: true,
            state: {
              email: outcome.email || email,
              token: outcome.session?.accessToken
            },
          });
          break;

        case "failed":
          if (outcome.message?.toLowerCase().includes("email not verified")) {
            showSnackbar("Email not verified. Please verify your email first.", "warning");
            navigateToOtpVerification(email, "SIGNUP");
          } else {
            showSnackbar(outcome.message, "error");
            setError(outcome.message || "Login failed");
          }
          break;
      }
    } catch (err: any) {
      if (err.message.includes(401)) {
        const errMsg = "Invalid Credentials";
        showSnackbar(errMsg, "error");
        setError(errMsg);
      }
    } finally {
      hideSpinner();
    }
  };

  // Handle mobile number + TOTP login
  const handleMobileLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate mobile number
    if (!mobileNumber || mobileNumber.length < 10) {
      showSnackbar("Please enter a valid 10-digit mobile number", "warning");
      return;
    }

    // Validate TOTP
    if (!mobileOtp || mobileOtp.length < 6) {
      showSnackbar("Please enter the 6-digit TOTP from Google Authenticator", "warning");
      return;
    }

    setError("");
    showSpinner();

    try {
      const outcome: any = await login(
        buildLoginRequest({
          mobileNumber: '+91' + mobileNumber,
          mobileOtp: mobileOtp, // TOTP from Google Authenticator
          tenantId: locationState.tenantId,
        })
      );

      switch (outcome.type) {
        case "authenticated":
          if (outcome.mfaSetupRequired) {
            showSnackbar("Please set up Multi-Factor Authentication", "warning");
            navigate("/mfa-setup", {
              replace: true,
              state: { session: outcome.session, fromLogin: true }
            });
          } else {
            redirectAfterAuth(outcome.session, navigate);
          }
          break;

        case "mfaRequired":
          navigate("/mfa", {
            replace: true,
            state: {
              sessionToken: outcome.sessionToken,
              mfaType: outcome.mfaType,
              mobileNumber: mobileNumber,
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
              mobileNumber: mobileNumber,
              mobileOtp: mobileOtp,
              isMobileLogin: true,
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
          setError(outcome.message || "Login failed");
          showSnackbar(outcome.message || "Login failed", "error");
          break;

        default:
          setError("Unexpected response from server");
          showSnackbar("Unexpected response", "error");
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to process mobile login";
      setError(errMsg);
      showSnackbar(errMsg, "error");
      console.error("Mobile login error:", err);
    } finally {
      hideSpinner();
    }
  };

  const navigateToSignup = () => {
    navigate("/signup", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl min-h-[90vh] bg-white rounded-sm p-[25px] shadow-xl grid grid-cols-1 gap-6 md:grid-cols-2 overflow-hidden"
      >
        {/* Left Section */}
        <div className="rounded-xl p-10 flex flex-col justify-between bg-gradient-to-bl from-primary-50 to-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-4 h-4 bg-primary rounded-sm rotate-45"></div>
              <span className="font-bold text-gray-700">
                Dot<span className="text-primary">HR</span>
              </span>
            </div>
            <h1 className="text-2xl font-semibold leading-snug mb-6">
              Sign in to <br />
              Dot<span className="text-primary">HR</span>
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
            Dot<span className="text-primary">HR</span> Platform
          </h2>
          <div className="text-[12px] mb-8 text-gray-400">
            {isMobile 
              ? "Enter your mobile number and TOTP to access your dashboard" 
              : "Enter your credentials to access your dashboard"
            }
          </div>

          <form onSubmit={isMobile ? handleMobileLogin : handleEmailLogin} className="space-y-5">
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
                    placeholder="employee@company.com or Emp ID"
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

                {/* {error && (
                  <div className="text-sm text-error bg-red-50 border border-red-100 rounded-sm px-3 py-2">
                    {error}
                  </div>
                )} */}

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
                    placeholder="Enter your 10-digit mobile number"
                    className="w-full bg-white text-sm px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none transition"
                    required
                    maxLength={10}
                  />
                  {/* <p className="text-xs text-gray-400 mt-1">
                    Enter the mobile number registered with your account
                  </p> */}
                </div>

                {/* TOTP Input */}
                <div>
                  <label className="block text-sm mb-2" htmlFor="mobileOtp">
                    Google Authenticator TOTP
                  </label>
                  <input
                    id="mobileOtp"
                    type="text"
                    inputMode="numeric"
                    value={mobileOtp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      setMobileOtp(value);
                    }}
                    placeholder="Enter 6-digit TOTP from Google Authenticator"
                    className="w-full bg-white text-sm px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none transition"
                    required
                    maxLength={6}
                  />
                  {/* <p className="text-xs text-gray-400 mt-1">
                    Open Google Authenticator app and enter the 6-digit code
                  </p> */}
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
                  Sign in with Mobile
                </button>
              </>
            )}
          </form>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                setIsMobile(!isMobile);
                setError("");
                setMobileNumber("");
                setMobileOtp("");
                setEmail("");
                setPassword("");
              }}
              className="w-full mt-6 text-sm text-primary border border-primary-dark py-3 rounded-sm font-semibold transition cursor-pointer hover:bg-primary-50"
            >
              {isMobile ? "Back to Email Sign In" : "Login with Mobile Number"}
            </button>

            <button
              onClick={navigateToSignup}
              className="w-full text-xs text-gray-500 hover:text-primary transition cursor-pointer"
            >
              New user? Create an account
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}