# FIXI Audit Scope

## Goal
Determine whether Fixi can be sold today with evidence only.

## What is in scope
- Environment variables used by `apps/web-admin`, `apps/web-public`, `apps/web-clientes`, and `apps/api`
- Auth flow from landing to dashboard
- Tenant isolation across JWT, middleware, headers, and Supabase RLS
- Existing UI modules only
- Existing business flows only
- Production readiness for Vercel, Render, and Supabase

## What is out of scope
- Code changes
- Refactors
- New migrations
- New modules
- Architecture changes
- Generic recommendations

## Severity model
- `P0`: blocks sale immediately
- `P1`: important, affects real operation or trust
- `P2`: measurable debt, not a blocker
- `P3`: noise or cleanup

## Sale-blocking criteria
A finding is `P0` only if it is evidence that a customer cannot:
- pay
- enter the system
- authenticate reliably
- keep a valid session
- operate inside the correct tenant
- access production safely

## Evidence rules
- Every finding must include evidence, file path, route or variable name, impact, and severity
- If evidence cannot be verified from repository or observable configuration, the finding is discarded
- No opinions, hypotheses, or re-architecture suggestions

## Reference production surface
- Frontend admin: `apps/web-admin`
- Frontend public: `apps/web-public`
- Frontend clientes: `apps/web-clientes`
- Backend API: `apps/api`
- Database: Supabase
- Backend deploy: Render
- Frontend deploy: Vercel

## Current conclusion target
- If a real blocker exists, the output must say `NO LISTO PARA VENDER`
- If no real blocker is evidenced, the output must say `LISTO PARA VENDER`
