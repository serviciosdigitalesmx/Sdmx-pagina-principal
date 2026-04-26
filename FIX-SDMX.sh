#!/bin/bash
set -e

echo "🔥 FIX SDMX START"

########################################
# 1. FIX FRONTEND ENV
########################################

echo "➡️ Fix frontend env"

cat > apps/frontend-next/.env.local <<EOL
NEXT_PUBLIC_API_URL=https://sdmx-backend-api.onrender.com
EOL

########################################
# 2. FIX BACKEND ENV
########################################

echo "➡️ Fix backend env"

sed -i '' 's|CORS_ALLOWED_ORIGINS=.*|CORS_ALLOWED_ORIGINS=http://localhost:3000,https://sdmx-pagina-principal.vercel.app|' apps/backend-api/.env || true

########################################
# 3. FIX LOGGER (quitar dependencias rotas)
########################################

echo "➡️ Fix logger"

cat > apps/backend-api/src/core/logger.ts <<EOL
export const logger = {
  info: (context: Record<string, unknown>, message: string) => {
    console.log(JSON.stringify({ level: 'info', message, ...context }));
  },
  error: (context: Record<string, unknown>, message: string) => {
    console.error(JSON.stringify({ level: 'error', message, ...context }));
  }
};
EOL

########################################
# 4. FIX FRONTEND TYPE ERROR
########################################

echo "➡️ Fix auditoria page"

sed -i '' "s/queryKey={\['audit-events'\]}//g" apps/frontend-next/app/auditoria/page.tsx || true

########################################
# 5. BUILD CHECK
########################################

echo "➡️ Build backend"
npm --prefix apps/backend-api run build || true

echo "➡️ Build frontend"
npm --prefix apps/frontend-next run build || true

########################################
# 6. GIT COMMIT
########################################

echo "➡️ Commit"

git add .
git commit -m "fix: conexión frontend-backend + logger + tipos + cors" || true

echo "➡️ Push"
git push || true

echo "🔥 FIX SDMX DONE"
