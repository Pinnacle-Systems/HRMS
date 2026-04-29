// services/api/endpoints.ts
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
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
