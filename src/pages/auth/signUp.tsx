import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import grp from '../../assets/grp.png';
import { useUI } from "../../context/Snackbar";
import { authService } from "../../services/modules/auth";
import dot from '../../assets/dot.png';
import { masterService, normalizeMasterData } from "../../services/modules/masters";

interface SignupFormData {
  firstName: string;
  lastName: string;
  phone: string;
  loginId: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  subdomain: string;
  country: string;
  state: string;
  industry: string;
}

interface SignupErrors {
  [key: string]: string;
}

interface MasterOption {
  _id: string;
  name: string;
  code?: string;
}

const toAutocompleteOptions = (response: unknown): MasterOption[] => {
  const records = normalizeMasterData<Record<string, unknown>>(response);
  if (!Array.isArray(records)) return [];

  return records.flatMap((record) => {
    const id = record?._id ?? record?.id;
    const name = record?.name;
    if (
      (typeof id !== "string" && typeof id !== "number") ||
      typeof name !== "string"
    ) {
      return [];
    }

    return [
      {
        _id: String(id),
        name,
        ...(typeof record.code === "string" ? { code: record.code } : {}),
      },
    ];
  });
};

// Reusable Autocomplete Component
interface AutocompleteProps {
  label: string;
  name: string;
  value: string;
  options: MasterOption[];
  placeholder: string;
  onChange: (name: string, value: string) => void;
  onBlur: (name: string, value: string) => void;
  loading?: boolean;
  error?: string;
  touched?: boolean;
  required?: boolean;
  disabled?: boolean;
}

function Autocomplete({
  label,
  name,
  value,
  options,
  placeholder,
  onChange,
  onBlur,
  loading = false,
  error,
  touched,
  required = true,
  disabled = false,
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Sync selected value display
  const selectedOption = options.find((o) => o._id === value);

  useEffect(() => {
    if (selectedOption) {
      setInputValue(selectedOption.name);
    } else if (!value) {
      setInputValue("");
    }
  }, [value, selectedOption]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);

    // If input is cleared, clear selection
    if (!newValue.trim()) {
      onChange(name, "");
    }
  };

  const handleSelect = (option: MasterOption) => {
    onChange(name, option._id);
    setInputValue(option.name);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleBlurInternal = () => {
    // Delay blur to allow option click
    setTimeout(() => {
      // If typed text doesn't match a selected option, clear it
      if (value) {
        const current = options.find((o) => o._id === value);
        if (current) {
          setInputValue(current.name);
        }
      } else {
        setInputValue("");
      }
      setIsOpen(false);
      onBlur(name, value);
    }, 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown") {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex]);

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-[12px] font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          name={name}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlurInternal}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className={`w-full px-3 py-2 bg-white-50 border rounded-sm focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none transition pr-8
            ${touched && error ? "border-red-500" : "border-gray-300"}
            ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
        />
        {/* Dropdown arrow / loading spinner */}
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {loading ? (
            <svg
              className="animate-spin h-4 w-4 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg
              className={`h-4 w-4 text-gray-400 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          )}
        </span>
      </div>

      {/* Dropdown list */}
      {isOpen && !disabled && (
        <ul
          ref={listRef}
          className="absolute z-20 w-full mt-1 max-h-52 overflow-y-auto bg-white border border-gray-200 rounded-sm shadow-lg"
        >
          {loading ? (
            <li className="px-3 py-2 text-[12px] text-gray-400">Loading...</li>
          ) : filteredOptions.length === 0 ? (
            <li className="px-3 py-2 text-[12px] text-gray-400">
              No results found
            </li>
          ) : (
            filteredOptions.map((option, idx) => (
              <li
                key={option._id}
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent blur
                  handleSelect(option);
                }}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`px-3 py-2 text-[12px] cursor-pointer transition
                  ${
                    idx === highlightedIndex
                      ? "bg-primary/10 text-primary"
                      : "text-gray-700 hover:bg-gray-50"
                  }
                  ${value === option._id ? "font-medium bg-primary/5" : ""}`}
              >
                {option.name}
              </li>
            ))
          )}
        </ul>
      )}

      {touched && error && (
        <p className="text-[10px] text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}

export default function Signup() {
  const navigate = useNavigate();
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const showSnackbarRef = useRef(showSnackbar);
  useEffect(() => {
    showSnackbarRef.current = showSnackbar;
  }, [showSnackbar]);

  const [formData, setFormData] = useState<SignupFormData>({
    firstName: "",
    lastName: "",
    phone: "",
    loginId: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    subdomain: "",
    country: "",
    state: "",
    industry: "",
  });

  const [errors, setErrors] = useState<SignupErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  // Countries, states & industries
  const [countries, setCountries] = useState<MasterOption[]>([]);
  const [states, setStates] = useState<MasterOption[]>([]);
  const [industries, setIndustries] = useState<MasterOption[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [statesLoading, setStatesLoading] = useState(false);
  const [industriesLoading, setIndustriesLoading] = useState(false);

  // Fetch active countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      setCountriesLoading(true);
      try {
        const response = await masterService.getActiveCountries();
        setCountries(toAutocompleteOptions(response));
      } catch (err) {
        console.error("Failed to fetch countries:", err);
        showSnackbarRef.current("Failed to load countries", "error");
      } finally {
        setCountriesLoading(false);
      }
    };
    void fetchCountries();
  }, []);

  // Fetch states for the selected country.
  useEffect(() => {
    let cancelled = false;
    setStates([]);

    if (!formData.country) {
      setStatesLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const fetchStates = async () => {
      setStatesLoading(true);
      try {
        const response = await masterService.getStatesByCountry(
          formData.country,
        );
        if (!cancelled) {
          setStates(toAutocompleteOptions(response));
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch states:", err);
          showSnackbarRef.current("Failed to load states", "error");
        }
      } finally {
        if (!cancelled) {
          setStatesLoading(false);
        }
      }
    };

    void fetchStates();
    return () => {
      cancelled = true;
    };
  }, [formData.country]);

  // Fetch industries on mount
  useEffect(() => {
    const fetchIndustries = async () => {
      setIndustriesLoading(true);
      try {
        const response: any = await masterService.getIndustries();
        setIndustries(toAutocompleteOptions(response));
      } catch (err) {
        console.error("Failed to fetch industries:", err);
        showSnackbarRef.current("Failed to load industries", "error");
      } finally {
        setIndustriesLoading(false);
      }
    };
    fetchIndustries();
  }, []);

  // Validation rules
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "firstName":
        return !value.trim() ? "First name is required" : "";
      case "lastName":
        return !value.trim() ? "Last name is required" : "";
      case "phone": {
        const phoneRegex = /^[0-9]{10}$/;
        return !value.trim()
          ? "Phone number is required"
          : !phoneRegex.test(value.replace(/[^0-9]/g, ""))
          ? "Please enter a valid 10-digit phone number"
          : "";
      }
      case "loginId": {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !value.trim()
          ? "Email is required"
          : !emailRegex.test(value)
          ? "Please enter a valid email address"
          : "";
      }
      case "password": {
        const passwordRegex =
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return !value
          ? "Password is required"
          : value.length < 8
          ? "Password must be at least 8 characters"
          : !passwordRegex.test(value)
          ? "Password must contain uppercase, lowercase, number, and special character"
          : "";
      }
      case "confirmPassword":
        return !value
          ? "Please confirm your password"
          : value !== formData.password
          ? "Passwords do not match"
          : "";
      case "companyName":
        return !value.trim() ? "Company name is required" : "";
      case "subdomain": {
        const subdomainRegex = /^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])?$/;
        return !value.trim()
          ? "Subdomain is required"
          : value.length < 3 || value.length > 50
          ? "Subdomain must be 3-50 characters"
          : !subdomainRegex.test(value)
          ? "Subdomain can only contain lowercase letters, numbers, and hyphens"
          : "";
      }
      case "country":
        return !value.trim() ? "Country is required" : "";
      case "state":
        return !value.trim() ? "State is required" : "";
      case "industry":
        return !value.trim() ? "Industry is required" : "";
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
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Generic field handler for autocomplete components
  const handleAutocompleteChange = (name: string, value: string) => {
    setFormData((prev) =>
      name === "country"
        ? { ...prev, country: value, state: "" }
        : { ...prev, [name]: value }
    );
    setErrors((prev) => ({
      ...prev,
      [name]: "",
      ...(name === "country" ? { state: "" } : {}),
    }));
    if (name === "country") {
      setTouched((prev) => ({ ...prev, state: false }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    const error = validateField(name, value);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  // Autocomplete blur handler
  const handleAutocompleteBlur = (name: string, value: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

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
      const signupPayload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.replace(/[^0-9]/g, ""),
        loginId: formData.loginId.trim(),
        password: formData.password,
        companyName: formData.companyName.trim(),
        subdomain: formData.subdomain.toLowerCase().trim(),
        country: formData.country,
        state: formData.state,
        industry: formData.industry,
      };
 
      const response: any = await authService.signup(signupPayload);

      if (response.success) {
        const { data } = response;

        // Case 1: Existing account linked to new company - No OTP required
        if (data?.existingAccount === true) {
          showSnackbar(
            data?.message ||
              "Account linked successfully! Please sign in with your existing password.",
            "success"
          );

          setTimeout(() => {
            navigate("/login", {
              replace: true,
              state: {
                email: data?.email || formData.loginId,
                fromSignup: true,
                signupMessage: response.message,
              },
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

          setTimeout(() => {
            navigate("/login", {
              replace: true,
              state: {
                email: data?.email || formData.loginId,
                fromSignup: true,
                signupMessage: response.message,
              },
            });
          }, 2000);
          return;
        }

        // Case 3: OTP required for verification (normal flow)
        if (data?.otpRequired !== false) {
          showSnackbar(
            `OTP sent to ${formData.loginId}. Please verify your email.`,
            "success"
          );

          navigate("/verify-otp", {
            replace: true,
            state: {
              email: formData.loginId,
              type: "SIGNUP",
              fromSignup: true,
              userData: {
                firstName: formData.firstName,
                lastName: formData.lastName,
                companyName: formData.companyName,
              },
            },
          });
          return;
        }

        // Case 4: Success but no specific flags (fallback)
        showSnackbar(response.message || "Signup successful!", "success");
        navigate("/login", {
          replace: true,
          state: {
            email: formData.loginId,
            fromSignup: true,
          },
        });
      } else {
        const errorMessage =
          response.message || "Signup failed. Please try again.";

        if (errorMessage.toLowerCase().includes("subdomain already exists")) {
          setErrors((prev) => ({
            ...prev,
            subdomain:
              "This subdomain is already taken. Please choose another.",
          }));
          showSnackbar(
            "Subdomain already exists. Please choose a different one.",
            "error"
          );
        } else if (
          errorMessage.toLowerCase().includes("email already registered")
        ) {
          setErrors((prev) => ({
            ...prev,
            loginId:
              "This email is already registered. Please login instead.",
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
        .replace(/[^a-z0-9]/g, "")
        .substring(0, 50);
      if (suggestion.length >= 3) {
        setFormData((prev) => ({ ...prev, subdomain: suggestion }));
        if (errors.subdomain) {
          setErrors((prev) => ({ ...prev, subdomain: "" }));
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
                <img src={dot} alt="Dot.HR Logo" width="100" />
              </div>
              <h1 className="text-3xl font-semibold leading-snug mb-6">
                Create your <br />
                Dot.<span className="text-primary">HR</span> Account
              </h1>
              <div className="flex items-start gap-4">
                <img src={grp} width="50" height="100" alt="group" />
                <p className="text-gray-600 text-[12px] leading-relaxed">
                  Get started with a comprehensive HRMS solution. Manage payroll,
                  attendance, onboarding, and more from one secure platform.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white/70 backdrop-blur-sm rounded-sm p-4 shadow-sm">
                <div className="flex items-center gap-3 text-[12px]">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    ✓
                  </div>
                  <span>Free 14-day trial</span>
                </div>
                <div className="flex items-center gap-3 text-[12px] mt-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    ✓
                  </div>
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-3 text-[12px] mt-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    ✓
                  </div>
                  <span>Full feature access</span>
                </div>
              </div>

              <div className="text-[10px] text-gray-400 text-center">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-primary hover:text-primary-dark font-medium"
                >
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
                      className={`w-full px-3 py-2 bg-white-50 border rounded-sm focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none transition
                        ${
                          touched.firstName && errors.firstName
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                    />
                    {touched.firstName && errors.firstName && (
                      <p className="text-[10px] text-red-500 mt-1">
                        {errors.firstName}
                      </p>
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
                      className={`w-full px-3 py-2 bg-white-50 border rounded-sm focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none transition
                        ${
                          touched.lastName && errors.lastName
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                    />
                    {touched.lastName && errors.lastName && (
                      <p className="text-[10px] text-red-500 mt-1">
                        {errors.lastName}
                      </p>
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
                    className={`w-full px-3 py-2 bg-white-50 border rounded-sm focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none transition
                      ${
                        touched.loginId && errors.loginId
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                  />
                  {touched.loginId && errors.loginId && (
                    <p className="text-[10px] text-red-500 mt-1">
                      {errors.loginId}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">
                    This will be your admin login ID and where we'll send
                    verification OTP
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
                    className={`w-full px-3 py-2 bg-white-50 border rounded-sm focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none transition
                      ${
                        touched.phone && errors.phone
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                  />
                  {touched.phone && errors.phone && (
                    <p className="text-[10px] text-red-500 mt-1">
                      {errors.phone}
                    </p>
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
                        className={`w-full px-3 py-2 bg-white-50 border rounded-sm focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none transition pr-10
                        ${
                          touched.password && errors.password
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
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
                      <p className="text-[10px] text-red-500 mt-1">
                        {errors.password}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1">
                      Min 8 characters with uppercase, lowercase, number, and
                      special character
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
                        className={`w-full px-3 py-2 bg-white-50 border rounded-sm focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none transition pr-10
                        ${
                          touched.confirmPassword && errors.confirmPassword
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <i className="material-icons text-[12px]">
                          {showConfirmPassword ? "visibility_off" : "visibility"}
                        </i>
                      </button>
                    </div>
                    {touched.confirmPassword && errors.confirmPassword && (
                      <p className="text-[10px] text-red-500 mt-1">
                        {errors.confirmPassword}
                      </p>
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
                      className={`w-full px-3 py-2 bg-white-50 border rounded-sm focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none transition
                      ${
                        touched.companyName && errors.companyName
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {touched.companyName && errors.companyName && (
                      <p className="text-[10px] text-red-500 mt-1">
                        {errors.companyName}
                      </p>
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
                        className={`w-full px-3 py-2 bg-white-50 border rounded-sm focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none transition
                        ${
                          touched.subdomain && errors.subdomain
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
                        .vibedomain.com
                      </span>
                    </div>
                    {touched.subdomain && errors.subdomain && (
                      <p className="text-[10px] text-red-500 mt-1">
                        {errors.subdomain}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] text-gray-400">
                        3-50 characters, lowercase letters, numbers, and hyphens
                        only
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

                {/* Country, State & Industry */}
                <div className="grid grid-cols-2 gap-4">
                  <Autocomplete
                    label="Country"
                    name="country"
                    value={formData.country}
                    options={countries}
                    placeholder="Search country..."
                    onChange={handleAutocompleteChange}
                    onBlur={handleAutocompleteBlur}
                    loading={countriesLoading}
                    error={errors.country}
                    touched={touched.country}
                    required
                  />

                  <Autocomplete
                    label="State"
                    name="state"
                    value={formData.state}
                    options={states}
                    placeholder="Search state..."
                    onChange={handleAutocompleteChange}
                    onBlur={handleAutocompleteBlur}
                    loading={statesLoading}
                    error={errors.state}
                    touched={touched.state}
                    required
                    disabled={!formData.country}
                  />

                  <Autocomplete
                    label="Industry"
                    name="industry"
                    value={formData.industry}
                    options={industries}
                    placeholder="Search industry..."
                    onChange={handleAutocompleteChange}
                    onBlur={handleAutocompleteBlur}
                    loading={industriesLoading}
                    error={errors.industry}
                    touched={touched.industry}
                    required
                  />
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
                    I agree to the{" "}
                    <Link
                      to="/terms"
                      className="text-primary hover:text-primary-dark"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      to="/privacy"
                      className="text-primary hover:text-primary-dark"
                    >
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
                      <>Creating Account...</>
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </div>

                {/* Mobile Sign In Link */}
                <div className="text-center md:hidden">
                  <p className="text-[12px] text-gray-600">
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      className="text-primary hover:text-primary-dark font-medium"
                    >
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