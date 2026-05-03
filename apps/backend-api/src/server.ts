import express from 'express';
import cors from 'cors';
import publicRoutes from './routes/public.routes.js';
import billingRoutes from './routes/billing.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import { handleApi } from './routes/api.js';

const app = express();

app.use(cors({
  origin: [
    'https://sdmx-pagina-principal.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-supabase-api-version']
}));

app.use(express.json());

app.use('/', handleApi);
app.use('/api/public', publicRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/webhooks', webhookRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
