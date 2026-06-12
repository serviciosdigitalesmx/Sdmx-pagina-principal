# Verticalization Current

## Status

Fixi usa `industry_key` como fuente de verticalización en runtime.

## Contract

- La vertical no vive en session/JWT.
- `tenantSettingsService` persiste `industry_key` desde datos reales del tenant.
- `VerticalRegistry` resuelve configuración de UI por `industry_key`.

## Current verticals

- talleres
- barberias
- hvac
- mecanicos
- rentas
- electronica

## Rule

Si la documentación histórica contradice este archivo, prevalece este archivo y los demás `*_CURRENT.md`.
