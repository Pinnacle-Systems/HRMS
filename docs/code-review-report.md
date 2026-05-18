# Code Review Report

## Review Scope

Reviewed `src/pages`, `src/components`, `src/routes`, `src/auth`, `src/hooks`, `src/utils`, `src/services/api`, and `src/services/modules`, with deeper review of the Leave module under `src/pages/leave` and `src/services/modules/leave*`.

## Executive Summary

- The strongest foundation is auth/routing: `ProtectedRoute`, `authMapper`, route-level role checks, token interceptors, and a single `Layout` are already in place.
- The Leave module has a useful feature API layer, response adapters, typed view models, route metadata, and mock data separation.
- UX consistency is starting to drift because breadcrumbs, page titles, tab shells, tables, filters, dialogs, cards, loading states, and empty states are rebuilt per page.
- Status labels and badge styles are duplicated across Leave screens and already disagree in wording for some statuses.
- Business rules are increasingly embedded in page components, including employee id fallback, leave action eligibility, attachment rules, date formatting, overlap checks, and comp-off expiry.
- API integration is directionally good, but page components still own many loading/error decisions and some mock constants leak into active screens.
- The best immediate reuse opportunities are `LeavePageShell`, `PageHeader`, `LeaveStatusBadge`, `FilterBar`, `DataState`, `DetailsDialog`, and table style helpers.
- The biggest growth risk is that upcoming Attendance, Payroll, Employee, Onboarding, and Approval workflows will copy current one-off Leave screen patterns.

## Top Findings

### Finding 1: Leave screen chrome is duplicated across every page

**Severity:** High  
**Category:** UX Consistency / Reuse  
**Files:**  
- `src/pages/leave/MyLeaveDashboard.tsx`
- `src/pages/leave/ApplyLeavePage.tsx`
- `src/pages/leave/MyLeaveRequestsPage.tsx`
- `src/pages/leave/ManagerLeaveApprovalsPage.tsx`
- `src/pages/leave/HolidayCalendarPage.tsx`
- `src/pages/leave/CompOffsPage.tsx`
- `src/pages/leave/LeavePlaceholderPage.tsx`

**Observation:**  
Each Leave page rebuilds the same breadcrumb, `Paper` wrapper, route tabs, title/subtitle area, and action area. The repeated `visibleRoutes` calculation appears in each page, and the `Tabs` rendering is nearly identical.

**Why it matters:**  
Every new Leave screen will need to copy the same structure. Small differences in spacing, titles, action placement, and mobile behavior will accumulate quickly.

**Recommendation:**  
Create a feature-level `LeavePageShell` that owns breadcrumbs, role-filtered tabs, title/subtitle, optional actions, and the content wrapper. For non-Leave screens, introduce a shared `PageHeader` later once the pattern stabilizes.

**Example direction:**  
`<LeavePageShell group="employee" title="My Leave Requests" actions={<Button>Apply Leave</Button>}>...</LeavePageShell>`

### Finding 2: Status badge labels and colors are duplicated and inconsistent

**Severity:** High  
**Category:** Reuse / Styling / Business Logic  
**Files:**  
- `src/pages/leave/MyLeaveDashboard.tsx`
- `src/pages/leave/MyLeaveRequestsPage.tsx`
- `src/pages/leave/ManagerLeaveApprovalsPage.tsx`
- `src/pages/leave/HolidayCalendarPage.tsx`
- `src/pages/leave/CompOffsPage.tsx`

**Observation:**  
Leave request status labels/classes are redefined in multiple pages. `WITHDRAWN` and `CANCEL_REQUESTED` display as `Cancelled` in `MyLeaveDashboard`, but as `Withdrawn` and `Cancellation Requested` in `MyLeaveRequestsPage` and `ManagerLeaveApprovalsPage`. Holiday and comp-off statuses use separate local maps.

**Why it matters:**  
HRMS workflows depend on precise state communication. A withdrawn request, requested cancellation, and cancelled request are different business states.

**Recommendation:**  
Centralize Leave status metadata in one feature file, then render with a shared `StatusBadge` or `LeaveStatusBadge`. Include labels, semantic tone, and any workflow grouping.

**Example direction:**  
`getLeaveStatusMeta(status)` returns `{ label, tone }`, and `LeaveStatusBadge` maps `tone` to shared styles.

### Finding 3: Leave pages contain business rules that should be testable helpers

**Severity:** High  
**Category:** Business Logic / Testing  
**Files:**  
- `src/pages/leave/ApplyLeavePage.tsx`
- `src/pages/leave/MyLeaveRequestsPage.tsx`
- `src/pages/leave/ManagerLeaveApprovalsPage.tsx`
- `src/pages/leave/HolidayCalendarPage.tsx`
- `src/pages/leave/CompOffsPage.tsx`
- `src/pages/leave/MyLeaveDashboard.tsx`

**Observation:**  
Rules like sick-leave attachment requirements, future leave cancellation eligibility, manager overlap checks, holiday row shaping, comp-off leave type detection, 90-day expiry, leave balance totals, and employee id fallback live directly inside page files.

**Why it matters:**  
These rules will be reused by approval, payroll, attendance, and HR admin flows. Keeping them in JSX-heavy pages makes them hard to test and easy to fork.

**Recommendation:**  
Move pure rules into `src/pages/leave/leaveRules.ts` or `src/services/modules/leaveRules.ts`, and put view-model shaping in `leaveMappers`/`leaveViewModels`. Start with the rules used by at least two pages.

**Example direction:**  
Extract `canWithdrawLeave`, `canRequestCancellation`, `requiresLeaveAttachment`, `calculateCompOffExpiryDate`, and `getTeamOverlap`.

### Finding 4: Manager approvals still use a hardcoded manager id

**Severity:** High  
**Category:** API / Permissions  
**Files:**  
- `src/pages/leave/ManagerLeaveApprovalsPage.tsx`
- `src/services/modules/leave.ts`

**Observation:**  
`ManagerLeaveApprovalsPage` defines `MOCK_MANAGER_ID = "emp-200"` and passes it into approval API calls. `leaveService.getManagerLeaveApprovals` also defaults to `emp-200`.

**Why it matters:**  
This can show the wrong approval queue when the real backend is enabled. It also bypasses the existing auth/session model and makes permission behavior difficult to validate.

**Recommendation:**  
Resolve manager identity through session/profile mapping or a backend "my approvals" endpoint. Keep mock defaults inside mock-only service paths, not active pages.

**Example direction:**  
`leaveService.getMyManagerApprovals(params)` can derive identity server-side, while mocks can keep `MOCK_MANAGER_ID` internally.

### Finding 5: Loading, empty, and error states are inconsistent

**Severity:** Medium  
**Category:** UX Consistency / API  
**Files:**  
- `src/pages/leave/MyLeaveDashboard.tsx`
- `src/pages/leave/MyLeaveRequestsPage.tsx`
- `src/pages/leave/ManagerLeaveApprovalsPage.tsx`
- `src/pages/leave/HolidayCalendarPage.tsx`
- `src/pages/leave/CompOffsPage.tsx`
- `src/context/Snackbar.tsx`
- `src/hooks/useApi.ts`

**Observation:**  
Some pages use inline loading panels, some use `Typography`, some only show the global spinner, and `CompOffsPage` has no local loading flag. Errors are sometimes inline and sometimes only snackbar. Empty states are local one-off blocks.

**Why it matters:**  
Users need predictable feedback, especially on operational HR screens where tables may legitimately be empty or blocked by permissions.

**Recommendation:**  
Introduce shared `DataState` components for loading, empty, and error blocks, and use the global spinner only for blocking actions or full-page transitions. Align `useApi` with feature loading patterns or retire it in favor of a consistent query hook.

**Example direction:**  
`<DataState type="empty" title="No leave requests found" />` below a table; `showSpinner` only for submit/approve/withdraw actions.

### Finding 6: Leave API service is strong but doing too many jobs

**Severity:** Medium  
**Category:** API / Structure  
**Files:**  
- `src/services/modules/leave.ts`
- `src/services/modules/leaveAdapters.ts`
- `src/services/modules/leaveMockData.ts`

**Observation:**  
`leave.ts` contains API calls, mock behavior, pagination helpers, filtering, sorting, envelope unwrapping, response mapping orchestration, calculation mapping, and mock state mutation.

**Why it matters:**  
The file will grow sharply as HR/admin leave setup, payroll inputs, LOP review, team calendar, and workflows are implemented.

**Recommendation:**  
Keep the public `leaveService` facade, but split helpers into `leaveApiHelpers`, `leaveMockService`, and `leaveCalculations` when touching the module next. Preserve the existing adapter pattern.

**Example direction:**  
`leaveService` imports `realLeaveApi` or `mockLeaveApi` based on `USE_MOCK_LEAVE_SERVICE`.

### Finding 7: Route config and route rendering are not fully declarative

**Severity:** Medium  
**Category:** Structure / Permissions  
**Files:**  
- `src/routes/Approutes.tsx`
- `src/pages/leave/leaveRoutes.ts`

**Observation:**  
`leaveRoutes` defines metadata, but `Approutes.tsx` still maps paths through a long ternary chain to choose components. Role groups are split in routes, while visible tab filtering is repeated in pages.

**Why it matters:**  
Adding Leave screens requires edits in multiple places and increases the chance of route/tab mismatches.

**Recommendation:**  
Add component references or route ids to the Leave route registry, and expose a helper such as `getVisibleLeaveRoutes(user, group?)`. Keep `ProtectedRoute` as the route-level guard.

**Example direction:**  
`leaveRouteElements[route.id] ?? <LeavePlaceholderPage route={route} />`

### Finding 8: Employee management shows early architectural drift outside Leave

**Severity:** Medium  
**Category:** Business Logic / Reuse / Structure  
**Files:**  
- `src/pages/employees/employeeManagement.tsx`
- `src/components/FilterPopup.tsx`
- `src/hooks/usePaginationSort.ts`

**Observation:**  
`EmployeeManagement` owns filter evaluation, employee id generation, sorting/search state, API orchestration, dialog state, and form state. There is a reusable `FilterPopup`, but the rule evaluation logic remains in the page.

**Why it matters:**  
Employee workflows will be central to HRMS. If onboarding, profile, leave, attendance, and payroll each reimplement filters and table state, the product will feel inconsistent.

**Recommendation:**  
Treat `FilterPopup`, `GlobalPagination`, and `usePaginationSort` as the start of shared table/filter infrastructure. Move filter evaluation into a utility or service and document when pages should use server-side filtering instead.

**Example direction:**  
`applyFilterConfig(data, filters)` in `src/utils/filtering.ts`, then reuse it until the API supports all filters.

## UX Consistency Review

Page layouts: `Layout` provides one app shell, which is good. Inside feature pages, layout is inconsistent. Leave pages mostly use breadcrumb + tabs + content panel, while settings uses menu-style tabs, and employee management has its own dense table experience.

Forms: Leave forms use MUI `TextField`, `DatePicker`, and `FileUpload`, but validation rules are local and required fields are not visually marked consistently. Apply Leave and Comp-Off request share date/session/reason/attachment patterns that should converge.

Tables/lists: Leave request, approval, holiday, balance, and comp-off tables use MUI tables but duplicate headers, empty states, styling, and action cells. `GlobalPagination` is reused in request/approval pages but not all list-like screens.

Filters: Leave request, approval, and holiday screens each build a local filter grid. Employee management uses `FilterPopup`. The codebase should choose when to use inline filters versus advanced filters.

Dialogs: Detail and action dialogs are rebuilt per screen. The global confirmation dialog exists, but approval dialogs and detail dialogs use separate local layouts.

Empty/loading/error states: There is no single pattern. Some tables show text rows, some pages use panels, and some rely on the global spinner only.

Status badges: Status chips include text labels, which is good, but labels and styles are page-local.

Navigation and role-specific screens: Route guards and nav filtering are strong. Role-specific screens still generally feel like one product, but Leave tab visibility and route rendering should be centralized.

## Reuse Opportunities

| Pattern | Current Duplication | Recommended Shared Abstraction | Priority |
|---|---|---|---|
| Page header | Breadcrumb/title/action blocks repeated in Leave pages | `PageHeader`, then `LeavePageShell` | P0 |
| Leave tabs | Same `Tabs` over `visibleRoutes` in every Leave page | `LeaveTabs` inside `LeavePageShell` | P0 |
| Status badge | Leave status maps repeated; holiday/comp-off maps local | `StatusBadge`, `LeaveStatusBadge` | P0 |
| Filter bar | Request, approval, holiday filters use custom grids | `FilterBar` with field config | P1 |
| Empty state | Local `EmptyState`, `Typography`, and inline messages | `DataState` | P1 |
| Loading state | Global spinner plus local text blocks vary by page | `DataState.Loading` and action-level spinner guidance | P1 |
| Error state | Snackbar-only versus inline errors | `DataState.Error` plus shared error mapper | P1 |
| Confirmation dialog | Global dialog exists; wording/action color is fixed | Strengthen `showConfirmDialog` options by intent | P1 |
| Date range picker | From/To date pairs repeated in filters | `DateRangeFields` | P2 |
| Approval action bar | Approve/reject/clarify actions repeated in table and dialog | `ApprovalActionBar` | P1 |
| Employee summary card | Approval details render employee facts locally | `EmployeeSummaryPanel` | P2 |
| Leave balance card | Dashboard and detail dialogs render balance summaries locally | `LeaveBalanceSummary` | P2 |

## Permission and Role Review

The existing route guard pattern is a strong area. `ProtectedRoute` centralizes auth checks and supports `allowedRoles` and `requiredPermissions`. `authMapper` centralizes app role mapping, default route choice, workspace labels, and navigation visibility.

Areas to improve:

- `leaveRoutes` role metadata is reused for tabs, but tab filtering is repeated in pages.
- Manager approvals use `MOCK_MANAGER_ID`, which is not permission-safe when real data is enabled.
- UI-level action permission is status-based only in Leave pages; future approval actions should use a helper that combines role, permission, ownership, and status.
- Permission failures have route-level fallback, but page-level partial access currently varies by screen.

Recommended centralization:

- Keep `ProtectedRoute` for route protection.
- Add `getVisibleLeaveRoutes(user)` and `canPerformLeaveAction(user, request, action)`.
- Avoid raw role/status checks in JSX once approval flows expand.

## API Integration Review

API client usage is centralized through `apiService`, and `interceptors.ts` handles token injection, refresh, 401 retry, session clearing, and error shaping. This is a good pattern to standardize around.

The Leave feature API has useful adapters in `leaveAdapters.ts` and a mock toggle via `VITE_USE_MOCK_LEAVE_SERVICE`. This is stronger than direct page-level API calls.

Risks and gaps:

- `leave.ts` mixes real API calls and mock implementation in one large service.
- Mock ids leak into active behavior via `MOCK_MANAGER_ID`.
- Page components repeatedly decide loading, empty, and error behavior.
- Some backend quirks are handled in adapters, which is good, but employee/profile id fallback is handled in `MyLeaveDashboard` instead of a session/profile helper.
- `useApi` exists but is not the dominant pattern in the Leave pages.

Recommendation: keep the feature service boundary, split mock internals over time, and standardize page data states.

## Leave Module Review

My Leave Dashboard: Strong overview structure and useful balance/request summaries. Needs `LeavePageShell`, shared status badge, shared balance card, shared empty/loading/error states, and extracted employee id resolution. The text "mock requests loaded" should not appear in production-facing UI.

Apply Leave: Good use of typed form state, MUI fields, date pickers, and server-side leave calculation. The attachment rule, emergency contact validation, submit/draft status mapping, and date formatting should move into helpers. Submit buttons disable during submit, but they do not show button-level loading text.

My Leave Requests: Good pagination and filters. Detail dialog is useful but repeats balance/calculation loading. Status actions are status-only and should move to `leaveActionRules`. Empty/loading states should use shared components.

Manager Approvals: Good first approval inbox with filters, overlap visibility, balance details, and approve/reject/clarify actions. The hardcoded manager id is the top issue. Overlap logic and action dialog validation should be extracted and tested.

Holiday Calendar: Good filter coverage and optional holiday flow. Holiday type labels/colors, date/day formatting, and location shaping are local. The year default is hardcoded to `2026`; consider deriving it from the current year or available calendars.

Comp-Offs: Useful balance summary, credit table, history table, and request dialog. It lacks a local loading state, derives comp-off type by matching names/codes in the page, and hardcodes 90-day expiry in submit logic. These should become rules/helpers.

Placeholder Leave screens: Helpful for route scaffolding. They already demonstrate a reusable shell pattern and should be folded into `LeavePageShell`.

## Recommended Refactor Backlog

| Priority | Task | Reason | Suggested Files |
|---|---|---|---|
| P0 | Add `LeavePageShell` and `LeaveTabs` | Stops layout drift before more Leave screens land | `src/pages/leave/*Page.tsx`, `src/pages/leave/leaveRoutes.ts` |
| P0 | Add centralized `LeaveStatusBadge` and status metadata | Fixes inconsistent labels and repeated color maps | `src/pages/leave/*Page.tsx` |
| P0 | Remove hardcoded manager id from active approval page | Prevents incorrect approval queues with real data | `src/pages/leave/ManagerLeaveApprovalsPage.tsx`, `src/services/modules/leave.ts` |
| P1 | Extract leave action and date rules | Makes workflow behavior testable | `ApplyLeavePage.tsx`, `MyLeaveRequestsPage.tsx`, `ManagerLeaveApprovalsPage.tsx`, `CompOffsPage.tsx` |
| P1 | Add shared `DataState` components | Standardizes loading, empty, and error UI | `src/components`, Leave pages |
| P1 | Create configurable `FilterBar` or `LeaveFilterBar` | Reduces duplicated filter grids | Leave request, approval, holiday pages |
| P1 | Strengthen confirmation/action dialog API | Approval and destructive actions need consistent wording and intent | `src/context/Snackbar.tsx`, Leave pages |
| P2 | Split Leave service into real/mock/helpers | Keeps API layer manageable as module grows | `src/services/modules/leave.ts` |
| P2 | Extract table style helpers or `DataTable` | Reduces repeated table `sx` and class blocks | Leave pages, employee pages |
| P2 | Move employee filter evaluation to utility | Prevents employee module from becoming a pattern of page-owned logic | `src/pages/employees/employeeManagement.tsx`, `src/utils` |

## Suggested Shared Components

### LeavePageShell

**Purpose:**  
Own Leave breadcrumbs, role-filtered tabs, page title/subtitle, actions, and panel wrapper.

**Used by:**  
All `src/pages/leave/*Page.tsx` screens.

**Suggested location:**  
`src/pages/leave/components/LeavePageShell.tsx`

**Props to consider:**  
`group`, `title`, `subtitle`, `actions`, `children`, `activePath`.

### PageHeader

**Purpose:**  
Shared page title, subtitle, breadcrumb trail, and action placement outside Leave.

**Used by:**  
Employee, Settings, Payroll, Onboarding, Leave shell.

**Suggested location:**  
`src/components/PageHeader.tsx`

**Props to consider:**  
`breadcrumbs`, `title`, `subtitle`, `actions`, `secondaryActions`.

### StatusBadge

**Purpose:**  
Render consistent status labels and semantic colors.

**Used by:**  
Leave requests, approvals, holidays, comp-offs, onboarding, payroll.

**Suggested location:**  
`src/components/StatusBadge.tsx`

**Props to consider:**  
`label`, `tone`, `size`, `variant`.

### LeaveStatusBadge

**Purpose:**  
Map `LeaveRequestStatus` to shared labels and tones.

**Used by:**  
Leave dashboard, requests, approvals, details, future HR screens.

**Suggested location:**  
`src/pages/leave/components/LeaveStatusBadge.tsx`

**Props to consider:**  
`status`, `size`.

### DataState

**Purpose:**  
Standard empty, loading, and error blocks for pages and tables.

**Used by:**  
All list and detail screens.

**Suggested location:**  
`src/components/DataState.tsx`

**Props to consider:**  
`type`, `title`, `message`, `action`.

### FilterBar

**Purpose:**  
Render common inline filter fields from config.

**Used by:**  
Leave request filters, approval filters, holiday filters, employee lists.

**Suggested location:**  
`src/components/FilterBar.tsx`

**Props to consider:**  
`fields`, `values`, `onChange`, `onReset`, `columns`.

### DetailsDialog

**Purpose:**  
Consistent dialog header, body spacing, close behavior, and action placement.

**Used by:**  
Leave details, approval details, employee details, payroll details.

**Suggested location:**  
`src/components/DetailsDialog.tsx`

**Props to consider:**  
`open`, `title`, `onClose`, `actions`, `maxWidth`, `children`.

### ApprovalActionBar

**Purpose:**  
Standard approve/reject/clarify/close action layout.

**Used by:**  
Manager Leave Approvals now; future onboarding, attendance, payroll approvals.

**Suggested location:**  
`src/components/ApprovalActionBar.tsx` or `src/pages/leave/components/ApprovalActionBar.tsx`

**Props to consider:**  
`availableActions`, `onApprove`, `onReject`, `onClarify`, `disabled`.

## Suggested Coding Guidelines

- Use shared page layout before creating a custom layout.
- Do not add raw role checks in JSX unless unavoidable.
- Do not add new status colors directly in page files.
- Extract repeated form/filter/table patterns after the second or third use.
- Keep API calls inside feature API files or the shared API client.
- Keep backend response mapping out of page components.
- Every new page must define loading, empty, error, and success states.
- Keep mock constants inside mock services, not active page components.
- Prefer route guards for route access and permission helpers for UI actions.
- Move business rules that affect payroll, approval, balance, or attendance into testable helpers.
- Use `GlobalPagination` or the agreed table abstraction for paginated lists.
- When adding a dialog, use the shared dialog/action placement unless the UX is genuinely unique.

## Final Recommendation

1. Build `LeavePageShell`, `LeaveTabs`, and centralized Leave status metadata first.
2. Replace hardcoded manager approval identity with session/profile/backend-derived identity.
3. Extract Leave action rules and form rules into testable helpers with focused unit tests.
4. Add shared `DataState` and apply it to Leave dashboard, request list, approvals, holiday calendar, and comp-offs.
5. Standardize filter/table patterns before adding HR Leave Requests, HR Balances, Attendance, Payroll, and Approval screens.

## Refactor Note: P0 Batch 1

Refactored the Leave module page chrome and Leave request status display. Added `LeavePageShell`, `LeaveTabs`, `LeaveStatusBadge`, and centralized status metadata in `leaveStatusMeta`.

Updated Leave dashboard, apply leave, my requests, manager approvals, holiday calendar, comp-offs, and placeholder screens to use the shared shell/tabs pattern. Replaced duplicated Leave request status chip maps with `LeaveStatusBadge`.

Intentionally not changed: API behavior, route paths, route guards, mock toggle behavior, form validation, submit/approve/reject/withdraw logic, manager id handling, and pagination/filter behavior.

Remaining next batch items: remove hardcoded manager approval identity, extract Leave business rules, add shared data states, and standardize filter/table abstractions.

## Refactor Note: P0 Batch 2

Moved mock manager approval identity out of `ManagerLeaveApprovalsPage`. The page now resolves a session employee id and calls `leaveService.getMyManagerLeaveApprovals` without importing or defining mock ids.

Kept the mock approval inbox functional by adding a clearly named mock-only fallback, `DEFAULT_MOCK_MANAGER_ID`, inside the Leave service layer. Real API paths no longer silently fall back to `emp-200`; they use the session-derived manager id when available, or the current-user approvals endpoint.

Intentionally not changed: visible approval UI, filters, pagination, approval/reject/clarify actions, mock data shape, route guards, and existing mock screen flows.

Remaining next batch items: extract Leave business rules, add shared data states, standardize filters/tables, and address the existing repo-wide lint/test debt separately.

## Refactor Note: P1 Batch 3

Extracted pure Leave business/view rules into `src/pages/leave/leaveRules.ts`: withdrawal eligibility, cancellation eligibility, upcoming approved leave detection, sick leave attachment requirement, comp-off expiry calculation, API date formatting, and manager team-overlap detection.

Updated `ApplyLeavePage`, `MyLeaveRequestsPage`, `ManagerLeaveApprovalsPage`, `CompOffsPage`, and `MyLeaveDashboard` to call the helpers while preserving existing UI, API calls, routing, mock behavior, validation, filters, pagination, dialogs, and visual layout.

Added focused unit coverage in `tests/unit/leaveRules.test.ts` for pending withdrawal, approved future cancellation, sick leave attachment thresholds, 90-day comp-off expiry including rollover, and overlap filtering.

Remaining business-rule cleanup: employee id/profile fallback and leave balance ordering are still page-local and can be reviewed in a later batch if they begin to repeat in HR/admin screens.

## Refactor Note: P1 Batch 4

Added `DataState` in `src/components/DataState.tsx` for shared loading, empty, and error states that can be used in panels and compact table rows.

Updated Leave dashboard, apply leave, my requests, manager approvals, holiday calendar, and comp-offs to use shared data states for simple panel/table loading, empty, and inline error states.

Intentionally preserved global snackbar/spinner behavior, API calls, mock behavior, route guards, filters, pagination, dialogs, approval actions, business-rule helpers, status badges, and page layout intent.

Intentionally not converted: field-level form validation, action-dialog validation, detail-card placeholder text such as attachments/team overlap notes, snackbar-only API failures, and UI-specific status/action conditions.

Remaining UX consistency work: extract shared filter bars/date ranges, then evaluate table abstraction once the repeated table patterns are clearer.

## Refactor Note: P1 Batch 5

Extracted the repeated Leave filter panel into `src/pages/leave/components/LeaveFilterBar.tsx`. The component standardizes the bordered gray filter container, responsive grid spacing, and optional reset/action placement while keeping each page's concrete fields local.

Updated My Leave Requests, Manager Leave Approvals, and Holiday Calendar to use the shared filter wrapper.

Intentionally preserved filter state names, default values, pagination reset behavior, API parameters, date picker behavior, labels, options, table layout, dialogs, and Leave page shell behavior.

Intentionally not generalized: no global `FilterBar`, no config-driven field schema, no URL query sync, no date range helper, and no table integration. Those should wait until Employee, Attendance, Payroll, and Onboarding filter needs are compared.

Remaining filter/table UX work: consider shared date range fields if they repeat in HR/admin Leave screens, then evaluate table and dialog/action abstractions separately.

## Refactor Note: P1 Batch 6

Extracted shared dialog and approval action patterns into `src/components/DetailsDialog.tsx` and `src/components/ApprovalActionBar.tsx`.

Updated My Leave Requests and Manager Leave Approvals to use `DetailsDialog` for read-only detail dialogs. Updated Manager Leave Approvals to use `ApprovalActionBar` for approve/reject/clarify actions in table rows and the detail dialog action area.

Intentionally preserved selected request state, close behavior, displayed fields, status badges, balance/calculation display, approval handlers, action dialog validation, table row behavior, API calls, filters, pagination, routing, mock behavior, and business-rule helpers.

Intentionally not generalized: no workflow engine, no permission framework, no status transition refactor, no table action abstraction, and no conversion of the manager action confirmation dialog because it owns validation and submit state.

Remaining dialog/action/table UX work: consider a shared confirmation dialog structure after more approval flows exist, then extract table style helpers or clean up the Leave route registry depending on the next feature priorities.

## Refactor Note: P1 Batch 7

Extracted shared Leave table style constants in `src/pages/leave/components/leaveTableStyles.ts` for table containers, table shells, header rows, body rows, body cells, action cells, location cells, and common table/header class names.

Updated My Leave Dashboard, My Leave Requests, Manager Leave Approvals, Holiday Calendar, and Comp-Offs to use the shared Leave table style constants where the existing table styling was repeated.

Intentionally preserved table architecture, columns, column order, row keys, data rendering, status badges, action buttons, pagination, filters, dialogs, API behavior, route behavior, mock behavior, and DataState table rows.

Intentionally avoided a full table abstraction, config-driven column schema, pagination/table integration, row action abstraction, and changes to unique card/dialog layouts.

Remaining table/route cleanup work: standardize table cells further only when a true table component is ready, or clean up the Leave route registry before adding more HR/admin Leave pages.

## Refactor Note: P1 Batch 8

Strengthened the Leave route registry with stable route ids, explicit `allowedRoles`, optional permissions, implementation status, and lookup/visibility helpers.

Updated LeaveTabs to use `getVisibleLeaveRoutes` instead of local role filtering. Updated app route rendering to use an id-based Leave route element map with placeholder fallback instead of path-based ternaries.

Intentionally preserved all existing Leave paths, labels, groups, role guard wrappers, page components, placeholder behavior, tab navigation, route redirects, and `ProtectedRoute` as the actual access-control mechanism.

Intentionally not generalized: no global route engine, no auth model changes, no global navigation rewrite, no URL schema changes, and no new Leave pages.

Remaining route/navigation cleanup: consider deriving group-level `ProtectedRoute` role wrappers from registry metadata only after more route groups need mixed role/permission combinations.
