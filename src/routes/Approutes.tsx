import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../auth/AuthProvider";
import { useAuth } from "../auth/authContext";
import { getDefaultRoute } from "../auth/authMapper";
import ProtectedRoute from "../auth/ProtectedRoute";
import Layout from "../components/Layout";
import Employees from "../pages/employees/employees";
import ForgotPassword from "../pages/auth/ForgotPassword/ForgotPassword";
import Home from "../pages/home/home";
import Leave from "../pages/leave/leave";
import Login from "../pages/auth/Login/Login";
import MfaPage from "../pages/auth/MfaPage";
import Payroll from "../pages/payroll/payroll";
import ResetPassword from "../pages/auth/ResetPassword/ResetPassword";
import Settings from "../pages/settings/settings";
import CompanySettings from "../pages/settings/companySettings";
import PasswordConfig from "../pages/settings/passwordConfig";
import TenantSelectPage from "../pages/auth/TenantSelectPage";
import UnauthorizedPage from "../pages/UnauthorizedPage";
import VerifyOTP from "../pages/auth/VerifyOTP/otp";

function RootRedirect() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <Navigate
      to={session ? getDefaultRoute(session.user) : "/login"}
      replace
    />
  );
}

function AppRoutesContent() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/mfa" element={<MfaPage />} />
        <Route path="/select-tenant" element={<TenantSelectPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/" element={<RootRedirect />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="home" element={<Home />} />
            <Route path="admin/dashboard" element={<Home />} />
            <Route path="hr/dashboard" element={<Home />} />
            <Route path="manager/dashboard" element={<Home />} />
            <Route path="employee/dashboard" element={<Home />} />
            <Route path="employees" element={<Employees />} />
            <Route path="leave" element={<Leave />} />
            <Route path="payroll" element={<Payroll />} />
            <Route path="settings" element={<Settings />}>
              <Route
                path="general/company-settings"
                element={<CompanySettings />}
              />
              <Route
                path="general/password-config"
                element={<PasswordConfig />}
              />
              <Route index element={<CompanySettings />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function AppRoutes() {
  return (
    <AuthProvider>
      <AppRoutesContent />
    </AuthProvider>
  );
}
