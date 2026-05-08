# Deployment & Migration Guide

This document explains how to apply the SQL migration in Supabase, how to test the new operations endpoints (PDF and WhatsApp), and which environment variables Render needs.

## 1) Apply SQL migration in Supabase Dashboard

File: `apps/backend-api/db/migrations/20260508_add_service_order_fields.sql`

Steps (Supabase Dashboard):

1. Open the Supabase project for the target environment.
2. From the left menu open "SQL" → "Editor".
3. Click **New Query**.
4. Open the file `apps/backend-api/db/migrations/20260508_add_service_order_fields.sql` in your local repo, copy the entire SQL contents and paste into the editor.
5. (Optional) Review to ensure it targets `public.service_orders` and that your tenant setup uses that schema.
6. Click **RUN**. Wait for the query to finish successfully.
7. Verify the changes by running a quick query:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'service_orders'
  AND column_name IN ('serial_number','accessories','internal_notes','warranty_until','evidence_metadata');
```

If you prefer the CLI, you can use `psql` to run the script (replace connection string):

```bash
psql "postgres://<DB_USER>:<DB_PASS>@<DB_HOST>:5432/<DB_NAME>" -f apps/backend-api/db/migrations/20260508_add_service_order_fields.sql
```

Note: When using Supabase managed DB you may use `supabase` CLI or `psql` depending on your workflow.

---

## 2) Test the new endpoints (examples using curl)

Prerequisites:
- The backend must be running and reachable (e.g., `https://api.example.com`).
- You need a valid user access token for an internal user (service user) in the `Authorization: Bearer <token>` header.

1) Generate (download) PDF for an order (authenticated)

```bash
TOKEN="<YOUR_BEARER_TOKEN>"
ORDER_ID_OR_FOLIO="<order-id-or-folio>"
API_BASE="https://api.example.com"

curl -v -X POST "$API_BASE/api/operations/orders/$ORDER_ID_OR_FOLIO/pdf" \
  -H "Authorization: Bearer $TOKEN" \
  -o orden-$ORDER_ID_OR_FOLIO.pdf
```

- The endpoint will return a PDF file and the `Content-Disposition` is set to `attachment` so the browser/download will save it.

2) Get WhatsApp link for an order (authenticated)

```bash
TOKEN="<YOUR_BEARER_TOKEN>"
ORDER_ID="<order-id-or-folio>"
API_BASE="https://api.example.com"

# Basic use (will attempt to lookup customer phone in DB)
curl -s -X GET "$API_BASE/api/operations/orders/$ORDER_ID/whatsapp" \
  -H "Authorization: Bearer $TOKEN" | jq

# Provide phone and template override
curl -s -G "$API_BASE/api/operations/orders/$ORDER_ID/whatsapp" \
  -H "Authorization: Bearer $TOKEN" \
  --data-urlencode "phone=5215512345678" \
  --data-urlencode "template=Hola {{cliente}}, tu orden {{folio}} tiene total ${{total}}. Ver: {{link}}" | jq
```

Response sample:

```json
{
  "success": true,
  "data": {
    "url": "https://wa.me/5215512345678?text=Hola%20..."
  }
}
```

---

## 3) Required environment variables (Render or other host)

Minimum list (ensure these are set in Render as secret environment variables):

- `SUPABASE_URL` — Supabase project URL (e.g., https://xyz.supabase.co)
- `SUPABASE_SERVICE_ROLE_KEY` — Service role / admin key (used by server to load sessions and run admin queries)
- `APP_BASE_URL` — Public app base URL used to build links (e.g., https://app.example.com)
- `PUBLIC_APP_URL` (optional) — used by some public controllers for portal links
- `WHATSAPP_BASE_URL` (optional) — defaults to `https://wa.me` if unset
- `PORT` (optional) — server port
- `NODE_ENV` — `production` or `development`

Extras (for full feature parity):
- `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET` etc. if using MercadoPago features in the repo

Security note: `SUPABASE_SERVICE_ROLE_KEY` must be kept secret and only used server-side. Do NOT expose it to clients.

---

## 4) Notes and verification

- All operations endpoints are protected by the authentication middleware which calls `loadSession(token)` and injects `tenantId` into the request. This enforces multi-tenant access — the PDF generator and WhatsApp link builder query data scoped to the `tenant_id` resolved from the session.

- The migration only adds columns and an index. It does not modify or delete existing data. Back up your DB before applying in production.

---

## 5) Quick local commands (install & build)

```bash
cd apps/backend-api
npm install
npm run build
# Start dev server
npm run dev
```

---

If you want, I can also create a small integration test script that runs the curl commands in CI, or help generate a Supabase CLI/CI job to run the migration automatically.
