import { PERMISSIONS } from "../../auth/Permissions";
import type { UserRoleGrantRecord } from "../../services/modules/roleAdmin";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employeeCode: string;
  department: string;
  branchId: string;
  branchName: string;
  isActive: boolean;
  createdAt: string;
  roles: UserRoleGrantRecord[];
}

export interface EmailConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  encryption: "tls" | "ssl" | "none";
  isActive: boolean;
}

export interface SMSConfig {
  provider: "twilio" | "nexmo" | "aws" | "custom";
  apiKey: string;
  apiSecret: string;
  fromNumber: string;
  accountSid?: string;
  authToken?: string;
  isActive: boolean;
}

export interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId: string;
  webhookVerifyToken: string;
  isActive: boolean;
}

export const EMPTY_FORM = {
  roleId: "",
  branchId: "",
};

export interface PermissionGroup {
    group: string;
    permissions: string[];
    description: string;
}

export const ROLES = {
    ADMIN: "ADMIN",
    HR: "HR",
    MANAGER: "MANAGER",
    ESS: "ESS",
} as const;

export const PERMISSION_GROUPS: PermissionGroup[] = [
    {
        group: "Employee Management",
        description: "Manage employee records and data",
        permissions: [
            PERMISSIONS.EMPLOYEE_READ,
            PERMISSIONS.EMPLOYEE_WRITE,
            PERMISSIONS.EMPLOYEE_DELETE,
            PERMISSIONS.EMPLOYEE_UPLOAD,
        ],
    },
    {
        group: "Payroll Management",
        description: "Manage payroll operations",
        permissions: [
            PERMISSIONS.PAYROLL_READ,
            PERMISSIONS.PAYROLL_WRITE,
        ],
    },
    {
        group: "Reports",
        description: "Access and export reports",
        permissions: [
            PERMISSIONS.REPORT_READ,
            PERMISSIONS.REPORT_EXPORT,
        ],
    },
    {
        group: "Profile Management",
        description: "Manage user profiles",
        permissions: [
            PERMISSIONS.PROFILE_READ,
            PERMISSIONS.PROFILE_WRITE,
        ],
    },
    {
        group: "Settings",
        description: "System settings management",
        permissions: [
            PERMISSIONS.SETTINGS_READ,
            PERMISSIONS.SETTINGS_WRITE,
        ],
    },
    {
        group: "Policy Management",
        description: "Manage policies",
        permissions: [
            PERMISSIONS.POLICY_READ,
            PERMISSIONS.POLICY_WRITE,
        ],
    },
    {
        group: "Attendance",
        description: "Manage attendance",
        permissions: [
            PERMISSIONS.ATTENDANCE_READ,
            PERMISSIONS.ATTENDANCE_WRITE,
        ],
    },
    {
        group: "Leave Management",
        description: "Manage leave requests",
        permissions: [
            PERMISSIONS.LEAVE_READ,
            PERMISSIONS.LEAVE_WRITE,
            PERMISSIONS.LEAVE_APPROVE,
        ],
    },
    {
        group: "Administration",
        description: "System administration",
        permissions: [
            PERMISSIONS.USER_MANAGE,
            PERMISSIONS.ROLE_MANAGE,
        ],
    },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
    ADMIN: [
        PERMISSIONS.PAYROLL_READ,
        PERMISSIONS.PAYROLL_WRITE,
        PERMISSIONS.REPORT_EXPORT,
        PERMISSIONS.REPORT_READ,
        PERMISSIONS.PROFILE_READ,
        PERMISSIONS.PROFILE_WRITE,
        PERMISSIONS.SETTINGS_READ,
        PERMISSIONS.SETTINGS_WRITE,
        PERMISSIONS.POLICY_READ,
        PERMISSIONS.POLICY_WRITE,
        PERMISSIONS.ATTENDANCE_WRITE,
        PERMISSIONS.ATTENDANCE_READ,
        PERMISSIONS.LEAVE_READ,
        PERMISSIONS.LEAVE_WRITE,
        PERMISSIONS.LEAVE_APPROVE,
        PERMISSIONS.USER_MANAGE,
        PERMISSIONS.ROLE_MANAGE,
    ],
    HR: [
        PERMISSIONS.EMPLOYEE_READ,
        PERMISSIONS.EMPLOYEE_WRITE,
        PERMISSIONS.EMPLOYEE_DELETE,
        PERMISSIONS.EMPLOYEE_UPLOAD,
        PERMISSIONS.PAYROLL_READ,
        PERMISSIONS.PAYROLL_WRITE,
        PERMISSIONS.REPORT_READ,
        PERMISSIONS.REPORT_EXPORT,
        PERMISSIONS.PROFILE_READ,
        PERMISSIONS.PROFILE_WRITE,
        PERMISSIONS.SETTINGS_READ,
        PERMISSIONS.SETTINGS_WRITE,
        PERMISSIONS.POLICY_READ,
        PERMISSIONS.POLICY_WRITE,
        PERMISSIONS.ATTENDANCE_WRITE,
        PERMISSIONS.ATTENDANCE_READ,
        PERMISSIONS.LEAVE_READ,
        PERMISSIONS.LEAVE_WRITE,
        PERMISSIONS.LEAVE_APPROVE,
    ],
    MANAGER: [
        PERMISSIONS.PAYROLL_READ,
        PERMISSIONS.EMPLOYEE_READ,
        PERMISSIONS.EMPLOYEE_WRITE,
        PERMISSIONS.EMPLOYEE_DELETE,
        PERMISSIONS.EMPLOYEE_UPLOAD,
        PERMISSIONS.REPORT_READ,
        PERMISSIONS.PROFILE_READ,
        PERMISSIONS.PROFILE_WRITE,
        PERMISSIONS.ATTENDANCE_READ,
        PERMISSIONS.LEAVE_READ,
        PERMISSIONS.LEAVE_WRITE,
        PERMISSIONS.LEAVE_APPROVE,
    ],
    ESS: [
        PERMISSIONS.PAYROLL_READ,
        PERMISSIONS.EMPLOYEE_READ,
        PERMISSIONS.EMPLOYEE_WRITE,
        PERMISSIONS.EMPLOYEE_DELETE,
        PERMISSIONS.EMPLOYEE_UPLOAD,
        PERMISSIONS.REPORT_READ,
        PERMISSIONS.PROFILE_READ,
        PERMISSIONS.PROFILE_WRITE,
        PERMISSIONS.ATTENDANCE_READ,
        PERMISSIONS.LEAVE_READ,
        PERMISSIONS.LEAVE_WRITE,
    ],
};

export const ROLE_COLORS: Record<string, { bg: string; color: string; }> = {
    ADMIN: {
        bg: "#fee2e2",
        color: "#dc2626",
    },
    HR: {
        bg: "#dbeafe",
        color: "#2563eb",
    },
    MANAGER: {
        bg: "#fef3c7",
        color: "#d97706",
    },
    ESS: {
        bg: "#d1fae5",
        color: "#059669",
    },
};

export const ROLE_ORDER = ['ADMIN', 'HR', 'MANAGER', 'ESS'];

export const getSortedRoles = (roles: string[]) => {
    const predefinedRoles = ROLE_ORDER.filter(role => roles.includes(role));
    const customRoles = roles.filter(role => !ROLE_ORDER.includes(role)).sort();
    return [...predefinedRoles, ...customRoles];
};