# Plan de Validación - Corrección tenant.slug

**Fecha:** 3 de junio de 2026  
**Cambio:** Corrección de referencias `tenant.tenant_slug` → `tenant.slug` en `auth.controller.ts`  
**Commit:** 8656cc4a  
**Estado Render:** Despliegue en progreso (espera 2-3 minutos)

---

## ✅ Lo que fue arreglado

### Problema identificado
- Función `register()` usaba `tenant.tenant_slug` en respuesta JSON
- Función `completeGoogleRegistration()` usaba `tenant.tenant_slug` en respuesta JSON
- RPC `create_tenant_transaction` retorna `slug`, NO `tenant_slug`
- Esto causaba respuestas JSON con campos undefined → navegadores rechazaban → HTTP 502

### Cambios aplicados
```
- Línea 174 (register):     tenant.tenant_slug → tenantSlug
- Línea 178 (register):     tenant.tenant_slug → tenantSlug
- Línea 295 (Google):       tenant.tenant_slug → tenantSlug
- Línea 302 (Google):       tenant.tenant_slug → tenantSlug
```

---

## 🧪 Protocolo de Validación

### FASE 1: Endpoint HTTP (5 min)

#### Test 1.1: Registro básico
```bash
curl -X POST https://api.serviciosdigitalesmx.online/auth/register \
  -H "Content-Type: application/json" \
  -H "Origin: https://serviciosdigitalesmx.online" \
  -d '{
    "workshopName": "Test Taller '$(date +%s)'",
    "email": "test-'$(date +%s)'@example.com",
    "password": "Test1234567",
    "phone": "5551234567",
    "origin": "https://serviciosdigitalesmx.online"
  }'
```

**Esperado:**
```json
{
  "token": "eyJ...",
  "tenant": {
    "id": "uuid-...",
    "slug": "test-taller-...",
    "trialExpiresAt": "2026-06-13T..."
  },
  "billing": {
    "subscriptionStatus": "trial",
    "billingExempt": false
  },
  "redirectUrl": "https://serviciosdigitalesmx.online/onboarding/success?tenant=test-taller-...&token=eyJ..."
}
```

**HTTP Status:** `201 Created` ✅  
**NO:** `502 Bad Gateway` ❌

---

#### Test 1.2: Validar respuesta JSON
Si el curl devuelve 201, valida que:
- ✅ `response.token` existe y no está vacío
- ✅ `response.tenant.id` existe (UUID)
- ✅ `response.tenant.slug` existe y es string
- ✅ `response.tenant.trialExpiresAt` existe (ISO date)
- ✅ `response.billing.subscriptionStatus === "trial"`
- ✅ `response.redirectUrl` contiene el slug
- ✅ `response.redirectUrl` contiene el token

---

### FASE 2: JWT Validation (5 min)

#### Test 2.1: Decodificar JWT
Toma el token de Test 1.1 y decodifica en https://jwt.io/

**Esperado payload:**
```json
{
  "sub": "uuid-user-id",
  "email": "test-xxx@example.com",
  "role": "owner",
  "tenant_id": "uuid-tenant-id",
  "tenant_slug": "test-taller-xxx",
  "sucursal_id": null,
  "session_id": null,
  "iat": 1717416000,
  "exp": 1717420800
}
```

**Validar:**
- ✅ `tenant_id` es UUID válido
- ✅ `tenant_slug` es string válido (mismo que en respuesta)
- ✅ `role === "owner"`
- ✅ `exp > iat` (token válido por tiempo)
- ❌ NO contiene `tenant.tenant_slug` (eso sería error)

---

### FASE 3: Logs Render (5 min)

#### Test 3.1: Ver logs de deploy
1. Ve a https://dashboard.render.com
2. Selecciona servicio `sdmx-backend-api`
3. Ve a **Logs** → **Deployment**
4. Espera a que aparezca ✅ **Deploy successful**

#### Test 3.2: Ver logs de ejecución
En **Logs** → **Runtime Logs**, busca durante la validación:
```
STEP_CREATEUSER_DONE
STEP_TENANT_OBTAINED
```

**Si aparecen:** ✅ Flujo de registro funciona  
**Si NO aparecen:** ❌ El registro nunca llegó a ejecución

---

### FASE 4: Browser Flow (10 min)

#### Test 4.1: Flujo completo registro desde web
1. Ve a https://serviciosdigitalesmx.online
2. Haz clic en "Probar 14 días gratis"
3. Completa:
   - Nombre taller: "Test Taller 2026"
   - Email: test-unique-2026@example.com (ÚNICO)
   - Teléfono: 5551234567
   - Contraseña: Test1234567

4. Presiona "Registrarse"

**Esperado:**
- ✅ HTTP 201 en Network tab
- ✅ Redirecciona a `/onboarding/success?tenant=...&token=...`
- ✅ URL contiene token válido (no "undefined")
- ✅ NO error "Failed to fetch"
- ✅ NO error "HTTP 502"

#### Test 4.2: Onboarding success page
Después de redirección:
- ✅ Página carga correctamente
- ✅ Extrae token de URL
- ✅ Muestra tenant slug en algún lugar (si aplica)
- ✅ Permite continuar al siguiente paso

---

### FASE 5: Login tradicional (5 min)

#### Test 5.1: Login con credenciales creadas
1. Ve a https://serviciosdigitalesmx.online/login
2. Ingresa:
   - Email: test-unique-2026@example.com
   - Contraseña: Test1234567
3. Presiona "Iniciar sesión"

**Esperado:**
- ✅ Login exitoso
- ✅ Redirecciona a dashboard del tenant
- ❌ NO error "Invalid login credentials"
- ❌ NO vuelve a landing

---

### FASE 6: Google Login (5 min)

#### Test 6.1: Google OAuth flow
1. Ve a https://serviciosdigitalesmx.online
2. Haz clic en "Continuar con Google"
3. Completa login Google (usa una cuenta personal de prueba)
4. Completa:
   - Nombre taller: "Test Google Taller"
   - Teléfono: 5559876543

**Esperado:**
- ✅ Redirecciona a `/onboarding/success?tenant=...&token=...`
- ✅ JWT contiene `tenant_slug` (no undefined)
- ✅ Flujo de auth bridge funciona
- ❌ NO vuelve a landing principal

---

### FASE 7: Auth Bridge Validation (5 min)

#### Test 7.1: Flujo /auth/exchange
Si tienes acceso a herramientas de desarrollo:

```bash
curl -X POST https://api.serviciosdigitalesmx.online/auth/exchange \
  -H "Content-Type: application/json" \
  -d '{
    "accessToken": "<supabase-session-token>"
  }'
```

**Esperado:**
- ✅ HTTP 200
- ✅ Response contiene JWT válido
- ✅ JWT tiene `tenant_slug` correcto
- ❌ NO HTTP 502 o 401

---

## 📊 Matriz de Aceptación

| Test | Esperado | Estado | Notas |
|------|----------|--------|-------|
| 1.1: POST /register | 201 + JSON válido | ⬜ | Indica si El RPC y mapeo funcionan |
| 1.2: JSON structure | Todos los campos presentes | ⬜ | Valida que no hay undefined |
| 2.1: JWT decode | Payload correcto con tenant_slug | ⬜ | Crítico para auth |
| 3.1: Render deploy | Deploy successful ✅ | ⬜ | Código debe estar en producción |
| 3.2: Runtime logs | STEP_CREATEUSER_DONE aparece | ⬜ | Indica ejecución exitosa |
| 4.1: Web registration | Redirección correcta | ⬜ | End-to-end desde UI |
| 4.2: Onboarding page | Carga y extrae token | ⬜ | Flujo continua |
| 5.1: Traditional login | Dashboard sin errores | ⬜ | Valida auth completo |
| 6.1: Google login | Redirección correcta | ⬜ | Valida Google auth |
| 7.1: Auth exchange | 200 + JWT válido | ⬜ | Bridge funciona |

**Criterio de éxito:** ≥8/10 tests PASS

---

## 🔴 Si algo falla

### Si 1.1 devuelve 502
1. Espera 2 minutos más para deploy
2. Ve a Render logs → busca errores
3. Si ves error SQL → problem en RPC
4. Si ves "Cannot read property" → problema en mapeo

### Si JWT tiene undefined en tenant_slug
- El mapeo no funcionó
- Revisa logs en Render
- Posible: `tenant.slug` es null del RPC

### Si Google login vuelve a landing
- Auth bridge (`/auth/exchange`) está fallando
- Revisa HTTP status en Network tab
- Busca logs en Render

---

## 📝 Notas

- **Todos los tests usan credenciales ÚNICAS** (incluir timestamp para evitar duplicados)
- **NO modificar Supabase remotamente** (consultar datos vía API)
- **Render puede tardar 2-3 minutos en desplegar** (paciencia)
- **Los logs desaparecen después de algunas horas** (guardar si es importante)

---

**Próximo paso:** Ejecutar FASE 1 (HTTP validation) inmediatamente después de que Render termine el deploy (~3 min).
