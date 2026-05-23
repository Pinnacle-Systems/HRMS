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
    LEAVE_ADJUSTMENTS: (id: string) => `/employees/${id}/leave-adjustments`,
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
  },

  MASTER: {
    GET_CITY: "/master/cities",
    GET_COUNTRY: "/master/countries",
    GET_STATES: "/master/states",
    GET_CURRENCIES: "/master/currencies",
    GET_ACTIVE_CURRENCIES: "/master/currencies/active",
    GET_STATES_BY_COUNTRY: (cid: any) => `/master/states/by-country/${cid}`,
    GET_CITIES_BY_COUNTRY: (cid: any) => `/master/cities/by-country/${cid}`,
    GET_CITIES_BY_STATE: (sid: any) => `/master/cities/by-state/${sid}`,
  },

  LEAVE: {
    BASE: "/leaves",
    MY_APPROVALS: "/leaves/approvals/my",
    BY_ID: (id: string) => `/leaves/${id}`,
    GET_BY_ID: (id: string) => `/leaves/${id}`,
    CALCULATE: "/leaves/calculate",
    APPROVE: (id: string) => `/leaves/${id}/actions/approve`,
    REJECT: (id: string) => `/leaves/${id}/actions/reject`,
    REQUEST_CLARIFICATION: (id: string) =>
      `/leaves/${id}/actions/request-clarification`,
    REVOKE: (id: string) => `/leaves/${id}/actions/revoke`,
    FORCE_APPROVE: (id: string) => `/leaves/${id}/actions/force-approve`,
    CONVERT_TO_LOP: (id: string) => `/leaves/${id}/actions/convert-to-lop`,
    WITHDRAW: (id: string) => `/leaves/${id}/actions/revoke`,
    CANCEL_REQUEST: (id: string) => `/leaves/${id}/actions/revoke`,
    OVERRIDE: (id: string) => `/leaves/${id}/actions/force-approve`,
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
    BY_ID: (id: string) => `/comp-offs/${id}`,
    GET_BY_ID: (id: string) => `/comp-offs/${id}`,
    APPROVE: (id: string) => `/comp-offs/${id}/actions/approve`,
    REJECT: (id: string) => `/comp-offs/${id}/actions/reject`,
  },

  PAYROLL: {
    LEAVE_INPUTS: "/payroll/leave-inputs",
    LEAVE_SUMMARY: "/payroll/leave-summary",
  },

  LEAVE_ACCRUAL: {
    RUN: "/leave-accruals/run",
  },

  ONBOARDING: {
    DELETE: (id: string) => `/onboarding/checklist/${id}`,
    DELETE_TASK: (id: string, tid: string) =>
      `/onboarding/checklist/${id}/tasks/${tid}`,
    DELETE_EMP: (id: string) => `/onboarding/${id}`,
    REACTIVATE_EMP: (id: string) => `/onboarding/${id}/reactivate`,
    DELETE_DOC: (taskInstanceId: string) => `/onboarding/documents/${taskInstanceId}`,

    GET_CHK_TASKS: (id: string) => `/onboarding/checklist/${id}`,
    BASE: "/onboarding/checklist",
    GET_BY_ID: (id: string, cid: string) =>
      `/onboarding/${id}/checklist/${cid}/tasks`,
    GET_PROGRESS: (employeeId: string) => `/onboarding/progress/${employeeId}`,
    GET_DOCUMENTS: (onboardingId: string) => `/onboarding/${onboardingId}/documents`,
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
};
