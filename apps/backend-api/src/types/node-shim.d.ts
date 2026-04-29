import type { IncomingMessage, ServerResponse } from 'node:http';

declare const process: {
  env: Record<string, string | undefined>;
};

declare const Buffer: {
  from(value: unknown): Uint8Array;
  concat(chunks: Uint8Array[]): Uint8Array;
};

declare module 'node:http' {
  export function createServer(handler: (incoming: IncomingMessage, outgoing: ServerResponse) => void | Promise<void>): {
    listen(port: number, cb?: () => void): void;
  };
}
