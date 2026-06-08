#!/usr/bin/env bash
set -Eeuo pipefail

echo "== Instrumentando búsqueda del request post-login =="

echo ""
echo "1) Buscar api-client"
grep -Rni "class ApiClient\|fetch(\|apiClient\|Authorization\|getStoredToken" apps/web-admin/src/lib apps/web-admin/src/app | head -200 || true

echo ""
echo "2) Buscar bootstrap dashboard"
grep -Rni "dashboard\|getCurrentSession\|getStoredToken\|listOrders\|sucursales\|requests\|orders" apps/web-admin/src/app/dashboard apps/web-admin/src/lib | head -300 || true

echo ""
echo "3) Mostrar api-client"
if [ -f apps/web-admin/src/lib/api-client.ts ]; then
  nl -ba apps/web-admin/src/lib/api-client.ts | sed -n '1,260p'
fi

echo ""
echo "4) Mostrar dashboard inicial"
for f in \
  apps/web-admin/src/app/dashboard/page.tsx \
  apps/web-admin/src/app/dashboard/layout.tsx \
  apps/web-admin/src/components/dashboard/dashboard-shell.tsx \
  apps/web-admin/src/components/layout/dashboard-shell.tsx
do
  if [ -f "$f" ]; then
    echo "----- $f -----"
    nl -ba "$f" | sed -n '1,260p'
  fi
done

echo ""
echo "5) Buscar todos los fetch post-login"
grep -RniE "apiClient\.|fetch\(|/api/|orders|requests|sucursales|tenantSlug" apps/web-admin/src/app/dashboard apps/web-admin/src/components apps/web-admin/src/lib \
  | grep -v ".next" \
  | head -500 || true

echo ""
echo "== Ahora agrega temporalmente este parche manual en apps/web-admin/src/lib/api-client.ts =="
cat <<'PATCH'

/**
 * DEBUG TEMPORAL:
 * Antes de cada fetch, imprimir:
 * - method
 * - url
 * - hasToken
 * Después:
 * - status
 * - response body si falla
 *
 * Objetivo:
 * detectar la PRIMERA petición posterior al login que devuelve 500.
 */

PATCH

