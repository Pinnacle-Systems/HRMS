import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/auth/Login/Login";
import PrivateRoute from "./Route";
import ForgotPassword from "../pages/auth/ForgotPassword/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword/ResetPassword";
import VerifyOTP from "../pages/auth/VerifyOTP/otp";
import Home from "../pages/home/home";
import Layout from "../components/Layout";
import Employees from "../pages/employees/employees";
import Settings from "../pages/settings/settings";
import CompanySettings from "../pages/settings/general/companySettings";
import PasswordConfig from "../pages/settings/general/passwordConfig";
import Profile from "../pages/myProfile/myprofile";
import BranchSettings from "../pages/settings/general/branchSettings";
import DepartmentSettings from "../pages/settings/employee/depSettings";
import CategorySettings from "../pages/settings/employee/otherCategory";
import CategoryItems from "../pages/settings/employee/categoryItems";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="home" element={<Home />} />
            <Route path="employees" element={<Employees />} />
            <Route path="profile" element={<Profile />} />
            {/* Settings Routes */}
            <Route path="settings" element={<Settings />}>
              <Route
                path="general/company-settings"
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
              {/* Employee Tab Routes */}
              <Route path="employee" element={<Employees />} />
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

              {/* Payroll Tab Routes */}
              {/* <Route path="payroll/payroll-settings" element={<PayrollSettings />} /> */}

              {/* Income Tax Tab Routes */}
              {/* <Route path="income-tax/income-tax-settings" element={<IncomeTaxSettings />} /> */}

              {/* Default redirect */}
              <Route index element={<CompanySettings />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
