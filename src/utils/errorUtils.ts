export function isAccessDeniedError(error: unknown): boolean {
  const message =
    typeof error === "object" && error && "message" in error
      ? String((error as { message?: unknown }).message)
      : String(error ?? "");

  return /access denied|insufficient permissions|forbidden/i.test(message);
}
