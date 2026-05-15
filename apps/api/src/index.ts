import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth';
import ordersRouter from './routes/orders';
import financeRouter from './routes/finance';
import customersRouter from './routes/customers';
import inventoryRouter from './routes/inventory';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const allowedOrigins = Array.from(
  new Set(
    (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
      .split(',')
      .concat('https://sdmx-pagina-principal.vercel.app')
      .map((origin) => origin.trim())
      .filter(Boolean),
  ),
);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/:tenantId/orders', ordersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/:tenantId/finance', financeRouter);
app.use('/api/finance', financeRouter);
app.use('/api/:tenantId/customers', customersRouter);
app.use('/api/customers', customersRouter);
app.use('/api/:tenantId/inventory', inventoryRouter);
app.use('/api/inventory', inventoryRouter);

app.get('/', (req, res) => {
  const apiName = process.env.API_NAME ?? 'White-label API';
  res.send(`${apiName} is running`);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
