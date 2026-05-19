# Frontend API Consumption Gap Report - Core HRMS

Source of truth: backend Swagger `data.json` provided as `/mnt/c/Users/admin/Downloads/data-2026519104223.json`.

Scope:
- Authentication
- Password Policy
- Onboarding
- Employees
- Login History
- Master Data
- Branches
- Company
- Fiscal Years
- Employee Categories
- Departments

This report summarizes frontend consumption gaps found during the module-specific API audits. It focuses on contract alignment, missing frontend consumption, frontend calls to unsupported endpoints, and flow risks.

## 1. Executive Summary

The frontend has a central API client and generally uses the Swagger path family for most core HRMS modules. Bearer-token attachment is centralized, and the audit did not find active password/email/roles/permissions query-string leakage in current routed flows.

The largest integration risks are around Employees and Onboarding. Employee list UI assumes server pagination even though Swagger says `GET /api/employees` returns all employees. Employee creation/bulk upload messaging assumes welcome/onboarding side effects that are not guaranteed by the employee APIs. Onboarding screens call several endpoints that are not in the expected Swagger contract, and onboarding progress is called with an onboarding id even though Swagger expects `employeeId`.

Several setup modules are mostly aligned on paths, but delete behavior needs backend clarification because Swagger exposes `DELETE` while requested behavior expects linked-record blocking and/or soft deactivate semantics. Master Data dropdowns work against Swagger paths but should use active-list endpoints where available.

## 2. P0 Blockers

| Module | Finding | Impact | Recommended Fix |
|---|---|---|---|
| Onboarding | Progress screen calls `/api/onboarding/progress/{id}` with `onboarding.id`, but Swagger defines `GET /api/onboarding/progress/{employeeId}`. | Current progress lookup can fetch the wrong record or fail. | Change frontend adapter/screen to pass `employeeId`; keep display id and assignment id separate. |
| Onboarding | Frontend uses unsupported onboarding endpoints such as `/api/onboarding/employee-onboardings`, `/api/onboarding/{id}/checklist/{checklistId}/tasks`, `/api/onboarding/{id}/documents`, and `DELETE /api/onboarding/{id}`. | Assignment/progress/document screens may not work against Swagger-only backend. | Replace with Swagger APIs or request backend aliases for the current frontend endpoints. |
| Employees | Employee list screen sends `page`, `size`, and `sort` to `GET /api/employees`, while Swagger says the endpoint returns all employees with no pagination parameters. | List pagination/count behavior can be incorrect in production. | Fetch all employees and paginate client-side, or ask backend to add paginated contract to Swagger. |

## 3. P1 Integration Risks

| Module | Finding | Risk | Recommended Fix |
|---|---|---|---|
| Employees | Employee code generation uses `/api/employees/id-pattern` and `/api/employees/id-sequence/increment`, but expected Swagger does not include employee code generation. | Employee creation flow may fail or rely on non-contract endpoints. | Confirm/add backend code-generation endpoints or remove frontend dependency. |
| Employees | Bulk upload sample/template uses `/api/employees/sample-template`, not present in expected Swagger. | Bulk upload UI may expose a broken download action. | Add Swagger-backed template/sample endpoint or hide the action. |
| Employees | Delete UI is wired to `DELETE /api/employees/{id}`; requested behavior expects soft delete/block-if-linked, while Swagger wording may imply hard delete. | Risk of destructive deletion or inconsistent UX. | Confirm backend semantics; adjust label and confirmation copy. |
| Onboarding | Employee create/bulk upload UI says welcome emails are sent automatically but does not explicitly call `/api/onboarding/assign` or `/api/onboarding/send-welcome` after employee create/bulk upload. | New employees may not receive onboarding assignment/invite. | Add explicit post-create orchestration or confirm backend side effects. |
| Onboarding | Document upload uses multipart but assumes frontend field names and task/onboarding id semantics. Swagger expects `POST /api/onboarding/documents` and document delete by `{taskId}`. | Upload/delete can fail if field names or ids differ. | Align adapter with Swagger request schema and clarify file field name. |
| Company | Update must use `/api/org/company/{id}`. Frontend service supports this, but screen must always have `companyInfo.id` before update. | Update can fall back to create/missing action if id is absent. | Ensure company load/hydration always stores id before enabling save. |
| Branches / Departments / Categories | Delete actions are wired, but linked-record blocking behavior is not confirmed in Swagger. | Users may attempt destructive deletes for linked records. | Treat delete as risky until backend confirms blocking semantics. |
| Employee Categories | Category list is treated like paginated in places via `{ size: 100 }`, while Swagger category list is not paginated; category items are paginated. | Dropdown completeness/shape issues. | Normalize category list as array and category items as page-or-array tolerant. |
| Login History | Swagger includes auth-context query params (`userId`, `tenantId`, `email`, `password`, `active`, `roles`, `permissions`) on secured endpoints. Current frontend does not send them, but service signatures allow generic params. | Future leakage/noisy contract coupling. | Type login-history params as `{ page, size, sort }` only. |
| Password Policy | Password screens hardcode validation rules and admin password policy screen is local state only. | Frontend can conflict with backend password rules. | Fetch `GET /api/password-policy` where passwords are created/changed. |

## 4. P2 Cleanup Items

| Area | Finding | Recommended Cleanup |
|---|---|---|
| API logging | Request interceptor logs `config.params` unredacted. | Redact sensitive keys before logging. |
| Master Data | Country/city/state dropdown hook loads full lists with `{ size: 200 }` even when active/cascade endpoints exist. | Use active countries and cascade endpoints for dropdowns; avoid full state/city preloads. |
| Login History | Table omits `createdAt` and `failureReason`. | Add date/time and failure reason columns or tooltips. |
| Login History | Serial number uses row index and resets per page. | Calculate `page * limit + index + 1`. |
| Onboarding | Checklist task reorder service exists, but UI affordance/usage needs confirmation. | Add drag/drop reorder or remove dead adapter method. |
| Company | `currencyId` is commented out and no currency dropdown is wired. | Add `GET /api/master/currencies/active` if company currency is required. |
| Auth | `getProfile(params?)` accepts arbitrary params though current callers pass none. | Remove generic params from secured auth context endpoints. |

## 5. Module-by-Module Findings

### Authentication

| Area | Finding | Priority | Recommendation |
|---|---|---|---|
| Login | `POST /api/auth/login` is used through the central API client. Login handles direct token success, MFA challenge, tenant selection, and validation-like errors. | P2 | Keep outcome mapping centralized. |
| Tenant selection | `POST /api/auth/login/select-tenant` is used with session token in the Authorization header. | P2 | Keep request body/header semantics; do not move tenant id to query params. |
| Refresh | Refresh handling uses a retry guard/queue and avoids obvious infinite 401 loops. | P2 | Keep refresh endpoint out of auth retry recursion. |
| Logout | Logout clears local auth state in `finally`, even if backend logout fails. | P2 | Good pattern; keep. |
| Secured query params | No current frontend calls send `password`, `email`, `roles`, `permissions`, `userId`, or `tenantId` as query params. | P2 | Add API client guardrails so future code cannot do this accidentally. |
| Mobile OTP | OTP UI exists, but mobile OTP login appears incomplete/assumed. | P1 | Confirm intended mobile OTP flow and wire `/api/auth/verify-otp` if in scope. |

### Password Policy

| Area | Finding | Priority | Recommendation |
|---|---|---|---|
| API consumption | Expected `GET /api/password-policy` and `PUT /api/password-policy` are not consumed by password screens. | P1 | Add password policy service and hook. |
| Set/reset/change password | Password validation is hardcoded in screens such as reset/change password. | P1 | Fetch policy before validating and render messages from backend policy fields. |
| Admin setup | Password config screen is local state only and does not persist via `PUT /api/password-policy`. | P1 | Wire admin policy screen to `GET`/`PUT`. |
| Query params | No unsafe password policy query params found. | P2 | Keep policy endpoints body/header only. |

### Onboarding

| Area | Finding | Priority | Recommendation |
|---|---|---|---|
| Checklist CRUD | Checklist create/list/get/update/delete and task create/update/delete/reorder paths mostly match expected Swagger. | P2 | Keep central endpoint constants. |
| Progress | Frontend passes onboarding id to `/onboarding/progress/{id}`; Swagger expects employee id. | P0 | Pass `employeeId` and rename adapter argument. |
| Employee onboardings list | Frontend calls `/onboarding/employee-onboardings`, which is not in expected Swagger. | P0 | Replace with Swagger-supported progress/assignment APIs or request backend endpoint. |
| Assignment delete | Frontend calls `DELETE /onboarding/{id}` for assignment deletion; expected Swagger does not list it. | P0 | Remove or confirm backend support. |
| Employee tasks | Frontend calls `/onboarding/{onboardingId}/checklist/{checklistId}/tasks`; expected Swagger does not list it. | P0 | Use checklist task APIs plus progress response, or ask backend to document endpoint. |
| Documents | Frontend calls `/onboarding/{onboardingId}/documents`; expected Swagger only lists `POST /onboarding/documents` and `DELETE /onboarding/documents/{taskId}`. | P0 | Align documents list/delete semantics with Swagger. |
| Bulk upload welcome assumption | Employee bulk upload UI implies welcome emails are automatic. | P1 | Explicitly call assign/send-welcome or confirm backend side effect. |

Flow expectation:

```text
Employee create/bulk upload
  -> assign checklist
  -> send welcome
  -> verify invite
  -> set password
  -> onboarding progress/tasks
  -> document upload
  -> complete task
```

### Employees

| Area | Finding | Priority | Recommendation |
|---|---|---|---|
| List | Frontend uses `GET /employees` with `page`, `size`, `sort`, `search`; Swagger says `GET /api/employees` returns all employees with no pagination. | P0 | Client-side paginate or request backend paginated API. |
| Paths | Employee detail/update/delete paths use plural `/employees/{id}`. | P2 | Good; avoid old singular `/employee/{id}`. |
| Create/update | Frontend sends employee payloads from screen forms; exact schema alignment still needs typed adapter cleanup. | P1 | Add request/response adapters and field-level schema tests. |
| Section updates | Frontend has PATCH section service methods, but some screens still use broader PUT/update flows. | P1 | Prefer PATCH for personal/identity/bank/background/admin/PF section edits where available. |
| Code generation | Frontend uses `/employees/id-pattern` and `/employees/id-sequence/increment`, missing from expected Swagger. | P1 | Clarify/add backend contract or remove flow dependency. |
| Bulk upload | `POST /employees/bulk-upload` is supported, but sample/template download endpoint is frontend-only. | P1 | Add documented backend sample/template endpoint or hide UI. |
| Delete | Delete UI is wired. Soft/hard delete behavior is unclear. | P1 | Confirm soft delete and linked-record blocking before enabling broadly. |

### Login History

| Area | Finding | Priority | Recommendation |
|---|---|---|---|
| Path | Frontend uses `/login-history`, not `/auth/login-history`; Swagger uses `/api/login-history`. | P2 | Keep Swagger path. |
| Pagination | Frontend sends `page` and `size`, matching Swagger. | P2 | Add `sort` if backend default order is not guaranteed. |
| Fields | UI displays browser, OS, IP, device type, user agent, status. It omits `createdAt` and `failureReason`. | P2 | Add created time and failure reason. |
| Location | Frontend login-history table does not expect location. | P2 | Do not add location unless backend provides it. |
| Admin usage | Service has tenant/user methods, but no routed admin screen was found. | P2 | Wire only if admin audit screen is required. |

### Master Data

| Area | Finding | Priority | Recommendation |
|---|---|---|---|
| Countries | Frontend uses `GET /master/countries?size=200`; Swagger supports list and active list. | P2 | Use `/master/countries/active` for dropdowns. |
| States | Frontend uses list and `by-country`; paths match Swagger. | P2 | Prefer `by-country` for cascades; avoid full preload. |
| Cities | Frontend uses list, `by-state`, and `by-country`; paths match Swagger. | P2 | Prefer `by-state` for state -> city cascade. |
| Currencies | Endpoint constant exists but no service/screen consumption found. | P2 | Add active currency dropdown if company currency is required. |
| Delete/deactivate | No master CRUD/deactivate UI found. Swagger describes delete as deactivate. | P2 | Label future delete actions as Deactivate. |
| Employee-specific masters | Employee designation/grade/status-style values are not loaded from `/master`; they use category APIs. | P2 | Keep employee-specific masters under `/org/category`. |

### Branches

| Area | Finding | Priority | Recommendation |
|---|---|---|---|
| CRUD | Frontend service uses `/org/branches` and `/org/branches/{id}`. | P2 | Paths align. |
| List filters | Frontend sends `page`, `size`, `sort`, `search`; Swagger-supported query params need confirmation. | P1 | Align list query type to Swagger. |
| Active/toggle | Active list and toggle-active PATCH are available in service. | P2 | Use active endpoint for dropdowns and PATCH for toggles. |
| Delete | Delete action is wired. Linked-record behavior unclear. | P1 | Confirm backend blocks delete when linked. |
| Location fields | Frontend uses branch address, latitude, longitude, radius, branch head, code, active. | P2 | Keep request adapter explicit. |

### Company

| Area | Finding | Priority | Recommendation |
|---|---|---|---|
| CRUD | Service supports `/org/company`, `/org/company/{id}` create/get/update/delete. | P2 | Paths align. |
| Update | Update must include id in path. Frontend service does this, screen depends on `companyInfo.id`. | P1 | Disable update until id is loaded. |
| Logo/signature | Service supports upload/delete logo/signature paths. | P2 | Confirm file field names if upload fails. |
| Currency | `currencyId` is commented out; currency active endpoint not consumed. | P2 | Add currency dropdown if required by backend schema. |

### Fiscal Years

| Area | Finding | Priority | Recommendation |
|---|---|---|---|
| API consumption | Expected company-scoped fiscal year APIs were not found in current frontend service usage. | P1 | Add fiscal year service under company id. |
| Activation | Frontend should call `/api/org/company/{companyId}/fiscal-years/{id}/activate`, not manually update active flags. | P1 | Add explicit activate adapter and UI action. |
| Active fiscal year | No active fiscal year consumption found. | P1 | Add `GET /api/org/company/{companyId}/fiscal-years/active` where needed. |

### Employee Categories

| Area | Finding | Priority | Recommendation |
|---|---|---|---|
| Category CRUD | Frontend uses `/org/category` paths matching Swagger. | P2 | Keep. |
| Category items | Frontend uses `/org/category/{categoryId}/items` paths matching Swagger. | P2 | Keep. |
| Pagination | Category list is treated as if `{ size }` may work, but Swagger category list is not paginated; category items are paginated. | P1 | Type category list as array; type item list as paged. |
| Dropdown dependencies | Employee fields such as designation/grade/cost center/employment type/status should resolve through category items. | P2 | Keep category dependency map centralized. |
| Mass update/delete | Requested document mentioned mass APIs, but Swagger does not include them. | P1 | Do not build mass UI unless backend adds contract. |
| Delete/toggle | Toggle endpoints are PATCH; delete linked blocking is unclear. | P1 | Use PATCH for toggles; confirm linked delete behavior. |

### Departments

| Area | Finding | Priority | Recommendation |
|---|---|---|---|
| CRUD | Frontend service uses `/org/departments` and `/org/departments/{id}`. | P2 | Paths align. |
| List filters | Frontend sends `page`, `size`, `sort`, `search`; Swagger-supported query params need confirmation. | P1 | Align query type to Swagger. |
| Active/by-branch | Service supports active and by-branch endpoints. | P2 | Use active/by-branch for dropdowns. |
| Toggle | Service supports PATCH toggle-active. | P2 | Prefer PATCH toggle over full PUT. |
| Delete | Delete action is wired. Linked-record behavior unclear. | P1 | Confirm backend blocks delete when linked. |

## 6. Endpoint Mismatch Table

| Module | Frontend Usage | Swagger Endpoint | Status | Risk | Recommended Fix |
|---|---|---|---|---|---|
| Employees | `GET /api/employees?page=&size=&sort=&search=` | `GET /api/employees` with no pagination in Swagger | Mismatch | P0 | Client-side paginate or add backend paginated contract. |
| Employees | `GET /api/employees/id-pattern` | Not present | Frontend-only | P1 | Add Swagger endpoint or remove dependency. |
| Employees | `POST /api/employees/id-sequence/increment` | Not present | Frontend-only | P1 | Add Swagger endpoint or remove dependency. |
| Employees | `GET /api/employees/sample-template` | Not present | Frontend-only | P1 | Add sample/template endpoint or hide action. |
| Onboarding | `GET /api/onboarding/progress/{onboardingId}` | `GET /api/onboarding/progress/{employeeId}` | Wrong id semantics | P0 | Pass employee id. |
| Onboarding | `GET /api/onboarding/employee-onboardings` | Not present | Frontend-only | P0 | Replace or document backend endpoint. |
| Onboarding | `GET /api/onboarding/{id}/checklist/{checklistId}/tasks` | Not present | Frontend-only | P0 | Replace or document backend endpoint. |
| Onboarding | `GET /api/onboarding/{id}/documents` | Not present | Frontend-only | P0 | Replace or document backend endpoint. |
| Onboarding | `DELETE /api/onboarding/{id}` | Not present | Frontend-only | P0 | Remove or document assignment delete API. |
| Login History | Requested doc said `/api/auth/login-history`; frontend uses `/api/login-history` | Swagger uses `/api/login-history` | Frontend correct | P2 | Keep Swagger path. |
| Company | Screen must update using `/api/org/company/{id}` | `PUT /api/org/company/{id}` | Service correct; screen depends on id | P1 | Ensure id loaded before save. |

## 7. Missing Frontend Consumption Table

| Module | Swagger Endpoint / Capability | Current Frontend Status | Priority | Recommendation |
|---|---|---|---|---|
| Password Policy | `GET /api/password-policy` | Not consumed by password screens | P1 | Fetch policy for set/reset/change password. |
| Password Policy | `PUT /api/password-policy` | Admin config screen not wired | P1 | Persist admin policy settings. |
| Onboarding | `POST /api/onboarding/assign` after employee create/bulk upload | Not explicitly called in employee flows | P1 | Add explicit assign step or confirm backend side effect. |
| Onboarding | `POST /api/onboarding/send-welcome` after employee create/bulk upload | Not explicitly called in employee flows | P1 | Add explicit send welcome step or confirm backend side effect. |
| Onboarding | `PATCH /api/onboarding/checklist/{id}/tasks/reorder` | Service exists; UI usage unclear | P2 | Add reorder UI if checklist task order is editable. |
| Employees | Section PATCH APIs | Service exists; not consistently preferred by screens | P1 | Use section PATCH for partial edits. |
| Login History | `createdAt`, `failureReason` display | Not shown in table | P2 | Add columns/tooltips. |
| Login History | Admin user/tenant screens | Service methods exist; routed screens not found | P2 | Add admin screen only if required. |
| Master Data | `GET /api/master/countries/active` | Not consumed | P2 | Use for dropdowns. |
| Master Data | `GET /api/master/currencies/active` | Not consumed | P2 | Add currency dropdown where needed. |
| Fiscal Years | Company-scoped fiscal year CRUD/active/activate | Not consumed | P1 | Add fiscal year service and screen wiring. |

## 8. Frontend Using Missing Backend Endpoint Table

| Module | Frontend Endpoint | Current Use | Swagger Status | Priority | Recommendation |
|---|---|---|---|---|---|
| Employees | `/api/employees/id-pattern` | Employee code/id pattern lookup | Missing | P1 | Add backend endpoint or remove UI dependency. |
| Employees | `/api/employees/id-sequence/increment` | Employee code/id sequence increment | Missing | P1 | Add backend endpoint or generate server-side during create. |
| Employees | `/api/employees/sample-template` | Bulk upload sample/template download | Missing | P1 | Add backend template endpoint or hide UI. |
| Employees | `/api/employees/{id}/resend-welcome` | Resend welcome action | Not in expected employee Swagger | P1 | Prefer `/api/onboarding/send-welcome` or document alias. |
| Onboarding | `/api/onboarding/employee-onboardings` | Assignment/progress/document screens | Missing | P0 | Replace with Swagger-backed APIs. |
| Onboarding | `/api/onboarding/{id}/checklist/{checklistId}/tasks` | Fetch assigned employee tasks | Missing | P0 | Replace or request backend contract. |
| Onboarding | `/api/onboarding/{id}/documents` | Fetch onboarding documents | Missing | P0 | Replace or request backend contract. |
| Onboarding | `DELETE /api/onboarding/{id}` | Delete assignment | Missing | P0 | Remove or request backend contract. |

## 9. Backend Clarification List

1. Should `GET /api/employees` support pagination/sort/search, or is the frontend expected to paginate the full list client-side?
2. Is employee code generated automatically by `POST /api/employees`, or will backend provide explicit code-generation endpoints?
3. Will backend provide a bulk upload sample/template download endpoint?
4. Does `DELETE /api/employees/{id}` soft delete, hard delete, or block when linked to payroll/attendance/onboarding?
5. Should employee creation or bulk upload automatically assign onboarding and send welcome emails, or must frontend call `/api/onboarding/assign` and `/api/onboarding/send-welcome`?
6. Is `/api/onboarding/progress/{employeeId}` the only progress endpoint, or should onboarding assignment id also be supported?
7. Are `/api/onboarding/employee-onboardings`, `/api/onboarding/{id}/checklist/{checklistId}/tasks`, and `/api/onboarding/{id}/documents` supported aliases that need Swagger coverage?
8. What is the exact multipart schema for `POST /api/onboarding/documents`: file field name, `taskId`, `employeeId`, `notes`, and accepted content types?
9. Should `DELETE /api/onboarding/documents/{taskId}` delete by task id or document id?
10. Should branch, department, category, and category item deletes be blocked when linked anywhere?
11. Should Master Data delete labels say Deactivate for all country/state/city/currency entities?
12. Are Swagger auth-context query params (`userId`, `tenantId`, `email`, `password`, `active`, `roles`, `permissions`) generation noise and safe to ignore on secured endpoints?
13. Is `/api/auth/login-history` an unsupported requested-doc path, with `/api/login-history` as the only correct path?
14. Is company currency required in the company request schema, and should frontend source it from `/api/master/currencies/active`?
15. Should fiscal year activation be the only way to set the active fiscal year?

## 10. Recommended Implementation Order for Frontend Fixes

1. Fix Onboarding P0 path/id mismatches: progress by `employeeId`, remove or replace unsupported onboarding assignment/task/document endpoints.
2. Fix Employee list pagination contract: either client-side paginate all employees or align with a backend paginated endpoint.
3. Resolve employee creation/bulk-upload onboarding orchestration: explicit assign/send-welcome calls or confirmed backend side effects.
4. Remove or guard frontend-only employee endpoints for code generation, sample/template download, and resend-welcome until backend contract exists.
5. Wire Password Policy `GET`/`PUT` and replace hardcoded password validation with policy-driven validation.
6. Add fiscal year service/screen wiring, especially active fiscal year and activate endpoint usage.
7. Tighten delete UX for employees, branches, departments, categories, and category items after backend confirms soft delete / linked blocking behavior.
8. Improve Login History table fields and type query params to pagination-only.
9. Update Master Data dropdown adapters to use active/cascade endpoints and add currency consumption if required.
10. Harden the central API client: reject unsafe auth-context query params where possible and redact logged params.
