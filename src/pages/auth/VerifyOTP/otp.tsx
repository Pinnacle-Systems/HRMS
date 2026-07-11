import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useUI } from "../../../context/Snackbar";
import { authService } from "../../../services/modules/auth";
import { useAuth } from "../../../auth/authContext";
import { getDefaultRoute } from "../../../auth/authMapper";
import { buildLoginRequest } from "../../../auth/authApi";
import otpImg from '../../../assets/otp.png';
import pinnacle from '../../../assets/pinnacle.jpg';

type VerifyOtpLocationState = {
  email?: string;
  mobileNumber?: string;
  type?: string;
  fromLogin?: boolean;
};

export default function VerifyOTP() {
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const location = useLocation();
  const state = (location.state || {}) as VerifyOtpLocationState;
  const [identifier, _setIdentifier] = useState<string>(
    state.mobileNumber || state.email || "your registered contact"
  );
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [error, setError] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const { login } = useAuth();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const canResend = timeLeft === 0;

  // Auto-send OTP on page load if from login
  useEffect(() => {
    if (state.fromLogin && state.mobileNumber && !otpSent) {
      autoSendOtp();
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    if (timeLeft === 0) return;

    const timer = window.setTimeout(() => {
      setTimeLeft((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [timeLeft]);

  // Auto-fill OTP from SMS (simulated - real implementation would use SMS retriever API)
  useEffect(() => {
    // This simulates auto-fill from SMS
    // In production, use Android SMS Retriever API or iOS SMS auto-fill
    const autoFillOtp = (code: string) => {
      if (code.length === 6 && /^\d+$/.test(code)) {
        const otpArray = code.split("");
        const newOtp = [...otp];
        for (let i = 0; i < 6; i++) {
          newOtp[i] = otpArray[i] || "";
        }
        setOtp(newOtp);
        // Auto-submit after 500ms delay
        setTimeout(() => {
          handleSubmit(newOtp.join(""));
        }, 500);
      }
    };

    // Listen for SMS (for web, this would be a placeholder)
    // In real implementation, use:
    // - Android: SMS Retriever API
    // - iOS: SMS auto-fill
    // - Web: Use SMS OTP via backend
    const messageListener = (event: MessageEvent) => {
      // Parse SMS content and extract OTP
      const sms = event.data;
      const otpMatch = sms?.match(/\b\d{6}\b/);
      if (otpMatch) {
        autoFillOtp(otpMatch[0]);
      }
    };

    window.addEventListener("message", messageListener);
    return () => window.removeEventListener("message", messageListener);
  }, []);

  // Auto-send OTP function
  const autoSendOtp = async () => {
    if (!state.mobileNumber) return;

    showSpinner();
    try {
      // Send OTP via login API without OTP
      const outcome = await login(
        buildLoginRequest({
          mobileNumber: state.mobileNumber,
        })
      );

      // If login returns authenticated, user might not need OTP
      if (outcome.type === "authenticated") {
        navigate(getDefaultRoute(outcome.session.user), { replace: true });
        return;
      }

      // If we get here, OTP was sent
      setOtpSent(true);
      setTimeLeft(60);
      showSnackbar("OTP sent to your mobile number", "success");
      
      // Focus on first input
      inputRefs.current[0]?.focus();
    } catch (err) {
      console.error("Failed to send OTP:", err);
    } finally {
      hideSpinner();
    }
  };

  const handleChange = (index: number, value: string): void => {
    if (value && !/^\d+$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(0, 1);
    setOtp(newOtp);
    setError("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are filled
    if (newOtp.every((digit) => digit !== "")) {
      setTimeout(() => {
        handleSubmit(newOtp.join(""));
      }, 300);
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ): void => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const setInputRef = (index: number) => (el: HTMLInputElement | null) => {
    inputRefs.current[index] = el;
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>): void => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const otpArray = pastedData.split("");
      const newOtp = [...otp];
      for (let i = 0; i < otpArray.length; i++) {
        newOtp[i] = otpArray[i];
      }
      setOtp(newOtp);
      const lastIndex = Math.min(otpArray.length - 1, 5);
      inputRefs.current[lastIndex]?.focus();

      // Auto-submit if all digits filled
      if (newOtp.every((digit) => digit !== "")) {
        setTimeout(() => {
          handleSubmit(newOtp.join(""));
        }, 300);
      }
    }
  };

  const handleSubmit = async (otpValue?: string) => {
    const code = otpValue || otp.join("");
    
    if (code.length < 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }

    if (isVerifying) return;
    setIsVerifying(true);
    showSpinner();

    try {
      // For mobile login flow
      if (state.fromLogin && state.mobileNumber) {
        // Verify OTP by calling login with OTP
        const outcome = await login(
          buildLoginRequest({
            mobileNumber: state.mobileNumber,
            mobileOtp: code,
          })
        );

        switch (outcome.type) {
          case "authenticated":
            showSnackbar("Login successful!", "success");
            navigate(getDefaultRoute(outcome.session.user), { replace: true });
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
                email: outcome.email || state.mobileNumber,
                sessionToken: outcome.sessionToken,
              },
            });
            break;
          case "mustChangePassword":
            navigate("/reset-password", {
              replace: true,
              state: {
                email: outcome.email || state.mobileNumber,
              },
            });
            break;
          case "failed":
            setError(outcome.message || "Invalid OTP. Please try again.");
            showSnackbar(outcome.message || "Invalid OTP", "error");
            break;
        }
      } else {
        // For other OTP verification (password reset, etc.)
        const response = await authService.verifyOtp({
          email: state.email || "",
          otp: code,
          type: state.type || "RESET_PASSWORD",
        });

        if (response.success) {
          showSnackbar(response.message || "OTP verified successfully.", "success");
          navigate("/reset-password", { 
            replace: true,
            state: { email: state.email }
          });
        } else {
          setError(response.message || "Unable to verify OTP.");
          showSnackbar(response.message || "Unable to verify OTP.", "error");
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Unable to verify OTP.";
      setError(errorMsg);
      showSnackbar(errorMsg, "error");
    } finally {
      hideSpinner();
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    try {
      if (state.fromLogin && state.mobileNumber) {
        // Resend OTP via login
        await login(
          buildLoginRequest({
            mobileNumber: state.mobileNumber,
          })
        );
        showSnackbar("OTP resent successfully", "success");
      } else {
        // Resend for other flows
        await authService.verifyOtp({
          email: state.email || "",
          otp: "",
          type: state.type || "RESEND",
        });
        showSnackbar("OTP resent successfully", "success");
      }
      
      setTimeLeft(60);
      setOtp(["", "", "", "", "", ""]);
      setError("");
      inputRefs.current[0]?.focus();
    } catch {
      showSnackbar("Failed to resend OTP", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl bg-white rounded-sm p-[25px] shadow-xl grid grid-cols-1 gap-6 md:grid-cols-2 overflow-hidden"
        style={{ height: "auto", minHeight: "85vh" }}
      >
        {/* Left Section */}
        <div className="bg-gradient-to-bl rounded-xl from-primary-50 to-gray-100 p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-4 h-4 bg-primary rounded-sm rotate-45"></div>
              <span className="font-bold text-gray-700">
                Vibe<span className="text-primary">HR</span>
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 leading-snug mb-4">
              Verify Your <span className="text-primary">Identity.</span>
            </h1>
            <div className="flex items-center justify-center mb-4">
              <p className="text-gray-600 max-w-sm text-[12px]">
                {state.fromLogin 
                  ? "We've sent a 6-digit OTP to your mobile number for secure login." 
                  : "For your security, we need to verify your identity before resetting your password."}
              </p>
            </div>
            <img src={otpImg} width="100" alt="OTP" />
          </div>

          <div className="mb-10 text-[12px] bg-white text-gray-600 rounded-sm shadow px-4 py-4">
            <p className="mb-2">
              📱 <span className="font-bold">OTP Sent to:</span>
              <br />
              <span className="text-primary-dark font-medium">
                {state.mobileNumber ? `+91${state.mobileNumber}` : identifier}
              </span>
              <br />
            </p>
            <span className="text-gray-400">
              {state.fromLogin 
                ? "The OTP will auto-fill when received" 
                : "Check your SMS inbox if you don't receive the code."}
            </span>
          </div>
        </div>

        {/* Right Section - OTP Verification Form */}
        <div className="p-10 flex flex-col justify-center relative">
          <img
            src={pinnacle}
            width="40%"
            className="absolute top-0 right-0"
            alt="pinnacle"
          />

          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Enter <br />
            Verification <span className="text-primary">Code</span>
          </h2>
          <div className="text-[12px] mb-6 text-gray-400">
            {state.fromLogin 
              ? "Enter the 6-digit OTP sent to your mobile" 
              : "We've sent a 6-digit code to your email"}
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }} className="space-y-6">
            {/* OTP Input Fields */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                OTP Code
              </label>
              <div className="flex gap-2 justify-between">
                {otp.map((digit: string, index: number) => (
                  <input
                    key={index}
                    ref={setInputRef(index)}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleChange(index, e.target.value)
                    }
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                      handleKeyDown(index, e)
                    }
                    onPaste={index === 0 ? handlePaste : undefined}
                    className={`w-12 bg-white h-12 text-center text-lg font-semibold border rounded-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent ${
                      error ? 'border-red-500' : 'border-gray-400'
                    }`}
                    autoFocus={index === 0}
                    disabled={isVerifying}
                  />
                ))}
              </div>

              {/* Error Message */}
              {error && (
                <div className="text-[11px] text-red-500 flex items-center gap-1">
                  <span>⚠️</span> {error}
                </div>
              )}

              {/* Auto-fill status */}
              {state.fromLogin && (
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Waiting for OTP (auto-fills when received)
                </div>
              )}
            </div>

            {/* Resend OTP Section */}
            <div className="text-center">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  className="text-sm text-primary hover:text-primary-dark font-medium cursor-pointer"
                  disabled={isVerifying}
                >
                  Resend OTP
                </button>
              ) : (
                <p className="text-sm text-gray-400">
                  Resend code in{" "}
                  <span className="font-semibold text-primary">{timeLeft}</span>{" "}
                  seconds
                </p>
              )}
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={isVerifying || otp.some(d => d === "")}
              className="w-full text-sm bg-primary text-white py-3 rounded-sm font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-dark"
            >
              {isVerifying ? "Verifying..." : state.fromLogin ? "Verify & Login" : "Verify & Continue"}
            </button>

            {/* Back to Login */}
            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-primary hover:text-primary-dark"
              >
                ← Back to Sign In
              </Link>
            </div>

            <p className="text-sm text-gray-400 flex items-center gap-2">
              <span className="text-primary rounded-xl bg-primary-50 w-[25px] h-[25px] flex items-center justify-center">
                🔒
              </span>
              {state.fromLogin 
                ? "One-time password for secure login" 
                : "Two-step verification for added security"}
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}