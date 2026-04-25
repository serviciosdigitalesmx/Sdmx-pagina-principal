type LogLevel = 'info' | 'error';

const log = (level: LogLevel, message: string, context?: Record<string, unknown>): void => {
  const payload = {
    level,
    message,
    time: new Date().toISOString(),
    ...(context ?? {})
  };

  // Structured JSON log for observability backends.
  // eslint-disable-next-line no-console
  console[level === 'error' ? 'error' : 'log'](JSON.stringify(payload));
};

export const logger = {
  info: (context: Record<string, unknown>, message: string) => log('info', message, context),
  error: (context: Record<string, unknown>, message: string) => log('error', message, context)
};
