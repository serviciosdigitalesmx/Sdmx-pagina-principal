type LogPrimitive = string | number | boolean | null | undefined;
type LogPayload = Record<string, LogPrimitive | LogPrimitive[] | { [key: string]: LogPrimitive }>;

const toPayload = (context: unknown): LogPayload => {
  if (context && typeof context === 'object' && !Array.isArray(context)) {
    return context as LogPayload;
  }
  return { context: context as LogPrimitive };
};

export const logger = {
  info: (context: unknown, message: string) => {
    console.log(JSON.stringify({ level: 'info', message, ...toPayload(context) }));
  },
  error: (context: unknown, message: string) => {
    console.error(JSON.stringify({ level: 'error', message, ...toPayload(context) }));
  }
};
