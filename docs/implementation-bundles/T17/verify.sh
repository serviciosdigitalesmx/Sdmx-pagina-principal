#!/usr/bin/env bash
set -euo pipefail

echo "== Git =="
git status --short --branch

echo
echo "== Typecheck API =="
pnpm --dir apps/api typecheck

echo
echo "== Verificar archivos T17 =="
test -f docs/ai-packets/T17-packet.md
test -f apps/api/src/routes/admin.ts
test -f apps/api/src/controllers/admin.ts
test -f apps/api/src/middleware/requireSuperAdmin.ts
test -f apps/api/src/services/platform-admin.ts
test -f docs/implementation-bundles/T17/README.md
test -f docs/implementation-bundles/T17/verify.sh
test -f docs/implementation-results/T17-result.md

echo
echo "== Verificar contenido T17 =="
rg -n "requireSuperAdmin|/api/admin|billing-exempt|supportReason|supportTicketId|billing_exempt|writeAuditLog|requestId|MASTER_TENANT_SLUG|MASTER_ACCOUNT_EMAIL|PLATFORM_ADMIN_EMAILS|tenant maestro|imperson" \
  apps/api/src/index.ts \
  apps/api/src/routes/admin.ts \
  apps/api/src/controllers/admin.ts \
  apps/api/src/middleware/requireSuperAdmin.ts \
  apps/api/src/services/platform-admin.ts \
  docs/implementation-results/T17-result.md

echo
echo "== Confirmar que no hay migración T17 =="
if ls supabase/migrations/*_t17* 1>/dev/null 2>&1; then
  echo "Unexpected T17 migration found"
  exit 1
else
  echo "No T17 migration, OK"
fi

echo
echo "== Confirmar que no toca dominios prohibidos =="
if git diff --name-only | rg "apps/web-admin|apps/web-clientes|apps/web-public|controllers/orders|routes/orders|controllers/reports|routes/reports|work-logs|productivity-reports|whatsapp|message_queue|pwa-push|notification_events|inventory|payment|refund|cash|mercado|supabase/migrations|package.json|pnpm-lock.yaml"; then
  echo "Unexpected cross-domain changes found"
  exit 1
else
  echo "No cross-domain changes, OK"
fi

echo
echo "== Diff stat =="
git diff --stat

echo
echo "T17 verify OK"
