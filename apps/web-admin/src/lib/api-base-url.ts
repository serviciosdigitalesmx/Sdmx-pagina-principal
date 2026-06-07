const apiUrlCandidates = [
  process.env.NEXT_PUBLIC_API_URL,
  process.env.API_URL,
] as const;

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error('Empty API base URL');
  }

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withScheme);
  url.hash = '';
  url.search = '';
  url.pathname = url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '');
  return url.toString().replace(/\/$/, '');
}

export function resolveAdminApiBaseUrl(): string {
  for (const candidate of apiUrlCandidates) {
    if (candidate?.trim()) {
      return normalizeBaseUrl(candidate);
    }
  }

  throw new Error('Missing required environment variable: NEXT_PUBLIC_API_URL');
}
