import { Router } from "express";
import { z } from "zod";
import { asyncHandler, AppError } from "../core/http.js";
import { logAuditEvent } from "../core/audit.js";
import { supabaseAdmin } from "../core/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { requireActiveSubscription } from "../middleware/subscription.js";
import { requireFeature } from "../middleware/plan.js";

const expenseSchema = z.object({
  description: z.string().min(1),
  amount: z.number().nonnegative(),
  expenseDate: z.string().optional(),
  category: z.string().optional()
});

function queryValue(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

export const expensesRouter = Router();

expensesRouter.get(
  "/summary",
  requireAuth,
  requireActiveSubscription,
  requireFeature("expenses"),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const startDate = queryValue(req.query.startDate);
    const endDate = queryValue(req.query.endDate);

    let incomeQuery = supabaseAdmin
      .from("service_orders")
      .select("final_cost")
      .eq("tenant_id", tenantId)
      .eq("payment_registered", true);
    if (startDate) incomeQuery = incomeQuery.gte("created_at", String(startDate));
    if (endDate) incomeQuery = incomeQuery.lte("created_at", String(endDate));
    const { data: incomeRows, error: incomeError } = await incomeQuery;
    if (incomeError) throw new AppError(incomeError.message, 400, "expense_summary_income_failed");
    const totalIncome = incomeRows?.reduce((sum, row) => sum + Number(row.final_cost ?? 0), 0) ?? 0;

    let expenseQuery = supabaseAdmin
      .from("expenses")
      .select("amount")
      .eq("tenant_id", tenantId);
    if (startDate) expenseQuery = expenseQuery.gte("expense_date", String(startDate));
    if (endDate) expenseQuery = expenseQuery.lte("expense_date", String(endDate));
    const { data: expenseRows, error } = await expenseQuery;
    if (error) throw new AppError(error.message, 400, "expense_summary_failed");

    const totalExpenses = expenseRows?.reduce((sum, row) => sum + Number(row.amount ?? 0), 0) ?? 0;

    res.json({
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses
    });
  })
);

expensesRouter.get(
  "/categories/list",
  requireAuth,
  requireActiveSubscription,
  requireFeature("expenses"),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const { data, error } = await supabaseAdmin
      .from("expenses")
      .select("category")
      .eq("tenant_id", tenantId)
      .not("category", "is", null);
    if (error) throw new AppError(error.message, 400, "expense_category_list_failed");
    const categories = [...new Set((data ?? []).map((row) => row.category).filter(Boolean))];
    res.json(categories);
  })
);

expensesRouter.get(
  "/",
  requireAuth,
  requireActiveSubscription,
  requireFeature("expenses"),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const startDate = queryValue(req.query.startDate);
    const endDate = queryValue(req.query.endDate);
    const category = queryValue(req.query.category);
    let query = supabaseAdmin
      .from("expenses")
      .select("id, description, amount, expense_date, category, created_by, created_at")
      .eq("tenant_id", tenantId)
      .order("expense_date", { ascending: false });
    if (startDate) query = query.gte("expense_date", String(startDate));
    if (endDate) query = query.lte("expense_date", String(endDate));
    if (category) query = query.eq("category", String(category));
    const { data, error } = await query;
    if (error) throw new AppError(error.message, 400, "expense_list_failed");
    res.json({ data });
  })
);

expensesRouter.post(
  "/",
  requireAuth,
  requireActiveSubscription,
  requireFeature("expenses"),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const userId = req.context!.userId;
    const body = expenseSchema.parse(req.body);
    const { data, error } = await supabaseAdmin
      .from("expenses")
      .insert({
        tenant_id: tenantId,
        description: body.description,
        amount: body.amount,
        expense_date: body.expenseDate ?? new Date().toISOString().slice(0, 10),
        ...(body.category ? { category: body.category } : {}),
        created_by: userId
      })
      .select("id, description, amount, expense_date, category, created_by, created_at")
      .single();
    if (error) throw new AppError(error.message, 400, "expense_create_failed");
    void logAuditEvent({
      tenantId,
      actorUserId: userId,
      action: "create",
      resourceType: "expense",
      resourceId: data.id,
      metadata: { amount: body.amount, category: body.category ?? null }
    });
    res.status(201).json(data);
  })
);

expensesRouter.patch(
  "/:id",
  requireAuth,
  requireActiveSubscription,
  requireFeature("expenses"),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const body = expenseSchema.partial().parse(req.body);
    const { data, error } = await supabaseAdmin
      .from("expenses")
      .update({
        ...(body.description ? { description: body.description } : {}),
        ...(body.amount !== undefined ? { amount: body.amount } : {}),
        ...(body.expenseDate ? { expense_date: body.expenseDate } : {}),
        ...(body.category ? { category: body.category } : {})
      })
      .eq("tenant_id", tenantId)
      .eq("id", req.params.id)
      .select("id, description, amount, expense_date, category, created_by, created_at")
      .single();
    if (error) throw new AppError(error.message, 400, "expense_update_failed");
    void logAuditEvent({
      tenantId,
      actorUserId: req.context?.userId ?? null,
      action: "update",
      resourceType: "expense",
      resourceId: data.id,
      metadata: { amount: data.amount, category: data.category ?? null }
    });
    res.json(data);
  })
);

expensesRouter.delete(
  "/:id",
  requireAuth,
  requireActiveSubscription,
  requireFeature("expenses"),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const { error } = await supabaseAdmin.from("expenses").delete().eq("tenant_id", tenantId).eq("id", req.params.id);
    if (error) throw new AppError(error.message, 400, "expense_delete_failed");
    void logAuditEvent({
      tenantId,
      actorUserId: req.context?.userId ?? null,
      action: "delete",
      resourceType: "expense",
      resourceId: String(req.params.id)
    });
    res.status(204).send();
  })
);
