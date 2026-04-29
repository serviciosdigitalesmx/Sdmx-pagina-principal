insert into public.plans (code, name, stripe_price_id, price_mxn, max_orders, limits)
values
  ('basic', 'Básico', null, 30000, 50, '{"orders": true, "customers": true, "inventory": true, "suppliers": true, "purchase_orders": false, "expenses": false, "reports": false, "storage_mb": 500}'::jsonb),
  ('pro', 'Pro', null, 45000, 200, '{"orders": true, "customers": true, "inventory": true, "suppliers": true, "purchase_orders": true, "expenses": true, "reports": true, "storage_mb": 2000}'::jsonb),
  ('max', 'Max', null, 60000, null, '{"orders": true, "customers": true, "inventory": true, "suppliers": true, "purchase_orders": true, "expenses": true, "reports": true, "storage_mb": 10000}'::jsonb)
on conflict (code) do update set
  name = excluded.name,
  stripe_price_id = excluded.stripe_price_id,
  price_mxn = excluded.price_mxn,
  max_orders = excluded.max_orders,
  limits = excluded.limits;
