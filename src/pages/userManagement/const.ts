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

export const dialogsx = {
  "& .MuiDialog-paper": {
    width: "1200px",
    maxWidth: "1200px",
  },
};
