import type { AuthSession } from "./authTypes";
import { logger } from "../utils/logger";

const AUTH_STORAGE_KEY = "hrms.auth.session";

export function saveSession(session: AuthSession): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  logger.debug("Saved auth session", {
    userId: session.user.userId,
    tenantId: session.user.tenantId,
    roles: session.user.roles,
    expiresAt: session.expiresAt,
  });
}

export function loadSession(): AuthSession | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!raw) {
    logger.debug("No stored auth session found");
    return null;
  }

  try {
    const session = JSON.parse(raw) as AuthSession;
     if (session.expiresAt && session.expiresAt < Date.now()) {
      logger.warn("Session token expired, clearing");
      clearSession();
      return null;
    }
    if (!session.accessToken || !session.refreshToken || !session.user) {
      logger.warn("Stored auth session is incomplete; clearing it");
      clearSession();
      return null;
    }

    logger.debug("Loaded auth session", {
      userId: session.user.userId,
      tenantId: session.user.tenantId,
      roles: session.user.roles,
      expiresAt: session.expiresAt,
    });
    return session;
  } catch {
    logger.warn("Stored auth session could not be parsed; clearing it");
    clearSession();
    return null;
  }
}

export function shouldRefreshSession(session: AuthSession | null): boolean {
  if (!session) return false;
  
  const timeUntilExpiry = session.expiresAt - Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  
  // Refresh if less than 5 minutes remaining
  return timeUntilExpiry < fiveMinutes;
}

export function clearSession(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  logger.debug("Cleared auth session");
}

export function getAccessToken(): string | null {
  return loadSession()?.accessToken ?? null;
}

export function getRefreshToken(): string | null {
  return loadSession()?.refreshToken ?? null;
}

export function updateAccessToken(
  accessToken: string,
  expiresIn?: number,
   additionalData?: Partial<Omit<AuthSession, 'accessToken' | 'expiresIn' | 'expiresAt'>>
): AuthSession | null {
  const session = loadSession();

  if (!session) {
    return null;
  }

  const updatedSession: AuthSession = {
    ...session,
    accessToken,
    expiresIn: expiresIn ?? session.expiresIn,
    expiresAt: expiresIn
      ? Date.now() + expiresIn * 1000
      : session.expiresAt,
      ...additionalData, 
  };

  saveSession(updatedSession);
  return updatedSession;
}