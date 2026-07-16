export interface LeaveAuditEntry {
  id?: string;
  module?: string;
  screen?: string;
  recordId?: string;
  fieldName?: string;
  oldValue?: string | null;
  newValue?: string | null;
  actionType?: string;
  changedBy?: {
    userId?: string;
    userName?: string;
  } | null;
  changedOn?: string | null;
  ipAddress?: string;
  userAgent?: string;
}

export function normalizeLeaveAuditEntries(payload: unknown): LeaveAuditEntry[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const envelope = payload as {
    data?: unknown;
    content?: unknown;
    [key: string]: unknown;
  };

  if (Array.isArray(envelope)) {
    return envelope as LeaveAuditEntry[];
  }

  if (Array.isArray(envelope.data)) {
    return envelope.data as LeaveAuditEntry[];
  }

  if (envelope.data && typeof envelope.data === "object") {
    const dataBlock = envelope.data as {
      content?: unknown;
      [key: string]: unknown;
    };

    if (Array.isArray(dataBlock.content)) {
      return dataBlock.content as LeaveAuditEntry[];
    }
  }

  return [];
}
