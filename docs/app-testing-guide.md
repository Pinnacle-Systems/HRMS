# HRMS App Testing Guide

## Purpose
This document helps testers understand the main functionality of the HRMS app and what to verify during manual or exploratory testing.

## Who this guide is for
This guide is written for people who do not code. It uses easy words and shows page-by-page checks that anyone can follow.

- No coding knowledge is needed.
- Follow the steps and look for the buttons, pages, and messages described.
- Note anything that looks wrong, is missing, or does not work.

## How to use this guide
1. Open the app in a browser.
2. Use the menu and buttons to go to each page.
3. Follow the page names listed here.
4. On each page, do the checks under that page name.
5. If something does not behave as expected, write it down.

## How to run the app

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Start the application locally:
   ```bash
   pnpm dev
   ```
3. Open the app in a browser at:
   ```
   http://localhost:5173
   ```

## Available test commands

- Run unit tests:
  ```bash
  pnpm test
  ```
- Run end-to-end tests:
  ```bash
  pnpm test:e2e
  ```
- Run Playwright UI mode:
  ```bash
  pnpm test:e2e:ui
  ```
- Run Playwright headed mode:
  ```bash
  pnpm test:e2e:headed
  ```
- Open existing Playwright report:
  ```bash
  pnpm test:e2e:report
  ```

## Main application flow

The app is a React + TypeScript HRMS system with user authentication and role-based navigation.

### Entry points
- `/login` - login screen
- `/forgot-password` - forgot password flow
- `/reset-password` - reset password flow
- `/verify-otp` - OTP verification
- `/mfa` - multi-factor authentication
- `/select-tenant` - tenant selection
- `/unauthorized` - access denied page

If the user is authenticated, the default root path `/` redirects to their role-specific landing page.

## Primary feature areas

### 1. Home
- URL: `/home`
- Shows dashboard data and quick access to role-based features.
- Available to all authenticated roles: `EMPLOYEE`, `MANAGER`, `HR`, `ADMIN`.

### 2. Employees
- URL: `/employees`
- Restricted to `HR` and `ADMIN` users with `EMPLOYEE_READ` permission.
- Test employee search, pagination, row selection, and employee details.
- Employee detail page: `/employees/:id`.

#### Employee Details page
- URL: `/employees/:id`
- Shows full information for one employee.
- The page has a profile header with name, employee ID, email, phone, and photo.
- There are tabs for different sections of employee data:
  - Personal Information
  - Addresses
  - Qualifications
  - Employee Details (admin data)
  - Training Details
  - Previous Employments
  - Identification Details
  - Family Members
  - Nominations
  - Attachments
- Each tab shows either:
  - a form-like group of fields with values, or
  - a table of items such as addresses, qualifications, or family members.
- There is an edit button for fields and a save/cancel flow for editing.
- Attachments can be uploaded on the Attachments tab or on some detail cards where a document type is shown.

##### What to check on Employee Details
- Open an employee from the list and verify the profile header displays the correct name, ID, email, and phone.
- Check each tab label is visible and clickable.
- On the Personal Information tab, confirm basic info and emergency contacts appear.
- On the Addresses tab, confirm address rows are shown.
- On Qualifications, confirm educational or skill records are listed.
- On Employee Details, confirm employee-specific settings like department, role, verification, and eligibility appear.
- On Identification Details, confirm bank, PAN, Aadhaar, passport, insurance, ESI, PRAN, and login details are shown.
- On Family Members, confirm family records appear.
- On Nominations, confirm nominee records appear by nomination type.
- On Attachments, confirm the attachments list appears and upload works if enabled.
- If the page allows editing, click Edit, make a small change, and check Save and Cancel behavior.

### 3. Leave Management
- URL base: `/leaves/*`
- Available to most roles, with sub-pages based on role permissions.

Key leave pages:
- `/leaves/my-dashboard` - personal leave dashboard
- `/leaves/apply` - submit a leave request
- `/leaves/my-requests` - view own leave requests
- `/leaves/holiday-calendar` - view holidays
- `/leaves/comp-offs` - comp off requests
- `/leaves/manager-approvals` - manager approval queue

### 4. Attendance
- URL base: `/attendance/*`
- Restricted to `HR` and `ADMIN`.

Attendance pages:
- `/attendance/shifts` - shift management settings
- `/attendance/list` - attendance records list
- `/attendance/reports` - attendance reporting

### 5. Payroll
- URL: `/payroll`
- Restricted to `HR` and `ADMIN`.
- Verify payroll-related UI, data loading and any actions available.

### 6. Settings
- URL base: `/settings/*`
- Restricted to `HR` and `ADMIN`.
- Settings sections include:
  - `/settings/general/company-settings`
  - `/settings/general/password-config`
  - `/settings/general/branch-settings`
  - `/settings/employee/dep-settings`
  - `/settings/employee/category-items`
  - `/settings/employee/other-category`
  - `/settings/employee/onboarding-process`

### 7. My Profile
- URL: `/profile`
- User profile and personal settings.
- Verify profile display and user-specific data.

### 8. Documentation / Help
- URL: `/documentation`
- Static documentation section for help and app guidance.

## Page and module overview

### Auth pages and modules
- `/login` (`src/pages/auth/Login/Login.tsx`): shows email/password fields and sign-in button. This page lets users log in.
- `/forgot-password` (`src/pages/auth/ForgotPassword/ForgotPassword.tsx`): asks for email to start password recovery.
- `/reset-password` (`src/pages/auth/ResetPassword/ResetPassword.tsx`): lets users set a new password after recovery.
- `/verify-otp` (`src/pages/auth/VerifyOTP/otp.tsx`): asks for one-time code sent to the user.
- `/mfa` (`src/pages/auth/MfaPage.tsx`): multi-factor auth step for extra security.
- `/select-tenant` (`src/pages/auth/TenantSelectPage.tsx`): lets users choose a workspace or tenant if needed.
- `/unauthorized` (`src/pages/UnauthorizedPage.tsx`): shows a simple access-denied message.

### Home page
- `/home` (`src/pages/home/home.tsx`): the main dashboard. It shows high-level information and quick links to other sections.

### Employee management
- `/employees` (`src/pages/employees/employeeManagement.tsx`): list of employees, search, pagination, and action buttons.
- `/employees/:id` (`src/pages/employees/employeeDetails.tsx`): details for a selected employee, such as contact info and role data.

### Leave module
- `/leaves/my-dashboard` (`src/pages/leave/MyLeaveDashboard.tsx`): personal leave summary and status.
- `/leaves/apply` (`src/pages/leave/ApplyLeavePage.tsx`): form to request leave or time off.
- `/leaves/my-requests` (`src/pages/leave/MyLeaveRequestsPage.tsx`): list of the user’s leave requests and their statuses.
- `/leaves/holiday-calendar` (`src/pages/leave/HolidayCalendarPage.tsx`): calendar view of holidays.
- `/leaves/comp-offs` (`src/pages/leave/CompOffsPage.tsx`): submit or track comp-off requests.
- `/leaves/manager-approvals` (`src/pages/leave/ManagerLeaveApprovalsPage.tsx`): managers approve or reject leave requests.
- `src/pages/leave/LeavePlaceholderPage.tsx`: generic page shown when a leave route is not implemented yet.
- `src/pages/leave/components/*`: shared UI parts like tabs, filters, badges, and layout wrappers used across leave pages.

### Attendance module
- `/attendance/shifts` (`src/pages/attendance/shiftSettings/shiftSettings.tsx`): manage work shifts and schedules.
- `/attendance/list` (`src/pages/attendance/attendanceList.tsx`): attendance records table.
- `/attendance/reports` (`src/pages/attendance/attendanceReport.tsx`): attendance reports and summary charts.
- `src/pages/attendance/shiftSettings/*`: child screens for creating shifts, viewing schedules, rosters, and rotation settings.

### Payroll page
- `/payroll` (`src/pages/payroll/payroll.tsx`): payroll-related overview and any payroll actions.

### Settings module
- `/settings/general/company-settings` (`src/pages/settings/general/companySettings.tsx`): company details and configuration.
- `/settings/general/password-config` (`src/pages/settings/general/passwordConfig.tsx`): password policy or settings.
- `/settings/general/branch-settings` (`src/pages/settings/general/branchSettings.tsx`): branch office setup and location settings.
- `/settings/employee/dep-settings` (`src/pages/settings/employee/depSettings.tsx`): department setup.
- `/settings/employee/category-items` (`src/pages/settings/employee/categoryItems.tsx`): category management for employee settings.
- `/settings/employee/other-category` (`src/pages/settings/employee/otherCategory.tsx`): manage additional employee categories.
- `/settings/employee/onboarding-process` (`src/pages/settings/employee/onBoardingProcess/onboard.tsx`): onboarding flows and related subpages.
- `src/pages/settings/employee/onBoardingProcess/*`: onboarding subpages for document upload, checklist builder, assignment, and progress tracking.

### My Profile
- `/profile` (`src/pages/myProfile/myprofile.tsx`): shows personal user information, preferences and profile details.

### Documentation / Help
- `/documentation` (`src/pages/documentation/doc.tsx`): help content and static documentation.

### Shared UI and infrastructure modules
- `src/components/Layout.tsx`: page wrapper used by logged-in users; contains the sidebar menu, top app bar, notifications, and profile menu.
- `src/components/ThemeSwitcher.tsx` and `src/components/ThemePanel.tsx`: let users change app theme or view settings.
- `src/auth/ProtectedRoute.tsx`: guards pages by role and permissions.
- `src/auth/AuthProvider.tsx`: manages user session, login, logout, and auth state.
- `src/auth/authMapper.ts`: decides which pages users can see and where to send them after login.

## Page-by-page checklist for non-technical testers

### Login page
- Open the app and go to the login page.
- Enter email and password.
- Click the login button.
- Check that you are taken to the dashboard or home page.
- If the login fails, confirm a clear error message is shown.

### Forgot password
- Go to the forgot password page.
- Enter the email address.
- Click the button to send a recovery email.
- Check that a success message appears.

### Reset password
- Open the reset password page.
- Enter a new password and confirm it.
- Click the save button.
- Check that the page confirms your password was reset.

### Verify OTP / MFA
- If asked, enter the code sent to your email or phone.
- Click verify.
- Check that you can continue into the app.

### Home page
- Confirm the page title or banner says Home or Dashboard.
- Look for quick links and summary cards.
- Click a link to a different section and make sure it opens.

### Employees page
- Open the Employees page.
- Confirm you can see a list of people or employee rows.
- Try the search box if there is one.
- Click one employee to open details.
- Check that the detail page shows employee name and role.

### Leave pages
- Open the leave dashboard page.
- Confirm your leave summary is visible.
- Go to the Apply Leave page and see the form fields.
- Try to select dates and submit (or confirm the form appears correctly).
- Check My Requests to see a list of your leave requests.
- Open Holiday Calendar and confirm holidays are visible on the calendar.
- Open Comp Offs and check the page loads.
- If you are a manager, open Manager Approvals and verify pending requests appear.

### Attendance pages
- Open Shift Management and confirm shift details appear.
- Open Attendance List and look for a table of records.
- Open Reports and see charts or summary data.

### Payroll page
- Open the Payroll page.
- Check that payroll information or headings are visible.
- Confirm any buttons or filters appear.

### Settings pages
- Open Company Settings and see company details.
- Open Password Config and check password settings appear.
- Open Branch Settings and verify branch/location options are visible.
- Open Department Settings and confirm the department list shows.
- Open Category Items and see category controls.
- Open Onboarding Process and verify onboarding task steps are visible.

### My Profile
- Open the Profile page.
- Confirm your name, email, and profile details are shown.
- Check whether you can see a profile edit button or personal settings.

### Documentation / Help
- Open the Documentation page.
- Confirm text or help content is visible.
- Look for links or instructions that explain the app.

## Navigation

The left-side menu is role-aware and shows items only if the signed-in user has permission.

Menu items include:
- Home
- Employees
- Leave
- Attendance
- Payroll
- Settings
- Help

Use the top-right profile menu to access:
- My Profile
- Logout

## Authentication and permissions to verify

### Authentication flows
- Successful login with valid credentials.
- Invalid login error handling.
- Forgot password request path.
- Reset password page behavior.
- OTP / MFA flow transitions.
- Tenant selection if the app requires tenant context.

### Authorization checks
- Role-based access control for restricted pages.
- Redirect to `/unauthorized` when a user lacks permission.
- Verify `HR` and `ADMIN` can access Attendance, Payroll, and Settings.
- Verify `EMPLOYEE` and `MANAGER` have access to leave and profile pages.

## Suggested manual test scenarios

### Scenario 1: Login and basic navigation
1. Open `/login`.
2. Sign in with valid credentials.
3. Confirm landing page redirects correctly.
4. Navigate through Home, Leave, and Help.
5. Open profile and logout.

### Scenario 2: Role-based access validation
1. Sign in as `EMPLOYEE`.
2. Confirm `Attendance`, `Payroll`, and `Settings` are not visible or accessible.
3. Attempt direct access to `/attendance/shifts` and verify `/unauthorized`.
4. Sign in as `HR` or `ADMIN` and confirm those pages are accessible.

### Scenario 3: Leave workflow
1. Open `/leaves/my-dashboard`.
2. Submit a new leave request via `/leaves/apply`.
3. Check the request appears in `/leaves/my-requests`.
4. If logged in as `MANAGER`, verify `/leaves/manager-approvals` lists pending approvals.

### Scenario 4: Employee management
1. Open `/employees` as `HR` or `ADMIN`.
2. Verify employee list loads and pagination works.
3. Click an employee row and open details.
4. Confirm details render and any update buttons appear.

### Scenario 5: Attendance and payroll
1. Open `/attendance/shifts` and verify shift settings display.
2. Open `/attendance/list` and confirm attendance data loads.
3. Open `/attendance/reports` and verify report UI.
4. Open `/payroll` and ensure payroll page content loads.

### Scenario 6: Settings and configuration
1. Open `/settings/general/company-settings`.
2. Open branch settings and department settings.
3. Verify onboarding and category management screens load.

## Notes for testers

- The app uses protected routes and lazy-loaded pages.
- If a page is blank while loading, wait for the fallback spinner.
- Local storage may contain auth session data; clear it if login issues occur.
- Check console for warnings or errors during test execution.

## Recommended test environment

- Browser: Chrome, Edge, or Firefox.
- Network: stable local API or mocked backend if required.
- Use Playwright for automated regression if available.

---

### Document location
This guide is stored at `docs/app-testing-guide.md`.
