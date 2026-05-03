#!/bin/bash

set -e

API_URL="https://sdmx-backend-api.onrender.com"
EMAIL="Srfix@taller.com"
PASSWORD="admin1"

echo "🔐 Login..."

RESPONSE=$(curl -s "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

echo "📦 Raw response:"
echo "$RESPONSE" | jq

TOKEN=$(echo "$RESPONSE" | jq -r '.data.accessToken')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ No se pudo obtener el token"
  exit 1
fi

echo "✅ Token obtenido (${#TOKEN} chars)"

echo ""
echo "📡 Probando /api/customers..."

CUSTOMERS=$(curl -s "$API_URL/api/customers" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "$CUSTOMERS" | jq

echo ""
echo "🧪 Diagnóstico:"

if echo "$CUSTOMERS" | grep -q "SUBSCRIPTION_REQUIRED"; then
  echo "❌ BLOQUEADO POR BILLING"
  echo "👉 El backend está rechazando acceso (no es problema de token)"
else
  echo "✅ Acceso correcto"
fi

echo ""
echo "🚀 Done"
