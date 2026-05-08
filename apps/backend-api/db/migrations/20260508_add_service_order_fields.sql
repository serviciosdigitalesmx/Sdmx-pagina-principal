-- Migration: add service order extended fields
-- Date: 2026-05-08

ALTER TABLE IF EXISTS public.service_orders
  ADD COLUMN IF NOT EXISTS serial_number text,
  ADD COLUMN IF NOT EXISTS accessories text,
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS warranty_until timestamptz,
  ADD COLUMN IF NOT EXISTS evidence_metadata jsonb DEFAULT '[]'::jsonb;

-- Add index to improve tenant + folio lookups
CREATE INDEX IF NOT EXISTS idx_service_orders_tenant_folio ON public.service_orders (tenant_id, folio);
