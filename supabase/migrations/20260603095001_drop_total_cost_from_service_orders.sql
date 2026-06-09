-- Drop legacy total_cost after migrating all runtime consumers to final_cost.
-- Preconditions already validated:
-- 1) service_orders.final_cost is the canonical charged amount.
-- 2) service_orders.estimated_cost is the quote/estimate.
-- 3) total_cost was backfilled to final_cost before this migration.

alter table public.service_orders
  drop constraint if exists service_orders_total_cost_check;

drop view if exists public.view_service_orders_detail;

alter table public.service_orders
  drop column if exists total_cost;

create or replace view "public"."view_service_orders_detail" as  SELECT so.id,
    so.created_at,
    so.status,
    (so.device_info ->> 'brand'::text) AS brand,
    (so.device_info ->> 'model'::text) AS model,
    so.final_cost,
    c.name AS customer_name,
    c.phone AS customer_phone,
    so.tenant_id
   FROM (public.service_orders so
     LEFT JOIN public.customers c ON ((so.customer_id = c.id)));
