export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh-token",
    FORGOT_PASSWORD: "/auth/forgot-password",
    PROFILE: "/auth/profile", // Supports both GET and PUT
    VERIFY_OTP: "/auth/verify-otp",
    MFA_VERIFY: "/auth/mfa/verify",
    MFA_SETUP: "/auth/mfa/setup",
    MFA_RESENDOTP: "/auth/mfa/resend-otp",
    MFA_ENABLE: "/auth/mfa/enable",
    CHANGE_PASSWORD: "/auth/change-password",
    SELECT_TENANT: "/auth/login/select-tenant",
    SET_PASSWORD: "/auth/set-password",
    PERMISSIONS: "/auth/permissions",
    PHOTO: "/auth/profile/picture",
    VERIFY_INVITE: (token: string) => `/auth/verify-invite/${token}`,
    SIGNUP: "/auth/signup",
    ACTIVATE_INVITE: "/auth/activate-invite",
    RESEND_OTP: "/auth/resend-signup-otp",
    GET_SESSION_CONTEXT: "/auth/session-context/options",
    SELECT_SESSION_CONTEXT: "/auth/session-context/select",
  },

  LOGIN_HISTORY: {
    DELETE: "/login-history",
    CLEAR_OLDER: (days: string) => `/login-history/older-than/${days}`,
    BASE: "/login-history",
    GET_BY_USERID: (id: string) => `/login-history/user/${id}`,
    GET_BY_TENANTID: "/login-history/tenant",
  },

  PASSWORD_POLICY: {
    BASE: "/password-policy",
  },

  BRANCH: {
    BASE: "/org/branches",
    GET_BY_ID: (id: string) => `/org/branches/${id}`,
    CREATE: "/org/branches",
    GET_ACTIVE: "/org/branches/active",
    UPDATE: (id: string) => `/org/branches/${id}`,
    DELETE: (id: string) => `/org/branches/${id}`,
    PATCH: (id: string) => `/org/branches/${id}/toggle-active`,
    GET_USAGE: (id: string) => `/org/branches/${id}/usage`,
    GET_DROPDOWN: "/org/branches/dropdown",
    DEFAULT_CREATE: "/org/branches/ensure-default",
  },

  DEPARTMENT: {
    DELETE: (id: string) => `/org/departments/${id}`,
    GET_BY_ID: (id: string) => `/org/departments/${id}`,
    BASE: "/org/departments",
    DROPDOWN: "/org/departments/dropdown",
    GET_USAGE: (id: string) => `/org/departments/${id}/usage`,
    GET_BY_BRANCHID: (bid: string) => `/org/departments/by-branch/${bid}`,
    GET_ACTIVE: "/org/departments/active",
    PATCH: (id: string) => `/org/departments/${id}/toggle-active`,
    CREATE: "/org/departments",
    UPDATE: (id: string) => `/org/departments/${id}`,
  },

  CATEGORY: {
    DELETECAT: (id: string) => `/org/category/${id}`,
    DELETECATITEM: (id: string, cid: string) =>
      `/org/category/${cid}/items/${id}`,
    GET_BY_CATID: (id: string) => `/org/category/${id}`,
    GET_BY_CATITEMID: (id: string, cid: string) =>
      `/org/category/${cid}/items/${id}`,
    BASECAT: "/org/category",
    BASECATITEM: (cid: string) => `/org/category/${cid}/items`,
    PATCHCAT: (cid: string) => `/org/category/${cid}/toggle-enabled`,
    PATCHCATITEM: (id: string, cid: string) =>
      `/org/category/${cid}/items/${id}/toggle-active`,
    CREATECAT: "/org/category",
    CREATECATITEM: (cid: string) => `/org/category/${cid}/items`,
    UPDATECAT: (id: string) => `/org/category/${id}`,
    UPDATECATITEM: (id: string, cid: string) =>
      `/org/category/${cid}/items/${id}`,

    GET_CAT_USAGE: (id: string) => `/org/category/${id}/usage`,
    GET_ITEM_USAGE: (id: string, cid: string) =>
      `/org/category/${cid}/items/${id}/usage`,

    GET_ACTIVE_CAT: "/org/category/active-items",
  },

  COMPANY: {
    DELETE: (id: string) => `/org/company/${id}`,
    DELETE_LOGO: (id: string) => `/org/company/${id}/logo`,
    DELETE_SIGNATURE: (id: string) => `/org/company/${id}/signature`,
    GET_BY_ID: (id: string) => `/org/company/${id}`,
    BASE: "/org/company",
    CREATE: "/org/company",
    UPDATE: (id: string) => `/org/company/${id}`,
    UPLOAD_LOGO: (id: string) => `/org/company/${id}/logo`,
    UPLOAD_SIGNATURE: (id: string) => `/org/company/${id}/signature`,
    GET_COMPANY_BY_GST: "/org/company/by-gst",
    GET_GST_BY_COMPANY: "/org/company/gst",
    GST_LOOKUP: "/org/company/gst-lookup",
  },

  EMPLOYEE: {
    DELETE: (id: string) => `/employees/${id}`,
    REACTIVATE: (id: string) => `/employees/${id}/reactivate`,
    DELETE_TRAINING: (id: string, tid: string) =>
      `/employees/${id}/training-details/${tid}`,
    DELETE_QUALIFICATION: (id: string, qid: string) =>
      `/employees/${id}/qualifications/${qid}`,
    DELETE_PRE_EMP: (id: string, pid: string) =>
      `/employees/${id}/previous-employments/${pid}`,
    DELETE_PF: (id: string, pid: string) =>
      `/employees/${id}/pf-accounts/${pid}`,
    DELETE_NOMINATION: (id: string, nid: string) =>
      `/employees/${id}/nominations/${nid}`,
    DELETE_FAMILY: (id: string, fid: string) =>
      `/employees/${id}/family-members/${fid}`,
    DELETE_EMERGENCY: (id: string, eid: string) =>
      `/employees/${id}/emergency-contacts/${eid}`,
    DELETE_ADDRESS: (id: string, aid: string) =>
      `/employees/${id}/addresses/${aid}`,
    DELETE_ATTACHMENT: (id: string, aid: string) =>
      `/employees/${id}/attachments/${aid}`,

    GET_BY_ID: (id: string) => `/employees/${id}`,
    BASE: "/employees",
    GET_TRAINING: (id: string) => `/employees/${id}/training-details`,
    GET_QUALIFICATION: (id: string) => `/employees/${id}/qualifications`,
    GET_PRE_EMP: (id: string) => `/employees/${id}/previous-employments`,
    GET_PF: (id: string) => `/employees/${id}/pf-accounts`,
    GET_NOMINATION: (id: string) => `/employees/${id}/nominations`,
    GET_FAMILY: (id: string) => `/employees/${id}/family-members`,
    GET_EMERGENCY: (id: string) => `/employees/${id}/emergency-contacts`,
    GET_ADDRESS: (id: string) => `/employees/${id}/addresses`,
    GET_ATTACHMENT: (id: string) => `/employees/${id}/attachments`,
    GET_DEACTIVATED: "/employees/deactivated",

    LEAVE_BALANCES: (id: string) => `/employees/${id}/leave-balances`,
    LEAVE_LEDGER: (id: string) => `/employees/${id}/leave-ledger`,
    LEAVES: (id: string) => `/employees/${id}/leaves`,
    COMP_OFF_BALANCE: (id: string) => `/employees/${id}/comp-off-balances`,
    LEAVE_ADJUSTMENTS: (id: string) => `/employees/${id}/leave-adjustments`,
    LEAVE_AUDIT: (id: string) => `/employees/${id}/leave-audit`,

    PATCH_PF: (id: string) => `/employees/${id}/pf`,
    PATCH_PERSONAL: (id: string) => `/employees/${id}/personal`,
    PATCH_IDENTITY: (id: string) => `/employees/${id}/identity`,
    PATCH_BANK: (id: string) => `/employees/${id}/bank`,
    PATCH_BG: (id: string) => `/employees/${id}/background`,
    PATCH_ADMIN: (id: string) => `/employees/${id}/admin`,

    CREATE: "/employees",
    POST_TRAINING: (id: string) => `/employees/${id}/training-details`,
    POST_QUALIFICATION: (id: string) => `/employees/${id}/qualifications`,
    POST_PRE_EMP: (id: string) => `/employees/${id}/previous-employments`,
    UPLOAD_PHOTO: (id: string) => `/employees/${id}/photo`,
    POST_PF: (id: string) => `/employees/${id}/pf-accounts`,
    POST_NOMINATION: (id: string) => `/employees/${id}/nominations`,
    POST_FAMILY: (id: string) => `/employees/${id}/family-members`,
    POST_EMERGENCY: (id: string) => `/employees/${id}/emergency-contacts`,
    POST_ADDRESS: (id: string) => `/employees/${id}/addresses`,
    POST_ATTACHMENT: (id: string) => `/employees/${id}/attachments`,
    BULK_UPLOAD: "/employees/bulk-upload",
    BULK_UPLOAD_TEMPLATE: "/employees/bulk-upload/template",

    UPDATE: (id: string) => `/employees/${id}`,
    UPDATE_TRAINING: (id: string, tid: string) =>
      `/employees/${id}/training-details/${tid}`,
    UPDATE_QUALIFICATION: (id: string, qid: string) =>
      `/employees/${id}/qualifications/${qid}`,
    UPDATE_PRE_EMP: (id: string, pid: string) =>
      `/employees/${id}/previous-employments/${pid}`,
    UPDATE_PF: (id: string, pid: string) =>
      `/employees/${id}/pf-accounts/${pid}`,
    UPDATE_NOMINATION: (id: string, nid: string) =>
      `/employees/${id}/nominations/${nid}`,
    UPDATE_FAMILY: (id: string, fid: string) =>
      `/employees/${id}/family-members/${fid}`,
    UPDATE_EMERGENCY: (id: string, eid: string) =>
      `/employees/${id}/emergency-contacts/${eid}`,
    UPDATE_ADDRESS: (id: string, aid: string) =>
      `/employees/${id}/addresses/${aid}`,

    POST_AADHAAR: "/aadhaar/lookup",
    POST_AADHAR_DOC: "/aadhaar/extract",

    EXPORT: "/employees/export",
    EXPORT_BY_ID: (id: string) => `/employees/${id}/export`,
  },

  MASTER: {
    GET_CITY: "/master/cities",
    GET_COUNTRY: "/master/countries",
    GET_ACTIVE_COUNTRIES: "/master/countries/active",
    GET_STATES: "/master/states",
    GET_CURRENCIES: "/master/currencies",
    GET_ACTIVE_CURRENCIES: "/master/currencies/active",
    GET_STATES_BY_COUNTRY: (cid: any) => `/master/states/by-country/${cid}`,
    GET_CITIES_BY_COUNTRY: (cid: any) => `/master/cities/by-country/${cid}`,
    GET_CITIES_BY_STATE: (sid: any) => `/master/cities/by-state/${sid}`,
  },

  LEAVE: {
    BASE: "/leaves",
    // MY_APPROVALS: "/leaves/approvals/my",
    PATCH_DRAFT: (id: string) => `/leaves/${id}`,
    GET_BY_ID: (id: string) => `/leaves/${id}`,
    CALCULATE: "/leaves/calculate",
    APPROVE: (id: string) => `/leaves/${id}/actions/approve`,
    REJECT: (id: string) => `/leaves/${id}/actions/reject`,
    REQUEST_CLARIFICATION: (id: string) =>
      `/leaves/${id}/actions/request-clarification`,
    REVOKE: (id: string) => `/leaves/${id}/actions/revoke`,
    FORCE_APPROVE: (id: string) => `/leaves/${id}/actions/force-approve`,
    CONVERT_TO_LOP: (id: string) => `/leaves/${id}/actions/convert-to-lop`,
    WITHDRAW: (id: string) => `/leaves/${id}/withdraw`,
    // CANCEL_REQUEST: (id: string) => `/leaves/${id}/actions/revoke`,
    CANCEL_REQUEST: (id: string) => `/leaves/${id}/cancel-request`,
    OVERRIDE: (id: string) => `/leaves/${id}/override`,
    UPCOMING_LEAVES: "/leave/upcoming-leaves",
    PENDING_APPROVALS: "/leave/pending-approvals",
    DELETE: (id: string) => `/leaves/${id}`,

    SUBMIT: (id: string) => `/leaves/${id}/submit`,

    TEAM_CALENDAR: "/leaves/team-calendar",
    HR_VERIFY: (id: string) => `/leaves/${id}/hr-verify`,
    SENDTO_HR_VERIFY: (id: string) => `/leaves/${id}/send-to-hr-verification`,
    GET_MY: "/leaves/my",
    GET_APPROVALS: "/leaves/approvals",
    GET_APPROVALS_BYID: (id: string) => `/leaves/approvals/${id}`,

    GET_AUDIT: (id: string) => `/leaves/${id}/audit`,

    PAYROLL: {
      LEAVE_INPUTS: "/payroll/leave-inputs",
      LEAVE_SUMMARY: "/payroll/leave-summary",
      GET_LEAVE_ENCASHMENT: "/payroll/leave-encashments",
      LOCK: "/payroll/leave-inputs/lock",
      UNLOCK: "/payroll/leave-inputs/unlock",
      GENERATE: "/payroll/leave-inputs/generate",
      POST_LV_ENCASHMENT: "/payroll/leave-encashments",
      PREVIEW: "/payroll/leave-encashments/preview",
      FS_LV_PROCESS: (empId: string) =>
        `/payroll/final-settlements/${empId}/leave-process`,
      FS_LV_PREVIEW: (empId: string) =>
        `/payroll/final-settlements/${empId}/leave-preview`,
    },

    ATTACHMENTS: {
      DELETE: (id: string, attId: string) =>
        `/leaves/${id}/attachments/${attId}`,
      GET_BY_ID: (id: string) => `/leaves/${id}/attachments`,
      UPLOAD: (id: string) => `/leaves/${id}/attachments`,
    },

    REPORTS: {
      LEAVE_USAGE: "/reports/leave-usage",
      LEAVE_PENDING_APPROVALS: "/reports/leave-pending-approvals",
      LEAVE_LOP: "/reports/leave-lop",
      LEAVE_COMP_OFF: "/reports/leave-comp-offs",
      LEAVE_BALANCE: "/reports/leave-balances",
      GET_EXPORTS: (id: string) => `/reports/exports/${id}`,
      DOWNLOAD_EXPORT: (id: string) => `/reports/exports/${id}/download`,
      POST_EXPORT: "/reports/exports",
    },
  },

  LEAVE_TYPE: {
    BASE: "/leave-types",
    BY_ID: (id: string) => `/leave-types/${id}`,
    GET_BY_ID: (id: string) => `/leave-types/${id}`,
    UPDATE: (id: string) => `/leave-types/${id}`,
    DELETE: (id: string) => `/leave-types/${id}`,
  },

  LEAVE_POLICY: {
    BASE: "/leave-policies",
    BY_ID: (id: string) => `/leave-policies/${id}`,
    GET_BY_ID: (id: string) => `/leave-policies/${id}`,
    UPDATE: (id: string) => `/leave-policies/${id}`,
    DELETE: (id: string) => `/leave-policies/${id}`,
  },

  LEAVE_POLICY_RULE: {
    BASE: "/leave-policy-rules",
    BY_ID: (id: string) => `/leave-policy-rules/${id}`,
    UPDATE: (id: string) => `/leave-policy-rules/${id}`,
    DELETE: (id: string) => `/leave-policy-rules/${id}`,
  },

  HOLIDAY_CALENDAR: {
    BASE: "/holiday-calendars",
    BY_ID: (id: string) => `/holiday-calendars/${id}`,
    GET_BY_ID: (id: string) => `/holiday-calendars/${id}`,
    UPDATE: (id: string) => `/holiday-calendars/${id}`,
    DELETE: (id: string) => `/holiday-calendars/${id}`,
  },

  HOLIDAY: {
    BASE: "/holidays",
    BY_ID: (id: string) => `/holidays/${id}`,
    UPDATE: (id: string) => `/holidays/${id}`,
    DELETE: (id: string) => `/holidays/${id}`,
    UPCOMING_HOLIDAYS: "/holidays/upcoming",
    OPT_HOLIDAYS_BY_EMP: (id: string) => `/employees/${id}/optional-holidays`,
    OPTIONAL: "/holidays/optional",
  },

  HOLIDAY_IMPORT: {
    BASE: "/holiday-imports",
  },

  WORK_CALENDAR: {
    BASE: "/work-calendars",
    BY_ID: (id: string) => `/work-calendars/${id}`,
    GET_BY_ID: (id: string) => `/work-calendars/${id}`,
    UPDATE: (id: string) => `/work-calendars/${id}`,
    DELETE: (id: string) => `/work-calendars/${id}`,
  },

  COMP_OFF: {
    BASE: "/comp-offs",
    GET_BY_ID: (id: string) => `/comp-offs/${id}`,
    GET_MY: "/comp-offs/my",
    GET_APPROVALS: "/comp-offs/approvals",
    CRE_REQ_REJECT: (id: string) => `/comp-offs/credit-requests/${id}/reject`,
    REJECT: (id: string) => `/comp-offs/${id}/actions/reject`,
    CRE_REQ_APPROVE: (id: string) => `/comp-offs/credit-requests/${id}/approve`,
    APPROVE: (id: string) => `/comp-offs/${id}/actions/approve`,
    POST_CREDIT_REQ: "/comp-offs/credit-requests",
  },

  LEAVE_ACCRUAL: {
    RUN: "/leave-accruals/run",
  },

  EMP_OPERATIONAL_LIST: {
    ANNIVERSARIES: "/employees/work-anniversaries",
    BIRTHDAYS: "/employees/upcoming-birthdays",
    RESIGNATIONS: "/employees/recent-resignations",
    JOINERS: "/employees/recent-joiners",
  },

  ONBOARDING: {
    // ============ Checklist Management ============
    BASE: "/onboarding/checklist",
    CREATE: "/onboarding/checklist",
    UPDATE: (id: string) => `/onboarding/checklist/${id}`,
    DELETE: (id: string) => `/onboarding/checklist/${id}`,
    GET_CHK_TASKS: (id: string) => `/onboarding/checklist/${id}`,
    // DUPLICATE: (id: string) => `/onboarding/checklist/${id}/duplicate`,

    // ============ Task Management ============
    CREATE_TASK: (checklistId: string) =>
      `/onboarding/checklist/${checklistId}/tasks`,
    UPDATE_TASK: (checklistId: string, taskId: string) =>
      `/onboarding/checklist/${checklistId}/tasks/${taskId}`,
    DELETE_TASK: (checklistId: string, taskId: string) =>
      `/onboarding/checklist/${checklistId}/tasks/${taskId}`,
    // BULK_TASKS: (checklistId: string) =>
    //   `/onboarding/checklist/${checklistId}/tasks/bulk`,
    PATCH_REORDER: (checklistId: string) =>
      `/onboarding/checklist/${checklistId}/tasks/reorder`,

    // ============ Task Completion ============
    PATCH_TASK: (taskId: string) => `/onboarding/task/${taskId}/complete`,
    // SKIP_TASK: (taskId: string) => `/onboarding/tasks/${taskId}/skip`,
    // REQUEST_ASSISTANCE: (taskId: string) =>
    //   `/onboarding/tasks/${taskId}/assistance`,
    // GET_TASK: (taskId: string) => `/onboarding/tasks/${taskId}`,
    // START_TASK: (taskId: string) => `/onboarding/tasks/${taskId}/start`,

    // ============ Assignment Management ============
    ASSIGN: "/onboarding/assign",
    BULK_ASSIGN: "/onboarding/assign-bulk",
    ASSIGNMENTS: "/onboarding/assignments",
    // GET_ASSIGNMENT: (id: string) => `/onboarding/assignments/${id}`,
    // UPDATE_ASSIGNMENT: (id: string) => `/onboarding/assignments/${id}`,
    // DELETE_EMP: (id: string) => `/onboarding/assignments/${id}`,
    REACTIVATE_EMP: (id: string) => `/onboarding/${id}/reactivate`,
    DEACTIVATE: (id: string) => `/onboarding/${id}`,
    // EXTEND_DEADLINE: (id: string) =>
    //   `/onboarding/assignments/${id}/extend-deadline`,

    // ============ Progress Tracking ============
    GET_PROGRESS: (employeeId: string) => `/onboarding/progress/${employeeId}`,
    // GET_DETAIL: (onboardingId: string) => `/onboarding/${onboardingId}`,
    GET_BY_ID: (onboardingId: string, checklistId: string) =>
      `/onboarding/${onboardingId}/checklists/${checklistId}/tasks`,
    // PROGRESS_SUMMARY: "/onboarding/progress/summary",
    // CHECKLIST_PROGRESS: (checklistId: string) =>
    //   `/onboarding/checklists/${checklistId}/progress`,

    // ============ Document Management ============
    CREATE_DOC: "/onboarding/documents",
    GET_DOCUMENTS: (onboardingId: string) =>
      `/onboarding/${onboardingId}/documents`,
    // GET_DOCUMENT: (documentId: string) => `/onboarding/documents/${documentId}`,
    DELETE_DOC: (taskInstanceId: string) =>
      `/onboarding/documents/${taskInstanceId}`,
    // UPDATE_DOC: (documentId: string) => `/onboarding/documents/${documentId}`,
    // DOWNLOAD_DOC: (documentId: string) =>
    //   `/onboarding/documents/${documentId}/download`,
    // BULK_UPLOAD_DOCS: "/onboarding/documents/bulk",

    // ============ Notifications ============
    SEND_WELCOME: "/onboarding/send-welcome",
    // SEND_REMINDER: "/onboarding/send-reminder",
    // BULK_REMINDER: "/onboarding/send-reminder/bulk",
    // COMPLETION_NOTIFICATION: "/onboarding/notifications/completion",
    // NOTIFICATION_SETTINGS: "/onboarding/notifications/settings",

    // ============ Completion & Review ============
    // COMPLETE: (onboardingId: string) => `/onboarding/${onboardingId}/complete`,
    // CERTIFICATE: (onboardingId: string) =>
    //   `/onboarding/${onboardingId}/certificate`,
    // DOWNLOAD_CERTIFICATE: (onboardingId: string) =>
    //   `/onboarding/${onboardingId}/certificate/download`,
    // REVIEW: (onboardingId: string) => `/onboarding/${onboardingId}/review`,
    // ASSIGN_REVIEWER: "/onboarding/review/assign",
    // WORKFLOW_STATUS: (onboardingId: string) =>
    //   `/onboarding/${onboardingId}/workflow`,
    // APPROVE_STEP: (onboardingId: string, stepId: string) =>
    //   `/onboarding/${onboardingId}/workflow/${stepId}/approve`,
    // REJECT_STEP: (onboardingId: string, stepId: string) =>
    //   `/onboarding/${onboardingId}/workflow/${stepId}/reject`,

    // ============ Analytics & Reports ============
    // STATS: "/onboarding/stats",
    // REPORT: "/onboarding/reports",
    // EXPORT_REPORT: "/onboarding/reports/export",
    // EMPLOYEE_HISTORY: (employeeId: string) =>
    //   `/onboarding/employees/${employeeId}/history`,
    // CHECKLIST_ANALYTICS: (checklistId: string) =>
    //   `/onboarding/checklists/${checklistId}/analytics`,

    // ============ Templates ============
    // SAVE_TEMPLATE: "/onboarding/templates",
    // TEMPLATES: "/onboarding/templates",
    // APPLY_TEMPLATE: "/onboarding/templates/apply",
    // DELETE_TEMPLATE: (templateId: string) =>
    //   `/onboarding/templates/${templateId}`,

    // ============ Employee Self-Service ============
    // MY_ONBOARDING: "/onboarding/my-onboarding",
    // MY_TASKS: "/onboarding/my-tasks",
    // MY_DOCUMENTS: "/onboarding/my-documents",

    // ============ Integration ============
    // SYNC_HRIS: "/onboarding/integration/hris/sync",
    // GENERATE_LETTER: (employeeId: string) =>
    //   `/onboarding/employees/${employeeId}/letter`,
  },

  // ONBOARDING: {
  //   DELETE: (id: string) => `/onboarding/checklist/${id}`,
  //   DELETE_TASK: (id: string, tid: string) =>
  //     `/onboarding/checklist/${id}/tasks/${tid}`,
  //   DELETE_EMP: (id: string) => `/onboarding/${id}`,
  //   REACTIVATE_EMP: (id: string) => `/onboarding/${id}/reactivate`,
  //   DELETE_DOC: (taskInstanceId: string) =>
  //     `/onboarding/documents/${taskInstanceId}`,

  //   GET_CHK_TASKS: (id: string) => `/onboarding/checklist/${id}`,
  //   BASE: "/onboarding/checklist",
  //   GET_BY_ID: (id: string, cid: string) =>
  //     `/onboarding/${id}/checklist/${cid}/tasks`,
  //   GET_PROGRESS: (employeeId: string) => `/onboarding/progress/${employeeId}`,
  //   GET_DOCUMENTS: (onboardingId: string) =>
  //     `/onboarding/${onboardingId}/documents`,
  //   ASSIGNMENTS: "/onboarding/assignments",

  //   PATCH_TASK: (id: string) => `/onboarding/task/${id}/complete`,
  //   PATCH_REORDER: (id: string) => `/onboarding/checklist/${id}/tasks/reorder`,

  //   SEND_WELCOME: "/onboarding/send-welcome",
  //   CREATE_DOC: "/onboarding/documents",
  //   CREATE: "/onboarding/checklist",
  //   CREATE_TASK: (id: string) => `/onboarding/checklist/${id}/tasks`,
  //   ASSIGN: "/onboarding/assign",

  //   UPDATE: (id: string) => `/onboarding/checklist/${id}`,
  //   UPDATE_TASK: (id: string, tid: string) =>
  //     `/onboarding/checklist/${id}/tasks/${tid}`,
  // },

  PASSWORD_CONFIG: {
    BASE: "/password-policy",
  },

  SHIFTS: {
    DELETE: (id: string) => `/shifts/${id}`,
    GET_BY_ID: (id: string) => `/shifts/${id}`,
    BASE: "/shifts",
    VALIDATE_SHIFT: "/shifts/validate-code",
    GET_SHIFT_TYPES: "/shifts/types",
    GET_STATS: "/shifts/stats",
    GET_DROPDOWN: "/shifts/dropdown",
    GET_ACTIVE: "/shifts/active",
    CREATE: "/shifts",
    UPDATE: (id: string) => `/shifts/${id}`,
    UPDATE_ACTIVE: (id: string) => `/shifts/${id}/status`,
    SET_DEFAULT: (id: string) => `/shifts/${id}/default`,
    DEFAULT: "/shifts/default",

    GET_SWAP_REQUEST: "/shift-swap-requests",
    GET_SWAP_REQUEST_BYID: (id: string) => `/shift-swap-requests/${id}`,
    CREATE_SWAP_REQUEST: "/shift-swap-requests",
    UPDATE_SWAP_REQUEST: (id: string) => `/shift-swap-requests/${id}/status`,

    DELETE_ROTATION: (id: string) => `/shift-rotations/${id}`,
    GET_ROTATION_BY_ID: (id: string) => `/shift-rotations/${id}`,
    BASE_ROTATION: "/shift-rotations",
    CREATE_ROTATION: "/shift-rotations",
    UPDATE_APPLY: (id: string) => `/shift-rotations/${id}/apply`,
    UPDATE_ROTATION: (id: string) => `/shift-rotations/${id}`,

    GET_ROSTER: "/shift-roster",
    GET_PUBLISH_STATUS: "/shift-roster/publish-status",
    EXPORT_PDF: "/shift-roster/export/pdf",
    EXPORT_EXCEL: "/shift-roster/export/excel",
    GET_ALERTS: "/shift-roster/alerts",

    UNPUBLISH: "/shift-roster/unpublish",
    PUBLISH: "/shift-roster/publish",

    COPY_PREV_WEEK: "/shift-roster/copy-previous-week",
    BULK_ASSIGN: "/shift-roster/bulk-assign",
    UPDATE_EMP_ROSTER: (eid: string) => `/shift-roster/${eid}`,

    GET_SCHEDULE: "/shift-schedule",
    GET_UPCOMING: "/shift-schedule/upcoming",
    GET_SCHEDULE_STATS: "/shift-schedule/stats",

    GET_NOTIFICATION_TEMP: "/shift-schedule/notification-templates",
    GET_NOTIFICATION_STATUS: "/shift-schedule/notification-status",
    GET_NOTIFICATION: "/shift-schedule/notifications",

    EXPORT_SCHEDULE_PDF: "/shift-schedule/export/pdf",
    EXPORT_SCHEDULE_Excel: "/shift-schedule/export/excel",
    GET_COUNT: "/shift-schedule/distribution",
    SEND_NOTIFY: "/shift-schedule/send-notifications",

    GET_ADV_CONFIG: (sid: string) => `/shifts/${sid}/advanced-config`,
    POST_ADV_CONFIG: (sid: string) => `/shifts/${sid}/advanced-config`,
    PUT_ADV_CONFIG: (sid: string) => `/shifts/${sid}/advanced-config`,
  },

  LOAN_ADVANCE: {
    GET_TYPES: "/loan-advances/types",
    CREATE: "/loan-advances/requests",
    GET_MY: "/loan-advances/requests/my",
    GET_BY_ID: (id: string) => `/loan-advances/requests/${id}`,
    APPROVE: (id: string) => `/loan-advances/requests/${id}/approve`,
    REJECT: (id: string) => `/loan-advances/requests/${id}/reject`,
  },

  POLICY: {
    DELETE: (id: string) => `/policies/${id}`,
    GET_BY_ID: (id: string) => `/policies/${id}`,
    BASE: "/policies",
    GET_VERSIONS: (id: string) => `/policies/${id}/versions`,
    GET_EMPLOYEES: (id: string) => `/policies/${id}/employees`,
    GET_AUDIT: (id: string) => `/policies/${id}/audit`,
    COMPANY_POLICY: (id: string) => `/policies/company/${id}`,
    GET_BY_DOMAIN: (domain: string) => `/policies/by-domain/${domain}`,
    CREATE: "/policies",
    CREATE_VERSION: (id: string) => `/policies/${id}/versions`,
    UPDATE_VALIDATE_CONFIG: (id: string) => `/policies/${id}/validate-config`,
    UPDATE: (id: string) => `/policies/${id}`,
    CREATE_VALIDATE_CONFIG: (did: string) =>
      `/policy-domains/${did}/validate-config`,

    TEMPLATES: {
      DELETE: (id: string) => `/policy-templates/${id}`,
      REMOVE_RULE: (id: string, rid: string) =>
        `/policy-templates/${id}/rule-blocks/${rid}`,
      GET_BY_ID: (id: string) => `/policy-templates/${id}`,
      BASE: "/policy-templates",
      GET_RULES_BY_ID: (id: string) => `/policy-templates/${id}/rule-blocks`,
      CREATE: "/policy-templates",
      ADD_RULE: (id: string) => `/policy-templates/${id}/rule-blocks`,
      COPY: (id: string) => `/policy-templates/${id}/copy`,
      UPDATE: (id: string) => `/policy-templates/${id}`,
      UPDATE_RULE: (id: string, rid: string) =>
        `/policy-templates/${id}/rule-blocks/${rid}`,
    },

    VERSION: {
      GET_BY_ID: (id: string) => `/policy-versions/${id}`,
      COMPARE: (v1: string, v2: string) =>
        `/policy-versions/${v1}/compare/${v2}`,
      GET_AUDIT: (id: string) => `/policy-versions/${id}/audit`,
      SUBMIT: (id: string) => `/policy-versions/${id}/submit`,
      REJECT: (id: string) => `/policy-versions/${id}/reject`,
      EXPIRE: (id: string) => `/policy-versions/${id}/expire`,
      ARCHIVE: (id: string) => `/policy-versions/${id}/archive`,
      APPROVE: (id: string) => `/policy-versions/${id}/approve`,
      ACTIVATE: (id: string) => `/policy-versions/${id}/activate`,
      UPDATE: (id: string) => `/policy-versions/${id}`,
    },

    EVALUATION: {
      GET_HISTORY: (id: string) => `/employees/${id}/policy-history`,
      GET_EMP_POLICY: (id: string) => `/employees/${id}/policies`,
      GET_EFFECTIVE_POLICY: (id: string, domain: string) =>
        `/employees/${id}/effective-policy/${domain}`,
      PREVIEW: (id: string) => `/policy-versions/${id}/preview`,
      EVALUATE: "/policies/evaluate",
      BULK_EVALUATE: "/policies/bulk-evaluate",
    },

    RULE_BLOCKS: {
      DELETE: (id: string) => `/rule-blocks/${id}`,
      GET_BY_ID: (id: string) => `/rule-blocks/${id}`,
      BASE: "/rule-blocks",
      SCHEMA: (id: string) => `/rule-blocks/${id}/schema`,
      BY_DOMAIN: (code: string) => `/rule-blocks/domain/${code}`,
      CREATE: "/rule-blocks",
      UPDATE: (id: string) => `/rule-blocks/${id}`,
    },

    DOMAIN_CONFIG: {
      LEAVE_ENTITLEMENTS: {
        DELETE: (id: string) => `/leave-entitlements/${id}`,
        GET: (id: string) => `/policy-versions/${id}/leave-entitlements`,
        POST: (id: string) => `/policy-versions/${id}/leave-entitlements`,
        PUT: (id: string) => `/leave-entitlements/${id}`,
      },
      EXPENSE_LIMITS: {
        DELETE: (id: string) => `/expense-limits/${id}`,
        GET: (id: string) => `/policy-versions/${id}/expense-limits`,
        POST: (id: string) => `/policy-versions/${id}/expense-limits`,
        PUT: (id: string) => `/expense-limits/${id}`,
      },
      OVERTIME_RULES: {
        GET: (id: string) => `/policy-versions/${id}/overtime-rules`,
        PUT: (id: string) => `/policy-versions/${id}/overtime-rules`,
      },
      CARRY_FORWARD: {
        GET: (id: string) => `/policy-versions/${id}/carry-forward`,
        PUT: (id: string) => `/policy-versions/${id}/carry-forward`,
      },
      WFH: {
        GET: (id: string) => `/policy-versions/${id}/wfh-rules`,
        PUT: (id: string) => `/policy-versions/${id}/wfh-rules`,
      },
      SANDWICH: {
        GET: (id: string) => `/policy-versions/${id}/sandwich-rule`,
        PUT: (id: string) => `/policy-versions/${id}/sandwich-rule`,
      },
      PAYROLL: {
        GET: (id: string) => `/policy-versions/${id}/payroll-rules`,
        PUT: (id: string) => `/policy-versions/${id}/payroll-rules`,
      },
      COMPOFF: {
        GET: (id: string) => `/policy-versions/${id}/comp-off-rules`,
        PUT: (id: string) => `/policy-versions/${id}/comp-off-rules`,
      },
      HOLIDAY: {
        GET: (id: string) => `/policy-versions/${id}/holiday-rules`,
        PUT: (id: string) => `/policy-versions/${id}/holiday-rules`,
      },
    },

    ASSIGNMENT: {
      DELETE: (id: string) => `/policy-assignments/${id}`,
      GET_BY_ID: (id: string) => `/policy-assignments/${id}`,
      GET_BY_VERSION: (vid: string) => `/policy-versions/${vid}/assignments`,
      CONFLICTS: (id: string) => `/policy-assignments/${id}/conflicts`,
      EMP_ASSIGNMENTS: (eid: string) => `/employees/${eid}/assignments`,
      CREATE: "/policy-assignments",
      CHECK_CONFLICTS: "/policy-assignments/check-conflicts",
      UPDATE: (id: string) => `/policy-assignments/${id}`,
    },

    NOTIFICATION: {
      GET: "/notifications/policy",
      CREATE: (vid: string) => `/policy-versions/${vid}/notify`,
    },

    SIMULATION: {
      GET: "/policy-simulations",
      GET_BY_ID: (id: string) => `/policy-simulations/${id}`,
      RUN: (vid: string) => `/policy-versions/${vid}/simulate`,
      ANALYSIS: (vid: string) => `/policy-versions/${vid}/impact-analysis`,
    },

    APPROVAL_WORKFLOW: {
      DELETE: (id: string) => `/approval-flow/${id}`,
      DELETE_LEVEL: (id: string) => `/approval-flow-levels/${id}`,
      GET_BY_VERSION: (vid: string) => `/policy-versions/${vid}/approval-flow`,
      CREATE_FLOW: (vid: string) => `/policy-versions/${vid}/approval-flow`,
      CREATE_LEVEL: (id: string) => `/approval-flow/${id}/levels`,
      UPDATE: (id: string) => `/approval-flow/${id}`,
      UPDATE_LEVEL: (id: string) => `/approval-flow-levels/${id}`,
    },

    REPORTS: {
      GET_SUMMARY: "/reports/policy-summary",
      GET_SIMULATION: "/reports/policy-simulations",
      GET_CONFLICTS: "/reports/policy-conflicts",
      GET_AUDIT: "/reports/policy-audit",
      GET_ASSIGNMENTS: "/reports/policy-assignments",
      GET_APPROVALS: "/reports/policy-approvals",
      GET: "/dashboard/policies",
    },
  },

  ALLOWANCE: {
    DELETE: (id: string) => `/allowance-components/${id}`,
    GET_BY_ID: (id: string) => `/allowance-components/${id}`,
    BASE: "/allowance-components",
    TOOGLE_ACTIVE: (id: string) => `/allowance-components/${id}/toggle-active`,
    CREATE: "/allowance-components",
    UPDATE: (id: string) => `/allowance-components/${id}`,
  },

  EXPENSE_CATEGORIES: {
    DELETE: (id: string) => `/expense-categories/${id}`,
    GET_BY_ID: (id: string) => `/expense-categories/${id}`,
    BASE: "/expense-categories",
    TOOGLE_ACTIVE: (id: string) => `/expense-categories/${id}/toggle-active`,
    CREATE: "/expense-categories",
    UPDATE: (id: string) => `/expense-categories/${id}`,
  },

  DEDUCTION: {
    DELETE: (id: string) => `/deduction-components/${id}`,
    GET_BY_ID: (id: string) => `/deduction-components/${id}`,
    BASE: "/deduction-components",
    TOOGLE_ACTIVE: (id: string) => `/deduction-components/${id}/toggle-active`,
    CREATE: "/deduction-components",
    UPDATE: (id: string) => `/deduction-components/${id}`,
  },

  POLICY_DOMAIN: {
    DELETE: (id: string) => `/policy-domains/${id}`,
    GET_BY_ID: (id: string) => `/policy-domains/${id}`,
    BASE: "/policy-domains",
    CREATE: "/policy-domains",
    UPDATE: (id: string) => `/policy-domains/${id}`,
  },

  EXPORTS: {
    GET_EXPORTS: (token: string) => `/exports/${token}`,
  },

  ID_GENERATION: {
    GET_ID: "/employees/id-config",
    POST: "/employees/id-config/preview",
    PUT: "/employees/id-config",
  },

  BANK: {
    DELETE: (id: string) => `/banks/${id}`,
    GET_BY_ID: (id: string) => `/banks/${id}`,
    BASE: "/banks",
    CREATE: "/banks",
    PATCH_STATUS: (id: string) => `/banks/${id}/status`,
    PATCH_PRIMARY: (id: string) => `/banks/${id}/primary`,
    UPDATE: (id: string) => `/banks/${id}`,
    DROPDOWN: "/master/banks/india",
  },

  AUDIT_LOGS: {
    GET_ALL: "/audit-logs",
    GET_BY_RECORD_ID: (recordId: string) => `/audit-logs/${recordId}`,
  },

  ATTENDANCE: {
    GET_TODAY: "/attendance/today",
    GET_REGISTER: "/attendance/register",
    GET_CORRECTIONS: "/attendance/corrections",
    GET_CORRECTIONS_BYID: (id: string) => `/attendance/corrections/${id}`,
    POST_DAILY_STATUS: "/attendance/daily-status",
    POST_CORRECTION_APPROVE: (id: string) =>
      `/attendance/corrections/${id}/approve`,
    POST_CORRECTION_REQ: "/attendance/correction/request",
    POST_CHECKIN: "/attendance/check-in",

    GET_SUMMARY: "/attendance/summary",
    GET_DETAILED: "/attendance/detailed",
    GET_EMPLOYEE_ATTENDANCE: (employeeId: string) =>
      `/attendance/employee/${employeeId}`,
    GET_MUSTER: "/attendance/muster",
    GET_MONTHLY_REGISTER: "/attendance/monthly-register",
    GET_ATTENDANCE_INFO: (employeeId: string) =>
      `/attendance/info/${employeeId}`,
    GET_HOLIDAYS: "/attendance/holidays",
    GET_FINALISED: "/attendance/finalised",

    POST_CHECKOUT: "/attendance/check-out",
    POST_BULK_PROCESS: "/attendance/bulk-process",
    POST_FINALISE: "/attendance/finalise",
    POST_UNLOCK: "/attendance/unlock",
    POST_PROCESS: "/attendance/process",
    VALIDATE: "/attendance/process/validate",
    PROCESS_AND_CLOSE: "/attendance/process-and-close",

    GET_LOCKS: "/attendance/locks",
    POST_LOCK: "/attendance/lock",

    REPORT_MONTHLY_SUMMARY: "/attendance/reports/monthly-summary",
    REPORT_LATE_ARRIVAL: "/attendance/reports/late-arrivals",
    REPORT_OVERTIME: "/attendance/reports/overtime",
    REPORT_LOP: "/attendance/reports/lop",
    REPORT_ABSENTEEISM: "/attendance/reports/absenteeism",
    REPORT_IRREGULAR_PUNCH: "/attendance/reports/irregular-punch",
    REPORT_DEPARTMENT_WISE: "/attendance/reports/department-wise",
    REPORT_EMPLOYEE_HISTORY: "/attendance/reports/employee-history",
    REPORT_LEAVE_UTILIZATION: "/attendance/reports/leave-utilization",
    REPORT_EXPORT: (type: string, format: string) =>
      `/attendance/reports/${type}/export?format=${format}`,

    PAYROLL_CONSOLIDATE: "/integration/payroll/consolidated",

    SHIFT_SCHEDULE: (employeeId: string) =>
      `/attendance/shift/schedule/${employeeId}`,
    REMOTE_CHECKINS: "attendance/remote-checkins",
    OT_CALCULATE: "/attendance/overtime/calculate",
    OT_APPROVAL_REQ: "/attendance/overtime/approval/required",
    LOP_CALCULATE: "/attendance/lop/calculate",
    EXPORT_MONTHLY: "/attendance/export/monthly",
    LEAVE_TODAY: "/attendance/employees/on-leave/today",
    // DASHBOARD: "/attendance/dashboard/summary",
    CALENDAR_HOLIDAYS: "/attendance/calendar/holidays",
    REM_CHK_REJECT: (id: string) => `/attendance/remote-checkins/${id}/reject`,
    REM_CHK_APPROVE: (id: string) =>
      `/attendance/remote-checkins/${id}/approve`,
    SEND_REMINDERS: "/attendance/reminders/send",
    OT_APPROVE: (id: string) => `/attendance/overtime/${id}/approve`,
    IMPORT: "/attendance/import",
    IMPORT_FILE: "/attendance/import/file",
    BULK_CHECKIN: "/attendance/bulk-checkin",
    BULK_CHECKOUT: "/attendance/bulk-checkout",

    DOWNLOAD_TEMP: "/attendance/import/template",
    AUTO_ASSIGN_SHIFT: "/attendance/policy/auto-assign-shift",
    OT_APPROVAL_REQUIRED: "/attendance/policy/ot-approval-required",

    BIOMETRIC: {
      GET_DEVICES: "/integration/biometric/devices",
      GET_DEVICE_BYID: (id: string) => `/integration/biometric/devices/${id}`,
      SYNC: "/integration/biometric/sync/status",
      HEALTH: (id: string) => `/integration/biometric/devices/${id}/health`,
      POST_WEBHOOK: "/integration/biometric/webhook",
      POST_SYNC: "/integration/biometric/sync",
      POST_MAP: "/integration/biometric/map",
      POST_DEVICE: "/integration/biometric/devices",
      UPDATE_DEVICE: (id: string) => `/integration/biometric/devices/${id}`,
    },

    DATA_INTEGRITY: {
      CONFLICTS: "/integration/attendance/conflicts",
      LOG_ERROR: "/integration/logs/error",
      CONSOLIDATE: "/integration/attendance/consolidate",
      CON_RESOLVE: (id: string) =>
        `/integration/attendance/conflicts/${id}/resolve`,
    },
  },

  DASHBOARD: {
    LIST_AVAILABLE_PAGES: () => `/dashboard/pages`,
    RENDER_PAGE: (page: string) => `/dashboard/${page}`,
    GET_PAGE_CONTEXT: (page: string) => `/dashboard/${page}/context`,
    LIST_PAGE_WIDGETS: (page: string) => `/dashboard/${page}/widgets`,
    GET_PAGE_PREFERENCES: (page: string) => `/dashboard/${page}/preferences`,
    SAVE_PAGE_PREFERENCES: (page: string) => `/dashboard/${page}/preferences`,
    RESET_PAGE_PREFERENCES: (page: string) =>
      `/dashboard/${page}/preferences/reset`,
    EXECUTE_WIDGET_DRILLDOWN: (page: string, widgetId: string) =>
      `/dashboard/${page}/widgets/${widgetId}/drilldown`,

    BUILDER: {
      LIST_PAGES: () => `/admin/dashboard/pages`,
      GET_PAGE: (pageId: string) => `/admin/dashboard/pages/${pageId}`,
      CREATE_PAGE: () => `/admin/dashboard/pages`,
      UPDATE_PAGE: (pageId: string) => `/admin/dashboard/pages/${pageId}`,
      DELETE_PAGE: (pageId: string) => `/admin/dashboard/pages/${pageId}`,
      LIST_WIDGETS: (pageId: string) =>
        `/admin/dashboard/pages/${pageId}/widgets`,
      ADD_WIDGET: (pageId: string) =>
        `/admin/dashboard/pages/${pageId}/widgets`,
      UPDATE_WIDGET: (pageId: string, widgetId: string) =>
        `/admin/dashboard/pages/${pageId}/widgets/${widgetId}`,
      DELETE_WIDGET: (pageId: string, widgetId: string) =>
        `/admin/dashboard/pages/${pageId}/widgets/${widgetId}`,
      LIST_FILTERS: (pageId: string) =>
        `/admin/dashboard/pages/${pageId}/filters`,
      ADD_FILTER: (pageId: string) =>
        `/admin/dashboard/pages/${pageId}/filters`,
      UPDATE_FILTER: (pageId: string, filterId: string) =>
        `/admin/dashboard/pages/${pageId}/filters/${filterId}`,
      DELETE_FILTER: (pageId: string, filterId: string) =>
        `/admin/dashboard/pages/${pageId}/filters/${filterId}`,
      GET_BUILDER_META: () => `/admin/dashboard/meta`,
    },

    BI_ASYNC_EXP: {
      GET_JOB: (jobref: string) => `/bi/exports/${jobref}`,
      DOWNLOAD: (jobref: string) => `/bi/exports/${jobref}/download`,
      POST: (id: string) => `/bi/datasets/${id}/exports`,
    },

    REPORTS: {
      GET_REPORT: (id: string) => `/bi/reports/${id}`,
      LIST_REPORTS: () => `/bi/reports`,
      CREATE_REPORT: () => `/bi/reports`,
      UPDATE_REPORT: (id: string) => `/bi/reports/${id}`,
      DELETE_REPORT: (id: string) => `/bi/reports/${id}`,
      RUN_REPORT: (id: string) => `/bi/reports/${id}/run`,
      EXPORT_REPORT: (id: string) => `/bi/reports/${id}/exports`,
    },

    BI_QUERY_ENGINE: {
      LIST_DATASETS: () => `/bi/datasets`,
      GET_DATASET_SCHEMA: (datasetId: string) =>
        `/bi/datasets/${datasetId}/schema`,
      GET_QUERY_PRESET: (datasetId: string, presetId: string) =>
        `/bi/datasets/${datasetId}/presets/${presetId}`,
      EXECUTE_QUERY: (datasetId: string) => `/bi/datasets/${datasetId}/query`,
      VALIDATE_QUERY: (datasetId: string) =>
        `/bi/datasets/${datasetId}/query/validate`,

      // Backward-compatible aliases used by the existing BI workspace service.
      GET: () => `/bi/datasets`,
      GET_BY_ID: (datasetId: string) => `/bi/datasets/${datasetId}/schema`,
      POST_QUERY: (datasetId: string) => `/bi/datasets/${datasetId}/query`,
      QUERY_VALIDATE: (datasetId: string) =>
        `/bi/datasets/${datasetId}/query/validate`,
    },

    BI_QUERY_SETS: {
      LIST_QUERY_SETS: () => `/admin/bi/query-sets`,
      GET_QUERY_SET: (id: string) => `/admin/bi/query-sets/${id}`,
      CREATE_QUERY_SET: () => `/admin/bi/query-sets`,
      UPDATE_QUERY_SET: (id: string) => `/admin/bi/query-sets/${id}`,
      DELETE_QUERY_SET: (id: string) => `/admin/bi/query-sets/${id}`,
    },

    PAYROLL_DASHBOARD: {
      PF_ESI: "/v1/dashboard/payroll/pf-esi",
      OVERVIEW: "/v1/dashboard/payroll/overview",
      EMPLOYEES: "/v1/dashboard/payroll/employees",
      HEAD_COUNT: "/v1/dashboard/payroll/employee-strength",
      DRILLDOWN: "/v1/dashboard/payroll/drilldown/company",
    },
  },

  FISCAL_YEARS: {
    DELETE: (cid: string, id: string) =>
      `/org/company/${cid}/fiscal-years/${id}`,
    GET: (cid: string) => `/org/company/${cid}/fiscal-years`,
    GET_ACTIVE: (cid: string) => `/org/company/${cid}/fiscal-years/active`,
    CREATE: (cid: string) => `/org/company/${cid}/fiscal-years`,
    UPDATE: (cid: string, id: string) =>
      `/org/company/${cid}/fiscal-years/${id}`,
    ACTIVATE: (cid: string, id: string) =>
      `/org/company/${cid}/fiscal-years/${id}/activate`,
  },

  ROLE_ADMIN: {
    DELETE_USER_ROLES: (id: string, gid: string) =>
      `/admin/users/${id}/role-grants/${gid}`,
    GET_USER_ROLES: (id: string) => `/admin/users/${id}/role-grants`,
    GET_ROLES: "/admin/roles",
    CREATE_USER_ROLES: (id: string) => `/admin/users/${id}/role-grants`,
  },

  WHATSAPP: {
    GET_ALL: "/messaging/whatsapp-configs",
    GET_BY_ID: (id: string) => `/messaging/whatsapp-configs/${id}`,
    CREATE: "/messaging/whatsapp-configs",
    UPDATE: (id: string) => `/messaging/whatsapp-configs/${id}`,
    DELETE: (id: string) => `/messaging/whatsapp-configs/${id}`,
    SET_DEFAULT: (id: string) => `/messaging/whatsapp-configs/${id}/default`,
  },

  SMS: {
    GET_ALL: "/messaging/sms-configs",
    GET_BY_ID: (id: string) => `/messaging/sms-configs/${id}`,
    CREATE: "/messaging/sms-configs",
    UPDATE: (id: string) => `/messaging/sms-configs/${id}`,
    DELETE: (id: string) => `/messaging/sms-configs/${id}`,
    SET_DEFAULT: (id: string) => `/messaging/sms-configs/${id}/default`,
    TEST: (id: string) => `/messaging/sms-configs/${id}/test`,
  },

  EMAIL: {
    BASE: "/messaging/email-configs",
    GET_ALL: "/messaging/email-configs",
    GET_BY_ID: (id: string) => `/messaging/email-configs/${id}`,
    CREATE: "/messaging/email-configs",
    UPDATE: (id: string) => `/messaging/email-configs/${id}`,
    DELETE: (id: string) => `/messaging/email-configs/${id}`,
    SET_DEFAULT: (id: string) => `/messaging/email-configs/${id}/default`,
    TEST: (id: string) => `/messaging/email-configs/${id}/test`,
  },

  TEMPLATES: {
    BASE: "/messaging/templates",
    GET_BY_ID: (id: string) => `/messaging/templates/${id}`,
    CREATE: "/messaging/templates",
    UPDATE: (id: string) => `/messaging/templates/${id}`,
    DELETE: (id: string) => `/messaging/templates/${id}`,
    PREVIEW: (id: string) => `/messaging/templates/${id}/preview`,
  },

  WHATSAPP_CHAT: {
    BASE: "/messaging/whatsapp/conversations",
    GET_BY_ID: (id: string) => `/messaging/whatsapp/conversations/${id}`,
    MESSAGES: (id: string) =>
      `/messaging/whatsapp/conversations/${id}/messages`,
    STATUS: (id: string) => `/messaging/whatsapp/conversations/${id}/status`,
    READ: (id: string) => `/messaging/whatsapp/conversations/${id}/read`,
    SEND: "/messaging/whatsapp/conversations/send",
    SEND_BY_ID: (id: string) => `/messaging/whatsapp/conversations/${id}/send`,
  },

  WHATSAPP_WEBHOOK: (tenantId: string) =>
    `/integration/whatsapp/webhook/${tenantId}`,

  PAYROLL: {
    DASHBOARD: "/payroll/dashboard",
    RUNS: {
      BASE: "/payroll/runs", //
      GET_BY_ID: (id: string) => `/payroll/runs/${id}`, //
      CREATE: "/payroll/runs", //
      // UPDATE: (id: string) => `/payroll/runs/${id}`,
      // DELETE: (id: string) => `/payroll/runs/${id}`,
      PROCESS: (id: string) => `/payroll/runs/${id}/process`, //
    },
    PAYROLLRUNS: {
      BASE: "/payroll-runs",
      GET_BY_ID: (id: string) => `/payroll-runs/${id}`,
      GET_ITEMS: (id: string) => `/payroll-runs/${id}/items`,
      GET_PERIOD_DETAILS: "/payroll-runs/period-details",
      CREATE: "/payroll-runs",
      CANCEL: (id: string) => `/payroll-runs/${id}/cancel`,
      PREVIEW: "/payroll-runs/preview",
    },
    GENERATE: {
      PREVIEW: "/payroll/generate/preview", //
      // CREATE: "/payroll/generate",
      // CONFIRM: "/payroll/generate/confirm",
    },
    PAYROLLPAYSLIPS: {
      BASE: "/payroll/payslips", //
      GET_BY_EMPLOYEE_AND_PERIOD: (employeeId: string, period: string) =>
        `/payroll/payslips/${employeeId}/${encodeURIComponent(period)}`, //
      DOWNLOAD: (employeeId: string) =>
        `/payroll/payslips/${employeeId}/download`, //
      // BULK_DOWNLOAD: "/payroll/payslips/bulk-download",
      // EMAIL: (employeeId: string) => `/payroll/payslips/${employeeId}/email`,
    },
    PAYSLIPS: {
      BASE: "/payslips",
      VIEW_PAYSLIP: (id: string) => `/payslips/${id}`,
      DOWNLOAD: (id: string) => `/payslips/${id}/download`,
      SUMMARY: "/payslips/summary",
    },
    SALARY_VIEW: {
      BASE: (employeeId: string) => `/payroll/employee-salary/${employeeId}`, //
      // HISTORY: (employeeId: string) =>
      //   `/payroll/employee-salary/${employeeId}/history`,
      // YTD: (employeeId: string) => `/payroll/employee-salary/${employeeId}/ytd`,
      EMP__SALARY_VIEW: (employeeId: string) =>
        `/employee-salary-view/${employeeId}`,
      EMP__DOWNLOAD_PAYSLIP: (employeeId: string) =>
        `/employee-salary-view/${employeeId}/download-payslip`,
    },
    COMPONENTS: {
      BASE: "/salary-components",
      GET_BY_ID: (id: string) => `/salary-components/${id}`,
      CREATE: "/salary-components",
      SUMMARY: "/salary-components/summary",
      VALIDATE: "/salary-components/validate-formula",
      UPDATE: (id: string) => `/salary-components/${id}`,
      DELETE: (id: string) => `/salary-components/${id}`,
      // TOGGLE: (id: string) => `/salary-components/${id}/toggle`,
    },
    STRUCTURES: {
      BASE: "/salary-structures",
      GET_OPTIONS: "/salary-structures/component-options",
      GET_BY_ID: (id: string) => `/salary-structures/${id}`,
      CREATE: "/salary-structures",
      UPDATE: (id: string) => `/salary-structures/${id}`,
      UPDATE_EARNINGS: (id: string) => `/salary-structures/${id}/earnings`,
      UPDATE_DEDUCTIONS: (id: string) => `/salary-structures/${id}/deductions`,
      UPDATE_BASIC: (id: string) => `/salary-structures/${id}/basic`,
      DELETE: (id: string) => `/salary-structures/${id}`,
      PUBLISH: (id: string) => `/salary-structures/${id}/publish`,
      UNPUBLISH: (id: string) => `/salary-structures/${id}/unpublish`,
      DUPLICATE: (id: string) => `/salary-structures/${id}/duplicate`,
      // DRAFT: (id: string) => `/salary-structures/${id}/draft`,
      PREVIEW: "/salary-structures/preview",
    },
    ASSIGN: {
      BASE: "/salary-assignments",
      GET_BY_EMPLOYEE: (employeeId: string) =>
        `/salary-assignments/employee/${employeeId}`,
      EMPLOYEE_HISTORY: (employeeId: string) =>
        `/salary-assignments/employee/${employeeId}/history`,
      CREATE_BULK: "/salary-assignments/bulk",
      CREATE: "/salary-assignments",
      // UPDATE: (id: string) => `/salary-assignments/${id}`,
      DELETE: (id: string) => `/salary-assignments/${id}`,
      // EXPORT: "/salary-assignments/export",
    },
    EMP_DEDUCTIONS: {
      BASE: "/employee-deductions",
      GET_BY_EMPLOYEE: (employeeId: string) =>
        `/employee-deductions/employee/${employeeId}/overview`,
      GET_BY_ID: (id: string) => `/employee-deductions/${id}`,
      CREATE: "/employee-deductions",
      FROM_LOAN: (id: string) => `/employee-deductions/from-loan/${id}`,
      UPDATE: (id: string) => `/employee-deductions/${id}`,
      DELETE: (id: string) => `/employee-deductions/${id}`,
      STATUS: (id: string) => `/employee-deductions/${id}/status`,
      // SUMMARY: (employeeId: string) =>
      //   `/employee-deductions/employee/${employeeId}/summary`,
    },
    PERIODS: {
      BASE: "/payroll/periods",
      GET_BY_ID: (id: string) => `/payroll/periods/${id}`,
      CREATE: "/payroll/periods",
      UPDATE: (id: string) => `/payroll/periods/${id}`,
      DELETE: (id: string) => `/payroll/periods/${id}`,
      SUMMARY: "/payroll/periods/day-summary",
      // GET /api/payroll/periods/day-summary?startDate=2026-08-01&endDate=2026-08-31
      // CLOSE: (id: string) => `/payroll/periods/${id}/close`,
      // CURRENT: "/payroll/periods/current",
    },
    LOAN_ADVANCE: {
      BASE: "/loan-requests",
      GET_BY_ID: (id: string) => `/loan-requests/${id}`,
      DOWNLOAD: (id: string) => `/loan-requests/${id}/download`,
      // GET_BY_EMPLOYEE: (employeeId: string) =>
      //   `/loan-requests/employee/${employeeId}`,
      CREATE: "/loan-requests",
      // UPDATE_STATUS: (id: string) =>
      //   `/loan-requests/${id}/status`,
      UPDATE: (id: string) => `/loan-requests/${id}`,
      APPROVE: (id: string) => `/loan-requests/${id}/approve`,
      REJECT: (id: string) => `/loan-requests/${id}/reject`,
      // DELETE: (id: string) => `/loan-requests/${id}`,
      SUMMARY: "/loan-requests/summary",
      MY: "/loan-requests/my",
    },
    COMPLIANCE: {
      BASE: "/statutory-compliance",
      GET_BY_ID: (id: string) => `/statutory-compliance/${id}`,
      DELETE: (id: string) => `/statutory-compliance/${id}`,
      DOWNLOAD: (id: string) => `/statutory-compliance/${id}/download`,
      OVERVIEW: "/statutory-compliance/overview",
      UPDATE_STATUS: (id: string) => `/statutory-compliance/${id}/status`,
      CREATE: "/statutory-compliance",
      // GET_BY_TYPE_AND_PERIOD: (type: string, period: string) =>
      //   `/statutory-compliance/${type}/${encodeURIComponent(period)}`,
      // SUMMARY: "/statutory-compliance/summary",
      GENERATE_REPORT: "/statutory-compliance/report",
      UPDATE: (id: string) => `/statutory-compliance/${id}`,
      // EXPORT: "/statutory-compliance/export",
      // SUBMIT: "/statutory-compliance/submit",
    },
    BANK_ADVICE: {
      BASE: "/bank-advices",
      GET_BY_ID: (id: string) => `/bank-advices/${id}`,
      GENERATE: "/bank-advices/generate",
      SUMMARY: "/bank-advices/summary",
      DOWNLOAD: (id: string) => `/bank-advices/${id}/download`,
      // BULK: "/bank-advices/bulk",
      // BANKS: "/bank-advices/banks",
      DELETE: (id: string) => `/bank-advices/${id}`,
    },
    REPORTS: {
      BASE: "/payroll/reports",
      // GET_BY_ID: (id: string) => `/payroll/reports/${id}`,
      GENERATE: "/payroll/reports/generate",
      DOWNLOAD: (id: string) => `/payroll/reports/${id}/download`,
      DELETE: (id: string) => `/payroll/reports/${id}`,
      // TYPES: "/payroll/reports/types",
      QUICK: (type: string) => `/payroll/reports/quick/${type}`,
      // EMAIL: (id: string) => `/payroll/reports/${id}/email`,
    },
    PAYROLLREPORTS: {
      BASE: "/payroll-reports",
      DELETE: (id: string) => `/payroll-reports/${id}`,
      GET_BY_ID: (id: string) => `/payroll-reports/${id}`,
      DOWNLOAD: (id: string) => `/payroll-reports/${id}/download`,
      SUMMARY: "/payroll-reports/summary",
      GENERATE_BY_ID: (id: string) => `/payroll-reports/${id}/generate`,
      GENERATE: "/payroll-reports/generate",
    },
    AUDIT: {
      BASE: "/payroll-audit-logs",
      SUMMARY: "/payroll-audit-logs/summary",
      // GET_BY_ID: (id: string) => `/payroll/audit/${id}`,
      // ACTIONS: "/payroll/audit/actions",
      EXPORT: "/payroll-audit-logs/export",
      CREATE: "/payroll-audit-logs",
      // GET_BY_USER: (userId: string) => `/payroll/audit/user/${userId}`,
    },
    PAYROLL_AUDIT: {
      BASE: "/payroll/audit",
      EXPORT: "/payroll/audit/export",
      ACTIONS: "/payroll/audit/actions",
    },
    PORTAL: {
      BASE: "/payroll/employee-portal",
      // ADMIN_VIEW: "/payroll/employee-portal",
      SELF: "/payroll/employee-portal/self",
      EMPLOYEE: (employeeId: string) =>
        `/payroll/employee-portal/employee/${employeeId}`,
      BANK_DETAILS: "/payroll/employee-portal/bank-details",
      TAX_SUMMARY: "/payroll/employee-portal/tax-summary",
      // PAYSLIPS: "/payroll/employee-portal/payslips",
      // FEATURES: "/payroll/employee-portal/features",
      // PAYSLIP_REQUEST: "/payroll/employee-portal/payslip/request",
    },
    EMP_PORTAL: {
      SUMMARY: "/employee-portal/summary",
      FEATURES: "/employee-portal/features",
      EMPLOYEES: "/employee-portal/employees",
      TAX_SUMMARY: (employeeId: string) =>
        `/employee-portal/employees/${employeeId}/tax-summary`,
      PAYSLIPS: (employeeId: string) =>
        `/employee-portal/employees/${employeeId}/payslips`,
    },
    SETTINGS: {
      BASE: "/payroll/settings",
      // GET_BY_CATEGORY: (category: string) => `/payroll/settings/${category}`,
      // UPDATE: "/payroll/settings",
      // UPDATE_CATEGORY: (category: string) => `/payroll/settings/${category}`,
      // RESET: "/payroll/settings/reset",
    },
    MASTERS: {
      DEDUCTIONS: {
        DELETE: (id: string) => `/payroll/deductions/${id}`,
        GET_BY_ID: (empId: string) => `/payroll/deductions/employee/${empId}`,
        CREATE: "/payroll/deductions",
        UPDATE: (id: string) => `/payroll/deductions/${id}`,
      },
      COMPONENTS: {
        DELETE: (id: string) => `/payroll/components/${id}`,
        BASE: "/payroll/components",
        CREATE: "/payroll/components",
        UPDATE: (id: string) => `/payroll/components/${id}`,
      },
      STRUCTURES: {
        BASE: "/payroll/structures",
        CREATE: "/payroll/structures",
      },
      LOANADV: {
        BASE: "/payroll/loan-advance-requests",
        CREATE: "/payroll/loan-advance-requests",
        UPDATE: (id: string) => `/payroll/loan-advance-requests/${id}/status`,
      },
      COMPLIANCE: {
        BASE: "/payroll/compliance",
        GENERATE_REPORT: "/payroll/compliance/generate-report",
      },
      BANKADVICE: {
        BASE: "/payroll/bank-advice",
        GENERATE: "/payroll/bank-advice/generate",
      },
      ASSIGN: {
        GET_BY_ID: (empId: string) => `/payroll/assign/employee/${empId}`,
        BASE: "/payroll/assign",
      },
    },
    // EMPLOYEES: {
    //   BASE: "/employees",
    //   GET_ALL: "/employees",
    //   GET_BY_ID: (id: string) => `/employees/${id}`,
    //   DEPARTMENTS: "/employees/departments",
    //   DESIGNATIONS: "/employees/designations",
    //   GRADES: "/employees/grades",
    // },
  },

  PERMISSION: {
    ROLE_PERMISSIONS: (role: string) => `/admin/roles/${role}/permissions`,
    GET: "/admin/permissions",
    UPDATE_ROLE_PERMISSIONS: (role: string) =>
      `/admin/roles/${role}/permissions`,
  },

  MOBILE_ATTENDANCE: {
    GET_TODAY: "/mobile/attendance/today",
    GET_TIMELINE: "/mobile/attendance/timeline",
    GET_SUMMARY: "/mobile/attendance/summary",
    GET_HISTORY: "/mobile/attendance/history",
    GEOFENCE_VALIDATE: "/mobile/attendance/geofence/validate",
    POST_CHECKIN: "/mobile/attendance/check-in",
    POST_CHECKOUT: "/mobile/attendance/check-out",
    POST_REMOTE_CHECKIN: "/mobile/attendance/remote-checkin",
    POST_CORRECTION: "/mobile/attendance/correction",
    POST_BREAK_START: "/mobile/attendance/break/start",
    POST_BREAK_END: "/mobile/attendance/break/end",
  },
};