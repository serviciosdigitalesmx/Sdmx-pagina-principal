begin;

-- Añadir customer_id a finances
alter table public.finances
  add column if not exists customer_id uuid references public.customers(id) on delete set null;

-- Añadir campos de control a finances para prioridad 8
alter table public.finances
  add column if not exists status text not null default 'VALIDATED',
  add column if not exists movement_type text not null default 'expense';

commit;
