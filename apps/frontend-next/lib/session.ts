import type { SessionDto } from "@sdmx/contracts";

export type Session = SessionDto;

export const readSession = (): Session | null => {
  return null;
};

export const persistSession = (session: Session) => {
  return session;
};

export const clearSession = () => {
  return;
};

export const getAccessToken = (): string | null => {
  return null;
};

export const isSessionExpired = (inputSession?: Session | null): boolean => {
  const session = inputSession ?? null;

  if (!session?.accessToken) return true;
  if (!session.expiresAt) return false;

  const expires = Date.parse(session.expiresAt);
  if (!Number.isFinite(expires)) return false;

  return Date.now() >= expires;
};

export const isValidSession = (inputSession?: Session | null): boolean => {
  const session = inputSession ?? null;
  if (!session?.accessToken) return false;
  return !isSessionExpired(session);
};
