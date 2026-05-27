#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

rg -n \
  "\\.eq\\('tenant_id'|auth\\.jwt\\(\\).*tenant_id|tenant_id\\s*:" \
  "$ROOT_DIR/apps/api/src" "$ROOT_DIR/packages" "$ROOT_DIR/supabase/migrations" \
  -g '!**/.next/**' -g '!**/node_modules/**' || true
