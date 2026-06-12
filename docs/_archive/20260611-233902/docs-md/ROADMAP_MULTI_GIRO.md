# Multi-Giro Roadmap

## Closed

- tenant-scoped core
- industry profiles
- labels and fallback labels
- dynamic field definitions
- operational risk / semaphore
- module capabilities
- production deploy alignment work

## In progress / next

- template editor / template management UI
- richer PDF templating
- richer WhatsApp event templates
- more vertical-specific landing copy
- stronger billing plan enforcement
- better module usage telemetry

## Next verticals

- electronics repair
- HVAC
- auto workshop / motorcycles
- home services
- equipment rental

## Risks

- stale deploys
- frontend-only gating
- schema drift between live Supabase and code
- legacy repair terminology still present as fallback
- admin lint debt inherited from earlier work

## Technical debt to prioritize

1. close the web-admin lint debt
2. finish template management UX
3. add automated production smoke checks
4. unify API base env naming across all apps
