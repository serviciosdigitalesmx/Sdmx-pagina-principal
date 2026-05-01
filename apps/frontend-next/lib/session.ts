import type { SessionDto } from "@sdmx/contracts";

export type Session = SessionDto;

const KEY = 'session';

export const readSession = (): Session | null => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const persistSession = (session: Session) => {
  const { accessToken, refreshToken, ...safeSession } = session;
  localStorage.setItem(KEY, JSON.stringify(safeSession));
};

export const clearSession = () => {
  localStorage.removeItem(KEY);
};

export const getAccessToken = (): string | null => {
  return null;
};

export const isSessionExpired = (inputSession?: Session | null): boolean => {
  const session = inputSession ?? readSession();

  if (!session?.accessToken) return true;
  if (!session.expiresAt) return false;

  const expires = Date.parse(session.expiresAt);
  if (!Number.isFinite(expires)) return false;

  return Date.now() >= expires;
};

export const isValidSession = (inputSession?: Session | null): boolean => {
  const session = inputSession ?? readSession();
  if (!session?.accessToken) return false;
  return !isSessionExpired(session);
};
