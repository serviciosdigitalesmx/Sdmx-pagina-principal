#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(pwd)"
OUT="$ROOT/auth-debug-report-$(date +%Y%m%d-%H%M%S).txt"

ADMIN_URL="${ADMIN_URL:-http://localhost:3003}"
API_URL="${API_URL:-http://localhost:3001}"
TENANT_SLUG="${TENANT_SLUG:-otriz-valle}"

redact() {
  sed -E \
    -e 's/(service_role|anon|jwt|token|secret|password|key|authorization|cookie)[^=:" ]*([=:" ]+)[^ ,}]*/\1\2[REDACTED]/Ig' \
    -e 's/eyJ[a-zA-Z0-9._-]+/[JWT_REDACTED]/g'
}

section() {
  echo ""
  echo "============================================================"
  echo "$1"
  echo "============================================================"
}

run() {
  section "$1"
  shift
  {
    echo "\$ $*"
    "$@" 2>&1 || true
  } | redact
}

{
section "AUTH DEBUG REPORT"
echo "Fecha: $(date)"
echo "Root: $ROOT"
echo "ADMIN_URL: $ADMIN_URL"
echo "API_URL: $API_URL"
echo "TENANT_SLUG: $TENANT_SLUG"

section "1) Git / rama / último commit"
git status --short 2>&1 || true
git branch --show-current 2>&1 || true
git log -1 --oneline 2>&1 || true

section "2) Versiones"
node -v 2>&1 || true
pnpm -v 2>&1 || true
npm -v 2>&1 || true

section "3) Variables detectadas sin exponer valores"
for f in \
  ".env" \
  ".env.local" \
  "apps/api/.env" \
  "apps/api/.env.local" \
  "apps/web-admin/.env" \
  "apps/web-admin/.env.local"
do
  if [ -f "$f" ]; then
    echo ""
    echo "Archivo: $f"
    grep -nE '^[A-Z0-9_]+=' "$f" | sed -E 's/(=).+$/=[SET]/'
  else
    echo "No existe: $f"
  fi
done

section "4) Buscar mensaje exacto del frontend"
grep -Rni "No pudimos convertir la sesión\|convertir la sesión\|auth/exchange\|exchangeSupabaseSession\|loginWithSupabase" apps/web-admin/src apps/api/src 2>/dev/null || true

section "5) Controlador exchange completo"
if [ -f apps/api/src/controllers/auth.controller.ts ]; then
  nl -ba apps/api/src/controllers/auth.controller.ts | sed -n '400,630p'
fi

section "6) Ruta auth backend"
if [ -f apps/api/src/routes/auth.ts ]; then
  nl -ba apps/api/src/routes/auth.ts
fi

section "7) Buscar middleware auth / tenant / cookies"
grep -RniE "attachAuthCookie|cookie|credentials|cors|origin|sameSite|secure|domain|tenantResolver|validateTenant|authMiddleware|requireAuth|security_sessions|EXCHANGE_" apps/api/src apps/web-admin/src 2>/dev/null || true

section "8) Archivos críticos frontend auth"
for f in \
  "apps/web-admin/src/lib/auth.ts" \
  "apps/web-admin/src/lib/session.ts" \
  "apps/web-admin/src/app/login/page.tsx" \
  "apps/web-admin/src/middleware.ts"
do
  if [ -f "$f" ]; then
    echo ""
    echo "----- $f -----"
    nl -ba "$f" | sed -n '1,260p'
  fi
done

section "9) Health checks"
echo "API health:"
curl -kisS "$API_URL/health" 2>&1 | head -80 || true

echo ""
echo "Admin:"
curl -kisS "$ADMIN_URL" 2>&1 | head -80 || true

section "10) Preflight CORS real hacia exchange"
curl -kisS -X OPTIONS "$API_URL/api/auth/exchange" \
  -H "Origin: $ADMIN_URL" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,authorization" \
  2>&1 | head -120 || true

section "11) POST exchange con token inválido controlado"
curl -kisS -X POST "$API_URL/api/auth/exchange" \
  -H "Origin: $ADMIN_URL" \
  -H "Content-Type: application/json" \
  -d '{"accessToken":"test-invalid-token"}' \
  2>&1 | head -160 || true

section "12) Probar rutas probables post-login SIN cookie"
for path in \
  "/api/auth/me" \
  "/api/me" \
  "/api/session" \
  "/api/$TENANT_SLUG/me" \
  "/api/$TENANT_SLUG/dashboard" \
  "/api/$TENANT_SLUG/orders" \
  "/api/$TENANT_SLUG/solicitudes" \
  "/api/$TENANT_SLUG/sucursales"
do
  echo ""
  echo "### GET $API_URL$path"
  curl -kisS "$API_URL$path" \
    -H "Origin: $ADMIN_URL" \
    2>&1 | head -80 || true
done

section "13) Buscar endpoints existentes en backend"
find apps/api/src -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "*/node_modules/*" \
  -print0 | xargs -0 grep -nE "router\.(get|post|put|patch|delete)|app\.use|app\.(get|post|put|patch|delete)" 2>/dev/null || true

section "14) Buscar posibles throws/500"
grep -RniE "status\(500\)|Internal server error|throw new Error|catch \(error\)|catch\(error\)|EXCHANGE_500_FULL|console\.error" apps/api/src apps/web-admin/src 2>/dev/null || true

section "15) Service Worker / PWA"
for f in \
  "apps/web-admin/src/components/pwa/pwa-bootstrap.tsx" \
  "apps/web-admin/public/sw.js" \
  "apps/web-admin/src/app/api/pwa/sw.js/route.ts"
do
  if [ -f "$f" ]; then
    echo ""
    echo "----- $f -----"
    grep -nE "serviceWorker|unregister|register|/api|NetworkFirst|CacheFirst|StaleWhileRevalidate|fetch|Cache-Control" "$f" || true
  fi
done

section "16) Typecheck/build rápido"
pnpm --dir apps/api typecheck 2>&1 || true
pnpm --dir apps/web-admin typecheck 2>&1 || true

section "17) Diagnóstico automático"
echo "Revisar arriba:"
echo "- Si POST /api/auth/exchange con token inválido devuelve 401, el endpoint está vivo."
echo "- Si devuelve 500 con token inválido, el controlador/middleware truena antes de validar token."
echo "- Si exchange real ya da 200 pero dashboard falla, el culpable es una petición posterior."
echo "- Si CORS no devuelve Access-Control-Allow-Credentials cuando usas cookies, revisar CORS."
echo "- Si cookie no llega en requests posteriores, revisar SameSite/Secure/Domain/credentials: include."
echo "- Si una ruta tenant devuelve 500 sin cookie, revisar middleware auth/tenant."

} | tee "$OUT"

echo ""
echo "REPORTE GENERADO:"
echo "$OUT"
