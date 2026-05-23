# Core HRMS API Alignment Completion Tracker

## Summary

| Status | Count | Notes |
|---|---:|---|
| Completed | 8 | Core hardening, employee pagination/bulk upload, onboarding |
| Frontend Pending | 6 | Includes MFA and master data optimizations |
| Backend/API Pending | 5 | Swagger contract gaps and missing endpoints |
| Deferred / Product Decision | 0 | None explicitly deferred yet |

## Completed Frontend Items

| Item | Area | Status | Evidence / Files | Tests | Documentation |
|---|---|---|---|---|---|
| Login History UI improvements | Login History | ✅ Completed | `createdAt`, `failureReason` displayed, nullable fallbacks, pagination fixed | Passing | Updated in gap report |
| API client hardening | API Client | ✅ Completed | Sensitive params redacted, unsafe query-param guard, `getProfile` fixed | Passing | Updated in gap report |
| Employee paginated/filterable API consumption | Employees | ✅ Completed | `GET /employees` uses Spring Page contract, filters/query params aligned | Passing | Updated in gap report |
| Employee async combobox/typeahead migration | Employees | ✅ Completed | Reusable `EmployeeAsyncCombobox` used in key select dropdowns | Passing | Updated in gap report |
| Onboarding Swagger alignment | Onboarding | ✅ Completed | Used `/onboarding/assignments`, assigned task/doc endpoints, task type enum aligned | Passing | Updated in gap report |
| Password Policy integration | Auth / Policy | ✅ Completed | `GET/PUT /password-policy` wired, complexity/mfa flags wired, shared helper used | Passing | Updated in gap report |
| Employee Bulk Upload alignment | Employees | ✅ Completed | `POST /employees/bulk-upload` (only file), `/template` endpoint, client-side validation | Passing | Updated in gap report |
| Employee Deactivate / Reactivate UX | Employees | ✅ Completed | `deactivateEmployee`/`reactivateEmployee` service methods, Deactivate/Reactivate UI wording, `includeInactive` toggle | Needs latest run | Updated in gap report |

## Pending Frontend Items

| Priority | Item | Area | Why next | Dependencies | Suggested prompt/status |
|---|---|---|---|---|---|
| **1** | Company cleanup | Company | Removes hardcoded ID, aligns logo/signature delete endpoints | None | *Next recommended item* |
| 2 | Master Data dropdown optimization | Master Data | Performance and correctness improvement (active/cascade endpoints) | None | - |
| 3 | Branch/Department/Category toggle cleanup | Organization | Align with Swagger endpoints (use PATCH) | None | - |
| 4 | Invite activation flow | Auth / Onboarding | Essential flow for new user onboarding | Backend contract | - |
| 5 | MFA setup/verification flow | Auth | Security requirement | Password policy flag | - |
| 6 | Employee create onboarding/welcome orchestration | Employees | Closes the loop on employee creation | Clarification on backend side-effects | - |

## Backend/API Contract Items

| Priority | Item | Backend status | Frontend fallback | Owner / Next action |
|---|---|---|---|---|
| High | Employee code generation endpoint | Missing `/employees/id-pattern` and `/id-sequence/increment` | Frontend-only dependency | Clarify if UI dependency remains or backend adds contract |
| High | Employee resend welcome alias | Missing `/employees/{id}/resend-welcome` | Use `/onboarding/send-welcome` | Update Swagger or frontend to use `/onboarding` |
| Medium | Swagger auth-context query params | Auth-context params appear on secured endpoints | Frontend guardrails added | Clean up Swagger |
| Medium | Formal multipart requestBody modeling | Some upload endpoints may lack formal schema | Send standard multipart `file` | Track as Swagger quality item |
| Medium | Linked-record blocking (branch/dept/category) | Unclear 409 behavior or semantics | Treat deletes as risky | Confirm blocking semantics |

## Test/Quality Baseline

- Latest full unit test count: Needs latest run
- Lint status: Needs latest run
- Typecheck/build status: Needs latest run
- Note: Pre-existing failures are unknown.

## Documentation Status

- [docs/api-consumption-gap-report-core-hrms.md](file:///home/ajay/workspace/HRMS/docs/api-consumption-gap-report-core-hrms.md)
- [docs/api-alignment-completion-tracker.md](file:///home/ajay/workspace/HRMS/docs/api-alignment-completion-tracker.md)
- Note: Always keep the gap report and this tracker in sync when marking items as completed.

## Next Recommended Implementation Order

1. Company cleanup
2. Master Data dropdown optimization
3. Branch/Department/Category toggle cleanup
4. Invite activation flow
5. MFA setup/verification flow
6. Employee create onboarding/welcome orchestration
