import express from 'express';
import cors from 'cors';
import publicRoutes from './routes/public.routes.js';
import billingRoutes from './routes/billing.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import { handleApi } from './routes/api.js';
import { env } from './config/env.js';
import operationsRoutes from './routes/operations.routes.js';

const app = express();

app.use(cors({
  origin: env.corsAllowedOriginList.length > 0 ? env.corsAllowedOriginList : ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-supabase-api-version']
}));

app.use(express.json());

app.use('/', handleApi);
app.use('/api/public', publicRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/operations', operationsRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
