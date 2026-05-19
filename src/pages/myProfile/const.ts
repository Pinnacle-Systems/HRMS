export interface LoginHistory {
  id: string;
  browser: string | null;
  deviceType: string | null;
  ipAddress: string | null;
  os: string | null;
  userAgent: string | null;
  status: string;
  createdAt: string | null;
  failureReason: string | null;
}
