#!/usr/bin/env bash
set -euo pipefail

export PATH="/Users/usuario/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin:/Users/usuario/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:${PATH}"

echo "== Git =="
git status --short --branch

echo
echo "== Typecheck API =="
pnpm --dir apps/api typecheck

echo
echo "== Verificar T10 =="
test -f docs/ai-packets/T10-packet.md
test -f docs/implementation-bundles/T10/README.md
test -f docs/implementation-bundles/T10/verify.sh
test -f docs/implementation-results/T10-result.md
ls supabase/migrations/*_t10_service_order_warranties.sql >/dev/null

rg -n "service_order_warranties|create_service_order_warranty_claim|update_service_order_warranty_claim_status" supabase/migrations
rg -n "getOrderWarrantySummary|createOrderWarrantyClaim|updateOrderWarrantyClaimStatus" apps/api/src/controllers/orders.ts apps/api/src/routes/orders.ts
rg -n "warranty.claim.created|warranty.claim.status_updated|warranty_claim_created|warranty_claim_status_updated" supabase/migrations apps/api/src

echo
echo "== Diff stat =="
git diff --stat

echo
echo "T10 verify OK"
