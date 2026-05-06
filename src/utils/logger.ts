type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

const SENSITIVE_KEY_PATTERN =
  /token|password|authorization|otp|secret|credential/i;

const isLoggingEnabled = () => import.meta.env.DEV;

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key) ? "[REDACTED]" : sanitizeValue(item),
    ]),
  );
}

function writeLog(level: LogLevel, message: string, context?: LogContext) {
  if (!isLoggingEnabled()) {
    return;
  }

  const sanitizedContext = context ? sanitizeValue(context) : undefined;
  const payload = sanitizedContext
    ? [`[HRMS] ${message}`, sanitizedContext]
    : [`[HRMS] ${message}`];

  console[level](...payload);
}

export const logger = {
  debug: (message: string, context?: LogContext) =>
    writeLog("debug", message, context),
  info: (message: string, context?: LogContext) =>
    writeLog("info", message, context),
  warn: (message: string, context?: LogContext) =>
    writeLog("warn", message, context),
  error: (message: string, context?: LogContext) =>
    writeLog("error", message, context),
};
