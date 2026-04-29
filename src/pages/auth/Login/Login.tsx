import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../../services/modules/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [visible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (isMobile && mobileNumber) {
      //Login with mobile number
      const response = await fetch(
        "http://122.166.169.82:7091/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Add this
          mode: "cors", // Add this
          body: JSON.stringify({
            mobileNumber: mobileNumber,
            // otpSent: true
          }),
        },
      );
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("userData", JSON.stringify(data.user));
        navigate("/verify-otp", {
          state: { mobileNumber, userId: data.userId },
        });
      } else {
        alert(data.message || "Login failed");
      }
    } else if (!isMobile && email && password) {
      // Login with email
      try {
        const response = await authService.login({ loginId:email, password });
        console.log("Login successful:", response);
        if (response.success) {
          navigate("/home");
        }
      } catch (err: any) {
        setError(err.message || "Login failed");
      } finally {
        setLoading(false);
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
            {/* <div className="border-r border-gray-300  text-center pr-2">
              <div>🌍 </div>
              <div>15 </div>
              <div>Markets</div>
            </div> */}
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
            {/* <Link to={isMobile ? '/verify-otp' : '/home'} > */}
            <button
              type="submit"
              className="w-full mt-2 text-sm bg-primary text-white py-3 rounded-sm font-semibold transition cursor-pointer"
            >
              {isMobile ? "Get OTP" : "Sign in"}
            </button>
            {/* </Link> */}

            <div className="text-gray-500">
              --------------------------- or ------------------------------
            </div>
          </form>
          <div>
            {/* <Link to="/verify-otp" > */}
            <button
              type="submit"
              onClick={() => setIsMobile(isMobile == false ? true : false)}
              className="w-full mt-6 text-sm text-primary border border-primary-dark py-3 rounded-sm font-semibold transition cursor-pointer"
            >
              {isMobile ? "Back to Sign In" : "Login in with Mobile Number"}
            </button>
            {/* </Link> */}

            {/* <p className="text-sm mt-4 text-gray-500 flex items-center gap-2">
                            <span className="text-primary-500 rounded-xl bg-primary-50 w-[25px] h-[25px] flex items-center justify-center">✔</span>
                            One platform for all HR needs
                        </p> */}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
