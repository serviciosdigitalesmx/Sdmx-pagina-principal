# E2E Validation

## Target flow

Landing publica
-> solicitud / cotización
-> customer + order creation
-> panel interno
-> status update
-> portal cliente
-> WhatsApp wa.me
-> PDF / documents / evidence
-> basic reports

## Required checks

### Landing

- resolve tenant by slug
- load tenant settings
- render CTA

### Public request

- create customer
- create service request or order
- set `tenant_id` server-side
- store metadata when applicable

### Internal panel

- list orders
- show detail
- update status
- show semaphore / risk when available

### Portal

- query by folio
- show only tenant-safe data
- do not expose internal risk details

### WhatsApp

- generate `wa.me` link only
- never send a real message during validation

### PDFs

- open/download real document
- verify tenant-scoped storage path
- verify `order_documents` reference

## Example curl checks

```bash
curl -sS https://api.example.com/api/health | jq .
curl -sS https://api.example.com/api/public/tenant/demo/landing | jq .
curl -sS -H "Authorization: Bearer $TEST_AUTH_TOKEN" https://api.example.com/api/auth/tenant/demo/settings | jq .
```

## Security checks

- tenant A cannot read tenant B data
- public portal does not expose sensitive internal data
- backend rejects arbitrary `tenant_id`
- storage remains tenant-scoped

## Safe test data

- mark tenants clearly as E2E / test / dev
- use synthetic emails
- do not use real customer contacts
