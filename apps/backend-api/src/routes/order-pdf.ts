import { Router } from "express";
import { z } from "zod";
import { asyncHandler, AppError } from "../core/http.js";
import { buildOrderPdfBuffer, type OrderPdfKind } from "../core/order-pdf.js";
import { storeOrderDocument } from "../core/order-documents.js";
import { supabaseAdmin } from "../core/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { requireActiveSubscription } from "../middleware/subscription.js";
import { requireFeature } from "../middleware/plan.js";

const kindSchema = z.enum(["ingreso", "diagnostico", "presupuesto", "entrega"]).default("ingreso");

export const orderPdfRouter = Router();

orderPdfRouter.get(
  "/:folio",
  requireAuth,
  requireActiveSubscription,
  requireFeature("orders"),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const kind = kindSchema.parse(req.query.kind);
    const { data: order, error } = await supabaseAdmin
      .from("service_orders")
      .select("id, folio, status, vehicle_plate, device_type, device_brand, device_model, accessories, reported_failure, diagnosis, internal_notes, public_notes, estimated_cost, final_cost, payment_registered, promised_date, completion_date, delivery_date, photos_urls, created_at, customer:customers(full_name, phone)")
      .eq("tenant_id", tenantId)
      .eq("folio", req.params.folio)
      .single();

    if (error || !order) throw new AppError("Order not found", 404, "order_not_found");
    const { data: checklistItems } = await supabaseAdmin
      .from("order_checklist_items")
      .select("label, checked, sort_order")
      .eq("tenant_id", tenantId)
      .eq("order_id", order.id)
      .order("sort_order", { ascending: true });

    const buffer = await buildOrderPdfBuffer(order as Parameters<typeof buildOrderPdfBuffer>[0], checklistItems ?? [], kind as OrderPdfKind);
    await storeOrderDocument({
      tenantId,
      orderId: order.id,
      folio: order.folio,
      documentType: kind as OrderPdfKind,
      pdfBuffer: buffer
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=orden-${order.folio}-${kind}.pdf`);
    res.send(buffer);
  })
);
