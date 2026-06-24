#!/usr/bin/env bash
set -euo pipefail

echo "== Git =="
git status --short --branch

echo
echo "== Typecheck API =="
pnpm --dir apps/api typecheck

echo
echo "== Verificar T08 =="
test -f docs/ai-packets/T08-packet.md
test -f docs/implementation-bundles/T08/README.md
test -f docs/implementation-bundles/T08/verify.sh
test -f docs/implementation-results/T08-result.md
ls supabase/migrations/*_t08_consume_inventory_reservations.sql >/dev/null

rg -n "consume_inventory_reservation|inventory\\.reservation\\.consumed|service_order_consumed" supabase/migrations apps/api/src
rg -n "stock_current = stock_current -|consumed_quantity|inventory_movements_tenant_consumption_idempotency_idx" supabase/migrations
rg -n "reservations/:id/consume|consumeInventoryReservation" apps/api/src/routes/inventory.ts apps/api/src/controllers/inventory-reservations.ts

echo
echo "== Diff stat =="
git diff --stat

echo
echo "T08 verify OK"
