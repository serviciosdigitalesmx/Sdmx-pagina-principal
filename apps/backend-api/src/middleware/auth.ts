import type { NextFunction, Request, Response } from "express";
import { AppError } from "../core/http.js";
import { logger } from "../core/logger.js";
import { supabaseAdmin } from "../core/supabase.js";

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return next(new AppError("Missing bearer token", 401, "unauthorized"));
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return next(new AppError("Invalid token", 401, "unauthorized"));
  }

  req.context = {
    userId: data.user.id,
    tenantId: ""
  };

  logger.info({ user_id: data.user.id, path: req.path, method: req.method });

  next();
}
