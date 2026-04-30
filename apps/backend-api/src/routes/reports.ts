import { Router } from "express";
import { asyncHandler, AppError } from "../core/http.js";
import { supabaseAdmin } from "../core/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { requireActiveSubscription } from "../middleware/subscription.js";
import { requireFeature } from "../middleware/plan.js";

export const reportsRouter = Router();

reportsRouter.get(
  "/operational",
  requireAuth,
  requireActiveSubscription,
  requireFeature("reports"),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const { startDate, endDate } = req.query;

    let query = supabaseAdmin
      .from("service_orders")
      .select("id, status, created_at", { count: "exact" })
      .eq("tenant_id", tenantId);
    if (startDate) query = query.gte("created_at", String(startDate));
    if (endDate) query = query.lte("created_at", String(endDate));

    const { data, error, count } = await query;
    if (error) throw new AppError(error.message, 400, "report_operational_failed");

    const statusBreakdown = (data ?? []).reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = (acc[row.status] ?? 0) + 1;
      return acc;
    }, {});

    res.json({
      summary: {
        totalOrders: count ?? 0,
        statusBreakdown
      },
      orders: data ?? []
    });
  })
);

reportsRouter.get(
  "/operational/csv",
  requireAuth,
  requireActiveSubscription,
  requireFeature("reports"),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const { data, error } = await supabaseAdmin
      .from("service_orders")
      .select("id, status, vehicle_plate, description, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (error) throw new AppError(error.message, 400, "report_csv_failed");

    const rows = [
      ["ID", "Status", "Placa", "Descripcion", "Fecha"],
      ...(data ?? []).map((row) => [
        row.id,
        row.status,
        row.vehicle_plate,
        row.description,
        row.created_at
      ])
    ];

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=report-${Date.now()}.csv`);
    res.send(rows.map((row) => row.join(",")).join("\n"));
  })
);
