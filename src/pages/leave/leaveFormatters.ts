const displayDateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const displayDayFormatter = new Intl.DateTimeFormat("en-IN", {
  weekday: "long",
});

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  try {
    return displayDateFormatter.format(new Date(value));
  } catch {
    return "";
  }
}

export function formatDay(value: string | Date | null | undefined): string {
  if (!value) return "";
  try {
    return displayDayFormatter.format(new Date(value));
  } catch {
    return "";
  }
}
