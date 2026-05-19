# Leave Module Frontend Plan

## Existing Patterns Found

### Routing
- Routes are defined centrally in `src/routes/Approutes.tsx` using `BrowserRouter`, `Routes`, nested `Route`, `Outlet`, and `Navigate`.
- Public auth routes live at top level: `/login`, `/forgot-password`, `/reset-password`, `/verify-otp`, `/mfa`, `/select-tenant`.
- Authenticated app routes are nested under `<ProtectedRoute />` and `<Layout />`.
- Current shared role route group allows `ADMIN`, `HR`, `MANAGER`, and `EMPLOYEE` for `/home`, `/leave`, and `/profile`.
- Role dashboard routes are separate: `/admin/dashboard`, `/hr/dashboard`, `/manager/dashboard`, `/employee/dashboard`.
- Settings uses nested routing under `/settings` with an index route and child pages.

### Authenticated Route Protection
- `src/auth/ProtectedRoute.tsx` checks `useAuth()` session state.
- Unauthenticated users redirect to `/login` with `state.from`.
- Authorized route checks are:
  - `allowedRoles`: passes when any user role matches.
  - `requiredPermissions`: passes when every required permission exists.
- Denied users redirect to `/unauthorized`.
- Loading state uses a simple full-screen Tailwind loader text.

### Roles And Permissions In UI
- Role and permission types live in `src/auth/authTypes.ts`.
- API roles are normalized in `src/auth/authMapper.ts`; `ESS` maps to `EMPLOYEE`.
- JWT permissions and roles are decoded from the access token when needed.
- Navigation visibility is controlled through `canShowNavItem(user, item)`.
- Layout nav items declare `roles` and optional `permissions`; for example Employees requires `HR` or `ADMIN` plus `EMPLOYEE_READ`.

### Layout Components
- `src/components/Layout.tsx` is the single authenticated shell for admin, HR, manager, and employee pages.
- It uses MUI `AppBar`, permanent `Drawer`, `Toolbar`, `Menu`, `Popover`, `Avatar`, `Badge`, `Tooltip`, and `IconButton`.
- The drawer is role-aware and currently includes:
  - Home
  - Employees
  - Leave / Attendance
  - Payroll
  - Settings
- The main content area is rendered through `<Outlet />` with drawer-aware left padding.
- No separate admin/HR/manager/employee layout components were found.

### Reusable UI Components
- Table: existing screens use MUI `Table`, `TableContainer`, `TableHead`, `TableBody`, `TableRow`, `TableCell`, and `Paper`, usually styled with Tailwind classes.
- Forms: MUI `TextField`, `Select`, `Switch`, `FormControlLabel`, date pickers from `@mui/x-date-pickers`, and local validation helpers.
- Modal/dialog: MUI `Dialog`, `DialogContent`, `DialogActions`, `DialogTitle`; repeated custom dialog headers use a border, primary title text, and close icon.
- Cards/panels: mostly Tailwind `div` wrappers with `border`, `rounded-lg`, `bg-white` or `bg-gray-50`; some old dashboard card code is commented out.
- Filters/search: pages use MUI `TextField` directly for search.
- Sorting: `src/components/GlobalSort.tsx`.
- Pagination: `src/components/GlobalPagination.tsx`.
- Toasts/loading/confirm: `src/context/Snackbar.tsx` exposes `useUI()` with `showSnackbar`, `showSpinner`, `hideSpinner`, and `showConfirmDialog`.
- File upload: `src/components/FileUpload.tsx`.
- Select-with-add: `src/components/SelectField.tsx` exports `DynamicSelectWithAdd`.
- Loading and error handling are usually page-local plus global spinner/snackbar; there is no shared empty/error state component.

### API Client And Service Patterns
- Axios is wrapped in `src/services/api/api.config.ts` as a singleton `apiService`.
- Request/response interceptors are configured in `src/services/api/interceptors.ts`.
- Interceptors attach bearer tokens, handle FormData content type, log requests, refresh access tokens on 401, clear session on refresh failure, and normalize rejected errors to `ApiError`.
- Endpoint constants live in `src/services/api/endpoints.ts`.
- Resource services live under `src/services/modules/*.ts` as small classes exporting singleton instances.
- Current services return `response.data` from the API client and leave response unwrapping mostly to page code.

### ApiResponse Handling
- Auth has a typed `ApiResponse<T>` in `src/auth/authTypes.ts`.
- General API types in `src/services/api/api.types.ts` are mostly commented out except `ApiError`.
- Current pages check `response.success`, then read from `response.data`.
- Paginated responses are not fully standardized in the UI. Branch settings accepts several shapes:
  - `response.data.content`
  - `response.data`
  - `response.data.totalElements`
  - `response.data.total`
  - `response.data.length`
- Existing list pages pass pagination params but naming is inconsistent: service interfaces mention `limit/sortBy/sortOrder`, while some page code sends `size` and `sort`.

### File Organization And Naming
- Pages live under `src/pages/<feature>/<file>.tsx`.
- Most page filenames are lowercase or camel-like lowercase: `employees.tsx`, `leave.tsx`, `myprofile.tsx`, `payroll.tsx`, `settings.tsx`.
- Auth pages use folders with component files: `Login/Login.tsx`, `ForgotPassword/ForgotPassword.tsx`, `ResetPassword/ResetPassword.tsx`, `VerifyOTP/otp.tsx`.
- Settings subpages are grouped by domain under `src/pages/settings/general` and `src/pages/settings/employee`.
- Services are grouped by backend domain in `src/services/modules`.
- Constants/types are commonly kept beside pages, such as `src/pages/settings/const.ts` and `src/pages/settings/general/type.ts`.

### Styling Approach
- The app uses Tailwind CSS utilities, MUI components, and MUI theme overrides together.
- Tailwind config defines CSS-variable colors such as `primary`, `primary-50`, `success`, `warning`, and `error`.
- Theme variables are defined in `src/index.css` under `:root` and `.dark`.
- MUI theme overrides are in `src/theme.ts`, especially for text fields, selects, labels, and picker focus styling.
- Dark mode is class-based and handled by custom Tailwind plugin mappings plus CSS variables.
- Existing screens favor compact, operational UI: small font sizes, dense tables, MUI icons, primary orange actions, gray borders, and restrained panels.

## Proposed Route Structure

Keep the existing `/leave` entry route for the first Leave module iteration because the nav already points there and all roles can currently access it.

Initial route:
- `/leave` -> leave workspace shell with tabs or internal view state.

Future nested route option, only if the module grows:
- `/leave/requests` -> employee self-service leave requests.
- `/leave/approvals` -> manager/HR approval queue.
- `/leave/balances` -> leave balances.
- `/leave/policies` -> HR/admin leave types and policy setup.
- `/leave/holidays` -> holiday calendar.

Recommended access rules:
- `/leave`: `ADMIN`, `HR`, `MANAGER`, `EMPLOYEE`.
- Approval view: visible in UI for `ADMIN`, `HR`, `MANAGER`; route can remain under `/leave` until nested routes are introduced.
- Policy/setup view: visible for `ADMIN`, `HR`.
- Employee request/balance view: visible for all roles, scoped by backend or mock adapter.

Do not change global `ProtectedRoute` or `Layout` unless backend permissions introduce new permission constants.

## Proposed File Structure

Use the existing feature-folder convention and keep Leave module files under `src/pages/leave` plus one service module.

```text
src/pages/leave/
  leave.tsx
  const.ts
  type.ts
  components/
    LeaveTabs.tsx
    LeaveSummaryCards.tsx
    LeaveRequestTable.tsx
    LeaveRequestDialog.tsx
    LeaveApprovalDialog.tsx
    LeaveFilters.tsx
  views/
    MyLeaveRequests.tsx
    LeaveApprovals.tsx
    LeaveBalances.tsx
    LeavePolicies.tsx
    HolidayCalendar.tsx

src/services/modules/
  leave.ts
```

If the team prefers fewer files for the first pass, combine the view components into `leave.tsx` first, then extract once the mock service shape stabilizes.

## Reusable Components To Use

- Auth/session: `useAuth()` for current user roles and permissions.
- Route protection: existing `ProtectedRoute` config in `Approutes.tsx`.
- Layout: existing `Layout`; no new shell.
- Toast/loading/confirm: `useUI()` from `src/context/Snackbar.tsx`.
- Tables: MUI table components styled like Branch Settings and Profile Login History.
- Pagination: `GlobalPagination`.
- Sort menu: `GlobalSort`.
- Search/filter fields: MUI `TextField`, `Select`, `MenuItem`, `Chip`, `Button`, `Tooltip`, `IconButton`.
- Forms/dialogs: MUI `Dialog`, `DialogContent`, `DialogActions`, `TextField`, `DatePicker`, close icon header pattern.
- Status display: MUI `Chip` with compact labels such as Pending, Approved, Rejected, Cancelled.
- Icons: `@mui/icons-material`, matching the existing app.

## Components And Screens To Build Later

- Leave workspace shell in `leave.tsx` with compact tabs.
- My Leave Requests view:
  - summary balances
  - request table
  - apply/edit/cancel dialog
- Approval Queue view:
  - manager/HR/admin-only table
  - approve/reject dialog with comments
- Leave Balances view:
  - balance cards/table by leave type
- Leave Policies view:
  - HR/admin-only leave type policy table
  - create/edit policy dialog
- Holiday Calendar view:
  - simple holiday table or month list
- Mock leave service adapter:
  - return `ApiResponse`-like objects with `success`, `message`, and `data`
  - mimic backend pagination with `data.content`, `data.totalElements`, `data.page`, `data.size`
  - expose methods that can later map directly to real endpoints

Suggested mock service methods:
- `getLeaveRequests(params)`
- `createLeaveRequest(payload)`
- `updateLeaveRequest(id, payload)`
- `cancelLeaveRequest(id)`
- `getApprovalRequests(params)`
- `approveLeaveRequest(id, payload)`
- `rejectLeaveRequest(id, payload)`
- `getLeaveBalances(params)`
- `getLeavePolicies(params)`
- `getHolidays(params)`

## Risks And Missing Conventions

- Backend leave endpoints do not exist yet; the frontend should isolate mock data in `leaveService` so screens do not know whether data is mocked or real.
- Permission names for leave are not established. Proposed placeholders should wait for backend agreement, for example `LEAVE_READ`, `LEAVE_APPLY`, `LEAVE_APPROVE`, `LEAVE_POLICY_MANAGE`.
- API response typing is inconsistent outside auth. Before real integration, add local Leave response types rather than changing the global API layer.
- Pagination params and response shapes vary between existing services and screens. The mock adapter should mimic the most common backend-looking shape used by Branch Settings: `content` and `totalElements`.
- Existing `src/pages/leave/leave.tsx` is only a placeholder and uses a card-like layout. The final Leave UI should follow the denser settings/profile table style for consistency.
- No shared error or empty-state component exists. Use inline empty rows/text and snackbar errors like current pages.
- Existing layout nav label says `Leave / Attendance`; if this module initially covers leave only, either keep the label for future attendance or defer nav text changes until scope is confirmed.
- The app mixes Tailwind classes with MUI `sx` overrides. Leave screens should follow this mix and avoid introducing another UI library or styling system.
