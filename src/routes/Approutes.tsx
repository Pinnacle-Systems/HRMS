import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Suspense, lazy } from "react";
import type { ReactElement } from "react";
import { AuthProvider } from "../auth/AuthProvider";
import { useAuth } from "../auth/authContext";
import { getDefaultRoute } from "../auth/authMapper";
import ProtectedRoute from "../auth/ProtectedRoute";
import Layout from "../components/Layout";
import { logger } from "../utils/logger";
import {
  getLeaveRouteGroupAllowedRoles,
  getLeaveRoutesByGroup,
  type LeaveRouteConfig,
  type LeaveRouteId,
} from "../pages/leave/leaveRoutes";

const Employees = lazy(() => import("../pages/employees/employeeManagement"));
const ForgotPassword = lazy(() => import("../pages/auth/ForgotPassword/ForgotPassword"));
const Home = lazy(() => import("../pages/home/home"));
const ApplyLeavePage = lazy(() => import("../pages/leave/ApplyLeavePage"));
const CompOffsPage = lazy(() => import("../pages/leave/CompOffsPage"));
const HolidayCalendarPage = lazy(() => import("../pages/leave/HolidayCalendarPage"));
const LeavePlaceholderPage = lazy(() => import("../pages/leave/LeavePlaceholderPage"));
const ManagerLeaveApprovalsPage = lazy(() => import("../pages/leave/ManagerLeaveApprovalsPage"));
const MyLeaveDashboard = lazy(() => import("../pages/leave/MyLeaveDashboard"));
const MyLeaveRequestsPage = lazy(() => import("../pages/leave/MyLeaveRequestsPage"));
const Login = lazy(() => import("../pages/auth/Login/Login"));
const MfaPage = lazy(() => import("../pages/auth/MfaPage"));
const Payroll = lazy(() => import("../pages/payroll/payroll"));
const ResetPassword = lazy(() => import("../pages/auth/ResetPassword/ResetPassword"));
const Settings = lazy(() => import("../pages/settings/settings"));
const TenantSelectPage = lazy(() => import("../pages/auth/TenantSelectPage"));
const UnauthorizedPage = lazy(() => import("../pages/UnauthorizedPage"));
const VerifyOTP = lazy(() => import("../pages/auth/VerifyOTP/otp"));
const PasswordConfig = lazy(() => import("../pages/settings/general/passwordConfig"));
const CompanySettings = lazy(() => import("../pages/settings/general/companySettings"));
const Profile = lazy(() => import("../pages/myProfile/myprofile"));
const BranchSettings = lazy(() => import("../pages/settings/general/branchSettings"));
const DepartmentSettings = lazy(() => import("../pages/settings/employee/depSettings"));
const CategoryItems = lazy(() => import("../pages/settings/employee/categoryItems"));
const CategorySettings = lazy(() => import("../pages/settings/employee/otherCategory"));
const EmployeeDetails = lazy(() => import("../pages/employees/employeeDetails"));
const OnBoardingProcess = lazy(() => import("../pages/settings/employee/onBoardingProcess/onboard"));
const Documentation = lazy(() => import("../pages/Documentation/doc"));

const leaveRouteElements: Partial<Record<LeaveRouteId, ReactElement>> = {
  myDashboard: <MyLeaveDashboard />,
  apply: <ApplyLeavePage />,
  myRequests: <MyLeaveRequestsPage />,
  holidayCalendar: <HolidayCalendarPage />,
  compOffs: <CompOffsPage />,
  managerApprovals: <ManagerLeaveApprovalsPage />,
};

function getLeaveRouteElement(route: LeaveRouteConfig) {
  return leaveRouteElements[route.id] ?? <LeavePlaceholderPage route={route} />;
}

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
  const employeeLeaveRoutes = getLeaveRoutesByGroup("employee");
  const managerLeaveRoutes = getLeaveRoutesByGroup("manager");
  const hrLeaveRoutes = getLeaveRoutesByGroup("hr");
  const adminLeaveRoutes = getLeaveRoutesByGroup("admin");

  return (
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-gray-500">Loading...</div>}>
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
                <Route path="documentation" element={<Documentation />} />
              </Route>

              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={getLeaveRouteGroupAllowedRoles("employee")}
                  />
                }
              >
                {employeeLeaveRoutes.map((route) => (
                  <Route
                    key={route.path}
                    path={route.path.replace(/^\//, "")}
                    element={getLeaveRouteElement(route)}
                  />
                ))}
              </Route>

              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={getLeaveRouteGroupAllowedRoles("manager")}
                  />
                }
              >
                {managerLeaveRoutes.map((route) => (
                  <Route
                    key={route.path}
                    path={route.path.replace(/^\//, "")}
                    element={getLeaveRouteElement(route)}
                  />
                ))}
              </Route>

              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={getLeaveRouteGroupAllowedRoles("hr")}
                  />
                }
              >
                {hrLeaveRoutes.map((route) => (
                  <Route
                    key={route.path}
                    path={route.path.replace(/^\//, "")}
                    element={getLeaveRouteElement(route)}
                  />
                ))}
              </Route>

              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={getLeaveRouteGroupAllowedRoles("admin")}
                  />
                }
              >
                {adminLeaveRoutes.map((route) => (
                  <Route
                    key={route.path}
                    path={route.path.replace(/^\//, "")}
                    element={getLeaveRouteElement(route)}
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
      </Suspense>
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
