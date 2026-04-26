#!/bin/bash
set -euo pipefail

echo "=================================================="
echo " DIAGNÓSTICO SDMX / SR FIX"
echo "=================================================="
echo "Fecha: $(date)"
echo "Ruta: $(pwd)"
echo ""

echo "================ GIT ================"
git rev-parse --show-toplevel 2>/dev/null || true
git branch --show-current 2>/dev/null || true
git status --short 2>/dev/null || true
git log -1 --oneline 2>/dev/null || true
git remote -v 2>/dev/null || true
echo ""

echo "================ NODE / NPM ================"
node -v || true
npm -v || true
echo ""

echo "================ ESTRUCTURA ================"
find . -maxdepth 3 -type f \
  \( -name "package.json" -o -name "tsconfig.json" -o -name "next.config.*" -o -name "vercel.json" -o -name "render.yaml" -o -name ".env*" \) \
  | sort
echo ""

echo "================ PACKAGE ROOT ================"
cat package.json 2>/dev/null || echo "No package.json root"
echo ""

echo "================ FRONTEND package.json ================"
cat apps/frontend-next/package.json 2>/dev/null || echo "No frontend package.json"
echo ""

echo "================ BACKEND package.json ================"
cat apps/backend-api/package.json 2>/dev/null || echo "No backend package.json"
echo ""

echo "================ ENV FILES DETECTADOS ================"
find . -maxdepth 4 -type f -name ".env*" | sort
echo ""

echo "================ ENV KEYS SIN VALORES ================"
for f in $(find . -maxdepth 4 -type f -name ".env*" | sort); do
  echo "--- $f ---"
  sed -E 's/(=).*/=\[REDACTED\]/' "$f" || true
done
echo ""

echo "================ CONFIG FRONTEND ================"
echo "--- api.ts ---"
sed -n '1,220p' apps/frontend-next/lib/api.ts 2>/dev/null || true
echo ""
echo "--- session.ts ---"
sed -n '1,220p' apps/frontend-next/lib/session.ts 2>/dev/null || true
echo ""
echo "--- login page ---"
sed -n '1,260p' apps/frontend-next/app/login/page.tsx 2>/dev/null || true
echo ""
echo "--- dashboard page ---"
sed -n '1,260p' apps/frontend-next/app/dashboard/page.tsx 2>/dev/null || true
echo ""
echo "--- next.config.mjs ---"
cat apps/frontend-next/next.config.mjs 2>/dev/null || true
echo ""
echo "--- vercel.json ---"
cat apps/frontend-next/vercel.json 2>/dev/null || true
echo ""

echo "================ CONFIG BACKEND ================"
echo "--- env.ts ---"
sed -n '1,220p' apps/backend-api/src/config/env.ts 2>/dev/null || true
echo ""
echo "--- server.ts ---"
sed -n '1,260p' apps/backend-api/src/server.ts 2>/dev/null || true
echo ""
echo "--- routes/api.ts ---"
sed -n '1,320p' apps/backend-api/src/routes/api.ts 2>/dev/null || true
echo ""
echo "--- app-service.ts ---"
sed -n '1,360p' apps/backend-api/src/domain/app-service.ts 2>/dev/null || true
echo ""
echo "--- supabase.ts ---"
sed -n '1,220p' apps/backend-api/src/services/supabase.ts 2>/dev/null || true
echo ""

echo "================ SUPABASE LOCAL CONFIG ================"
supabase --version 2>/dev/null || true
cat supabase/config.toml 2>/dev/null || true
echo ""
echo "--- migrations ---"
ls -lah supabase/migrations 2>/dev/null || true
echo ""
echo "--- ultima migracion ---"
sed -n '1,260p' supabase/migrations/20260424_200000_multitenant_alignment.sql 2>/dev/null || true
echo ""

echo "================ BUSQUEDA DE VARIABLES EN CODIGO ================"
grep -RIn --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist --exclude-dir=.git \
  "NEXT_PUBLIC_API\|SUPABASE\|CORS\|process.env\|localhost\|onrender\|vercel.app" \
  apps packages supabase 2>/dev/null || true
echo ""

echo "================ BUILD / TYPECHECK ================"
echo "--- backend build ---"
npm --prefix apps/backend-api run build || true
echo ""
echo "--- frontend build ---"
npm --prefix apps/frontend-next run build || true
echo ""

echo "================ ENDPOINTS PRODUCCION ================"
echo "--- backend health esperado ---"
curl -i --max-time 20 https://sdmx-backend-api.onrender.com/api/health || true
echo ""
echo "--- backend root ---"
curl -i --max-time 20 https://sdmx-backend-api.onrender.com/ || true
echo ""
echo "--- frontend principal ---"
curl -I --max-time 20 https://sdmx-pagina-principal.vercel.app || true
echo ""
echo "--- frontend login ---"
curl -I --max-time 20 https://sdmx-pagina-principal.vercel.app/login || true
echo ""
echo "--- frontend dashboard ---"
curl -I --max-time 20 https://sdmx-pagina-principal.vercel.app/dashboard || true
echo ""

echo "================ RESUMEN RAPIDO ================"
echo "Repo: $(pwd)"
echo "Branch: $(git branch --show-current 2>/dev/null || echo 'N/A')"
echo "Commit: $(git log -1 --oneline 2>/dev/null || echo 'N/A')"
echo "Supabase ref esperado: wydspsvcvbwcmumynkwx"
echo "Frontend prod esperado: https://sdmx-pagina-principal.vercel.app"
echo "Backend prod esperado: https://sdmx-backend-api.onrender.com"
echo "=================================================="
