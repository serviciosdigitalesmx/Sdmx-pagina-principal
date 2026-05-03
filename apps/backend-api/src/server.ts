import express from 'express';
import cors from 'cors';
import publicRoutes from './routes/public.routes.js';
import billingRoutes from './routes/billing.routes.js';
import webhookRoutes from './routes/webhook.routes.js';

const app = express();

// Configuración de CORS Blindada
app.use(cors({
  origin: [
    'https://sdmx-pagina-principal.vercel.app',
    'http://localhost:3000' // Para tus pruebas locales
  ],
  credentials: true, // OBLIGATORIO para que viajen las cookies/refresh_token
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-supabase-api-version']
}));

app.use(express.json());

app.use('/api/public', publicRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/webhooks', webhookRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
