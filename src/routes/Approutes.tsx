import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../auth/AuthProvider";
import { useAuth } from "../auth/authContext";
import { getDefaultRoute } from "../auth/authMapper";
import ProtectedRoute from "../auth/ProtectedRoute";
import Layout from "../components/Layout";
import { logger } from "../utils/logger";
import Employees from "../pages/employees/employeeManagement";
import ForgotPassword from "../pages/auth/ForgotPassword/ForgotPassword";
import Home from "../pages/home/home";
import ApplyLeavePage from "../pages/leave/ApplyLeavePage";
import CompOffsPage from "../pages/leave/CompOffsPage";
import HolidayCalendarPage from "../pages/leave/HolidayCalendarPage";
import LeavePlaceholderPage from "../pages/leave/LeavePlaceholderPage";
import MyLeaveDashboard from "../pages/leave/MyLeaveDashboard";
import MyLeaveRequestsPage from "../pages/leave/MyLeaveRequestsPage";
import { leaveRoutes } from "../pages/leave/leaveRoutes";
import Login from "../pages/auth/Login/Login";
import MfaPage from "../pages/auth/MfaPage";
import Payroll from "../pages/payroll/payroll";
import ResetPassword from "../pages/auth/ResetPassword/ResetPassword";
import Settings from "../pages/settings/settings";
import TenantSelectPage from "../pages/auth/TenantSelectPage";
import UnauthorizedPage from "../pages/UnauthorizedPage";
import VerifyOTP from "../pages/auth/VerifyOTP/otp";
import PasswordConfig from "../pages/settings/general/passwordConfig";
import CompanySettings from "../pages/settings/general/companySettings";
import Profile from "../pages/myProfile/myprofile";
import BranchSettings from "../pages/settings/general/branchSettings";
import DepartmentSettings from "../pages/settings/employee/depSettings";
import CategoryItems from "../pages/settings/employee/categoryItems";
import CategorySettings from "../pages/settings/employee/otherCategory";
import EmployeeDetails from "../pages/employees/employeeDetails";
import OnBoardingProcess from "../pages/settings/employee/onBoardingProcess/onboard";

function RootRedirect() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-gray-500">
        Loading...
      </div>
    );
  }

  const redirectTo = session ? getDefaultRoute(session.user) : "/login";
  logger.info("Root redirect resolved", {
    redirectTo,
    isAuthenticated: Boolean(session),
    userId: session?.user.userId,
    roles: session?.user.roles,
  });

  return <Navigate to={redirectTo} replace />;
}

function AppRoutesContent() {
  const employeeLeaveRoutes = leaveRoutes.filter(
    (route) => route.group === "employee",
  );
  const managerLeaveRoutes = leaveRoutes.filter(
    (route) => route.group === "manager",
  );
  const hrLeaveRoutes = leaveRoutes.filter((route) => route.group === "hr");
  const adminLeaveRoutes = leaveRoutes.filter(
    (route) => route.group === "admin",
  );

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
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={["ADMIN", "HR", "MANAGER", "EMPLOYEE"]}
                />
              }
            >
              <Route path="home" element={<Home />} />
              <Route path="leave" element={<Navigate to="/leaves/my-dashboard" replace />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            <Route
              element={
                <ProtectedRoute
                  allowedRoles={["ADMIN", "HR", "MANAGER", "EMPLOYEE"]}
                />
              }
            >
              {employeeLeaveRoutes.map((route) => (
                <Route
                  key={route.path}
                  path={route.path.replace(/^\//, "")}
                  element={
                    route.path === "/leaves/my-dashboard" ? (
                      <MyLeaveDashboard />
                    ) : route.path === "/leaves/apply" ? (
                      <ApplyLeavePage />
                    ) : route.path === "/leaves/my-requests" ? (
                      <MyLeaveRequestsPage />
                    ) : route.path === "/leaves/holiday-calendar" ? (
                      <HolidayCalendarPage />
                    ) : route.path === "/leaves/comp-offs" ? (
                      <CompOffsPage />
                    ) : (
                      <LeavePlaceholderPage route={route} />
                    )
                  }
                />
              ))}
            </Route>

            <Route
              element={<ProtectedRoute allowedRoles={["ADMIN", "MANAGER"]} />}
            >
              {managerLeaveRoutes.map((route) => (
                <Route
                  key={route.path}
                  path={route.path.replace(/^\//, "")}
                  element={<LeavePlaceholderPage route={route} />}
                />
              ))}
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["ADMIN", "HR"]} />}>
              {hrLeaveRoutes.map((route) => (
                <Route
                  key={route.path}
                  path={route.path.replace(/^\//, "")}
                  element={<LeavePlaceholderPage route={route} />}
                />
              ))}
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
              {adminLeaveRoutes.map((route) => (
                <Route
                  key={route.path}
                  path={route.path.replace(/^\//, "")}
                  element={<LeavePlaceholderPage route={route} />}
                />
              ))}
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
              <Route path="admin/dashboard" element={<Home />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["HR"]} />}>
              <Route path="hr/dashboard" element={<Home />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["MANAGER"]} />}>
              <Route path="manager/dashboard" element={<Home />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["EMPLOYEE"]} />}>
              <Route path="employee/dashboard" element={<Home />} />
            </Route>

            <Route
              element={
                <ProtectedRoute
                  allowedRoles={["HR", "ADMIN"]}
                  requiredPermissions={["EMPLOYEE_READ"]}
                />
              }
            >
              <Route path="employees" element={<Employees />} />
              <Route path="employees/:id" element={<EmployeeDetails />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["HR", "ADMIN"]} />}>
              <Route path="payroll" element={<Payroll />} />
              <Route path="settings" element={<Settings />}>
                <Route
                  path="general/company-settings"
                  // path="general/company-settings/:id"
                  element={<CompanySettings />}
                />
                <Route
                  path="general/branch-settings"
                  element={<BranchSettings />}
                />
                <Route
                  path="general/password-config"
                  element={<PasswordConfig />}
                />
                 <Route
                  path="employee/onboarding-process"
                  element={<OnBoardingProcess />}
                />
                <Route
                  path="employee/department-settings"
                  element={<DepartmentSettings />}
                />
                <Route
                  path="employee/category-settings"
                  element={<CategorySettings />}
                />
                <Route
                  path="employee/category-items/:categoryId"
                  element={<CategoryItems />}
                />
                <Route index element={<CompanySettings />} />
              </Route>
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
