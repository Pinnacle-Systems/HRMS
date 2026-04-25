import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [visible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: any) => {
    e.preventDefault();
    console.log(e);
    if (isMobile && mobileNumber) {
      navigate("/verify-otp");
    } else if (!isMobile && email && password) {
      navigate("/home");
    }
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
            <div className="flex items-center gap-2 mb-8">
              <div className="w-4 h-4 bg-[#e16a3d] rounded-sm rotate-45"></div>
              <span className="font-bold text-gray-700">
                Vibe<span className="text-[#e16a3d]">HR</span>
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 leading-snug mb-6">
              Vibe<span className="text-[#e16a3d]">HR</span> is your <br />{" "}
              ultimate HRMS platform
            </h1>
            <div className="flex items-center justify-center">
              <img src="src\assets\grp.png" width="50" height="100" />
              <p className="text-gray-600 max-w-sm text-[11px] ml-4">
                We provide the only platform that makes it easy to manage
                employees, attendance, payroll, and more.
              </p>
            </div>
          </div>
          <div className="mb-10 text-[12px] bg-white text-gray-400 rounded-sm shadow px-2 py-6 grid grid-cols-4 gap-2">
            <div className="border-r border-gray-300 text-center pr-2">
              <div>🏆 </div>
              <div>10+ </div>
              <div>Years</div>
            </div>
            <div className="border-r border-gray-300  text-center pr-2">
              <div>🌍 </div>
              <div>15 </div>
              <div>Markets</div>
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
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            <img
              src="src/assets/pinnacle.jpg"
              width="40%"
              className="absolute top-[0] right-[0]"
            />
            Welcome in <br />
            Vibe<span className="text-[#e16a3d]">HR</span> Platform
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
                    className="w-full px-4 text-sm py-2 border border-gray-400 rounded-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    required
                  />
                </div>
                {/* Password */}
                <div className="relative">
                  <label className="block text-sm mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 text-sm py-2 border border-gray-400 rounded-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    required
                  />
                  <div className="absolute top-[38px] right-[0]">
                    <i
                      className="material-icons mr-2 !text-[16px] text-[#e16a3d] hover:text-orange-600 cursor-pointer"
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
                    className="text-[#e16a3d] hover:text-orange-600"
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
                    className="w-full px-4 text-sm py-2 border border-gray-400 rounded-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </>
            )}
            {/* Button */}
            {/* <Link to={isMobile ? '/verify-otp' : '/home'} > */}
            <button
              type="submit"
              className="w-full mt-2 text-sm bg-[#e16a3d] text-white py-3 rounded-sm font-semibold transition cursor-pointer"
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
              className="w-full mt-6 text-sm text-[#e16a3d] border border-orange-500 py-3 rounded-sm font-semibold transition cursor-pointer"
            >
              {isMobile ? "Back to Sign In" : "Login in with Mobile Number"}
            </button>
            {/* </Link> */}

            {/* <p className="text-sm mt-4 text-gray-500 flex items-center gap-2">
                            <span className="text-orange-500 rounded-xl bg-orange-50 w-[25px] h-[25px] flex items-center justify-center">✔</span>
                            One platform for all HR needs
                        </p> */}
          </div>
        </div>
      </motion.div>
    </div>
  );
}