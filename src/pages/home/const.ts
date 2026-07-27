import dayjs from "dayjs";

export const isIdColumn = (name: string) => {
  const lower = name.toLowerCase();
  return lower === "id" || lower.endsWith("id");
};

export const isDateString = (value: any): boolean => {
  if (typeof value !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}/.test(value)) return false;
  const parsed = dayjs(value);
  return parsed.isValid();
};

export const getWidgetColor = (type: string) => {
  const typeLower = type?.toLowerCase() || "";
  if (["employee", "employees", "headcount", "summary-box"].includes(typeLower)) {
    return { bg: "#E3F2FD", color: "#1976D2" };
  }
  if (["attendance", "absenteeism"].includes(typeLower)) {
    return { bg: "#E8F5E9", color: "#388E3C" };
  }
  if (["performance", "rating"].includes(typeLower)) {
    return { bg: "#FFF3E0", color: "#F57C00" };
  }
  if (["payroll", "salary", "cost"].includes(typeLower)) {
    return { bg: "#F3E5F5", color: "#7B1FA2" };
  }
  if (["recruitment", "hiring", "candidates"].includes(typeLower)) {
    return { bg: "#E0F7FA", color: "#00838F" };
  }
  if (["training", "learning"].includes(typeLower)) {
    return { bg: "#FFF8E1", color: "#F9A825" };
  }
  if (["rewards", "recognition"].includes(typeLower)) {
    return { bg: "#FCE4EC", color: "#C2185B" };
  }
  if (["analytics", "report", "kpi"].includes(typeLower)) {
    return { bg: "#E8EAF6", color: "#283593" };
  }
  return { bg: "#F5F5F5", color: "#616161" };
};
