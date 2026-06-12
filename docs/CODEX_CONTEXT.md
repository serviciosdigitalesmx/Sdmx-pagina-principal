# Codex Context

## Purpose

This repo is a production multi-tenant SaaS. Changes must preserve build stability and real contracts.

## Non-negotiables

- No mocks
- No fake data
- No invented endpoints
- No hardcoded secrets or tenant values
- No direct UI fetches

## Workflow

1. Read current `*_CURRENT.md` docs first.
2. Inspect real code paths before editing.
3. Change the smallest surface that satisfies the contract.
4. Verify with a production build.

## Verticalization

- Do not move vertical identity into session.
- Use tenant runtime config and registry resolution only.
