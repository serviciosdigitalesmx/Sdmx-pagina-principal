import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./core/env.js";
import { AppError } from "./core/http.js";
import { logger } from "./core/logger.js";
import { billingRouter } from "./routes/billing.js";
import { adminRouter } from "./routes/admin.js";
import { checklistTemplatesRouter } from "./routes/checklist-templates.js";
import { customersRouter } from "./routes/customers.js";
import { expensesRouter } from "./routes/expenses.js";
import { healthRouter } from "./routes/health.js";
import { inventoryRouter } from "./routes/inventory.js";
import { ordersRouter } from "./routes/orders.js";
import { orderPdfRouter } from "./routes/order-pdf.js";
import { purchaseOrdersRouter } from "./routes/purchase-orders.js";
import { reportsRouter } from "./routes/reports.js";
import { setupRouter } from "./routes/setup.js";
import { techniciansRouter } from "./routes/technicians.js";
import { suppliersRouter } from "./routes/suppliers.js";
import { publicRouter } from "./routes/public.js";
import { tenantSettingsRouter } from "./routes/tenant-settings.js";
import { webhooksRouter } from "./routes/webhooks.js";

const app = express();

const allowedOrigins = env.ALLOWED_ORIGINS?.split(",").map((origin) => origin.trim()).filter(Boolean) ?? [];

if (env.TRUST_PROXY) {
  app.set("trust proxy", env.TRUST_PROXY);
}

app.use(helmet());
app.use(morgan("combined"));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0) return callback(null, true);
      const normalizedOrigin = origin.trim();
      const isAllowed =
        allowedOrigins.includes(normalizedOrigin) ||
        (normalizedOrigin.endsWith(".vercel.app") && allowedOrigins.includes("https://*.vercel.app"));
      return isAllowed ? callback(null, true) : callback(new AppError("Origin not allowed", 403, "cors_not_allowed"));
    },
    credentials: true
  })
);

app.use("/health", healthRouter);
app.use("/api/health", healthRouter);
app.use("/api/setup", setupRouter);
app.use("/v1/setup", setupRouter);
app.use("/v1/webhooks", webhooksRouter);
app.use("/v1/public", publicRouter);
app.use(express.json());
app.use("/v1/orders", ordersRouter);
app.use("/v1/orders/pdf", orderPdfRouter);
app.use("/v1/checklist-templates", checklistTemplatesRouter);
app.use("/v1/customers", customersRouter);
app.use("/v1/suppliers", suppliersRouter);
app.use("/v1/technicians", techniciansRouter);
app.use("/v1/inventory", inventoryRouter);
app.use("/v1/purchase-orders", purchaseOrdersRouter);
app.use("/v1/expenses", expensesRouter);
app.use("/v1/reports", reportsRouter);
app.use("/v1/tenant-settings", tenantSettingsRouter);
app.use("/v1/admin", adminRouter);
app.use("/v1/billing", billingRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const error = err instanceof AppError ? err : new AppError("Unexpected error");
  logger.error({ code: error.code, message: error.message, statusCode: error.statusCode });
  res.status(error.statusCode).json({
    error: {
      code: error.code,
      message: error.message
    }
  });
});

app.listen(env.PORT, () => {
  process.stdout.write(`backend-api listening on ${env.PORT}\n`);
});
