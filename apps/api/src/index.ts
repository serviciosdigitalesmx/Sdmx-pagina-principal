import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth';
import ordersRouter from './routes/orders';
import requestsRouter from './routes/requests';
import financeRouter from './routes/finance';
import customersRouter from './routes/customers';
import inventoryRouter from './routes/inventory';
import sucursalesRouter from './routes/sucursales';
import suppliersRouter from './routes/suppliers';
import purchaseOrdersRouter from './routes/purchase-orders';
import tasksRouter from './routes/tasks';
import usersRouter from './routes/users';
import securityRouter from './routes/security';
import publicRouter from './routes/public';
import procurementRouter from './routes/procurement';
import reportsRouter from './routes/reports';
import stockAlertsRouter from './routes/stock-alerts';
import movivendorRouter from './routes/movivendor';
import pwaRouter from './routes/pwa';
import billingRouter, { webhookRouter } from './routes/billing';
import { getApiRoot, getHealth } from './controllers/meta';
import { listAuditLogs } from './controllers/security';
import { requireAuth } from './middleware/auth';
import { requireTenantBillingActive } from './middleware/tenantBilling';
import { attachTenantCapabilities, requireTenantModule } from './middleware/tenantCapabilities';
import { requireRole } from './middleware/requireRole';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
app.set('trust proxy', 1);
const port = process.env.PORT || 4000;
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const localhostOrigins = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
]);
const vercelHostSuffixes = ['vercel.app', 'vercel-sh.com'];
const defaultProductionOrigins = [
  process.env.APP_URL?.trim(),
  process.env.NEXT_PUBLIC_WEB_PUBLIC_URL?.trim(),
  process.env.NEXT_PUBLIC_WEB_ADMIN_URL?.trim(),
  'https://serviciosdigitalesmx.online',
  'https://app.serviciosdigitalesmx.online',
  'https://api.serviciosdigitalesmx.online',
].filter((origin): origin is string => Boolean(origin));

function isAllowedCorsOrigin(origin: string | undefined) {
  if (!origin) return false;

  let hostname = '';
  try {
    hostname = new URL(origin).hostname;
  } catch {
    hostname = origin || '';
  }

  const allowedHostnames = allowedOrigins.map((o) => {
    try {
      return new URL(o).hostname;
    } catch {
      return o;
    }
  });

  const productionHostnames = defaultProductionOrigins.map((o) => {
    try {
      return new URL(o).hostname;
    } catch {
      return o;
    }
  });

  const isVercelHostname = vercelHostSuffixes.some((suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`));

  return (
    allowedHostnames.includes(hostname) ||
    productionHostnames.includes(hostname) ||
    localhostOrigins.has(hostname) ||
    isVercelHostname
  );
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || isAllowedCorsOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
}));
app.use(express.json());

app.options('*', cors({
  origin: (origin, callback) => {
    if (!origin || isAllowedCorsOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
}));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/:tenantSlug/auth', authRouter); // Support for tenant-prefixed auth

app.use('/api/:tenantSlug/orders', ordersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/:tenantSlug/requests', requestsRouter);
app.use('/api/requests', requestsRouter);

app.use('/api/:tenantSlug/finance', financeRouter);
app.use('/api/finance', financeRouter);

app.use('/api/:tenantSlug/customers', customersRouter);
app.use('/api/customers', customersRouter);

app.use('/api/:tenantSlug/inventory', inventoryRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/:tenantSlug/sucursales', sucursalesRouter);
app.use('/api/sucursales', sucursalesRouter);
app.use('/api/:tenantSlug/suppliers', suppliersRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/:tenantSlug/purchase-orders', purchaseOrdersRouter);
app.use('/api/purchase-orders', purchaseOrdersRouter);
app.use('/api/:tenantSlug/tasks', tasksRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/:tenantSlug/users', usersRouter);
app.use('/api/users', usersRouter);
app.use('/api/:tenantSlug/security', securityRouter);
app.use('/api/security', securityRouter);
app.get('/api/audit', requireAuth, requireTenantBillingActive, attachTenantCapabilities, requireTenantModule('security'), requireRole('owner'), listAuditLogs);
app.use('/api/:tenantSlug/procurement', procurementRouter);
app.use('/api/procurement', procurementRouter);
app.use('/api/:tenantSlug/reports', reportsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/:tenantSlug/stock-alerts', stockAlertsRouter);
app.use('/api/stock-alerts', stockAlertsRouter);
app.use('/api/:tenantSlug/pwa', pwaRouter);
app.use('/api/pwa', pwaRouter);
app.use('/api/:tenantSlug/movivendor', movivendorRouter);
app.use('/api/movivendor', movivendorRouter);
app.use('/api/:tenantSlug/billing', billingRouter);
app.use('/api/billing', billingRouter);
app.use('/api/webhooks', webhookRouter);
app.use('/api/public', publicRouter);

app.get('/', (req, res) => {
  const apiName = process.env.API_NAME ?? 'White-label API';
  res.send(`${apiName} is running`);
});
app.get('/api', getApiRoot);
app.get('/health', getHealth);
app.get('/healthz', getHealth);
app.get('/api/health', getHealth);
app.use(errorHandler);

const isVercel = Boolean(process.env.VERCEL);

if (!isVercel) {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

export default app;
