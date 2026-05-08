import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { extractTenant } from './middleware/auth.js';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

app.get('/health', (req, res) => res.json({ status: 'v3-online', tenant_isolation: true }));

// Endpoint de Órdenes con aislamiento total
app.post('/api/orders', extractTenant, async (req, res) => {
  const { customer_id, device_info, problem_description, total_cost } = req.body;

  const { data, error } = await supabase
    .from('service_orders')
    .insert([{
      tenant_id: req.tenantId,
      customer_id,
      device_info,
      problem_description,
      total_cost: total_cost || 0
    }])
    .select();

  if (error) return res.status(400).json(error);
  res.status(201).json(data[0]);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend SaaS corriendo en puerto ${PORT}`));
