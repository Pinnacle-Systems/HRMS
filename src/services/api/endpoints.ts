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
    // GET_ACTIVE: "/org/category/active",
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
    GET_BY_ID: (id: string) => `/org/company/${id}`,
    BASE: "/org/company",
    CREATE: "/org/company",
    UPDATE: (id: string) => `/org/company/${id}`,
    UPLOAD_LOGO: (id: string) => `/org/company/${id}/logo`,
    UPLOAD_SIGNATURE: (id: string) => `/org/company/${id}/signature`,
  },

  EMPLOYEE: {
    BASE: "/employees",
    GET_BY_ID: (id: string) => `/employees/${id}`,
    CREATE: "/employees",
    UPDATE: (id: string) => `/employees/${id}`,
    DELETE: (id: string) => `/employees/${id}`,
  },
};
