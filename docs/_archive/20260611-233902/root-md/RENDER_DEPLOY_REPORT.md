# RENDER_DEPLOY_REPORT

## Commit Local
- SHA completo: `2f9271dd4a882f3ffb26434a8c1223cf01ba36c3`
- SHA corto: `2f9271dd`
- Fecha: `2026-06-05`
- Branch: `main`

## Commit Desplegado
- SHA completo: `2f9271dd4a882f3ffb26434a8c1223cf01ba36c3`
- SHA corto: `2f9271dd`
- Mensaje: `fix(inventory): use sucursal_id in movement insert`

## Verificación de Despliegue
- Servicio Render: `sdmx-backend-api`
- Servicio ID: `srv-d7mj7f1j2pic73942q8g`
- Branch conectada: `main`
- Estado del último deploy: `live`
- Inicio del deploy: `2026-06-05T00:07:42.121979Z`
- Fin del deploy: `2026-06-05T00:09:10.317795Z`
- Creación del deploy: `2026-06-05T00:07:42.187381Z`

## Comparación
- `LOCAL_SHA`: `2f9271dd4a882f3ffb26434a8c1223cf01ba36c3`
- `DEPLOYED_SHA`: `2f9271dd4a882f3ffb26434a8c1223cf01ba36c3`
- Resultado: `MATCH`

## Resultado Antes
- `PATCH /api/inventory/:id` devolvía `502`
- Error observado: `Could not find the 'branch_id' column of 'inventory_movements' in the schema cache`

## Resultado Después
- `PATCH /api/inventory/:id` devolvió `200`
- El backend productivo ya corresponde al SHA local actual.
