import { Router } from "express";
import { z } from "zod";
import { asyncHandler, AppError } from "../core/http.js";
import { logAuditEvent } from "../core/audit.js";
import { supabaseAdmin } from "../core/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { requireActiveSubscription } from "../middleware/subscription.js";
import { requireFeature } from "../middleware/plan.js";

const productSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  supplierId: z.string().uuid().optional().nullable(),
  stock: z.number().int().nonnegative().default(0),
  minStockAlert: z.number().int().nonnegative().default(0),
  purchasePrice: z.number().nonnegative().default(0),
  salePrice: z.number().nonnegative().default(0)
});

const stockAdjustSchema = z.object({
  quantity: z.number().int().positive(),
  type: z.enum(["add", "remove"])
});

function queryValue(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

export const inventoryRouter = Router();

inventoryRouter.get(
  "/",
  requireAuth,
  requireActiveSubscription,
  requireFeature("inventory"),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("id, name, category, supplier:suppliers(name), stock, min_stock_alert, purchase_price, sale_price, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (error) throw new AppError(error.message, 400, "inventory_list_failed");
    res.json({ products: data });
  })
);

inventoryRouter.post(
  "/",
  requireAuth,
  requireActiveSubscription,
  requireFeature("inventory"),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const body = productSchema.parse(req.body);
    const { data, error } = await supabaseAdmin
      .from("products")
      .insert({
        tenant_id: tenantId,
        name: body.name,
        category: body.category,
        supplier_id: body.supplierId ?? null,
        stock: body.stock,
        min_stock_alert: body.minStockAlert,
        purchase_price: body.purchasePrice,
        sale_price: body.salePrice
      })
      .select("id, name, category, supplier:suppliers(name), stock, min_stock_alert, purchase_price, sale_price, created_at")
      .single();
    if (error) throw new AppError(error.message, 400, "inventory_create_failed");
    void logAuditEvent({
      tenantId,
      actorUserId: req.context?.userId ?? null,
      action: "create",
      resourceType: "product",
      resourceId: data.id,
      metadata: { name: data.name, category: data.category }
    });
    res.status(201).json({ product: data });
  })
);

inventoryRouter.get(
  "/alerts/low-stock",
  requireAuth,
  requireActiveSubscription,
  requireFeature("inventory"),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("id, name, stock, min_stock_alert")
      .eq("tenant_id", tenantId)
      .order("name", { ascending: true });
    if (error) throw new AppError(error.message, 400, "inventory_alerts_failed");
    const products = (data ?? []).filter((product) => product.stock <= product.min_stock_alert);
    res.json({ products });
  })
);

inventoryRouter.patch(
  "/:id",
  requireAuth,
  requireActiveSubscription,
  requireFeature("inventory"),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const body = productSchema.partial().parse(req.body);
    const { data, error } = await supabaseAdmin
      .from("products")
      .update({
        ...(body.name ? { name: body.name } : {}),
        ...(body.category ? { category: body.category } : {}),
        ...(body.supplierId !== undefined ? { supplier_id: body.supplierId } : {}),
        ...(body.stock !== undefined ? { stock: body.stock } : {}),
        ...(body.minStockAlert !== undefined ? { min_stock_alert: body.minStockAlert } : {}),
        ...(body.purchasePrice !== undefined ? { purchase_price: body.purchasePrice } : {}),
        ...(body.salePrice !== undefined ? { sale_price: body.salePrice } : {})
      })
      .eq("tenant_id", tenantId)
      .eq("id", req.params.id)
      .select("id, name, category, supplier:suppliers(name), stock, min_stock_alert, purchase_price, sale_price, created_at")
      .single();
    if (error) throw new AppError(error.message, 400, "inventory_update_failed");
    void logAuditEvent({
      tenantId,
      actorUserId: req.context?.userId ?? null,
      action: "update",
      resourceType: "product",
      resourceId: data.id,
      metadata: { name: data.name, category: data.category }
    });
    res.json({ product: data });
  })
);

inventoryRouter.post(
  "/:id/stock",
  requireAuth,
  requireActiveSubscription,
  requireFeature("inventory"),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const { quantity, type } = stockAdjustSchema.parse(req.body);

    const { data: product, error: fetchError } = await supabaseAdmin
      .from("products")
      .select("stock")
      .eq("tenant_id", tenantId)
      .eq("id", req.params.id)
      .single();
    if (fetchError || !product) throw new AppError("Product not found", 404, "product_not_found");

    const nextStock = type === "add" ? product.stock + quantity : product.stock - quantity;
    if (nextStock < 0) throw new AppError("Stock insufficient", 422, "stock_insufficient");

    const { error } = await supabaseAdmin
      .from("products")
      .update({ stock: nextStock, updated_at: new Date().toISOString() })
      .eq("tenant_id", tenantId)
      .eq("id", req.params.id);
    if (error) throw new AppError(error.message, 400, "stock_update_failed");

    const { error: movementError } = await supabaseAdmin.from("inventory_movements").insert({
      tenant_id: tenantId,
      product_id: req.params.id,
      movement_type: type === "add" ? "add" : "remove",
      quantity,
      reference_type: "manual_adjustment",
      reference_id: req.params.id,
      created_by: req.context?.userId ?? null
    });
    if (movementError) throw new AppError(movementError.message, 500, "inventory_movement_failed");

    void logAuditEvent({
      tenantId,
      actorUserId: req.context?.userId ?? null,
      action: "update_stock",
      resourceType: "product",
      resourceId: String(req.params.id),
      metadata: { quantity, type, next_stock: nextStock }
    });

    res.json({ message: "Stock updated", stock: nextStock });
  })
);

inventoryRouter.get(
  "/movements",
  requireAuth,
  requireActiveSubscription,
  requireFeature("inventory"),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const { data, error } = await supabaseAdmin
      .from("inventory_movements")
      .select("id, movement_type, quantity, reference_type, reference_id, created_at, product:products(name)")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new AppError(error.message, 400, "inventory_movements_failed");
    res.json({ movements: data ?? [] });
  })
);
