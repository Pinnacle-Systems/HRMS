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
import CompanySettings from "../pages/settings/companySettings";
import PasswordConfig from "../pages/settings/passwordConfig";


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
            {/* Settings Routes */}
          <Route path="settings" element={<Settings />}>
            {/* General Tab Routes */}
            <Route path="general/company-settings" element={<CompanySettings />} />
            <Route path="general/password-config" element={<PasswordConfig />} />
            
            {/* Employee Tab Routes */}
            {/* <Route path="employee/employee" element={<Employee />} />
            <Route path="employee/employee-positions" element={<EmployeePositions />} /> */}
            
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
