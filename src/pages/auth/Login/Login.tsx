import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../../services/modules/auth";
import { useUI } from "../../../context/Snackbar";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [visible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const { showSnackbar, showSpinner, hideSpinner } = useUI();

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (isMobile && mobileNumber) {
      showSpinner();
      try {
        const response = await authService.getOtp({ mobileNumber });
        if (response.success) {
          navigate("/home");
          showSnackbar(response.message, "success");
        }
      } catch (err: any) {
        showSnackbar(err.message, "error");
      } finally {
        hideSpinner();
      }
    } else if (!isMobile && email && password) {
      showSpinner();
      try {
        const response = await authService.login({ loginId: email, password });
        if (response.success) {
          navigate("/home");
          showSnackbar(response.message, "success");
        }
      } catch (err: any) {
        showSnackbar(err.message, "error");
      } finally {
        hideSpinner();
      }
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
        <div className=" rounded-xl p-10 flex flex-col justify-between bg-gradient-to-bl from-primary-50 to-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-4 h-4 bg-primary rounded-sm rotate-45"></div>
              <span className="font-bold text-gray-700">
                Vibe<span className="text-primary">HR</span>
              </span>
            </div>
            <h1 className="text-2xl font-semibold leading-snug mb-6">
              Vibe<span className="text-primary">HR</span> is your <br />{" "}
              ultimate HRMS platform
            </h1>
            <div className="flex items-center justify-center">
              <img src="src\assets\grp.png" width="50" height="100" />
              <p className="text-gray-600 max-w-sm text-[11px] ml-4 text-justify">
                We provide the only platform that makes it easy to manage
                employees, attendance, payroll, and more.
              </p>
            </div>
          </div>
          <div className="mb-10 text-[12px] bg-white text-gray-400 rounded-sm shadow px-2 py-6 grid grid-cols-3 justify gap-2">
            <div className="border-r border-gray-300 text-center pr-2">
              <div>🏆 </div>
              <div>10+ </div>
              <div>Years</div>
            </div>
            <div className="border-r border-gray-300  text-center pr-2">
              <div>👥 </div>
              <div>500+ </div>
              <div>Employees</div>
            </div>
            <div className=" text-center pr-2">
              <div>⭐ </div>
              <div>98%</div>
              <div> Satisfaction</div>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="p-10 flex flex-col justify-center relative">
          <h2 className="text-2xl font-semibold mb-2">
            <img
              src="src/assets/pinnacle.jpg"
              width="40%"
              className="absolute top-[0] right-[0]"
            />
            Welcome in <br />
            Vibe<span className="text-primary">HR</span> Platform
          </h2>
          <div className="text-[12px] mb-8 text-gray-400">
            Enter your credentials to access your dashboard
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isMobile && (
              <>
                {/* Email */}
                <div>
                  <label className="block text-sm mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full bg-white text-sm px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none transition"
                    required
                  />
                </div>
                {/* Password */}
                <div className="relative">
                  <label className="block text-sm mb-2">Password</label>
                  <input
                    type={visible == false ? "password" : "text"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-white text-sm px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none transition"
                    required
                  />
                  <div className="absolute top-[38px] right-[0]">
                    <i
                      className="material-icons mr-2 !text-[16px] text-primary hover:text-primary-dark cursor-pointer"
                      onClick={() =>
                        setIsVisible(visible == false ? true : false)
                      }
                    >
                      {visible == false ? "visibility_off" : "visibility"}
                    </i>
                  </div>
                </div>
                <div className="flex items-end justify-end text-sm cursor-pointer">
                  <Link
                    to="/forgot-password"
                    className="text-primary hover:text-primary-dark"
                  >
                    Forgot password?
                  </Link>
                </div>
              </>
            )}
            {isMobile && (
              <>
                {/* Mobile Number */}
                <div>
                  <label className="block text-sm mb-2">Mobile Number</label>
                  <input
                    type="number"
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="Enter your mobile number"
                    className="w-full bg-white text-sm px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none transition"
                  />
                </div>
              </>
            )}
            {/* Button */}
            <div className="text-center mt-2 ">
              <button
                type="submit"
                className="w-full text-sm bg-primary text-white py-3 rounded-sm font-semibold transition cursor-pointer"
              >
                {isMobile ? "Get OTP" : "Sign in"}
              </button>
              <div className="text-gray-500 mt-5">
                --------------------------- or ------------------------------
              </div>
            </div>
          </form>
          <div>
            <button
              type="submit"
              onClick={() => setIsMobile(isMobile == false ? true : false)}
              className="w-full mt-6 text-sm text-primary border border-primary-dark py-3 rounded-sm font-semibold transition cursor-pointer"
            >
              {isMobile ? "Back to Sign In" : "Login in with Mobile Number"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
