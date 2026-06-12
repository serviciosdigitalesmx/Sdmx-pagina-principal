# Validación Técnica - Comandos Listos

Copiar y pegar directamente en terminal. **Usa timestamps para evitar duplicados de email/teléfono.**

---

## Paso 0: Variables (configura primero)

```bash
# Estos deberían cambiar CADA VEZ que ejecutes pruebas
TIMESTAMP=$(date +%s)
EMAIL="test-$TIMESTAMP@example.com"
PHONE="5551234567"
WORKSHOP="Test-Taller-$TIMESTAMP"

echo "📌 Valores para esta prueba:"
echo "  Email: $EMAIL"
echo "  Phone: $PHONE"
echo "  Workshop: $WORKSHOP"
```

---

## Paso 1: Registro (HTTP 201?)

```bash
TIMESTAMP=$(date +%s)
EMAIL="test-$TIMESTAMP@example.com"
PHONE="5551234567"
WORKSHOP="Test-Taller-$TIMESTAMP"

echo "🔄 Enviando POST /auth/register..."
RESPONSE=$(curl -s -X POST https://api.serviciosdigitalesmx.online/auth/register \
  -H "Content-Type: application/json" \
  -H "Origin: https://serviciosdigitalesmx.online" \
  -d "{
    \"workshopName\": \"$WORKSHOP\",
    \"email\": \"$EMAIL\",
    \"password\": \"Test1234567\",
    \"phone\": \"$PHONE\",
    \"origin\": \"https://serviciosdigitalesmx.online\"
  }")

echo "Response:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"

# Extrae token
TOKEN=$(echo "$RESPONSE" | jq -r '.token' 2>/dev/null)
TENANT_SLUG=$(echo "$RESPONSE" | jq -r '.tenant.slug' 2>/dev/null)

echo ""
echo "✅ Extraído:"
echo "  Token: ${TOKEN:0:20}... ($(echo -n "$TOKEN" | wc -c) chars)"
echo "  Tenant slug: $TENANT_SLUG"
```

**Validar:**
- ✅ Status debe ser 201 (curl muestra sin error)
- ✅ `token` no es "null" o vacío
- ✅ `tenant.slug` no es "null" o vacío
- ✅ `redirectUrl` contiene `slug` y `token` (no "undefined")

---

## Paso 2: Decodificar JWT

```bash
# Asume que TOKEN está disponible del paso anterior
# Si no, pégalo manualmente:
TOKEN="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."

decode_jwt() {
  local token=$1
  local base64url=$(echo $token | cut -d'.' -f2)
  # Agregar padding si es necesario
  case $((${#base64url} % 4)) in
    2) base64url="${base64url}==" ;;
    3) base64url="${base64url}=" ;;
  esac
  echo "$base64url" | base64 -d 2>/dev/null | jq . 2>/dev/null || echo "Error decodificando"
}

echo "🔐 Decodificando JWT..."
decode_jwt "$TOKEN"
```

**Validar:**
- ✅ `tenant_id` es UUID (36 caracteres)
- ✅ `tenant_slug` existe y NO es "undefined"
- ✅ `role` es "owner"
- ✅ `sub` es UUID
- ✅ `iat` < `exp`

---

## Paso 3: Verificar Render Deploy

```bash
# Abre en navegador (o curl si tienes curl de XML)
echo "📊 Dashboard Render:"
echo "https://dashboard.render.com/services/sdmx-backend-api"
echo ""
echo "Busca en Logs:"
echo "1. Deployment → debe mostrar ✅ Deploy successful"
echo "2. Runtime → busca STEP_CREATEUSER_DONE y STEP_TENANT_OBTAINED"
```

Si usas curl para verificar health:
```bash
curl -s https://api.serviciosdigitalesmx.online/health | jq .
```

Esperado:
```json
{
  "status": "ok",
  "service": "Sdmx Backend API"
}
```

---

## Paso 4: Validar /auth/exchange (Auth Bridge)

Primero necesitas un `accessToken` válido de Supabase. Simulando:

```bash
# Si ya tienes un session token de una sesión anterior:
SUPABASE_TOKEN="<tu-token-de-supabase-aqui>"

curl -s -X POST https://api.serviciosdigitalesmx.online/auth/exchange \
  -H "Content-Type: application/json" \
  -d "{\"accessToken\": \"$SUPABASE_TOKEN\"}" | jq .
```

Esperado:
```json
{
  "token": "eyJ...",
  "user": {
    "sub": "...",
    "email": "...",
    "role": "...",
    "tenantId": "...",
    "tenantSlug": "..."
  },
  "tenant": {
    "id": "...",
    "slug": "...",
    "name": "..."
  }
}
```

---

## Paso 5: Validar login tradicional (Desde web)

**No hay comando CLI recomendado** (requiere session management).

Valida manualmente:
1. Ve a https://serviciosdigitalesmx.online/login
2. Email: `test-<timestamp>@example.com` (de Paso 1)
3. Password: `Test1234567`
4. Expected: Dashboard del tenant, NO landing

---

## Paso 6: Validar Google Login (Desde web)

**No hay comando CLI recomendado** (requiere OAuth flow).

Valida manualmente:
1. Ve a https://serviciosdigitalesmx.online
2. Click "Continuar con Google"
3. Google login + autorizar
4. Completa: workshop name + phone
5. Expected: Redirecciona a `/onboarding/success?tenant=...&token=...`

En DevTools > Network:
- Verifica que `/onboarding/success` recibe token completo (no "undefined")
- Verifica que URL tiene ambos parámetros

---

## Checklist de Ejecución

Copia esto en una nota y marca conforme completes:

```
[ ] Paso 0: Variables configuradas
[ ] Paso 1: POST /register devuelve 201
[ ] Paso 1: token y tenant.slug NO son null
[ ] Paso 2: JWT decodificado correctamente
[ ] Paso 2: tenant_slug en JWT NO es undefined
[ ] Paso 3: Render mostró Deploy successful
[ ] Paso 3: Logs incluyen STEP_CREATEUSER_DONE
[ ] Paso 4: /auth/exchange devuelve 200 (si aplica)
[ ] Paso 5: Login tradicional funciona desde web
[ ] Paso 6: Google login funciona desde web
[ ] ÉXITO: Mínimo 8/10 pasos completados ✅
```

---

## Troubleshooting rápido

### Si Paso 1 devuelve 502
```bash
# Verifica salud de API
curl -s https://api.serviciosdigitalesmx.online/health

# Si devuelve error, Render aún está desplegando
# Espera 2-3 minutos más
```

### Si Paso 2 falla decodificar
```bash
# Verifica que el token es válido (3 partes con .)
echo "$TOKEN" | tr '.' '\n' | wc -l
# Debe devolver 3
```

### Si tenant_slug es null en Paso 2
```bash
# Problema: RPC no retornó slug o mapeo fallo
# Verifica en Render logs: STEP_TENANT_OBTAINED
# Si no aparece, registr no llegó al RPC
```

### Si Google login falla
```bash
# Ve a DevTools > Network > XHR
# POST /auth/exchange debe devolver 200
# Si es 401 o 502, auth bridge está roto
# Revisa Render logs para "EXCHANGE_DEBUG"
```

---

## Variables globales útiles

Si quieres reutilizar valores entre comandos:

```bash
# Exporta para uso en múltiples comandos
export TIMESTAMP=$(date +%s)
export EMAIL="test-$TIMESTAMP@example.com"
export PHONE="5551234567"
export WORKSHOP="Test-Taller-$TIMESTAMP"
export API_BASE="https://api.serviciosdigitalesmx.online"
export APP_URL="https://serviciosdigitalesmx.online"

# Luego usa:
curl -X POST $API_BASE/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", ...}"
```

---

**Tiempo total estimado:** 15-20 minutos para todos los pasos.
