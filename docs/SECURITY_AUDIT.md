# Auditoría de Seguridad - Credenciales y Variables de Entorno

**Fecha:** 8 de mayo de 2026
**Estado:** ✅ Seguro (Sin credenciales públicas en Git)

## Hallazgos

### ✅ Puntos Positivos

1. **Archivos .env excluidos de Git**
   - `.gitignore` contiene `*.env` y `.env.*` (excepto `.env.example`)
   - No hay archivos `.env` siendo rastreados en Git
   - Las credenciales reales están protegidas

2. **Variables de Entorno Centralizadas**
   - Backend usa `apps/backend-api/src/config/env.ts` para centralizar todas las variables
   - Las claves se leen desde `process.env` consistentemente
   - Validación de variables requeridas en tiempo de ejecución

3. **Configuración de Supabase Segura**
   - URLs y keys se cargan desde variables de entorno
   - No hay tokens JWT hardcodeados en el código fuente
   - Uso correcto de `SUPABASE_SERVICE_ROLE_KEY` solo en backend

### ⚠️ Hallazgos / Cambios Realizados

#### 1. URLs Hardcodeadas en CORS
**Archivo:** `apps/backend-api/src/server.ts`
**Problema:** URL de Vercel (`https://sdmx-pagina-principal.vercel.app`) hardcodeada en origen CORS
**Solución:** ✅ Refactorizado para usar `env.corsAllowedOriginList` desde variables de entorno
```typescript
// Antes: origin: ['https://sdmx-pagina-principal.vercel.app', 'http://localhost:3000']
// Ahora: origin: env.corsAllowedOriginList
```

#### 2. Archivos .env.example Incompletos
**Archivos Afectados:**
- `.env.example`
- `apps/backend-api/.env.example`
- `apps/frontend-next/.env.example`

**Solución:** ✅ Actualizados con:
- Comentarios de secciones para mejor organización
- Placeholders claros en lugar de valores vacíos
- Documentación de variables requeridas vs opcionales
- Notas de seguridad (e.g., qué no debe exponerse en cliente)

### 📋 Variables de Entorno Documentadas

#### Backend API (`apps/backend-api/.env.example`)
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (Solo backend)
- ✅ `JWT_SECRET`
- ✅ `CORS_ALLOWED_ORIGINS`
- ✅ `MP_ACCESS_TOKEN` (Mercado Pago)
- ✅ `MP_WEBHOOK_SECRET`
- ✅ `APP_URL`, `WEBHOOK_BASE_URL`, `BACKEND_PUBLIC_URL`
- ✅ `PORT`, `NODE_ENV`, `TRIAL_DAYS`

#### Frontend (`apps/frontend-next/.env.example`)
- ✅ `NEXT_PUBLIC_API_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_URL` (Solo anon key)
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `NEXT_PUBLIC_APP_URL`
- ✅ Variables Stripe (opcional)

### 🔍 Auditoría de Credenciales Actuales

**En `.env` (no en Git):**
```
✅ SUPABASE_URL=https://wydspsvcvbwcmumynkwx.supabase.co
✅ SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (Token real, protegido en .env)
✅ MERCADO_PAGO_ACCESS_TOKEN=TEST-... (Token de prueba)
✅ FRONTEND_URL=https://sdmx-pagina-principal.vercel.app
✅ CORS_ALLOWED_ORIGINS configurado correctamente
```

**En código fuente:**
```
✅ No hay URLs de API hardcodeadas
✅ No hay tokens de autenticación
✅ No hay keys de Supabase
✅ No hay credenciales de terceros
```

**En `.env.local`:**
```
✅ Archivos locales no en Git (.gitignore)
✅ Contienen URLs públicas permitidas (frontend, Render API)
```

## Checklist de Seguridad

- [x] No hay credenciales en código fuente
- [x] Archivos `.env` excluidos de Git
- [x] Variables de entorno centralizadas en backend
- [x] URLs dinámicas desde `process.env`
- [x] CORS configurado desde variables
- [x] `.env.example` documentado y completo
- [x] Separación: claves públicas vs privadas
- [x] Backend usa `SERVICE_ROLE_KEY` (privado)
- [x] Frontend usa `ANON_KEY` (público)

## Instrucciones para Producción

### 1. Asignar Variables de Entorno
Configurar en plataformas de deployment:
- **Vercel (Frontend):** Agregar `NEXT_PUBLIC_*` variables en Project Settings
- **Render (Backend):** Agregar variables en Environment
- **Supabase:** Usar proyecto de producción

### 2. Validar Variables Críticas
```bash
# Backend
echo $SUPABASE_SERVICE_ROLE_KEY  # ✅ Debe tener valor
echo $CORS_ALLOWED_ORIGINS       # ✅ Dominio de producción

# Frontend (públicas, OK en cliente)
echo $NEXT_PUBLIC_SUPABASE_URL    # ✅ URL de Supabase prod
```

### 3. Nuca Compartir Credenciales
- ❌ No enviar `.env` por email
- ❌ No copiar-pegar en tickets/Slack
- ❌ No compartir `SERVICE_ROLE_KEY`
- ✅ Usar gestor de secrets (1Password, Vault, etc.)

## Conclusión

**Estado:** ✅ **SEGURO**

El proyecto sigue buenas prácticas de seguridad:
1. No hay credenciales expuestas en Git
2. Variables de entorno correctamente implementadas
3. Separación clara entre claves públicas y privadas
4. CORS dinámico desde variables

Los cambios realizados refuerzan aún más la seguridad centralizando todas las configuraciones.
