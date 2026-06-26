#!/usr/bin/env bash
set -euo pipefail

echo "== Git =="
git status --short --branch

echo
echo "== Typecheck API =="
pnpm --dir apps/api typecheck

echo
echo "== Verificar archivos T19 =="
test -f docs/ai-packets/T19-packet.md
test -f apps/api/src/services/tenant-plan-limits.ts
test -f docs/implementation-bundles/T19/README.md
test -f docs/implementation-bundles/T19/verify.sh
test -f docs/implementation-results/T19-result.md

echo
echo "== Verificar contenido T19 =="
rg -n "PLAN_REGISTRY|PLAN_LIMIT_EXCEEDED|tenant-plan-limits|listPlanDefinitions|getTenantLimitDiagnostics|assertTenantPlanLimit|/plans|/tenants/:tenantId/limits|limits/validate|users|sucursales|monthly_orders|storage_mb|not_implemented|unknown|403|requestId" \
  apps/api/src/services/tenant-plan-limits.ts \
  apps/api/src/routes/admin.ts \
  apps/api/src/controllers/admin.ts \
  apps/api/src/services/platform-admin.ts \
  apps/api/src/controllers/users.ts \
  docs/implementation-results/T19-result.md

echo
echo "== Confirmar que no hay migración T19 =="
if ls supabase/migrations/*_t19* 1>/dev/null 2>&1; then
  echo "Unexpected T19 migration found"
  exit 1
else
  echo "No T19 migration, OK"
fi

echo
echo "== Confirmar que no toca dominios prohibidos =="
if git diff --name-only | rg "apps/web-admin|apps/web-clientes|apps/web-public|apps/api/src/services/billing.ts|apps/api/src/services/billing-adapter.ts|apps/api/src/services/billing.ts|apps/api/src/controllers/public.ts|apps/api/src/routes/public.ts|supabase/migrations|package.json|pnpm-lock.yaml"; then
  echo "Unexpected forbidden changes found"
  exit 1
else
  echo "No forbidden changes, OK"
fi

echo
echo "== Confirmar que no se implementó cambio de plan/pagos =="
changed_api_files="$(git diff --name-only -- apps/api/src || true)"
if [ -n "$changed_api_files" ] && printf '%s\n' "$changed_api_files" | xargs rg -n "PATCH.*/plans|PATCH.*/plan|change.*plan|plan_id|tenants.plan|subscription_status.*update|MercadoPago|checkout|webhook" 2>/dev/null; then
  echo "Potential forbidden plan/payment change found; review manually"
  exit 1
else
  echo "No plan mutation/payment implementation, OK"
fi

echo
echo "== Diff stat =="
git diff --stat

echo
echo "T19 verify OK"
