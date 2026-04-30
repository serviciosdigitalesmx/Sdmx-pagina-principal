export const logger = {
  info: (payload: Record<string, unknown>) => {
    process.stdout.write(`${JSON.stringify({ level: "info", ...payload })}\n`);
  },
  error: (payload: Record<string, unknown>) => {
    process.stderr.write(`${JSON.stringify({ level: "error", ...payload })}\n`);
  }
};
