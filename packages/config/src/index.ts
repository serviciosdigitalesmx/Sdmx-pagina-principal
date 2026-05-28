const fail = (name: string): never => {
  throw new Error(`Missing required environment variable: ${name}`);
};

export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) return fail(name);
  return value;
}

export function optionalEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

export function resolveApiBaseUrl(): string {
  const candidates = [
    optionalEnv("NEXT_PUBLIC_API_URL"),
    optionalEnv("NEXT_PUBLIC_API_BASE_URL"),
    optionalEnv("NEXT_PUBLIC_RENDER_API_URL"),
  ].filter((value): value is string => Boolean(value));

  if (candidates.length === 0) {
    return fail("NEXT_PUBLIC_API_URL");
  }

  try {
    return new URL(candidates[0]).toString().replace(/\/$/, "");
  } catch {
    throw new Error("Invalid API base URL in environment");
  }
}
