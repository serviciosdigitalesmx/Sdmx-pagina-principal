import type { NextFunction, Request, Response } from "express";
import { AppError } from "../core/http.js";

export function requireFeature(feature: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const limits = req.context?.subscription?.plans?.limits;
    if (!limits) return next(new AppError("Plan limits unavailable", 500, "plan_limits_missing"));

    const allowed = limits[feature];
    if (allowed === false) {
      return next(new AppError(`Feature "${String(feature)}" requires upgrade`, 403, "upgrade_required"));
    }

    next();
  };
}
