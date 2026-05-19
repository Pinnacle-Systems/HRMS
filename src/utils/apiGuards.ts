const FORBIDDEN_QUERY_KEYS = new Set([
  "password",
  "token",
  "accesstoken",
  "refreshtoken",
  "email",
  "userid",
  "tenantid",
  "roles",
  "permissions",
  "authorization",
  "credential",
  "secret",
  "otp",
]);

/**
 * Warns when forbidden auth-context keys are found in query params.
 * Active in development and test builds only; no-op in production.
 */
export function assertSafeQueryParams(
  params: Record<string, unknown> | null | undefined,
): void {
  if (!params) return;

  const isDev =
    import.meta.env.DEV || import.meta.env.MODE === "test";
  if (!isDev) return;

  const forbidden = Object.keys(params).filter((key) =>
    FORBIDDEN_QUERY_KEYS.has(key.toLowerCase()),
  );

  if (forbidden.length > 0) {
    console.warn(
      `[HRMS] Unsafe query param(s) detected: ${forbidden.join(", ")}. ` +
        "Auth-context values must not be sent in URL/query params.",
    );
  }
}
