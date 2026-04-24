import type { SessionDto } from '@contracts/index';

const STORAGE_KEYS = {
  accessToken: 'sdmx_access_token',
  refreshToken: 'sdmx_refresh_token',
  expiresAt: 'sdmx_expires_at',
  session: 'sdmx_session'
} as const;

export const isValidSession = (value: unknown): value is SessionDto => {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  return typeof v.accessToken === 'string'
    && typeof v.refreshToken === 'string'
    && typeof v.expiresAt === 'string'
    && !!v.user
    && !!v.shop
    && Array.isArray(v.roles)
    && Array.isArray(v.permissions);
};

export const persistSession = (session: SessionDto): void => {
  localStorage.setItem(STORAGE_KEYS.accessToken, session.accessToken);
  localStorage.setItem(STORAGE_KEYS.refreshToken, session.refreshToken);
  localStorage.setItem(STORAGE_KEYS.expiresAt, session.expiresAt);
  localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
};

export const clearSession = (): void => {
  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
  localStorage.removeItem(STORAGE_KEYS.expiresAt);
  localStorage.removeItem(STORAGE_KEYS.session);
};

export const readSession = (): SessionDto | null => {
  const raw = localStorage.getItem(STORAGE_KEYS.session);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return isValidSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const isSessionExpired = (session: SessionDto): boolean => {
  const expiresAt = Date.parse(session.expiresAt);
  return Number.isNaN(expiresAt) || expiresAt <= Date.now();
};

export const getAccessToken = (): string | null => {
  const session = readSession();
  if (!session) return null;
  if (isSessionExpired(session)) return null;
  return session.accessToken;
};
