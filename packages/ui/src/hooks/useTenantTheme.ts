export type TenantTheme = {
  primary: string;
  secondary: string;
  accent: string;
};

export function useTenantTheme(): TenantTheme {
  return {
    primary: 'var(--tenant-primary)',
    secondary: 'var(--tenant-secondary)',
    accent: 'var(--tenant-accent)',
  };
}
