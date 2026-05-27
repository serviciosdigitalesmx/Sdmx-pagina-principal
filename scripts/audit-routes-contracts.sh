#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

rg -n \
  "router\\.|app\\.(get|post|put|patch|delete)|export const (register|login|meta|landing|tracking|orders|requests|reports|customers|inventory|suppliers|purchaseOrders|finance)" \
  "$ROOT_DIR/apps/api/src" \
  -g '!**/.next/**' -g '!**/node_modules/**' || true

rg -n \
  "TenantRuntimeConfig|TenantCapabilities|field_definitions|workflow_statuses|semaphore_rules|enabled_modules" \
  "$ROOT_DIR/packages/types" "$ROOT_DIR/apps/api/src" "$ROOT_DIR/apps/web-admin/src" "$ROOT_DIR/apps/web-public/src" "$ROOT_DIR/apps/web-clientes/src" \
  -g '!**/.next/**' -g '!**/node_modules/**' || true
