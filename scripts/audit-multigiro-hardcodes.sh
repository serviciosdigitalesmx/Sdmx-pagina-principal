#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

rg -n \
  "celular|celulares|reparación|reparacion|equipo|IMEI|diagnóstico|diagnostico|entrega|recibido|listo|HVAC|barber|demo|localhost|supabase\\.co|vercel\\.app|onrender\\.com|service_role|anon key|publishable key|MP_ACCESS_TOKEN|tenant_id|slug" \
  "$ROOT_DIR/apps" "$ROOT_DIR/packages" "$ROOT_DIR/supabase" "$ROOT_DIR/docs" \
  -g '!**/.next/**' -g '!**/node_modules/**' || true
