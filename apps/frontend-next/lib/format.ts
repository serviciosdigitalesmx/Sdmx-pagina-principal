export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    maximumFractionDigits: 0
  }).format(value);
}

export function formatDate(value: string | number | Date, options: Intl.DateTimeFormatOptions = {}): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('es-MX', {
    timeZone: 'UTC',
    ...options
  }).format(date);
}
