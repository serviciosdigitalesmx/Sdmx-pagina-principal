import type { NextFunction, Request, Response } from "express";

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode = 500,
    public code = "internal_error"
  ) {
    super(message);
  }
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    void fn(req, res, next).catch(next);
  };
}
