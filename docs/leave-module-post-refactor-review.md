# Leave Module Post-Refactor Review

## Review Scope

Reviewed all Leave pages (`src/pages/leave/`), all Leave components (`src/pages/leave/components/`), all shared components introduced in batches 1–8 (`src/components/DataState.tsx`, `src/components/DetailsDialog.tsx`, `src/components/ApprovalActionBar.tsx`), the Leave service layer (`src/services/modules/leave.ts`, `leaveAdapters.ts`), session identity (`src/auth/sessionIdentity.ts`), route config (`src/routes/Approutes.tsx`, `src/pages/leave/leaveRoutes.ts`), and all unit tests under `tests/unit/leave*` and the component-level tests.

---

## Executive Summary

Batches 1–8 achieved their goals cleanly. `LeavePageShell`, `LeaveTabs`, `LeaveStatusBadge`, `leaveRules`, `DataState`, `LeaveFilterBar`, `DetailsDialog`, `ApprovalActionBar`, `leaveTableStyles`, and the route registry are all real improvements — not cosmetic. No obvious regressions were introduced. The approval identity issue is resolved at the service layer with a proper fallback hierarchy.

Three structural problems remain before HR/admin Leave screens arrive: a `formatDate` utility duplicated verbatim across six files, a hardcoded `year = 2026` state in `HolidayCalendarPage`, and a gap between route metadata role lists and the `ProtectedRoute` wrappers that currently use hardcoded roles. A fourth issue — the employee identity fallback in `MyLeaveDashboard` — is the largest remaining page-owned business logic block. Everything else is low severity.

---

## What Improved

- **LeavePageShell + LeaveTabs**: Layout drift is stopped. Every Leave page now shares one breadcrumb/tab/content structure. `LeaveTabs` reads `getVisibleLeaveRoutes` from the registry, so tab visibility stays consistent with route access.
- **LeaveStatusBadge + leaveStatusMeta**: Status labels are no longer copy-pasted. `WITHDRAWN` vs `Cancelled` vs `Cancellation Requested` are now distinct and correct everywhere they appear. The unknown-status fallback handles future API statuses gracefully.
- **leaveRules.ts**: `canWithdrawLeave`, `canRequestCancellation`, `requiresLeaveAttachment`, `calculateCompOffExpiryDate`, `getTeamOverlap`, and `formatDateForApi` are all pure and well-tested. Pages that previously contained these as inline expressions now delegate correctly.
- **DataState**: All Leave pages now show loading, empty, and error states in a consistent pattern. Both panel-level and compact table-row variants are used correctly.
- **LeaveFilterBar**: The filter container style is no longer duplicated. Pages still own their concrete fields, which is the right split at this stage.
- **DetailsDialog + ApprovalActionBar**: Dialog chrome is consistent. The approval action buttons have two variants (icons for table rows, buttons for dialog footers) and are used correctly in `ManagerLeaveApprovalsPage`.
- **leaveTableStyles**: Table container, header row, body cell, action cell, and location cell styles are no longer copy-pasted across five pages.
- **leaveRoutes registry**: Routes now have stable ids, role metadata, implementation status flags, and `getVisibleLeaveRoutes` / `isLeaveRouteVisibleForUser` helpers. `LeaveTabs` and `Approutes.tsx` both consume the registry rather than maintaining parallel lists.
- **Session identity / manager approvals**: `ManagerLeaveApprovalsPage` no longer imports or defines `MOCK_MANAGER_ID`. `getMyManagerLeaveApprovals` in the service layer handles real-API and mock paths separately with a clear fallback contract. `leaveService.test.ts` verifies both paths.

---

## Remaining Issues

### Issue 1: `formatDate` is duplicated verbatim in six files

**Severity:** High  
**Category:** Reuse / Structure  
**Files:**
- `src/pages/leave/MyLeaveDashboard.tsx:49–55`
- `src/pages/leave/ManagerLeaveApprovalsPage.tsx:68–74`
- `src/pages/leave/MyLeaveRequestsPage.tsx:56–62`
- `src/pages/leave/CompOffsPage.tsx:69–75`
- `src/pages/leave/HolidayCalendarPage.tsx:63–69`
- `src/pages/leave/ApplyLeavePage.tsx:61–67`

**Observation:** Every page defines the same `Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" })` local function. `formatDay` in `HolidayCalendarPage` is also local. These are the highest-frequency copy-paste targets in the Leave module.

**Recommendation:** Move `formatDate` and `formatDay` into `leaveRules.ts` (alongside `formatDateForApi`) or a dedicated `leaveFormatters.ts`. Delete the local copies. The HR/admin screens will immediately need these formatters — do this before those screens land.

**Fix now or later:** Fix now, before adding any more Leave pages.

---

### Issue 2: `HolidayCalendarPage` year state is hardcoded to `2026`

**Severity:** High  
**Category:** Business Logic  
**File:** `src/pages/leave/HolidayCalendarPage.tsx:91`

**Observation:** `const [year, setYear] = useState(2026)`. This will silently show an empty calendar starting in 2027. The original review flagged a hardcoded year; the fix was deferred but the stub value was never replaced.

**Recommendation:** Replace with `useState(new Date().getFullYear())`. If the page should allow year navigation, derive the default from the current year or the available calendar data once loaded.

**Fix now or later:** Fix now — it will break silently in production.

---

### Issue 3: Route protection in `Approutes.tsx` is not derived from the route registry

**Severity:** High  
**Category:** Routing / Permissions  
**Files:**
- `src/routes/Approutes.tsx:118–157`
- `src/pages/leave/leaveRoutes.ts`

**Observation:** `Approutes.tsx` wraps each group's routes in a `ProtectedRoute` with a hardcoded `allowedRoles` array:
- Employee group: `["ADMIN", "HR", "MANAGER", "EMPLOYEE"]`
- Manager group: `["ADMIN", "MANAGER"]`
- HR group: `["ADMIN", "HR"]`
- Admin group: `["ADMIN"]`

These lists happen to match the union of `allowedRoles` in `leaveRoutes.ts` for each group today. But the registry and the route wrappers are not linked — they can drift independently. If a new route is added to the `hr` group with `allowedRoles: ["HR"]` (not ADMIN), the `ProtectedRoute` wrapper still allows ADMIN through at the route level. The tab visibility filter catches it, but the URL is accessible.

**Recommendation:** Before adding HR/admin Leave pages, derive the `ProtectedRoute allowedRoles` from the registry:

```ts
function groupAllowedRoles(group: LeaveRouteGroup): AppRole[] {
  return Array.from(
    new Set(getLeaveRoutesByGroup(group).flatMap((r) => r.allowedRoles)),
  ) as AppRole[];
}
```

This makes the route registry the single source of truth for both tab visibility and route-level access.

**Fix now or later:** Fix before adding HR/admin routes. Adding those routes with the current setup will create silent access gaps.

---

### Issue 4: Employee identity resolution complex fallback is still fully embedded in `MyLeaveDashboard`

**Severity:** Medium  
**Category:** Business Logic / Reuse  
**File:** `src/pages/leave/MyLeaveDashboard.tsx:107–139`

**Observation:** The dashboard contains a 30-line block that: calls `authService.getProfile()`, extracts up to six candidate employee ids from the profile response shape, iterates them in order trying `getEmployeeLeaveBalances`, and falls back to `currentUserId` on failure. The `ProfileResponse` type and `isAccessDeniedError` helper are also local to the dashboard.

`sessionIdentity.ts` was introduced in Batch 2 but only implements `resolveEmployeeIdFromSession(session)` which returns `session?.user.userId`. The profile API multi-candidate fallback was not extracted.

**Recommendation:** Move the profile-to-employee-id resolution into `sessionIdentity.ts` or a `useEmployeeId` hook that encapsulates the profile call, candidate ordering, and fallback. The dashboard should call one function and receive an employee id. The `isAccessDeniedError` helper belongs in a shared error utility.

This matters because HR admin screens will need to resolve other employees' ids, and the approval page (`ManagerLeaveApprovalsPage`) already needs `resolveEmployeeIdFromSession` — the pattern is splitting.

**Fix now or later:** Fix before HR/admin screens, or whenever `useEmployeeId` would prevent the second copy.

---

### Issue 5: `CompOffsPage` has local status chip maps not using the shared badge pattern

**Severity:** Medium  
**Category:** Reuse / Styling  
**File:** `src/pages/leave/CompOffsPage.tsx:55–67`

**Observation:** `creditStatusClasses` and `requestStatusClasses` are local `Record<Status, className>` maps. The comp-off statuses (`AVAILABLE`, `AVAILED`, `EXPIRED` for credits; `PENDING`, `APPROVED`, `REJECTED` for requests) are rendered with raw `Chip` + local className rather than `LeaveStatusBadge`. These statuses are a different type (`CompOffCredit["status"]`) from `LeaveRequestStatus`, but the Chip pattern and tone mapping are identical.

**Recommendation:** Either extend `leaveStatusMeta` to cover comp-off credit statuses (they share `PENDING`, `APPROVED`, `REJECTED`) and use `LeaveStatusBadge`, or extract a small `CompOffStatusBadge` that follows the same `getStatusMeta → toneClasses → Chip` pattern as `LeaveStatusBadge`. Leaving them as local maps means the pattern will be copied again when HR admin comp-off screens arrive.

**Fix now or later:** Fix before HR admin comp-off screen.

---

### Issue 6: `HolidayCalendarPage` has local `holidayTypeLabels` and `holidayTypeClasses`

**Severity:** Medium  
**Category:** Reuse / Styling  
**File:** `src/pages/leave/HolidayCalendarPage.tsx:45–61`

**Observation:** Holiday type display labels (`PUBLIC → "Public Holiday"`, `NATIONAL → "Public Holiday"`, etc.) and chip color classes are defined as local record maps in `HolidayCalendarPage`. `NATIONAL` and `PUBLIC` map to the same label and class; `REGIONAL` and `RESTRICTED` are also aliased. These duplicated mappings will reappear in any HR admin holiday management screen.

**Recommendation:** Move `holidayTypeLabels` and holiday tone mapping into `leaveStatusMeta.ts` or a dedicated `holidayMeta.ts`, and render with the `LeaveStatusBadge`-style approach (or a `HolidayTypeBadge`). At minimum, centralizing the label aliases removes future inconsistency risk.

**Fix now or later:** Fix before admin holiday calendar page.

---

### Issue 7: `LeaveFilterBar` reset button is not wired in any page

**Severity:** Medium  
**Category:** UX Consistency  
**Files:**
- `src/pages/leave/MyLeaveRequestsPage.tsx`
- `src/pages/leave/ManagerLeaveApprovalsPage.tsx`
- `src/pages/leave/HolidayCalendarPage.tsx`

**Observation:** `LeaveFilterBar` renders a Reset button when `onReset` is passed. None of the three pages that use `LeaveFilterBar` pass `onReset`. The Reset button never appears. Users cannot clear all filters in one action.

**Recommendation:** Each page should provide an `onReset` that resets all filter state to defaults and resets `page` to 1. This is trivial to add to each page and is expected UX on any filtered list.

**Fix now or later:** Fix now — the current state looks incomplete and will confuse users who expect a reset affordance.

---

### Issue 8: `ManagerLeaveApprovalsPage` action confirmation dialog does not use `DetailsDialog`

**Severity:** Low  
**Category:** Reuse / UX Consistency  
**File:** `src/pages/leave/ManagerLeaveApprovalsPage.tsx:625–680`

**Observation:** The approve/reject/clarify action confirmation dialog is a manual `Dialog` with a manually assembled header (`flex items-center justify-between p-2 border-b`), `DialogContent`, and `DialogActions`. Its structure matches `DetailsDialog` header-for-header, but the component is not used. The two dialogs coexist: `DetailsDialog` for read-only details, raw `Dialog` for action confirmation.

**Recommendation:** `DetailsDialog` can already accept any `actions` prop and supports all `maxWidth` values. The action confirmation dialog is a valid `DetailsDialog` with a form body. This is a medium-effort cleanup, not urgent, but will matter when onboarding/attendance/payroll add their own action dialogs.

**Fix now or later:** Fix later, after more action dialogs exist so the pattern is proven.

---

### Issue 9: `LeaveTabs` receives no `group` filter from `LeavePageShell`

**Severity:** Low  
**Category:** UX / Structure  
**Files:**
- `src/pages/leave/components/LeavePageShell.tsx:47`
- `src/pages/leave/components/LeaveTabs.tsx:10–15`

**Observation:** `LeavePageShell` accepts a `group` prop (used for breadcrumbs) but passes nothing to `<LeaveTabs />`. `LeaveTabs` shows all routes visible to the user across all groups in one flat list. For a MANAGER user, this renders: My Dashboard, Apply Leave, My Requests, Holiday Calendar, Comp Offs, Approvals, Team Calendar, Team Summary — all in one tab bar.

This works correctly today (8 tabs total). But when HR and Admin Leave groups are added, ADMIN users will see a tab bar with 20+ entries, all at the same visual level without group separation.

**Recommendation:** Do not filter by group today — the current UX is intentional and acceptable. But record a plan: before HR/admin routes are implemented, either (a) pass `group` to `LeaveTabs` so each page shows only its own group's tabs, or (b) add a group selector/secondary nav above the tab bar. Do not add this until the HR/admin tab count makes the flat list unworkable.

**Fix now or later:** Leave alone now. Revisit when HR/admin routes become visible.

---

### Issue 10: `loadRequests` and `loadLookups` in `ManagerLeaveApprovalsPage` are not stable references

**Severity:** Low  
**Category:** Structure  
**File:** `src/pages/leave/ManagerLeaveApprovalsPage.tsx:109–154`

**Observation:** `loadRequests` and `loadLookups` are defined as `const` async functions inside the component body (not wrapped in `useCallback`). They are called from `useEffect` hooks. The `useEffect` dependency arrays do not include these functions (they include the filter state variables directly), so the behavior is correct today. However, if the effects are ever refactored to include `loadRequests` as a dependency, the missing `useCallback` will cause an infinite loop.

**Recommendation:** Wrap both in `useCallback` with the appropriate dependency arrays when this file is next edited, as a defensive measure. This is not urgent.

**Fix now or later:** Fix as part of any future edit to this file.

---

### Issue 11: `selectOptionalHoliday` and `getTeamCalendar` have no real API path

**Severity:** Low  
**Category:** API / Structure  
**File:** `src/services/modules/leave.ts:1057–1068`, `1151–1153`

**Observation:** `selectOptionalHoliday` has no `if (!USE_MOCK_LEAVE_SERVICE)` branch — it always runs the mock path. `getTeamCalendar` is the same. When `VITE_USE_MOCK_LEAVE_SERVICE=false`, these methods silently return mock data as if they were real responses. There is no warning, no `throw`, and no placeholder.

**Recommendation:** Add a guard that throws a `"Not implemented"` error or calls the real endpoint (even if unimplemented). This prevents the silent mock-as-real pattern from being invisible during integration testing.

**Fix now or later:** Fix before the real backend for these endpoints is integrated.

---

### Issue 12: "mock requests loaded" text is visible in production UI

**Severity:** Low  
**Category:** UX  
**File:** `src/pages/leave/MyLeaveDashboard.tsx:263`

**Observation:** The Recent Requests stat card contains the literal subtitle `"mock requests loaded"`. This was flagged in the original review as a P0 text cleanup and was not removed.

**Recommendation:** Replace with a meaningful label such as `"in the selected period"` or `"submitted this year"` depending on the actual filter applied.

**Fix now or later:** Fix now — it ships as written.

---

### Issue 13: Leave service test coverage is narrow

**Severity:** Low  
**Category:** Testing  
**File:** `tests/unit/leaveService.test.ts`

**Observation:** The service test only covers `getMyManagerLeaveApprovals` (mock path and real API path). There are no tests for `createLeave` (mock branch has non-trivial default field assembly), `calculateLeave` (mock has date arithmetic), `getLeaveTypes` with the enabled filter active (real-API path silently filters `enabled: false` types), or `approveLeave`/`rejectLeave`/`cancelLeaveRequest` state mutations. The `requiresLeaveAttachment` test correctly documents that only `leaveTypeCode === "SL"` triggers the rule, but no service-level test confirms that `getLeaveTypes` actually drops disabled types.

**Recommendation:** Add focused tests for `calculateLeave` mock arithmetic, the `getLeaveTypes` enabled filter, and at least one of the action methods. These are the paths most likely to silently break on backend schema changes.

**Fix now or later:** Fix before HR/admin Leave features that exercise these paths.

---

## Refactor Quality Assessment

### LeavePageShell / LeaveTabs
Well-executed. The shell props (`group`, `title`, `breadcrumbLabel`, `subtitle`, `actions`, `contentClassName`, `paperClassName`, `titleClassName`) cover real page variation without over-generalizing. The breadcrumb renders correctly. The tab group separation in breadcrumbs (employee/manager/hr/admin) is clear. No issues.

### LeaveStatusBadge / status metadata
Clean and correct. The `toneClasses` record in `LeaveStatusBadge` maps all six tones. The `formatUnknownStatus` fallback in `leaveStatusMeta` is defensive and safe. The `leaveRequestStatusOptions` export is reused correctly in filter dropdowns. One gap: comp-off statuses and holiday type statuses are not in this system yet (Issues 5 and 6 above).

### Session identity / manager approvals
The `sessionIdentity.ts` function is correct but minimal. The manager approvals fix in the service layer is well-structured: real-API path uses session id or falls back to a "my approvals" endpoint; mock path falls back to `DEFAULT_MOCK_MANAGER_ID` only when the manager's own data is empty. The test covers both paths. No issues with the approval fix itself; the remaining gap is the complex profile fallback still sitting in `MyLeaveDashboard` (Issue 4).

### leaveRules
Strong. All six exported functions are pure and directly testable. The test file covers the important boundary cases: PENDING-only withdrawal, same-day approved cancellation, SL attachment threshold, 90-day comp-off expiry across year boundaries, and overlap exclusion logic. One minor gap: `canWithdrawLeave` only matches `PENDING`; `DRAFT` status is not covered by tests and the rule behavior for drafts is ambiguous.

### DataState usage
Consistent and correct. All six Leave pages use it for table-row loading (compact), table-row empty (compact), and panel-level error states. The `type` prop covering `loading | empty | error` is sufficient for current needs. The component itself is lean and does not need changes.

### LeaveFilterBar
The wrapper is correct. Its only problem is that no page passes `onReset` (Issue 7). The `gridClassName` override prop is used in `MyLeaveRequestsPage` (4 columns) vs the default 5 columns — this flexibility is appropriate, not a design smell.

### DetailsDialog / ApprovalActionBar
Both are clean. `DetailsDialog` covers all Leave detail use cases. `ApprovalActionBar` covers both icon-row and button-footer variants and is used in exactly those two places in `ManagerLeaveApprovalsPage`. The action confirmation dialog not using `DetailsDialog` (Issue 8) is low priority but worth recording.

### leaveTableStyles
The constants work but `leaveTableContainerSx` and `leaveTableSx` are near-identical. Both reference the same CSS variables and have the same two properties. They could be merged into one. Not worth a standalone refactor, but clean up when the file is next touched.

### leaveRoutes registry
Well-structured. Stable ids, `allowedRoles` per route, `requiredPermissions` slot ready, `isImplemented` flag for placeholder management. The three lookup helpers (`getLeaveRouteByPath`, `getLeaveRouteById`, `getVisibleLeaveRoutes`) are all tested. The only gap is that the `ProtectedRoute` wrappers in `Approutes.tsx` don't consume `allowedRoles` from the registry (Issue 3).

---

## Remaining Refactor Backlog

| Priority | Task | Reason | Files |
|---|---|---|---|
| P0 | Extract `formatDate` and `formatDay` into `leaveRules.ts` or `leaveFormatters.ts` | Duplicated in 6 files; HR/admin screens will add a 7th | All Leave page files |
| P0 | Fix `HolidayCalendarPage` hardcoded `year = 2026` | Will silently show empty calendar in 2027 | `HolidayCalendarPage.tsx:91` |
| P0 | Replace `"mock requests loaded"` with real label | Production-facing UI | `MyLeaveDashboard.tsx:263` |
| P0 | Wire `onReset` in all three `LeaveFilterBar` usages | Reset button never appears; missing standard UX | `MyLeaveRequestsPage.tsx`, `ManagerLeaveApprovalsPage.tsx`, `HolidayCalendarPage.tsx` |
| P1 | Derive `ProtectedRoute allowedRoles` from route registry | Prevents drift when HR/admin routes are added | `Approutes.tsx`, `leaveRoutes.ts` |
| P1 | Extract employee identity resolution into `sessionIdentity.ts` or `useEmployeeId` | Profile fallback logic is repeated and page-owned | `MyLeaveDashboard.tsx:107–139`, `sessionIdentity.ts` |
| P1 | Add comp-off status badge using shared tone pattern | Prevents local chip maps from spreading to HR admin screens | `CompOffsPage.tsx`, `leaveStatusMeta.ts` |
| P1 | Centralize holiday type labels and colors | Local maps will reappear in admin holiday page | `HolidayCalendarPage.tsx:45–61` |
| P1 | Add guard to `selectOptionalHoliday` and `getTeamCalendar` for real-API path | Silent mock-as-real is a production risk | `leave.ts:1057`, `1151` |
| P2 | Action confirmation dialog in manager approvals → use `DetailsDialog` | Consistency before more action dialogs appear | `ManagerLeaveApprovalsPage.tsx:625–680` |
| P2 | Wrap `loadRequests`/`loadLookups` in `useCallback` | Defensive stability for future edits | `ManagerLeaveApprovalsPage.tsx` |
| P2 | Expand leave service test coverage | `createLeave`, `calculateLeave`, `getLeaveTypes` enabled filter | `tests/unit/leaveService.test.ts` |
| P2 | Consider tab group separation before HR/admin routes appear | Flat 20+ tab list will be unusable | `LeaveTabs.tsx`, `LeavePageShell.tsx` |

---

## Things To Avoid Refactoring Further

**LeaveFilterBar concrete fields**: The decision not to make `LeaveFilterBar` config-driven was correct. Pages still own their specific fields, options, and filter state. Do not introduce a field schema until Employee, Attendance, and Payroll filter needs can be compared against Leave's.

**leaveTableStyles granularity**: The current constants cover the real repetition (container, header row, body cell, action cell, location cell). Do not extract a full `DataTable` abstraction yet. The tables differ enough in columns and row actions that a config-driven table component would be premature.

**leaveRules function signatures**: All six rule functions are already used in multiple pages with clear inputs. Do not add optional parameters or overloads to handle edge cases that haven't appeared yet. The `canWithdrawLeave(DRAFT)` question should be answered with a product decision before touching the function.

**LeaveTabs group filtering**: Do not add group filtering to `LeaveTabs` until the HR/admin route count makes the flat list a real UX problem. Adding it prematurely would require all existing pages to pass their `group` prop explicitly, with no visible benefit yet.

**DataState variants**: The three-type (`loading | empty | error`) API is sufficient. Do not add subtypes (`empty.filtered`, `error.auth`, etc.) until a specific page needs to distinguish them.

**leaveStatusMeta tone palette**: The six tones (`default`, `neutral`, `info`, `success`, `warning`, `error`) map cleanly to Leave domain states. Do not add new tones to cover comp-off or holiday statuses — reuse existing tones via new metadata entries.

**Mock data shape**: `leaveMockData.ts` works well. Do not change mock data structure to "align with real API" without a real backend contract to align to.

---

## P0 Cleanup Note

The four P0 items were fixed in a single batch after this review was written.

- **Date display formatters centralized.** `formatDate` and `formatDay` were extracted into `src/pages/leave/leaveFormatters.ts`. All six local inline copies were removed from `MyLeaveDashboard`, `ApplyLeavePage`, `MyLeaveRequestsPage`, `ManagerLeaveApprovalsPage`, `HolidayCalendarPage`, and `CompOffsPage`. `formatDateForApi` in `leaveRules.ts` is unchanged.
- **Holiday default year fixed.** `HolidayCalendarPage` now initializes year state with `new Date().getFullYear()`. The year selector menu options are also dynamic.
- **Production-facing mock copy removed.** The "mock requests loaded" subtitle in `MyLeaveDashboard` was replaced with "submitted requests".
- **Filter reset handlers wired.** `onReset` is now passed to `LeaveFilterBar` in `MyLeaveRequestsPage` (resets status, leave type, from/to date, page to 1), `ManagerLeaveApprovalsPage` (resets to defaults including status back to "PENDING", page to 1), and `HolidayCalendarPage` (resets date, day, name, type, location filters).
- **Tests added.** `tests/unit/leaveFormatters.test.ts` covers `formatDate` and `formatDay` with known-date and null/undefined/empty-string cases. All 9 tests pass.
- **All existing tests pass.** 29/29 tests across `leaveRoutes`, `DetailsDialog`, `ApprovalActionBar`, `LeaveFilterBar`, `DataState`, `leaveService`, `leaveStatusMeta`, `leaveRules`. Build is clean.
- **API calls, business rules, route guards, dialogs, pagination, mock behavior, and approval workflows were intentionally not changed.**

Remaining backlog starts at P1 items.

---

## Route Guard Cleanup Note

Leave group `ProtectedRoute` allowed roles are now derived from the Leave route registry, reducing route/tab/guard drift before HR/admin Leave screens are added.

`getLeaveRouteGroupAllowedRoles(group)` was added to `leaveRoutes.ts`. It computes the union of `allowedRoles` across all routes in a group, deduplicated. `Approutes.tsx` now calls it for all four Leave group wrappers (`employee`, `manager`, `hr`, `admin`). Non-Leave routes keep their existing hardcoded arrays unchanged.

Derived role sets match the previous hardcoded arrays exactly:

- employee → `["ADMIN", "HR", "MANAGER", "EMPLOYEE"]`
- manager → `["ADMIN", "MANAGER"]`
- hr → `["ADMIN", "HR"]`
- admin → `["ADMIN"]`

Five new tests added to `tests/unit/leaveRoutes.test.ts`: one per group matching previous arrays, plus a deduplication assertion. 43/43 tests pass. Build is clean.

---

## Recommended Next Step

Extract `formatDate` and `formatDay` into `src/pages/leave/leaveFormatters.ts`, fix the hardcoded `year = 2026` in `HolidayCalendarPage` to `new Date().getFullYear()`, replace `"mock requests loaded"` with a real label in `MyLeaveDashboard`, and add `onReset` to all three `LeaveFilterBar` usages. These four P0 items are mechanical, low-risk, and unblock the module for the next set of screens.

Suggested prompt:

> Fix the four P0 items in the Leave module:
> 1. Extract the duplicated `formatDate` (Intl.DateTimeFormat en-IN day/month/year) and `formatDay` (weekday) into `src/pages/leave/leaveFormatters.ts` and replace all six inline copies.
> 2. In `HolidayCalendarPage.tsx:91`, change `useState(2026)` to `useState(new Date().getFullYear())`.
> 3. In `MyLeaveDashboard.tsx:263`, replace `"mock requests loaded"` with `"submitted requests"`.
> 4. Add `onReset` to `LeaveFilterBar` in `MyLeaveRequestsPage`, `ManagerLeaveApprovalsPage`, and `HolidayCalendarPage` — each one should reset all filter state fields to their defaults and reset the page to 1.
> Do not change any API calls, business rules, route guards, dialog behavior, or pagination logic.

---

## Comp-Off Status Cleanup Note

Comp-off credit/request status display is now centralized through metadata and `CompOffStatusBadge`, reducing local chip maps before HR/admin comp-off screens are added.

- `src/pages/leave/compOffStatusMeta.ts` added. Covers `AVAILABLE`, `AVAILED`, `EXPIRED`, `PENDING`, `APPROVED`, `REJECTED` with label and tone. Unknown statuses fall back to a formatted label with `"default"` tone.
- `src/pages/leave/components/CompOffStatusBadge.tsx` added. Uses `getCompOffStatusMeta`, the same `toneClasses` pattern as `LeaveStatusBadge`, and accepts any `string` status with a safe fallback.
- `creditStatusClasses` and `requestStatusClasses` local maps removed from `CompOffsPage`. Both Chip renders replaced with `<CompOffStatusBadge status={...} />`.
- `tests/unit/compOffStatusMeta.test.ts` added — 8 tests covering all six statuses, an unknown status, and empty string. 8/8 pass.
- All existing tests pass (27 pre-existing tests). Build is clean.

---

## Holiday Type Badge Cleanup Note

Holiday type display is now centralized through metadata and `HolidayTypeBadge`, removing local chip maps before any admin holiday calendar screen is added.

- `src/pages/leave/holidayTypeMeta.ts` added. Covers `PUBLIC`, `NATIONAL`, `COMPANY`, `OPTIONAL`, `RESTRICTED`, `REGIONAL` with label and tone. `PUBLIC`/`NATIONAL` share label `"Public Holiday"` and tone `"success"`. `RESTRICTED`/`REGIONAL` share label `"Restricted Holiday"` and tone `"warning"`. Unknown types fall back to a formatted label with `"default"` tone.
- `src/pages/leave/components/HolidayTypeBadge.tsx` added. Uses `getHolidayTypeMeta`, the same `toneClasses` pattern as `CompOffStatusBadge` and `LeaveStatusBadge`, and accepts any `string` type with a safe fallback.
- `holidayTypeLabels` and `holidayTypeClasses` local maps removed from `HolidayCalendarPage`. `Chip` import dropped. The row-level Chip render and both filter dropdown label references replaced: row uses `<HolidayTypeBadge type={holiday.type} />`, filter `renderValue` and menu items use `getHolidayTypeMeta(type).label`.
- `tests/unit/holidayTypeMeta.test.ts` added — 10 tests covering all six type codes, the two aliased pairs (`PUBLIC`/`NATIONAL`, `REGIONAL`/`RESTRICTED`), an unknown type, and empty string. 10/10 pass.
- All pre-existing tests pass (27/27). Build is clean.

---

## API Guard Cleanup Note

`selectOptionalHoliday` and `getTeamCalendar` in `src/services/modules/leave.ts` previously had no `if (!USE_MOCK_LEAVE_SERVICE)` branch, silently returning mock data as real responses whenever `VITE_USE_MOCK_LEAVE_SERVICE=false`. Both methods now follow the standard file pattern: the real-API branch comes first and throws `new Error("<method>: real API not implemented")`, making the unimplemented state visible immediately during integration testing instead of silently masking it with mock data. The mock path is unchanged. Two new tests in `tests/unit/leaveService.test.ts` (using the same `importLeaveService(false)` pattern as the existing manager approvals coverage) confirm each method rejects with the expected message when `USE_MOCK_LEAVE_SERVICE` is false. 5/5 service tests pass; all 37 pre-existing leave tests pass. Build is clean.

---

## Session Identity Cleanup Note

The 30-line employee identity resolution block that was embedded in `MyLeaveDashboard` is now extracted into `src/auth/sessionIdentity.ts`, and the `isAccessDeniedError` guard is centralised in a new shared utility.

**Files added:**

- `src/utils/errorUtils.ts` — exports `isAccessDeniedError`. Shared by both `sessionIdentity.ts` and `MyLeaveDashboard`.
- `tests/unit/sessionIdentity.test.ts` — 9 tests covering `resolveEmployeeIdFromSession` and `resolveEmployeeIdFromProfile`.

**Files changed:**

- `src/auth/sessionIdentity.ts` — `resolveEmployeeIdFromProfile(session, authService): Promise<string>` added. Encapsulates the `authService.getProfile()` call, the six-field candidate extraction (order preserved exactly: `data.employeeId || data.employee.employeeId`, `data.employee.id`, `data.id`, `data.userId`, `data.employee.userId`, `currentUserId`), access denied guard, and `currentUserId` final fallback. Any profile call failure — permission or network — falls back silently to `currentUserId`.
- `src/pages/leave/MyLeaveDashboard.tsx` — local `ProfileResponse`, `isAccessDeniedError`, and `uniqueValues` definitions removed. The 30-line identity resolution block replaced with `const employeeId = await resolveEmployeeIdFromProfile(session, authService)` followed by a single `getEmployeeLeaveBalances` call. Outer `isAccessDeniedError` catch imported from `errorUtils`. Visible behavior, loading states, and error handling unchanged.

**Candidate field order preserved:** `employeeId || employee.employeeId` → `employee.id` → `id` → `userId` → `employee.userId` → `currentUserId`.

**Tests:** 9/9 new tests pass. 42/42 pre-existing tests pass. Build clean.
