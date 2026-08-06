import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Suspense, lazy } from "react";
import type { ReactElement } from "react";
import { AuthProvider } from "../auth/AuthProvider";
import { useAuth } from "../auth/authContext";
import { getDefaultRoute, hasWorkspaceContext } from "../auth/authMapper";
import ProtectedRoute from "../auth/ProtectedRoute";
import Layout from "../components/Layout";
import { logger } from "../utils/logger";
import {
  getLeaveRouteGroupAllowedRoles,
  getLeaveRoutesByGroup,
  type LeaveRouteConfig,
  type LeaveRouteId,
} from "../pages/leave/leaveRoutes";
import { PERMISSIONS } from '../auth/Permissions.ts';
import BranchFiscalYearSelectPage from "../pages/auth/BranchFYSelect.tsx";
import WorkspaceGuard from "../auth/workSpaceGuard.tsx";

const Employees = lazy(() => import("../pages/employees/employeeManagement"));
const ForgotPassword = lazy(() => import("../pages/auth/ForgotPassword/ForgotPassword"));
const Home = lazy(() => import("../pages/home/home"));
const BIWorkspacePage = lazy(() => import("../pages/home/BiWorkspacePage.tsx"));
const ApplyLeavePage = lazy(() => import("../pages/leave/EmployeeComponents/ApplyLeavePage"));
const CompOffsPage = lazy(() => import("../pages/leave/EmployeeComponents/CompOffsPage"));
const HolidayCalendarPage = lazy(() => import("../pages/leave/EmployeeComponents/HolidayCalendarPage"));
const LeavePlaceholderPage = lazy(() => import("../pages/leave/LeavePlaceholderPage"));
const ManagerLeaveApprovalsPage = lazy(() => import("../pages/leave/ManagerComponents/ManagerLeaveApprovalsPage"));
const MyLeaveDashboard = lazy(() => import("../pages/leave/EmployeeComponents/MyLeaveDashboard"));
const MyLeaveRequestsPage = lazy(() => import("../pages/leave/EmployeeComponents/MyLeaveRequestsPage"));
const UpcomingEventsPage = lazy(() => import("../pages/leave/HrComponents/UpcomingEventsPage"));
const TeamCalendarPage = lazy(() => import("../pages/leave/ManagerComponents/TeamCalendarPage"));
const TeamSummaryPage = lazy(() => import("../pages/leave/ManagerComponents/TeamSummaryPage"));
const HrLeaveRequestsPage = lazy(() => import("../pages/leave//HrComponents/HrLeaveRequestsPage"));
const HrLeaveBalancesPage = lazy(() => import("../pages/leave/HrComponents/HrLeaveBalancesPage"));
const HrLeaveAdjustmentsPage = lazy(() => import("../pages/leave/HrComponents/HrLeaveAdjustmentsPage"));
const HrLopReviewPage = lazy(() => import("../pages/leave/HrComponents/HrLopReviewPage"));
const HrPayrollInputsPage = lazy(() => import("../pages/leave/HrComponents/HrPayrollInputsPage"));
const HrLeaveReportsPage = lazy(() => import("../pages/leave/HrComponents/HrLeaveReportsPage"));
const AdminLeaveTypesPage = lazy(() => import("../pages/leave/AdminComponents/AdminLeaveTypesPage"));
const AdminLeavePoliciesPage = lazy(() => import("../pages/leave/AdminComponents/AdminLeavePoliciesPage"));
const AdminHolidayCalendarsPage = lazy(() => import("../pages/leave/AdminComponents/AdminHolidayCalendarsPage"));
const AdminWorkCalendarsPage = lazy(() => import("../pages/leave/AdminComponents/AdminWorkCalendarsPage"));
const AdminWorkflowsPage = lazy(() => import("../pages/leave/AdminComponents/AdminWorkflowsPage"));
const Login = lazy(() => import("../pages/auth/Login/Login"));
const Signup = lazy(() => import("../pages/auth/signUp.tsx"));
const MfaPage = lazy(() => import("../pages/auth/MfaPage"));
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
const Documentation = lazy(() => import("../pages/Documentation/doc.tsx"));
const ShiftSettings = lazy(() => import("../pages/attendance/shiftSettings/shiftSettings"));
const AttendanceReports = lazy(() => import("../pages/attendance/attendanceReport"));
const PolicyDashboard = lazy(() => import("../pages/policies/PolicyDashboard"));
const CreatePolicy = lazy(() => import("../pages/policies/CreatePolicy"));
const EditPolicy = lazy(() => import("../pages/policies/EditPolicy"));
const PolicyDetails = lazy(() => import("../pages/policies/PolicyDetails"));
const PolicySimulator = lazy(() => import("../pages/policies/PolicySimulator"));
const PolicyReports = lazy(() => import("../pages/policies/PolicyReports"));
const AuditLogs = lazy(() => import("../pages/settings/general/auditLogs"));
const AllowanceComponents = lazy(() => import("../pages/settings/policy/allowanceComponents"));
const DeductionComponents = lazy(() => import("../pages/settings/policy/deductionComponents"));
const ExpenseCategory = lazy(() => import("../pages/settings/policy/expenseCategory"));
const AttendanceOverview = lazy(() => import("../pages/attendance/attendanceOverview"));
const AttendanceManagement = lazy(() => import("../pages/attendance/attendanceManagement"));
const AttendanceProcessing = lazy(() => import("../pages/attendance/attendanceProcessing"));
const AttendanceRecords = lazy(() => import("../pages/attendance/attendanceRecords"));
const MfaSetupPage = lazy(() => import("../pages/auth/MfaSetupPage.tsx"));
const PayrollDashboard = lazy(() => import("../pages/payroll/payroll.tsx"));
const PayrollRuns = lazy(() => import("../pages/payroll/Operations/PayrollRuns.tsx"));
const GeneratePayroll = lazy(() => import("../pages/payroll/Operations/GeneratePayroll"));
const PayrollDetails = lazy(() => import("../pages/payroll/Operations/PayrollDetails.tsx"));
const EmployeePayslips = lazy(() => import("../pages/payroll/Operations/EmployeePayslips.tsx"));
const EmployeePayslip = lazy(() => import("../pages/payroll/Operations/EmployeePayslip.tsx"));
const EmployeeSalaryView = lazy(() => import("../pages/payroll/Configuration/EmployeeView.tsx"));
const SalaryComponentBuilder = lazy(() => import("../pages/payroll/Configuration/SalaryCompBuider.tsx"));
const SalaryStructureTemplate = lazy(() => import("../pages/payroll/Configuration/SalaryStructure.tsx"));
const AssignSalaryStructure = lazy(() => import("../pages/payroll/Configuration/AssignSalary.tsx"));
const DeductionConfiguration = lazy(() => import("../pages/payroll/Configuration/Deductions.tsx"));
const PayrollPeriodConfig = lazy(() => import("../pages/payroll/Configuration/PayrollPeriod.tsx"));
const LoanAdvanceRequestPage = lazy(() => import("../pages/payroll/AdvancedFeature/LoanAdvanceRequestPage.tsx"));
const StatutoryCompliance = lazy(() => import("../pages/payroll/AdvancedFeature/StatutoryCompliance.tsx"));
const BankAdvice = lazy(() => import("../pages/payroll/AdvancedFeature/BankAdvice.tsx"));
const PayrollSettings = lazy(() => import("../pages/settings/payroll/payrollSettings.tsx"));
const PayrollReports = lazy(() => import("../pages/payroll/AdvancedFeature/PayrollReports.tsx"));
const PayrollAudit = lazy(() => import("../pages/payroll/AdvancedFeature/PayrolAudit.tsx"));
const EmployeePortal = lazy(() => import("../pages/payroll/AdvancedFeature/EmployeePortal"));
const UserManagement = lazy(() => import("../pages/userManagement/userMangement"));

const leaveRouteElements: Partial<Record<LeaveRouteId, ReactElement>> = {
  myDashboard: <MyLeaveDashboard />,
  apply: <ApplyLeavePage />,
  myRequests: <MyLeaveRequestsPage />,
  hrUpcomingEvents: <UpcomingEventsPage />,
  holidayCalendar: <HolidayCalendarPage />,
  compOffs: <CompOffsPage />,
  managerApprovals: <ManagerLeaveApprovalsPage />,
  teamCalendar: <TeamCalendarPage />,
  teamSummary: <TeamSummaryPage />,
  hrRequests: <HrLeaveRequestsPage />,
  hrBalances: <HrLeaveBalancesPage />,
  hrAdjustments: <HrLeaveAdjustmentsPage />,
  hrLopReview: <HrLopReviewPage />,
  hrPayrollInputs: <HrPayrollInputsPage />,
  hrReports: <HrLeaveReportsPage />,
  adminLeaveTypes: <AdminLeaveTypesPage />,
  adminPolicies: <AdminLeavePoliciesPage />,
  adminHolidayCalendars: <AdminHolidayCalendarsPage />,
  adminWorkCalendars: <AdminWorkCalendarsPage />,
  adminWorkflows: <AdminWorkflowsPage />,
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
  let redirectTo = "/login";
  // const redirectTo = session ? getDefaultRoute(session.user) : "/login";
  if (session) {
    if (hasWorkspaceContext(session)) {
      redirectTo = getDefaultRoute(session.user);
    } else {
      redirectTo = "/branch-fiscal-year";
    }
  }
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
          {/* Public Routes - No protection needed */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/mfa" element={<MfaPage />} />
          <Route path="/mfa-setup" element={<MfaSetupPage />} />
          <Route path="/select-tenant" element={<TenantSelectPage />} />
          <Route path="/branch-fiscal-year" element={<BranchFiscalYearSelectPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/" element={<RootRedirect />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route element={<WorkspaceGuard />}>

                {/* Home & Profile - All authenticated users */}
                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={["ADMIN", "HR", "MANAGER", "EMPLOYEE"]}
                    />
                  }
                >
                  <Route path="home" element={<Home />} />
                  <Route path="bi-workspace" element={<BIWorkspacePage />} />
                  <Route path="leave" element={<Navigate to="/leaves/my-dashboard" replace />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="documentation" element={<Documentation />} />
                  <Route path="my-info" element={<EmployeeDetails />} />
                  <Route path="onboarding-process" element={<OnBoardingProcess />} />
                </Route>

                {/* Employee Leave Routes */}
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

                {/* Manager Leave Routes */}
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

                {/* HR Leave Routes */}
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

                {/* Admin Leave Routes */}
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

                {/* Role-specific Dashboards */}
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

                {/* ============ EMPLOYEE MANAGEMENT ============ */}
                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={["HR", "ADMIN"]}
                      requiredPermissions={[PERMISSIONS.EMPLOYEE_READ]}
                    />
                  }
                >
                  <Route path="user-management" element={<UserManagement />} />
                  <Route path="employees" element={<Employees />} />
                  <Route path="employees/:id" element={<EmployeeDetails />} />
                </Route>

                {/* ============ POLICY MANAGEMENT ============ */}
                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={["HR", "ADMIN"]}
                      requiredPermissions={[PERMISSIONS.POLICY_READ]}
                    />
                  }
                >
                  <Route path="policies" element={<PolicyDashboard />} />
                  <Route path="policies/create" element={<CreatePolicy />} />
                  <Route path="policies/:id" element={<PolicyDetails />} />
                  <Route path="policies/:id/edit" element={<EditPolicy />} />
                  <Route path="policies/simulator" element={<PolicySimulator />} />
                  <Route path="policies/reports" element={<PolicyReports />} />
                </Route>

                {/* ============ ATTENDANCE MANAGEMENT ============ */}
                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={["HR", "ADMIN"]}
                      requiredPermissions={[PERMISSIONS.ATTENDANCE_READ]}
                    />
                  }
                >
                  <Route path="attendance/shifts" element={<ShiftSettings />} />
                  <Route path="attendance/overview" element={<AttendanceOverview />} />
                  <Route path="attendance/management" element={<AttendanceManagement />} />
                  <Route path="attendance/process" element={<AttendanceProcessing />} />
                  <Route path="attendance/records" element={<AttendanceRecords />} />
                  <Route path="attendance/reports" element={<AttendanceReports />} />
                </Route>

                {/* ============ PAYROLL - READ ACCESS ============ */}
                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={["HR", "ADMIN"]}
                      requiredPermissions={[PERMISSIONS.PAYROLL_READ]}
                    />
                  }
                >
                  <Route path="payroll" element={<PayrollDashboard />} />
                  <Route path="payroll/runs" element={<PayrollRuns />} />
                  <Route path="payroll/payslips" element={<EmployeePayslips />} />
                  <Route path="payroll/payslips/:empId/:period" element={<EmployeePayslip />} />
                  <Route path="payroll/employee-salary" element={<EmployeeSalaryView />} />
                  <Route path="payroll/runs/:id" element={<PayrollDetails />} />
                  <Route path="payroll/loan-advance-request" element={<LoanAdvanceRequestPage />} />
                </Route>

                {/* ============ PAYROLL - WRITE ACCESS ============ */}
                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={["HR", "ADMIN"]}
                      requiredPermissions={[PERMISSIONS.PAYROLL_WRITE]}
                      permissionMode="any"
                    />
                  }
                >
                  <Route path="payroll/generate" element={<GeneratePayroll />} />
                  <Route path="payroll/components" element={<SalaryComponentBuilder />} />
                  <Route path="payroll/structures" element={<SalaryStructureTemplate />} />
                  <Route path="payroll/assign" element={<AssignSalaryStructure />} />
                  <Route path="payroll/deductions" element={<DeductionConfiguration />} />
                  <Route path="payroll/periods" element={<PayrollPeriodConfig />} />
                  <Route path="payroll/compliance" element={<StatutoryCompliance />} />
                  <Route path="payroll/bank-advice" element={<BankAdvice />} />
                  <Route path="payroll/reports" element={<PayrollReports />} />
                  <Route path="payroll/audit" element={<PayrollAudit />} />
                  <Route path="payroll/employee-portal" element={<EmployeePortal />} />
                </Route>
              </Route>

              {/* ============ SETTINGS - READ ACCESS ============ */}
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={["ADMIN", "HR"]}
                    requiredPermissions={[PERMISSIONS.SETTINGS_READ]}
                  />
                }
              >
                <Route path="settings" element={<Settings />}>
                  {/* General Settings - Admin Only */}
                  <Route
                    element={
                      <ProtectedRoute
                        allowedRoles={["ADMIN"]}
                        requiredPermissions={[PERMISSIONS.SETTINGS_WRITE]}
                      />
                    }
                  >
                    <Route path="general/company-settings" element={<CompanySettings />} />
                    <Route path="general/branch-settings" element={<BranchSettings />} />
                    <Route path="general/shift-settings" element={<ShiftSettings />} />
                    <Route path="general/password-config" element={<PasswordConfig />} />
                  </Route>

                  {/* Audit Logs - Admin, HR, Manager with READ permission */}
                  <Route
                    element={
                      <ProtectedRoute
                        allowedRoles={["ADMIN", "HR", "MANAGER"]}
                        requiredPermissions={[PERMISSIONS.REPORT_READ]}
                      />
                    }
                  >
                    <Route path="general/audit-logs" element={<AuditLogs />} />
                  </Route>

                  {/* Employee Settings - Admin & HR with WRITE permission */}
                  <Route
                    element={
                      <ProtectedRoute
                        allowedRoles={["ADMIN", "HR"]}
                        requiredPermissions={[PERMISSIONS.EMPLOYEE_WRITE]}
                      />
                    }
                  >
                    <Route path="employee/onboarding-process" element={<OnBoardingProcess />} />
                    <Route path="employee/department-settings" element={<DepartmentSettings />} />
                    <Route path="employee/category-settings" element={<CategorySettings />} />
                    <Route path="employee/category-items/:categoryId" element={<CategoryItems />} />
                  </Route>

                  {/* Policy Settings - Admin & HR with POLICY_WRITE */}
                  <Route
                    element={
                      <ProtectedRoute
                        allowedRoles={["ADMIN", "HR"]}
                        requiredPermissions={[PERMISSIONS.POLICY_WRITE]}
                      />
                    }
                  >
                    <Route path="policy/allowance-components" element={<AllowanceComponents />} />
                    <Route path="policy/deduction-components" element={<DeductionComponents />} />
                    <Route path="policy/expense-category" element={<ExpenseCategory />} />
                  </Route>

                  {/* Payroll Settings - Admin Only with PAYROLL_WRITE & SETTINGS_WRITE */}
                  <Route
                    element={
                      <ProtectedRoute
                        allowedRoles={["ADMIN"]}
                        requiredPermissions={[PERMISSIONS.PAYROLL_WRITE, PERMISSIONS.SETTINGS_WRITE]}
                        permissionMode="all"
                      />
                    }
                  >
                    <Route path="payroll/payroll-settings" element={<PayrollSettings />} />
                    <Route path="payroll/payroll-settings/:tab" element={<PayrollSettings />} />
                  </Route>

                  <Route index element={<CompanySettings />} />
                </Route>
              </Route>

            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
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

// function AppRoutesContent() {
//   const employeeLeaveRoutes = getLeaveRoutesByGroup("employee");
//   const managerLeaveRoutes = getLeaveRoutesByGroup("manager");
//   const hrLeaveRoutes = getLeaveRoutesByGroup("hr");
//   const adminLeaveRoutes = getLeaveRoutesByGroup("admin");

//   return (
//     <BrowserRouter>
//       <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-gray-500">Loading...</div>}>
//         <Routes>
//           <Route path="/login" element={<Login />} />
//           <Route path="/signup" element={<Signup />} />
//           <Route path="/forgot-password" element={<ForgotPassword />} />
//           <Route path="/reset-password" element={<ResetPassword />} />
//           <Route path="/verify-otp" element={<VerifyOTP />} />
//           <Route path="/mfa" element={<MfaPage />} />
//           <Route path="/mfa-setup" element={<MfaSetupPage />} />
//           <Route path="/select-tenant" element={<TenantSelectPage />} />
//           <Route path="/unauthorized" element={<UnauthorizedPage />} />
//           <Route path="/" element={<RootRedirect />} />

//           <Route element={<ProtectedRoute />}>
//             <Route element={<Layout />}>
//               <Route
//                 element={
//                   <ProtectedRoute
//                     allowedRoles={["ADMIN", "HR", "MANAGER", "EMPLOYEE"]}
//                   />
//                 }
//               >
//                 <Route path="home" element={<Home />} />
//                 <Route path="bi-workspace" element={<BIWorkspacePage />} />
//                 <Route path="leave" element={<Navigate to="/leaves/my-dashboard" replace />} />
//                 <Route path="profile" element={<Profile />} />
//                 <Route path="documentation" element={<Documentation />} />
//                 <Route path="my-info" element={<EmployeeDetails />} />
//               </Route>

//               <Route
//                 element={
//                   <ProtectedRoute
//                     allowedRoles={getLeaveRouteGroupAllowedRoles("employee")}
//                   />
//                 }
//               >
//                 {employeeLeaveRoutes.map((route) => (
//                   <Route
//                     key={route.path}
//                     path={route.path.replace(/^\//, "")}
//                     element={getLeaveRouteElement(route)}
//                   />
//                 ))}
//               </Route>

//               <Route
//                 element={
//                   <ProtectedRoute
//                     allowedRoles={getLeaveRouteGroupAllowedRoles("manager")}
//                   />
//                 }
//               >
//                 {managerLeaveRoutes.map((route) => (
//                   <Route
//                     key={route.path}
//                     path={route.path.replace(/^\//, "")}
//                     element={getLeaveRouteElement(route)}
//                   />
//                 ))}
//               </Route>

//               <Route
//                 element={
//                   <ProtectedRoute
//                     allowedRoles={getLeaveRouteGroupAllowedRoles("hr")}
//                   />
//                 }
//               >
//                 {hrLeaveRoutes.map((route) => (
//                   <Route
//                     key={route.path}
//                     path={route.path.replace(/^\//, "")}
//                     element={getLeaveRouteElement(route)}
//                   />
//                 ))}
//               </Route>

//               <Route
//                 element={
//                   <ProtectedRoute
//                     allowedRoles={getLeaveRouteGroupAllowedRoles("admin")}
//                   />
//                 }
//               >
//                 {adminLeaveRoutes.map((route) => (
//                   <Route
//                     key={route.path}
//                     path={route.path.replace(/^\//, "")}
//                     element={getLeaveRouteElement(route)}
//                   />
//                 ))}
//               </Route>

//               <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
//                 <Route path="admin/dashboard" element={<Home />} />
//               </Route>

//               <Route element={<ProtectedRoute allowedRoles={["HR"]} />}>
//                 <Route path="hr/dashboard" element={<Home />} />
//               </Route>

//               <Route element={<ProtectedRoute allowedRoles={["MANAGER"]} />}>
//                 <Route path="manager/dashboard" element={<Home />} />
//               </Route>

//               <Route element={<ProtectedRoute allowedRoles={["EMPLOYEE"]} />}>
//                 <Route path="employee/dashboard" element={<Home />} />
//               </Route>

//               <Route
//                 element={
//                   <ProtectedRoute
//                     allowedRoles={["HR", "ADMIN"]}
//                     requiredPermissions={["EMPLOYEE_READ"]}
//                   />
//                 }
//               >
//                 <Route path="employees" element={<Employees />} />
//                 <Route path="employees/:id" element={<EmployeeDetails />} />
//               </Route>

//               {/* Policy Routes - Accessible by HR and ADMIN */}
//               <Route
//                 element={
//                   <ProtectedRoute
//                     allowedRoles={["HR", "ADMIN"]}
//                   />
//                 }
//               >
//                 <Route path="policies" element={<PolicyDashboard />} />
//                 <Route path="policies/create" element={<CreatePolicy />} />
//                 <Route path="policies/:id" element={<PolicyDetails />} />
//                 <Route path="policies/:id/edit" element={<EditPolicy />} />
//                 <Route path="policies/simulator" element={<PolicySimulator />} />
//                 <Route path="policies/reports" element={<PolicyReports />} />
//               </Route>

//               <Route element={<ProtectedRoute allowedRoles={["HR", "ADMIN"]} />}>
//                 <Route path="attendance/shifts" element={<ShiftSettings />} />
//                 <Route path="attendance/overview" element={<AttendanceOverview />} />
//                 <Route path="attendance/management" element={<AttendanceManagement />} />
//                 <Route path="attendance/process" element={<AttendanceProcessing />} />
//                 <Route path="attendance/records" element={<AttendanceRecords />} />
//                 <Route path="attendance/reports" element={<AttendanceReports />} />
//                 {/* </Route> */}
//                 <Route path="payroll" element={<Payroll />} />
//                 <Route path="payroll/loan-advance-request" element={<LoanAdvanceRequestPage />} />
//                 <Route path="settings" element={<Settings />}>
//                   <Route
//                     path="general/company-settings"
//                     element={<CompanySettings />}
//                   />
//                   <Route
//                     path="general/branch-settings"
//                     element={<BranchSettings />}
//                   />
//                   <Route
//                     path="general/shift-settings"
//                     element={<ShiftSettings />}
//                   />
//                   <Route
//                     path="general/password-config"
//                     element={<PasswordConfig />}
//                   />
//                   <Route
//                     path="general/audit-logs"
//                     element={<AuditLogs />}
//                   />
//                   <Route
//                     path="employee/onboarding-process"
//                     element={<OnBoardingProcess />}
//                   />
//                   <Route
//                     path="employee/department-settings"
//                     element={<DepartmentSettings />}
//                   />
//                   <Route
//                     path="employee/category-settings"
//                     element={<CategorySettings />}
//                   />
//                   <Route
//                     path="employee/category-items/:categoryId"
//                     element={<CategoryItems />}
//                   />
//                   <Route
//                     path="policy/allowance-components"
//                     element={<AllowanceComponents />}
//                   />
//                   <Route
//                     path="policy/deduction-components"
//                     element={<DeductionComponents />}
//                   />
//                   <Route
//                     path="policy/expense-category"
//                     element={<ExpenseCategory />}
//                   />

//                   <Route
//                     path="payroll/payroll-settings"
//                     element={<PayrollSettings />}
//                   />
//                   <Route
//                     path="payroll/payroll-settings/:tab"
//                     element={<PayrollSettings />}
//                   />
//                   <Route index element={<CompanySettings />} />
//                 </Route>
//               </Route>

//               <Route element={<ProtectedRoute
//                 allowedRoles={["HR", "ADMIN"]}
//                 requiredPermissions={[PERMISSIONS.PAYROLL_READ]}
//               />}>
//                 <Route path="payroll" element={<PayrollDashboard />} />
//                 <Route path="payroll/runs" element={<PayrollRuns />} />
//                 <Route path="payroll/payslips" element={<EmployeePayslips />} />
//               </Route>

//               <Route element={<ProtectedRoute
//                 allowedRoles={["HR", "ADMIN"]}
//                 requiredPermissions={[PERMISSIONS.PAYROLL_WRITE]}
//                 permissionMode="any"
//               />}>
//                 <Route path="payroll/generate" element={<GeneratePayroll />} />
//                 <Route path="payroll/assign" element={<AssignSalaryStructure />} />
//               </Route>

//               {/* <Route element={<ProtectedRoute
//                 allowedRoles={["ADMIN"]}
//                 requiredPermissions={[PERMISSIONS.USER_MANAGE]}
//                 permissionMode="all"
//               />}>
//                 <Route path="settings" element={<Settings />} />
//               </Route> */}

//               <Route element={<ProtectedRoute allowedRoles={["HR", "ADMIN"]} />}>
//                 {/* Payroll Routes */}
//                 {/* <Route path="payroll" element={<PayrollDashboard />} /> */}
//                 {/* <Route path="payroll/runs" element={<PayrollRuns />} /> */}
//                 <Route path="payroll/runs/:id" element={<PayrollDetails />} />
//                 {/* <Route path="payroll/generate" element={<GeneratePayroll />} /> */}
//                 {/* <Route path="payroll/payslips" element={<EmployeePayslips />} /> */}
//                 <Route path="payroll/payslips/:empId/:period" element={<EmployeePayslip />} />
//                 <Route path="payroll/employee-salary" element={<EmployeeSalaryView />} />
//                 <Route path="payroll/components" element={<SalaryComponentBuilder />} />
//                 <Route path="payroll/structures" element={<SalaryStructureTemplate />} />
//                 {/* <Route path="payroll/assign" element={<AssignSalaryStructure />} /> */}
//                 <Route path="payroll/deductions" element={<DeductionConfiguration />} />
//                 <Route path="payroll/periods" element={<PayrollPeriodConfig />} />
//                 <Route path="payroll/loan-advance-request" element={<LoanAdvanceRequestPage />} />
//                 <Route path="payroll/compliance" element={<StatutoryCompliance />} />
//                 <Route path="payroll/bank-advice" element={<BankAdvice />} />
//                 {/* <Route path="payroll/reports" element={<PayrollReports />} />
//                 <Route path="payroll/audit" element={<PayrollAudit />} />
//                 <Route path="payroll/employee-portal" element={<EmployeePortal />} /> */}
//               </Route>
//             </Route>
//             <Route path="*" element={<Navigate to="/" replace />} />
//           </Route>
//         </Routes>
//       </Suspense>
//     </BrowserRouter>
//   );
// }

// export default function AppRoutes() {
//   return (
//     <AuthProvider>
//       <AppRoutesContent />
//     </AuthProvider>
//   );
// }
