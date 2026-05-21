import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth';
import ordersRouter from './routes/orders';
import financeRouter from './routes/finance';
import customersRouter from './routes/customers';
import inventoryRouter from './routes/inventory';
import suppliersRouter from './routes/suppliers';
import securityRouter from './routes/security';
import publicRouter from './routes/public';
import procurementRouter from './routes/procurement';
import reportsRouter from './routes/reports';

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
app.use('/api/:tenantId/auth', authRouter); // Support for tenant-prefixed auth

app.use('/api/:tenantId/orders', ordersRouter);
app.use('/api/orders', ordersRouter);

app.use('/api/:tenantId/finance', financeRouter);
app.use('/api/finance', financeRouter);

app.use('/api/:tenantId/customers', customersRouter);
app.use('/api/customers', customersRouter);

app.use('/api/:tenantId/inventory', inventoryRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/:tenantId/suppliers', suppliersRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/:tenantId/security', securityRouter);
app.use('/api/security', securityRouter);
app.use('/api/:tenantId/procurement', procurementRouter);
app.use('/api/procurement', procurementRouter);
app.use('/api/:tenantId/reports', reportsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/public', publicRouter);

app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  const apiName = process.env.API_NAME ?? 'White-label API';
  res.send(`${apiName} is running`);
});

const isVercel = Boolean(process.env.VERCEL);

if (!isVercel) {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

export default app;
