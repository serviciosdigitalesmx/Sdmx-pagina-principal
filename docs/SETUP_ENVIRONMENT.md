# Guía de Configuración de Variables de Entorno

Este documento explica cómo configurar correctamente las variables de entorno para desarrollo y producción.

## ⚠️ Regla de Oro: Nada de Credenciales en GitHub

1. **Archivos `.env` nunca van a Git**
   - Están excluidos en `.gitignore`
   - Solo `.env.example` va a Git

2. **Si accidentalmente expones una credencial:**
   - Rota inmediatamente la key/token en Supabase, Stripe, MercadoPago, etc.
   - Usa `git filter-branch` o `BFG Repo-Cleaner` para limpiar el historio
   - Notifica al equipo

## Configuración Local (Desarrollo)

### Requisitos Previos
- Node.js 18+
- git
- Cuenta Supabase con proyecto activo

### 1. Backend API (`apps/backend-api`)

Copia el archivo de ejemplo y completa con credenciales:
```bash
cp .env.example .env.local
```

Edita `.env.local` con credenciales de tu proyecto Supabase:
```env
# Obtén estos valores de Supabase Dashboard > Settings > API
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=eyJhbGci... (copy de Supabase anon key)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (copy de Supabase service key)

# JWT para tokens internos (generar algo aleatorio)
JWT_SECRET=your-super-secret-key-at-least-32-chars-long

# CORS - Para desarrollo local
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# URLs locales
APP_URL=http://localhost:3000
BACKEND_PUBLIC_URL=http://localhost:5001
WEBHOOK_BASE_URL=http://localhost:5001

# Opcional: MercadoPago (TEST tokens para desarrollo)
MP_ACCESS_TOKEN=TEST-your-token-here
MP_WEBHOOK_SECRET=webhook-secret-here

# Puerto
PORT=5001
NODE_ENV=development
TRIAL_DAYS=15
```

**Obtener valores de Supabase:**
1. Ve a [supabase.com](https://supabase.com)
2. Abre tu proyecto
3. Settings > API
4. Copia `Project URL` → `SUPABASE_URL`
5. Copia `anon public` → `SUPABASE_ANON_KEY`
6. Copia `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Frontend (`apps/frontend-next`)

Copia el archivo de ejemplo:
```bash
cp .env.example .env.local
```

Edita `.env.local`:
```env
# API Backend (donde corre tu servidor Node)
NEXT_PUBLIC_API_URL=http://localhost:5001

# Supabase (mismos valores del backend, son públicos)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci... (mismo anon key del backend)

# URL de la app (para redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Opcional: Stripe (si usas Stripe en lugar de MercadoPago)
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
# NEXT_PUBLIC_STRIPE_PRICE_BASIC=price_...
# NEXT_PUBLIC_STRIPE_PRICE_PRO=price_...
```

### 3. Ejecutar Localmente

```bash
# Terminal 1: Backend API
cd apps/backend-api
npm install
npm run dev
# → Escucha en http://localhost:5001

# Terminal 2: Frontend
cd apps/frontend-next
npm install
npm run dev
# → Escucha en http://localhost:3000
```

## Configuración Producción

### Variables Críticas (nunca exponer)
- `SUPABASE_SERVICE_ROLE_KEY` → Solo en backend secreto
- `JWT_SECRET` → Usar valor seguro en producción
- `MP_WEBHOOK_SECRET` → Key secreta de webhooks

### Variables Públicas (OK en cliente)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon, solo lectura autorizada)
- `NEXT_PUBLIC_APP_URL`

### En Vercel (Frontend)

1. Ve a Project Settings > Environment Variables
2. Agrega las variables `NEXT_PUBLIC_*`:
   ```
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```
3. Deploy → Next.js injecta las variables en el build

### En Render (Backend)

1. Dashboard > Select Service > Environment
2. Agrega todas las variables (incluyendo `SERVICE_ROLE_KEY`):
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=eyJhbGci...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... ← SECRETO
   JWT_SECRET=your-production-secret
   CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://*.yourdomain.com
   MP_ACCESS_TOKEN=PROD-your-token
   MP_WEBHOOK_SECRET=secret
   ...etc
   ```
3. Deploy redeploy automáticamente

### En Supabase (Producción)

1. Crea un nuevo proyecto (no uses dev)
2. Settings > API → Anota las URLs y keys
3. Usa ese proyecto URL/keys en variables de entorno

## Validar Configuración

### Backend
```bash
npm run dev
# Si falta variable requerida, verás error:
# Error: Missing required env var: SUPABASE_URL
```

### Frontend
```bash
npm run dev
# Si variables públicas faltan, Next.js dará warning pero correrá
# En build, las variables se "baken" en el JS
```

## ¿Accidentalmente Expusiste una Credencial?

### Pasos Inmediatos:
1. **Rota la credencial en su servicio:**
   - Supabase: Settings > API > Regenerate Keys
   - Stripe: API Keys > Create Restricted Key
   - MercadoPago: Regenerar token

2. **Elimina del historial de Git:**
   ```bash
   # BFG es más rápido que filter-branch
   bfg --delete-files .env
   git reflog expire --expire=now --all && git gc --prune=now
   git push --force
   ```

3. **Notifica al equipo**

4. **Actualiza** todas las variables en dev, staging, prod

## Estructura de Archivos

```
proyecto/
├── .env.example              ← Plantilla (en Git ✅)
├── .env                       ← Real, secreto (Git ignora ❌)
├── .env.local                 ← Alternativa local (Git ignora ❌)
├── apps/
│   ├── backend-api/
│   │   ├── .env.example      ← Plantilla (en Git ✅)
│   │   ├── .env              ← Real (Git ignora ❌)
│   │   └── .env.local        ← Alternativa (Git ignora ❌)
│   └── frontend-next/
│       ├── .env.example      ← Plantilla (en Git ✅)
│       ├── .env.local        ← Real, variables públicas
│       └── .env.production   ← Para build de prod
└── .gitignore               ← Excluye *.env
```

## Mejores Prácticas

1. ✅ **Usar** `.env.example` con placeholders claros
2. ✅ **Copiar** `.env.example` a `.env` localmente
3. ✅ **Documentar** qué variable es requerida/opcional
4. ✅ **Separar** keys públicas vs privadas
5. ✅ **Rotar** credenciales regularmente
6. ✅ **Usar** gestor de secrets para producción (AWS Secrets Manager, HashiCorp Vault, etc.)
7. ❌ **NO** compartir `.env` por email/Slack/Teams
8. ❌ **NO** commitar `.env` a Git
9. ❌ **NO** loguear valores de `process.env`
10. ❌ **NO** hardcodear URLs o keys en código

## Troubleshooting

### Error: "Missing required env var: SUPABASE_URL"
→ Falta variable en `.env.local`

### Error: "CORS policy: No 'Access-Control-Allow-Origin' header"
→ `CORS_ALLOWED_ORIGINS` no contiene tu origen (frontend URL)

### Supabase rechaza request con 401
→ Token expiró o `SUPABASE_ANON_KEY` incorrecto

### Frontend no conecta con backend
→ `NEXT_PUBLIC_API_URL` apunta a URL incorrecta

## Referencias

- [Supabase: API Keys & URL](https://supabase.com/docs/guides/api)
- [Node.js: process.env](https://nodejs.org/en/docs/guides/working-with-environment-variables/)
- [Next.js: Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [12 Factor App: Config](https://12factor.net/config)
