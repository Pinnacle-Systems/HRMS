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