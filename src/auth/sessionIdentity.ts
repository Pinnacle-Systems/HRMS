import type { AuthSession } from "./authTypes";
import { isAccessDeniedError } from "../utils/errorUtils";

export function resolveEmployeeIdFromSession(
  session: AuthSession | null,
): string | undefined {
  return session?.user.userId || undefined;
}

type ProfileResponse = {
  data?: {
    id?: string;
    employeeId?: string;
    userId?: string;
    employee?: {
      id?: string;
      employeeId?: string;
      userId?: string;
    };
  };
};

type ProfileFetcher = {
  getProfile(): Promise<unknown>;
};

function uniqueValues(values: Array<string | undefined | null | false>): string[] {
  return Array.from(new Set(values.filter(Boolean))) as string[];
}

export async function resolveEmployeeIdFromProfile(
  session: AuthSession | null,
  authService: ProfileFetcher,
): Promise<string> {
  const currentUserId = session?.user.userId ?? "";

  try {
    const profileResponse = (await authService.getProfile()) as ProfileResponse;
    const candidates = uniqueValues([
      profileResponse?.data?.employeeId ||
        profileResponse?.data?.employee?.employeeId,
      profileResponse?.data?.employee?.id,
      profileResponse?.data?.id,
      profileResponse?.data?.userId,
      profileResponse?.data?.employee?.userId,
      currentUserId,
    ]);
    return candidates[0] || currentUserId;
  } catch (error) {
    if (!isAccessDeniedError(error)) {
      // non-permission profile failures still fall back; caller owns balance errors
    }
    return currentUserId;
  }
}
