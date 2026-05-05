import type { AuthSession } from "./authTypes";

const AUTH_STORAGE_KEY = "hrms.auth.session";

export function saveSession(session: AuthSession): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function loadSession(): AuthSession | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const session = JSON.parse(raw) as AuthSession;
    if (!session.accessToken || !session.refreshToken || !session.user) {
      clearSession();
      return null;
    }

    return session;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
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
  };

  saveSession(updatedSession);
  return updatedSession;
}
