import type { NextFunction, Request, Response } from "express";
import { AppError } from "../core/http.js";
import { logger } from "../core/logger.js";
import { supabaseAdmin } from "../core/supabase.js";

export async function resolveTenant(req: Request, _res: Response, next: NextFunction) {
  const userId = req.context?.userId;
  if (!userId) {
    return next(new AppError("Missing user context", 401, "unauthorized"));
  }

  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("tenant_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return next(new AppError(error.message, 500, "tenant_lookup_failed"));
  if (!data?.tenant_id) return next(new AppError("Tenant not found", 403, "tenant_not_found"));

  req.context = {
    userId,
    tenantId: data.tenant_id
  };
  logger.info({ user_id: userId, tenant_id: data.tenant_id, path: req.path, method: req.method });
  next();
}
