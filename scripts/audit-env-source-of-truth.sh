#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

rg -n \
  "process\\.env\\.|NEXT_PUBLIC_|SUPABASE_|MP_|CORS_ALLOWED_ORIGINS|APP_URL|WEBHOOK_BASE_URL|MASTER_TENANT_SLUG|MASTER_ACCOUNT_EMAIL|TRIAL_DAYS|NEXT_PUBLIC_API_BASE_URL|NEXT_PUBLIC_RENDER_API_URL" \
  "$ROOT_DIR/apps" "$ROOT_DIR/packages" "$ROOT_DIR/render.yaml" "$ROOT_DIR/.env.example" \
  -g '!**/.next/**' -g '!**/node_modules/**' || true
