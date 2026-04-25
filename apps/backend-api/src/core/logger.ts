import { env } from '../config/env.js';

type LogLevel = 'info' | 'error';

type LogPayload = {
  level: LogLevel;
  message: string;
  time: string;
} & Record<string, unknown>;

const shipToBetterStack = async (payload: LogPayload): Promise<void> => {
  if (!env.betterStackToken) return;

  try {
    await fetch(env.betterStackEndpoint, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.betterStackToken}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch {
    // never fail app execution because of observability transport issues
  }
};

const notifyErrorWebhook = async (payload: LogPayload): Promise<void> => {
  if (payload.level !== 'error' || !env.errorWebhookUrl) return;

  try {
    await fetch(env.errorWebhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch {
    // ignore alerting transport errors
  }
};

const log = (level: LogLevel, message: string, context?: Record<string, unknown>): void => {
  const payload: LogPayload = {
    level,
    message,
    time: new Date().toISOString(),
    ...(context ?? {})
  };

  // eslint-disable-next-line no-console
  console[level === 'error' ? 'error' : 'log'](JSON.stringify(payload));
  void shipToBetterStack(payload);
  void notifyErrorWebhook(payload);
};

export const logger = {
  info: (context: Record<string, unknown>, message: string) => log('info', message, context),
  error: (context: Record<string, unknown>, message: string) => log('error', message, context)
};
