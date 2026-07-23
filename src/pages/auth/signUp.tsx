import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import grp from '../../assets/grp.png';
import { useUI } from "../../context/Snackbar";
import { authService } from "../../services/modules/auth";

interface SignupFormData {
  firstName: string;
  lastName: string;
  phone: string;
  loginId: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  subdomain: string;
}

interface SignupErrors {
  [key: string]: string;
}

export default function Signup() {
  const navigate = useNavigate();
  const { showSnackbar, showSpinner, hideSpinner } = useUI();

  const [formData, setFormData] = useState<SignupFormData>({
    firstName: "",
    lastName: "",
    phone: "",
    loginId: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    subdomain: ""
  });

  const [errors, setErrors] = useState<SignupErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  // Validation rules
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "firstName":
        return !value.trim() ? "First name is required" : "";
      case "lastName":
        return !value.trim() ? "Last name is required" : "";
      case "phone":
        const phoneRegex = /^[0-9]{10}$/;
        return !value.trim() ? "Phone number is required" :
          !phoneRegex.test(value.replace(/[^0-9]/g, '')) ? "Please enter a valid 10-digit phone number" : "";
      case "loginId":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !value.trim() ? "Email is required" :
          !emailRegex.test(value) ? "Please enter a valid email address" : "";
      case "password":
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return !value ? "Password is required" :
          value.length < 8 ? "Password must be at least 8 characters" :
            !passwordRegex.test(value) ? "Password must contain uppercase, lowercase, number, and special character" : "";
      case "confirmPassword":
        return !value ? "Please confirm your password" :
          value !== formData.password ? "Passwords do not match" : "";
      case "companyName":
        return !value.trim() ? "Company name is required" : "";
      case "subdomain":
        const subdomainRegex = /^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])?$/;
        return !value.trim() ? "Subdomain is required" :
          value.length < 3 || value.length > 50 ? "Subdomain must be 3-50 characters" :
            !subdomainRegex.test(value) ? "Subdomain can only contain lowercase letters, numbers, and hyphens" : "";
      default:
        return "";
    }
  };

  const validateForm = (): boolean => {
    const newErrors: SignupErrors = {};
    let isValid = true;

    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof SignupFormData]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    const error = validateField(name, value);
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    // Mark all fields as touched
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as { [key: string]: boolean });
    setTouched(allTouched);

    if (!validateForm()) {
      showSnackbar("Please fix all errors before submitting", "warning");
      return;
    }

    setIsSubmitting(true);
    showSpinner();

    try {
      // Step 1: POST /api/auth/signup
      const signupPayload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.replace(/[^0-9]/g, ''),
        loginId: formData.loginId.trim(),
        password: formData.password,
        companyName: formData.companyName.trim(),
        subdomain: formData.subdomain.toLowerCase().trim()
      };

      const response: any = await authService.signup(signupPayload);

      if (response.success) {
        const { data } = response;

        // Case 1: Existing account linked to new company - No OTP required
        if (data?.existingAccount === true) {
          showSnackbar(
            data?.message || "Account linked successfully! Please sign in with your existing password.",
            "success"
          );

          setTimeout(() => {
            navigate("/login", {
              replace: true,
              state: {
                email: data?.email || formData.loginId,
                fromSignup: true,
                signupMessage: response.message
              }
            });
          }, 2000);
          return;
        }

        // Case 2: Multi-tenant scenario - OTP not required but account is new
        if (data?.multiTenant === true && data?.otpRequired === false) {
          showSnackbar(
            data?.message || "Company created successfully! Please sign in.",
            "success"
          );

          // Navigate to login
          setTimeout(() => {
            navigate("/login", {
              replace: true,
              state: {
                email: data?.email || formData.loginId,
                fromSignup: true,
                signupMessage: response.message
              }
            });
          }, 2000);
          return;
        }

        // Case 3: OTP required for verification (normal flow)
        if (data?.otpRequired !== false) {
          showSnackbar(`OTP sent to ${formData.loginId}. Please verify your email.`, "success");

          // Navigate to OTP verification page
          navigate("/verify-otp", {
            replace: true,
            state: {
              email: formData.loginId,
              type: "SIGNUP",
              fromSignup: true,
              userData: {
                firstName: formData.firstName,
                lastName: formData.lastName,
                companyName: formData.companyName
              }
            }
          });
          return;
        }

        // Case 4: Success but no specific flags (fallback)
        showSnackbar(response.message || "Signup successful!", "success");
        navigate("/login", {
          replace: true,
          state: {
            email: formData.loginId,
            fromSignup: true
          }
        });

      } else {
        // Handle specific error cases
        const errorMessage = response.message || "Signup failed. Please try again.";

        if (errorMessage.toLowerCase().includes("subdomain already exists")) {
          setErrors(prev => ({
            ...prev,
            subdomain: "This subdomain is already taken. Please choose another."
          }));
          showSnackbar("Subdomain already exists. Please choose a different one.", "error");
        } else if (errorMessage.toLowerCase().includes("email already registered")) {
          setErrors(prev => ({
            ...prev,
            loginId: "This email is already registered. Please login instead."
          }));
          showSnackbar(
            "Email already registered. Please login or use a different email.",
            "error"
          );
        } else {
          showSnackbar(errorMessage, "error");
        }
      }
    } catch (err: any) {
      const errMsg = err.message || "Failed to create account";
      showSnackbar(errMsg, "error");
    } finally {
      setIsSubmitting(false);
      hideSpinner();
    }
  };

  // Generate subdomain suggestion from company name
  const generateSubdomainSuggestion = () => {
    if (formData.companyName && !formData.subdomain) {
      const suggestion = formData.companyName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 50);
      if (suggestion.length >= 3) {
        setFormData(prev => ({ ...prev, subdomain: suggestion }));
        // Clear error if exists
        if (errors.subdomain) {
          setErrors(prev => ({ ...prev, subdomain: "" }));
        }
      }
    }
  };

  return (
    <div className="bg-gray-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-5xl bg-white rounded-sm shadow-xl overflow-hidden"
      >
        <div className="grid grid-cols-1 md:grid-cols-5 min-h-[90vh]">
          {/* Left Section - Branding */}
          <div className="hidden md:flex md:col-span-2 bg-gradient-to-br from-primary-50 to-gray-100 p-10 flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-8">
                <div className="w-4 h-4 bg-primary rounded-sm rotate-45"></div>
                <span className="font-bold text-gray-700">
                  Dot<span className="text-primary">HR</span>
                </span>
              </div>
              <h1 className="text-3xl font-semibold leading-snug mb-6">
                Create your <br />
                Dot<span className="text-primary">HR</span> Account
              </h1>
              <div className="flex items-start gap-4">
                <img src={grp} width="50" height="100" alt="group" />
                <p className="text-gray-600 text-[12px] leading-relaxed">
                  Get started with a comprehensive HRMS solution.
                  Manage payroll, attendance, onboarding, and more
                  from one secure platform.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white/70 backdrop-blur-sm rounded-sm p-4 shadow-sm">
                <div className="flex items-center gap-3 text-[12px]">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">✓</div>
                  <span>Free 14-day trial</span>
                </div>
                <div className="flex items-center gap-3 text-[12px] mt-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">✓</div>
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-3 text-[12px] mt-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">✓</div>
                  <span>Full feature access</span>
                </div>
              </div>

              <div className="text-[10px] text-gray-400 text-center">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:text-primary-dark font-medium">
                  Sign in
                </Link>
              </div>
            </div>
          </div>

          {/* Right Section - Signup Form */}
          <div className="col-span-1 md:col-span-3 p-6 sm:p-10 grid justify-center items-center overflow-y-auto">
            <div className="">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-1">Create Account</h2>
                <p className="text-[12px] text-gray-500">
                  Fill in the details below to get started
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-2">
                {/* First Name & Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="John"
                      className={`w-full px-3 py-2 border rounded-sm focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none transition
                        ${touched.firstName && errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {touched.firstName && errors.firstName && (
                      <p className="text-[10px] text-red-500 mt-1">{errors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Doe"
                      className={`w-full px-3 py-2 border rounded-sm focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none transition
                        ${touched.lastName && errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {touched.lastName && errors.lastName && (
                      <p className="text-[10px] text-red-500 mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="loginId"
                    value={formData.loginId}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="john@company.com"
                    className={`w-full px-3 py-2 border rounded-sm focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none transition
                      ${touched.loginId && errors.loginId ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {touched.loginId && errors.loginId && (
                    <p className="text-[10px] text-red-500 mt-1">{errors.loginId}</p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">
                    This will be your admin login ID and where we'll send verification OTP
                  </p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="9876543210"
                    maxLength={10}
                    className={`w-full px-3 py-2 border rounded-sm focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none transition
                      ${touched.phone && errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {touched.phone && errors.phone && (
                    <p className="text-[10px] text-red-500 mt-1">{errors.phone}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Password */}
                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="StrongP@ss1"
                        className={`w-full px-3 py-2 border rounded-sm focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none transition pr-10
                        ${touched.password && errors.password ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <i className="material-icons text-[12px]">
                          {showPassword ? "visibility_off" : "visibility"}
                        </i>
                      </button>
                    </div>
                    {touched.password && errors.password && (
                      <p className="text-[10px] text-red-500 mt-1">{errors.password}</p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1">
                      Min 8 characters with uppercase, lowercase, number, and special character
                    </p>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 mb-1">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Confirm your password"
                        className={`w-full px-3 py-2 border rounded-sm focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none transition pr-10
                        ${touched.confirmPassword && errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <i className="material-icons text-[12px]">
                          {showConfirmPassword ? "visibility_off" : "visibility"}
                        </i>
                      </button>
                    </div>
                    {touched.confirmPassword && errors.confirmPassword && (
                      <p className="text-[10px] text-red-500 mt-1">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Company Name */}
                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 mb-1">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Acme Pvt Ltd"
                      className={`w-full px-3 py-2 border rounded-sm focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none transition
                      ${touched.companyName && errors.companyName ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {touched.companyName && errors.companyName && (
                      <p className="text-[10px] text-red-500 mt-1">{errors.companyName}</p>
                    )}
                  </div>

                  {/* Subdomain */}
                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 mb-1">
                      Subdomain <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="subdomain"
                        value={formData.subdomain}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="acme"
                        className={`w-full px-3 py-2 border rounded-sm focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none transition
                        ${touched.subdomain && errors.subdomain ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
                        .vibedomain.com
                      </span>
                    </div>
                    {touched.subdomain && errors.subdomain && (
                      <p className="text-[10px] text-red-500 mt-1">{errors.subdomain}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] text-gray-400">
                        3-50 characters, lowercase letters, numbers, and hyphens only
                      </p>
                      {formData.companyName && !formData.subdomain && (
                        <button
                          type="button"
                          onClick={generateSubdomainSuggestion}
                          className="text-[10px] text-primary hover:text-primary-dark"
                        >
                          Suggest from company name
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div className="flex items-start gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="terms"
                    className="mt-[3px] accent-primary"
                    required
                  />
                  <label htmlFor="terms" className="text-[12px] text-gray-600">
                    I agree to the{' '}
                    <Link to="/terms" className="text-primary hover:text-primary-dark">
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link to="/privacy" className="text-primary hover:text-primary-dark">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                {/* Submit Button */}
                <div className="flex justify-center !mt-5">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-[150px] bg-primary text-white p-3 rounded-md transition hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        {/* <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg> */}
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </div>

                {/* Mobile Sign In Link */}
                <div className="text-center md:hidden">
                  <p className="text-[12px] text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary hover:text-primary-dark font-medium">
                      Sign in
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}