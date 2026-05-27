#!/usr/bin/env bash
set -euo pipefail

: "${API_BASE_URL:?API_BASE_URL is required}"
: "${TEST_TENANT_SLUG:?TEST_TENANT_SLUG is required}"

echo "Health"
curl -fsS "${API_BASE_URL}/api/health" | jq .

echo "Landing"
curl -fsS "${API_BASE_URL}/api/public/tenant/${TEST_TENANT_SLUG}/landing" | jq .

if [[ -n "${TEST_AUTH_TOKEN:-}" ]]; then
  echo "Settings"
  curl -fsS -H "Authorization: Bearer ${TEST_AUTH_TOKEN}" \
    "${API_BASE_URL}/api/auth/tenant/${TEST_TENANT_SLUG}/settings" | jq .
fi
