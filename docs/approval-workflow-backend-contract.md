# Approval Workflow Backend API Contract

This contract is for the HRMS-wide workflow builder at
`/settings/general/approval-workflow`. Endpoints below are relative to the
configured API base URL. Require authentication and tenant/workspace context on
all routes. Derive tenant, requester, and approver identities from the
authenticated session; never trust those values from a submitted body.

## Workflow keys

The frontend exposes a workflow for each module/action pair. Module keys:

| Key | HRMS area |
| --- | --- |
| `employees` | Employee records and employee sub-records |
| `organization` | Company, branches, departments, categories |
| `attendance` | Attendance corrections, processing, rosters |
| `leave` | Leave and comp-off |
| `payroll` | Payroll, salaries and revisions |
| `policies` | Policies and versions |
| `onboarding` | Onboarding configuration and records |
| `system` | General and security settings |

Action keys are `CREATE`, `UPDATE`, `DELETE`, and `STATUS_CHANGE`. A workflow
ID is `{module}:{action}`, such as `employees:DELETE`. The UI configures one
workflow per pair, so the submitted settings include the full array of
workflows, including disabled/unconfigured ones.

An approval level is sequential: the next level becomes actionable only after
the current level is complete. `condition: "ANY"` means any selected approver
may approve that level; `"ALL"` means all assigned approvers must approve.
`approvers` contains stable role/user identifiers, not display labels. The UI
currently uses demo IDs (`admin`, `hr`, `manager`, `finance_head`,
`hr_director`); production should populate these from an API-backed approver
directory and return supported IDs to the frontend.

## 1. Read tenant settings

`GET /approval-workflows/settings` — administrator only.

Return an object directly:

```json
{
  "enabled": true,
  "workflows": [
    {
      "id": "employees:DELETE",
      "workflowName": "Employee Delete Approval",
      "module": "employees",
      "action": "DELETE",
      "priorityWeight": 1,
      "approvalRequired": true,
      "status": true,
      "levels": [
        {
          "id": "level-1",
          "levelTitle": "Level 1 Approval",
          "condition": "ANY",
          "approvers": ["admin"]
        },
        {
          "id": "level-2",
          "levelTitle": "Level 2 Approval",
          "condition": "ALL",
          "approvers": ["hr_director"]
        }
      ]
    },
    {
      "id": "payroll:UPDATE",
      "workflowName": "Payroll Update Approval",
      "module": "payroll",
      "action": "UPDATE",
      "priorityWeight": 2,
      "approvalRequired": true,
      "status": true,
      "levels": [
        {
          "id": "level-1",
          "levelTitle": "Level 1 Approval",
          "condition": "ANY",
          "approvers": ["finance_head"]
        }
      ]
    }
  ],
  "updatedAt": "2026-10-06T09:00:00Z"
}
```

Production storage must return all 32 module/action combinations, including
entries with `approvalRequired: false` or `status: false`, because the page
edits and saves the full workflow list. New tenants default to `enabled: false`
and all workflows inactive/not requiring approval.

## 2. Save tenant settings

`PUT /approval-workflows/settings` — administrator only.

Request JSON has the same `enabled` and `workflows` structure as the GET
response. The client omits server-controlled `updatedAt`:

```json
{
  "enabled": true,
  "workflows": [
    {
      "id": "employees:DELETE",
      "workflowName": "Employee Delete Approval",
      "module": "employees",
      "action": "DELETE",
      "priorityWeight": 1,
      "approvalRequired": true,
      "status": true,
      "levels": [
        {
          "id": "level-1",
          "levelTitle": "Level 1 Approval",
          "condition": "ANY",
          "approvers": ["admin"]
        }
      ]
    },
    {
      "id": "payroll:UPDATE",
      "workflowName": "Payroll Update Approval",
      "module": "payroll",
      "action": "UPDATE",
      "priorityWeight": 2,
      "approvalRequired": true,
      "status": true,
      "levels": [
        {
          "id": "level-1",
          "levelTitle": "Finance approval",
          "condition": "ALL",
          "approvers": ["finance_head"]
        }
      ]
    }
  ]
}
```

The production request must include all configured module/action workflows,
not only the two shown in the abbreviated example. Validate unique IDs,
module/action consistency, positive integer priority, non-empty names, valid
approver IDs, at least one level and at least one approver per level whenever
`status` and `approvalRequired` are both true. Return the saved full object in
the GET response shape, with server-generated `updatedAt`.

Approval is required only when the global setting `enabled` is true and the
matching workflow has both `status: true` and `approvalRequired: true`. When
the global switch is disabled, retain all configured workflows but do not gate
new mutations. Disabling the global switch must not auto-approve or discard
existing requests.

## 3. List approvals

`GET /approval-workflows/requests?status=PENDING` — administrator/authorized
approver only. The current UI requests pending items and expects a JSON array
(empty array if there are none):

```json
[
  {
    "id": "APR-2026-0001",
    "module": "employees",
    "action": "DELETE",
    "summary": "Delete employee E-1024 — Priya Sharma",
    "entityType": "Employee",
    "entityId": "E-1024",
    "status": "PENDING",
    "requestedBy": {
      "id": "USR-HR-001",
      "name": "Anita HR"
    },
    "requestedAt": "2026-10-06T08:30:00Z"
  }
]
```

Support `PENDING`, `APPROVED`, and `REJECTED` filters. Do not return the saved
operation payload in this list response. Keep the operation immutable on the
server and add a protected details endpoint if reviewers need a change preview.

## 4. Decide a pending approval

`POST /approval-workflows/requests/{requestId}/decision` — administrator or
authorized approver only.

Request JSON:

```json
{
  "decision": "APPROVE",
  "comments": "Employee exit confirmed by HR."
}
```

`decision` is `APPROVE` or `REJECT`; comments are optional. Never accept a
replacement mutation payload here. On final approval, atomically apply the
stored operation once and mark it approved. If a level is `ALL`, wait for every
approver in that level. A rejected level rejects the request. A request must
be pending and assigned to/approvable by the current principal.

Response JSON:

```json
{
  "request": {
    "id": "APR-2026-0001",
    "module": "employees",
    "action": "DELETE",
    "summary": "Delete employee E-1024 — Priya Sharma",
    "entityType": "Employee",
    "entityId": "E-1024",
    "status": "APPROVED",
    "requestedBy": {
      "id": "USR-HR-001",
      "name": "Anita HR"
    },
    "requestedAt": "2026-10-06T08:30:00Z"
  },
  "changeApplied": true,
  "message": "Request approved and the change was applied."
}
```

Return the updated request with `status: "REJECTED"` and
`changeApplied: false` after rejection. Return `409 Conflict` for an already
decided request. If applying a change fails, do not claim success or mark the
request approved; preserve an explicit recoverable failure state and provide a
clear error response.

## 5. Enforce approval on every business mutation

The workflow configuration API alone does not protect data. Enforce the
workflow inside every existing business API mutation (including nested records,
bulk endpoints, uploads, deletes, and status transitions) after authorization
checks. The HRMS frontend makes hundreds of separate module API calls, so do
not rely on a UI-only check or one specially routed delete button.

Example: when HR calls `DELETE /employees/E-1024` and the active
`employees:DELETE` workflow requires approval, do not delete the record.
Persist the original operation and return HTTP `202 Accepted`:

```json
{
  "approvalRequired": true,
  "request": {
    "id": "APR-2026-0003",
    "module": "employees",
    "action": "DELETE",
    "summary": "Delete employee E-1024 — Priya Sharma",
    "entityType": "Employee",
    "entityId": "E-1024",
    "status": "PENDING",
    "requestedBy": {
      "id": "USR-HR-001",
      "name": "Anita HR"
    },
    "requestedAt": "2026-10-06T10:00:00Z"
  },
  "message": "Approval is required before this change can be applied."
}
```

When approval is not required, preserve the endpoint's existing success status
and response. Use the same `202` response convention for gated create, update,
and status-change calls. Ensure every client gets the same server-side result;
approval must never be bypassed by calling a different endpoint.

Suggested standard errors:

```json
{
  "status": 403,
  "message": "The current user is not an approver for this request."
}
```

```json
{
  "status": 409,
  "message": "This approval request has already been decided."
}
```

## Demo mode

The frontend seeds 32 module/action workflow forms and two pending example
requests. Mock mode is enabled unless `VITE_USE_MOCK_APPROVAL_WORKFLOW=false` is
set. Mock settings and decisions are held in browser memory only and are not
persisted by the API. Disable mock mode after the backend endpoints above are
deployed.
