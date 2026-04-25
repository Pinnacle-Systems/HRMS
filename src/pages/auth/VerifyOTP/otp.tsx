import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

export default function VerifyOTP() {
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [mobileNumber, setMobileNumber] = useState<string>("9876543210");
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timeLeft > 0 && !canResend) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }
  }, [timeLeft, canResend]);

  const handleChange = (index: number, value: string): void => {
    if (value && !/^\d+$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(0, 1);
    setOtp(newOtp);
    setError("");
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
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
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length < 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }
    console.log("Verifying OTP:", otpValue);
    navigate("/home");
  };

  const handleResendOTP = (): void => {
    if (canResend) {
      console.log("Resending OTP to:", mobileNumber);
      setTimeLeft(60);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      setError("");
      inputRefs.current[0]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl bg-white rounded-sm p-[25px] shadow-xl grid grid-cols-1 gap-6 md:grid-cols-2 overflow-hidden"
        style={{ height: "auto", minHeight: "85vh" }}
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
            <h1 className="text-2xl font-semibold text-gray-900 leading-snug mb-4">
              Verify Your <span className="text-[#e16a3d]">Identity.</span>
            </h1>
            <div className="flex items-center justify-center mb-4">
              <p className="text-gray-600 max-w-sm text-[12px]">
                For your security, we need to verify your identity before
                resetting your password.
              </p>
            </div>
            <img src="src/assets/otp.png" width="100" alt="OTP" />
          </div>

          {/* OTP Info Box */}
          <div className="mb-10 text-[12px] bg-white text-gray-600 rounded-sm shadow px-4 py-4">
            <p className="mb-2">
              📱 <span className="font-bold">OTP Sent to:</span>
              <br />
              <span className="text-orange-600">{mobileNumber}</span>
              <br />
            </p>
            {/* <span className="text-gray-500">Check your spam folder if you don't see the email</span> */}
            <span className="text-gray-500">
              Check your SMS inbox if you don't receive the code.
            </span>
          </div>
        </div>

        {/* Right Section - OTP Verification Form */}
        <div className="p-10 flex flex-col justify-center relative">
          <img
            src="src/assets/pinnacle.jpg"
            width="40%"
            className="absolute top-0 right-0"
            alt="pinnacle"
          />

          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Enter <br />
            Verification <span className="text-[#e16a3d]">Code</span>
          </h2>
          <div className="text-[12px] mb-6 text-gray-400">
            We've sent a 6-digit code to your mobile number
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                    className="w-12 h-12 text-center text-lg font-semibold border border-gray-400 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#e16a3d] focus:border-transparent"
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              {/* Error Message */}
              {error && (
                <div className="text-[11px] text-red-500 flex items-center gap-1">
                  {error}
                </div>
              )}
            </div>

            {/* Resend OTP Section */}
            <div className="text-center">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  className="text-sm text-[#e16a3d] hover:text-orange-600 font-medium cursor-pointer"
                >
                  Resend OTP
                </button>
              ) : (
                <p className="text-sm text-gray-500">
                  Resend code in{" "}
                  <span className="font-semibold text-[#e16a3d]">
                    {timeLeft}
                  </span>{" "}
                  seconds
                </p>
              )}
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              className="w-full text-sm bg-[#e16a3d] text-white py-3 rounded-sm font-semibold transition cursor-pointer"
            >
              Verify & Continue
            </button>

            {/* Back to Login */}
            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-[#e16a3d] hover:text-orange-600"
              >
                ← Back to Sign In
              </Link>
            </div>

            <p className="text-sm text-gray-500 flex items-center gap-2">
              <span className="text-[#e16a3d] rounded-xl bg-orange-50 w-[25px] h-[25px] flex items-center justify-center">
                🔒
              </span>
              Two-step verification for added security
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}