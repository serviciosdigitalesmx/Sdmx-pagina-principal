import { Router } from "express";
import { z } from "zod";
import { asyncHandler, AppError } from "../core/http.js";
import { logAuditEvent } from "../core/audit.js";
import { logger } from "../core/logger.js";
import { supabaseAdmin } from "../core/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { requireActiveSubscription } from "../middleware/subscription.js";
import { requireFeature } from "../middleware/plan.js";

const itemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative()
});

const createSchema = z.object({
  supplierId: z.string().uuid(),
  orderDate: z.string().optional(),
  items: z.array(itemSchema).min(1)
});

const receiveSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive()
    })
  ).optional()
});

function queryValue(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

export const purchaseOrdersRouter = Router();

purchaseOrdersRouter.get(
  "/",
  requireAuth,
  requireActiveSubscription,
  requireFeature("purchase_orders"),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const { data, error, count } = await supabaseAdmin
      .from("purchase_orders")
      .select("id, folio_oc, supplier:suppliers(name), order_date, status, total", { count: "exact" })
      .eq("tenant_id", tenantId)
      .order("order_date", { ascending: false });
    if (error) throw new AppError(error.message, 400, "purchase_order_list_failed");
    res.json({ data, total: count });
  })
);

purchaseOrdersRouter.get(
  "/:id",
  requireAuth,
  requireActiveSubscription,
  requireFeature("purchase_orders"),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const { data: order, error: orderError } = await supabaseAdmin
      .from("purchase_orders")
      .select("id, folio_oc, supplier:suppliers(name), order_date, status, total")
      .eq("tenant_id", tenantId)
      .eq("id", req.params.id)
      .single();
    if (orderError || !order) throw new AppError("Purchase order not found", 404, "purchase_order_not_found");

    const { data: items, error: itemsError } = await supabaseAdmin
      .from("purchase_order_items")
      .select("id, product:products(name), quantity, unit_price")
      .eq("tenant_id", tenantId)
      .eq("purchase_order_id", req.params.id);
    if (itemsError) throw new AppError(itemsError.message, 400, "purchase_order_items_failed");

    res.json({ ...order, items: items ?? [] });
  })
);

purchaseOrdersRouter.post(
  "/",
  requireAuth,
  requireActiveSubscription,
  requireFeature("purchase_orders"),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const body = createSchema.parse(req.body);
    const total = body.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    const { data: order, error: orderError } = await supabaseAdmin
      .from("purchase_orders")
      .insert({
        tenant_id: tenantId,
        folio_oc: "TEMP",
        supplier_id: body.supplierId,
        order_date: body.orderDate ?? new Date().toISOString().slice(0, 10),
        status: "pendiente",
        total
      })
      .select("id")
      .single();
    if (orderError || !order) throw new AppError(orderError?.message ?? "purchase order create failed", 400, "purchase_order_create_failed");

    const folioOc = `OC-${order.id.slice(0, 8).toUpperCase()}`;
    const { error: folioError } = await supabaseAdmin
      .from("purchase_orders")
      .update({ folio_oc: folioOc })
      .eq("tenant_id", tenantId)
      .eq("id", order.id);
    if (folioError) throw new AppError(folioError.message, 400, "purchase_order_folio_failed");

    const items = body.items.map((item) => ({
      tenant_id: tenantId,
      purchase_order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice
    }));
    const { error: itemsError } = await supabaseAdmin.from("purchase_order_items").insert(items);
    if (itemsError) throw new AppError(itemsError.message, 400, "purchase_order_items_create_failed");

    logger.info({ event: "purchase_order.created", tenant_id: tenantId, purchase_order_id: order.id });
    void logAuditEvent({
      tenantId,
      actorUserId: req.context?.userId ?? null,
      action: "create",
      resourceType: "purchase_order",
      resourceId: order.id,
      metadata: { folio_oc: folioOc, total }
    });
    res.status(201).json({ id: order.id, folio_oc: folioOc, total });
  })
);

purchaseOrdersRouter.post(
  "/:id/receive",
  requireAuth,
  requireActiveSubscription,
  requireFeature("purchase_orders"),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const body = receiveSchema.parse(req.body ?? {});
    const { data: order, error: orderError } = await supabaseAdmin
      .from("purchase_orders")
      .select("id, status")
      .eq("tenant_id", tenantId)
      .eq("id", req.params.id)
      .single();
    if (orderError || !order) throw new AppError("Purchase order not found", 404, "purchase_order_not_found");
    if (!["pendiente", "parcial"].includes(order.status)) throw new AppError("Purchase order already processed", 422, "purchase_order_invalid_state");

    const { data: items, error: itemsError } = await supabaseAdmin
      .from("purchase_order_items")
      .select("id, product_id, quantity, received_quantity")
      .eq("tenant_id", tenantId)
      .eq("purchase_order_id", req.params.id);
    if (itemsError) throw new AppError(itemsError.message, 400, "purchase_order_items_failed");

    const receiveMap = new Map<string, number>();
    if (body.items?.length) {
      for (const item of body.items) receiveMap.set(item.productId, item.quantity);
    }

    let hasPendingRemaining = false;

    for (const item of items ?? []) {
      const desiredReceive = receiveMap.size ? receiveMap.get(item.product_id) ?? 0 : item.quantity - item.received_quantity;
      if (desiredReceive <= 0) {
        if (item.received_quantity < item.quantity) hasPendingRemaining = true;
        continue;
      }
      const remaining = item.quantity - item.received_quantity;
      if (desiredReceive > remaining) throw new AppError("Receive quantity exceeds remaining amount", 422, "purchase_order_receive_overflow");

      const { data: product, error: productError } = await supabaseAdmin
        .from("products")
        .select("stock")
        .eq("tenant_id", tenantId)
        .eq("id", item.product_id)
        .single();
      if (productError || !product) throw new AppError("Product not found", 404, "product_not_found");

      const { error: stockError } = await supabaseAdmin
        .from("products")
        .update({ stock: product.stock + desiredReceive, updated_at: new Date().toISOString() })
        .eq("tenant_id", tenantId)
        .eq("id", item.product_id);
      if (stockError) throw new AppError(stockError.message, 400, "stock_update_failed");

      const { error: movementError } = await supabaseAdmin.from("inventory_movements").insert({
        tenant_id: tenantId,
        product_id: item.product_id,
        movement_type: "purchase_in",
        quantity: desiredReceive,
        reference_type: "purchase_order",
        reference_id: req.params.id,
        created_by: req.context?.userId ?? null
      });
      if (movementError) throw new AppError(movementError.message, 500, "inventory_movement_failed");

      const { error: itemUpdateError } = await supabaseAdmin
        .from("purchase_order_items")
        .update({ received_quantity: item.received_quantity + desiredReceive })
        .eq("tenant_id", tenantId)
        .eq("id", item.id);
      if (itemUpdateError) throw new AppError(itemUpdateError.message, 400, "purchase_order_item_receive_failed");

      if (item.received_quantity + desiredReceive < item.quantity) hasPendingRemaining = true;
    }

    const { error: updateError } = await supabaseAdmin
      .from("purchase_orders")
      .update({ status: hasPendingRemaining ? "parcial" : "recibido" })
      .eq("tenant_id", tenantId)
      .eq("id", req.params.id);
    if (updateError) throw new AppError(updateError.message, 400, "purchase_order_update_failed");

    void logAuditEvent({
      tenantId,
      actorUserId: req.context?.userId ?? null,
      action: hasPendingRemaining ? "partial_receive" : "receive",
      resourceType: "purchase_order",
      resourceId: String(req.params.id),
      metadata: { status: hasPendingRemaining ? "parcial" : "recibido" }
    });

    res.json({ message: hasPendingRemaining ? "Orden recibida parcialmente, stock actualizado" : "Orden recibida, stock actualizado" });
  })
);
