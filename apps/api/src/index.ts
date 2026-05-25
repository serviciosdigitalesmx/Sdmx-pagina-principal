import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth';
import ordersRouter from './routes/orders';
import requestsRouter from './routes/requests';
import financeRouter from './routes/finance';
import customersRouter from './routes/customers';
import inventoryRouter from './routes/inventory';
import branchesRouter from './routes/branches';
import suppliersRouter from './routes/suppliers';
import purchaseOrdersRouter from './routes/purchase-orders';
import securityRouter from './routes/security';
import publicRouter from './routes/public';
import procurementRouter from './routes/procurement';
import reportsRouter from './routes/reports';
import { getApiRoot, getHealth } from './controllers/meta';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const baseDomains = (process.env.BASE_DOMAIN ?? 'serviciosdigitalesmx.online,serviciosdigitalesmx.dev')
  .split(',')
  .map((d) => d.trim())
  .filter(Boolean);

const localhostOrigins = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
]);

const isVercelPreviewHostname = (hostname: string) => hostname.endsWith('.vercel.app');

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin.includes('vercel.app')) {
      return callback(null, true);
    }
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

    const isWildcardAllowed = baseDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));

    const isAllowed =
      allowedHostnames.includes(hostname) ||
      isWildcardAllowed ||
      isVercelPreviewHostname(hostname) ||
      localhostOrigins.has(hostname);
    if (isAllowed) {
      return callback(null, true);
    }

    return callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());

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
app.use('/api/:tenantSlug/branches', branchesRouter);
app.use('/api/branches', branchesRouter);
app.use('/api/:tenantSlug/suppliers', suppliersRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/:tenantSlug/purchase-orders', purchaseOrdersRouter);
app.use('/api/purchase-orders', purchaseOrdersRouter);
app.use('/api/:tenantSlug/security', securityRouter);
app.use('/api/security', securityRouter);
app.use('/api/:tenantSlug/procurement', procurementRouter);
app.use('/api/procurement', procurementRouter);
app.use('/api/:tenantSlug/reports', reportsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/public', publicRouter);

app.get('/', (req, res) => {
  const apiName = process.env.API_NAME ?? 'White-label API';
  res.send(`${apiName} is running`);
});
app.get('/api', getApiRoot);
app.get('/health', getHealth);
app.get('/healthz', getHealth);
app.get('/api/health', getHealth);

const isVercel = Boolean(process.env.VERCEL);

if (!isVercel) {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

export default app;
