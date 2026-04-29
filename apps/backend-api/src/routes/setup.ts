import { Router } from "express";
import { asyncHandler, AppError } from "../core/http.js";
import { logAuditEvent } from "../core/audit.js";
import { logger } from "../core/logger.js";
import { createSupabaseUserClient, supabaseAdmin } from "../core/supabase.js";
import { requireAuth } from "../middleware/auth.js";

export const setupRouter = Router();

setupRouter.post(
  "/init",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.context?.userId;
    if (!userId) throw new AppError("Missing user context", 401, "unauthorized");

    const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) throw new AppError("Missing bearer token", 401, "unauthorized");

    const { data: userResponse } = await supabaseAdmin.auth.getUser(token);
    const userMetadata = userResponse.user?.user_metadata ?? {};

    const userClient = createSupabaseUserClient(token);
    const { data, error } = await userClient.rpc("initialize_tenant", {
      p_tenant_name: typeof userMetadata.tenant_name === "string" ? userMetadata.tenant_name : typeof userMetadata.full_name === "string" ? userMetadata.full_name : "Taller",
      p_tenant_slug: typeof userMetadata.tenant_slug === "string" ? userMetadata.tenant_slug : null,
      p_description: typeof userMetadata.description === "string" ? userMetadata.description : null
    });
    if (error) throw new AppError(error.message, 500, "setup_init_failed");

    logger.info({ event: "setup.init", user_id: userId, tenant_id: data });
    void logAuditEvent({
      tenantId: data,
      actorUserId: userId,
      action: "initialize_tenant",
      resourceType: "tenant",
      resourceId: data
    });

    res.status(201).json({ success: true, tenantId: data });
  })
);
