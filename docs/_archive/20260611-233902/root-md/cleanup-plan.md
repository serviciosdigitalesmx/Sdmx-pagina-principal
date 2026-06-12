# Cleanup Plan

## Objective

| Goal | Constraint | Outcome |
|---|---|---|
| Remove technical noise | No destructive cleanup without approval | Keep only safe removals in Phase A |
| Preserve production behavior | No business logic changes in cleanup phase | Separate hygiene from refactor |
| Freeze database history | No migration edits yet | Consolidate schema families only after approval |
| Keep multitenancy intact | Do not break `tenant_id`, `tenant_slug`, headers, or JWT flow | Review compatibility surfaces before changes |

## Scope by Phase

| Phase | Includes | Excludes |
|---|---|---|
| Phase A | Dead tracked files, backups, obvious temp artifacts, known generated noise | Code refactors, migration edits, Supabase remote changes |
| Phase B | Legacy branding, obsolete scripts, documentation historical cleanup, compatibility route review | Schema changes, destructive deletions, business logic changes |
| Phase C | Migration consolidation plan and canonicalization proposal | Direct Supabase destructive operations |
| Phase D | Docs/env normalization after code and schema boundaries are agreed | Runtime behavior changes |

## Phase A Candidate Set

| Path | Why it is a candidate | Risk |
|---|---|---|
| `Run` | Empty tracked artifact | Low |
| `audit-sdmx-platform-20260529-031649.txt` | Local audit artifact tracked in root | Low |
| `packages/config/src/index.ts.bak` | Duplicate backup snapshot | Low |
| `apps/web-admin/.env.production.local-backup` | Local env backup | Low |
| `apps/web-public/.env.production.local-backup` | Local env backup | Low |
| `apps/web-clientes/.env.production.local-backup` | Local env backup | Low |
| `apps/mobile/android/app/src/androidTest/java/com/getcapacitor/myapp/ExampleInstrumentedTest.java` | Default scaffold test | Low |
| `apps/mobile/android/app/src/test/java/com/getcapacitor/myapp/ExampleUnitTest.java` | Default scaffold test | Low |

## Generated Noise to Keep Ignored

| Path Pattern | Status | Action |
|---|---|---|
| `apps/**/.next/*` | Build output | Ignore, do not treat as source |
| `apps/**/dist/*` | Build output | Ignore, do not treat as source |
| `apps/**/node_modules/*` | Dependency install | Ignore, do not treat as source |
| `packages/**/node_modules/*` | Dependency install | Ignore, do not treat as source |
| `apps/mobile/android/build/*` | Android build output | Ignore, do not treat as source |
| `apps/mobile/android/.gradle/*` | Android cache | Ignore, do not treat as source |
| `supabase/.temp/*` | Local Supabase temp | Ignore, do not treat as source |
| `.turbo/` | Turbo cache | Ignore, do not treat as source |
| `.pnpm-store/` | pnpm store | Ignore, do not treat as source |
| `.vercel/` | Vercel local state | Ignore, do not treat as source |
| `*.tsbuildinfo` | TypeScript incremental cache | Ignore, do not treat as source |

## Phase B Refactor Candidates

| Path | Why it needs refactor | Risk |
|---|---|---|
| `scripts/audit-sdmx-platform-map.sh` | References obsolete `apps/backend-api` path | Medium |
| `scripts/deploy-all.sh` | Operational helper with historical coupling | Medium |
| `scripts/setup-vercel.sh` | Hard-coded bootstrap values and mixed historical defaults | Medium |
| `apps/api/src/routes/orders.ts` | Contains `/legacy` compatibility route | Medium |
| `apps/web-admin/src/app/api/pwa/manifest/route.ts` | Branding still needs cleanup verification | Low |
| `apps/web-admin/src/app/api/pwa/sw.js/route.ts` | Branding still needs cleanup verification | Low |
| `apps/web-public/src/app/[tenant]/page.tsx` | Legacy branding/copy surface | Low |
| `apps/web-public/src/app/t/[tenantSlug]/portal/page.tsx` | Legacy branding/copy surface | Low |
| `apps/web-clientes/src/app/t/[tenantSlug]/portal/page.tsx` | Legacy branding/copy surface | Low |
| `apps/web-public/src/app/login/page.tsx` | Copy still needs final review | Low |
| `apps/web-public/src/app/not-found.tsx` | Copy still needs final review | Low |
| `apps/web-public/src/app/onboarding/page.tsx` | Copy still needs final review | Low |
| `apps/web-public/src/components/public-portal-lookup.tsx` | Legacy label surface | Low |

## Phase C Migration Plan

| Family | Risk | Plan |
|---|---|---|
| Branches -> sucursales | High | Choose one canonical migration path, then mark overlaps as legacy-only in an approval note |
| Security/backoffice | High | Consolidate into one canonical schema family after remote schema parity check |
| User compatibility | Medium | Merge overlapping compatibility columns into one documented path |
| Inventory RLS hardening | Medium | Pick one canonical hardening migration and archive the duplicate as historical context |
| Baseline / snapshot | Medium | Keep for bootstrap provenance only, not as live contract for new environments |

## Phase D Documentation Plan

| Document Group | Action |
|---|---|
| `docs/CONTRATO_SR_FIX.md`, `docs/AUDITORIA_CONTRATO_SR_FIX.md`, `docs/MAPA_FUNCIONAL_SR_FIX_A_SDMX.md`, `docs/WEB_ADMIN_SR_FIX_INTEGRATION_MAP.md` | Mark as historical references only |
| `docs/BITACORA_REFACTOR.md`, `docs/CONTRATO_EJECUCION_REFACTOR.md`, `docs/CHECKLIST_REFACTOR_PENDIENTES.md`, `docs/ROADMAP_MIGRACION_SDMX.md` | Reclassify as legacy planning history |
| `docs/README.md` | Replace with current production contract once the cleanup phases are approved |
| `docs/WEB_ENV_AGENT_MAP.md` | Trim legacy variables and keep only active runtime envs |
| `docs/ui/source-truth.md` | Preserve as historical inventory, not runtime truth |

## Approval Gates

| Gate | Required Review | Result |
|---|---|---|
| Gate 1 | Confirm report classifications | Approve Phase A removals only |
| Gate 2 | Confirm no candidate is referenced in imports, routes, scripts, configs, or docs | Allow safe deletions |
| Gate 3 | Confirm migration families against live Supabase schema | Permit Phase C planning |
| Gate 4 | Confirm docs are no longer used as operational truth | Allow Phase D cleanup |

## Summary Recommendation

| Area | Recommendation |
|---|---|
| Fase A | Remove only low-risk tracked artifacts and backups |
| Fase B | Review and refactor legacy branding and scripts with product/runtime validation |
| Fase C | Consolidate duplicate migration families only after remote schema confirmation |
| Fase D | Normalize docs and env references after code/schema boundaries are stable |

