export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh-token",
    FORGOT_PASSWORD: "/auth/forgot-password",
    PROFILE: "/auth/profile",
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

    LEAVE_BALANCES: (id: string) => `/employees/${id}/leave-balances`,
    LEAVE_LEDGER: (id: string) => `/employees/${id}/leave-ledger`,
    LEAVES: (id: string) => `/employees/${id}/leaves`,
    COMP_OFF_BALANCE: (id: string) => `/employees/${id}/comp-off-balances`,
    LEAVE_ADJUSTMENTS: (id: string) => `/employees/${id}/leave-adjustments`,

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

    TEAM_CALENDAR: "/leaves/team-calendar",
    HR_VERIFY: (id: string) => `/leaves/${id}/hr-verify`,
    GET_MY: "/leaves/my",
    GET_APPROVALS: "/leaves/approvals",
    GET_APPROVALS_BYID: (id: string) => `/leaves/approvals/${id}`,

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
    // BY_ID: (id: string) => `/comp-offs/${id}`,
    GET_BY_ID: (id: string) => `/comp-offs/${id}`,
    APPROVE: (id: string) => `/comp-offs/${id}/actions/approve`,
    REJECT: (id: string) => `/comp-offs/${id}/actions/reject`,
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
    DELETE: (id: string) => `/onboarding/checklist/${id}`,
    DELETE_TASK: (id: string, tid: string) =>
      `/onboarding/checklist/${id}/tasks/${tid}`,
    DELETE_EMP: (id: string) => `/onboarding/${id}`,
    REACTIVATE_EMP: (id: string) => `/onboarding/${id}/reactivate`,
    DELETE_DOC: (taskInstanceId: string) =>
      `/onboarding/documents/${taskInstanceId}`,

    GET_CHK_TASKS: (id: string) => `/onboarding/checklist/${id}`,
    BASE: "/onboarding/checklist",
    GET_BY_ID: (id: string, cid: string) =>
      `/onboarding/${id}/checklist/${cid}/tasks`,
    GET_PROGRESS: (employeeId: string) => `/onboarding/progress/${employeeId}`,
    GET_DOCUMENTS: (onboardingId: string) =>
      `/onboarding/${onboardingId}/documents`,
    ASSIGNMENTS: "/onboarding/assignments",

    PATCH_TASK: (id: string) => `/onboarding/task/${id}/complete`,
    PATCH_REORDER: (id: string) => `/onboarding/checklist/${id}/tasks/reorder`,

    SEND_WELCOME: "/onboarding/send-welcome",
    CREATE_DOC: "/onboarding/documents",
    CREATE: "/onboarding/checklist",
    CREATE_TASK: (id: string) => `/onboarding/checklist/${id}/tasks`,
    ASSIGN: "/onboarding/assign",

    UPDATE: (id: string) => `/onboarding/checklist/${id}`,
    UPDATE_TASK: (id: string, tid: string) =>
      `/onboarding/checklist/${id}/tasks/${tid}`,
  },

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
    EXPORT_PDF: "/shift-roster/export/pdf",
    EXPORT_EXCEL: "/shift-roster/export/excel",
    GET_ALERTS: "/shift-roster/alerts",
    PUBLISH: "/shift-roster/publish",
    COPY_PREV_WEEK: "/shift-roster/copy-previous-week",
    BULK_ASSIGN: "/shift-roster/bulk-assign",
    UPDATE_EMP_ROSTER: (eid: string) => `/shift-roster/${eid}`,

    GET_SCHEDULE: "/shift-schedule",
    GET_UPCOMING: "/shift-schedule/upcoming",
    GET_SCHEDULE_STATS: "/shift-schedule/stats",
    EXPORT_SCHEDULE_PDF: "/shift-schedule/export/pdf",
    EXPORT_SCHEDULE_Excel: "/shift-schedule/export/excel",
    GET_COUNT: "/shift-schedule/distribution",
    SEND_NOTIFY: "/shift-schedule/send-notifications",

    GET_ADV_CONFIG: (sid: string) => `/shifts/${sid}/advanced-config`,
    POST_ADV_CONFIG: (sid: string) => `/shifts/${sid}/advanced-config`,
    PUT_ADV_CONFIG: (sid: string) => `/shifts/${sid}/advanced-config`,
  },

  POLICY: {
    DELETE: (id: string) => `/policies/${id}`,
    GET_BY_ID: (id: string) => `/policies/${id}`,
    BASE: "/policies",
    GET_VERSIONS: (id: string) => `/policies/${id}/versions`,
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
    POST_PROCESS: "/attendance/process",
    POST_BULK_PROCESS: "/attendance/bulk-process",
    POST_FINALISE: "/attendance/finalise",
    POST_UNLOCK: "/attendance/unlock",

    GET_LOCKS: "/attendance/locks",
    POST_LOCK: "/attendance/lock",

    REPORT_MONTHLY_SUMMARY: "/attendance/reports/monthly-summary",
    REPORT_LATE_ARRIVAL: "/attendance/reports/late-arrivals",
    REPORT_OVERTIME: "/attendance/reports/overtime",
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
    PREFERENCES: (page: string) => `dashboard/${page}/preferences`,
    PAGE: (page: string) => `dashboard/${page}`,
    WIDGETS: (page: string) => `dashboard/${page}/widgets`,
    CONTEXT: (page: string) => `dashboard/${page}/context`,
    GET: "dashboard/pages",
    POST_DRILLDOWN: (page: string, wid: string) =>
      `dashboard/${page}/widgets/${wid}/drilldown`,
    POST_PREFERENCE: (page: string) => `dashboard/${page}/preferences/reset`,
    UPDATE_PREFERENCE: (page: string) => `dashboard/${page}/preferences`,

    BI_ASYNC_EXP: {
      GET_JOB: (jobref: string) => `/bi/exports/${jobref}`,
      DOWNLOAD: (jobref: string) => `/bi/exports/${jobref}/download`,
      POST: (id: string) => `/bi/datasets/${id}/exports`,
    },
    REPORTS: {
      DELETE: (id: string) => `/bi/reports/${id}`,
      GET_BY_ID: (id: string) => `/bi/reports/${id}`,
      GET: "/bi/reports",
      CREATE: "/bi/reports",
      RUN: (id: string) => `/bi/reports/${id}/run`,
      EXPORTS: (id: string) => `/bi/reports/${id}/exports`,
      UPDATE: (id: string) => `/bi/reports/${id}`,
    },
    BI_QUERY_ENGINE: {
      GET: "/bi/datasets",
      GET_BY_ID: (id: string) => `/bi/datasets/${id}/schema`,
      GET_PRESETS: (id: string, pid: string) =>
        `/bi/datasets/${id}/presets/${pid}`,
      POST_QUERY: (id: string) => `/bi/datasets/${id}/query`,
      QUERY_VALIDATE: (id: string) => `/bi/datasets/${id}/query/validate`,
    },
  },
};
