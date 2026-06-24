#!/usr/bin/env bash
set -euo pipefail

echo "== Git =="
git status --short --branch

echo
echo "== Typecheck API =="
pnpm --dir apps/api typecheck

echo
echo "== Verificar T07 =="
test -f apps/api/src/controllers/inventory-reservations.ts
test -f docs/ai-packets/T07-packet.md
test -f docs/implementation-bundles/T07/README.md
test -f docs/implementation-bundles/T07/verify.sh
test -f docs/implementation-results/T07-result.md
ls supabase/migrations/*_t07_inventory_reservations.sql >/dev/null

rg -n "inventory_reservations|reserve_inventory_for_order|release_inventory_reservation" supabase/migrations apps/api/src
rg -n "inventory\\.reservation\\.created|inventory\\.reservation\\.released" supabase/migrations apps/api/src

echo
echo "== Diff stat =="
git diff --stat

echo
echo "T07 verify OK"
