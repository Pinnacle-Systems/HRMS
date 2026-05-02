// services/api/endpoints.ts
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh-token",
    FORGOT_PASSWORD: "/auth/forgot-password",
    MFA_VERIFY: "/auth/mfa/verify",
    SELECT_TENANT: "/auth/login/select-tenant",
    SET_PASSWORD: "/auth/set-password",
    PROFILE: "/auth/profile",
    PERMISSIONS: "/auth/permissions",
  },

  COMPANY: {
    BASE: "/companies",
    GET_BY_ID: (id: string) => `/companies/${id}`,
    // CREATE: '/companies',
    UPDATE: (id: string) => `/companies/${id}`,
    DELETE: (id: string) => `/companies/${id}`,
    UPLOAD_LOGO: (id: string) => `/companies/${id}/logo`,
    UPLOAD_SIGNATURE: (id: string) => `/companies/${id}/signature`,
    // DOWNLOAD_REPORT: (id: string) => `/companies/${id}/report`,
    // MASTER_DATA: '/companies/master-data',
    // ADD_MASTER_DATA: '/companies/master-data',
    // EXPORT: '/companies/export',
    // IMPORT: '/companies/import',
  },

  EMPLOYEE: {
    BASE: "/employees",
    GET_BY_ID: (id: string) => `/employees/${id}`,
    CREATE: "/employees",
    UPDATE: (id: string) => `/employees/${id}`,
    DELETE: (id: string) => `/employees/${id}`,
  },
};
