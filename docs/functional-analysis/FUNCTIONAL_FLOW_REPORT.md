# FUNCTIONAL_FLOW_REPORT

Fecha de validación: 2026-06-07

Alcance:
- Validación funcional real sobre:
  - `HEAD` en puerto `3000`
  - `2c54f4e9` en puerto `3001`
  - `71f3fe59` en puerto `3002`
- Flujo probado:
  1. Login funcional
  2. Entrar al panel admin
  3. Crear cliente
  4. Crear orden/equipo
  5. Asignar estado inicial
  6. Ver la orden en recepción
  7. Ver la orden en semáforo
  8. Abrir detalle de orden
  9. Cambiar estado desde flujo técnico
  10. Agregar diagnóstico/nota/evidencia si existe
  11. Marcar reparación como lista o entregada
  12. Reflejar cambio en dashboard/listado
  13. Consultar la orden desde portal cliente si aplica

## Tabla de resultados

| Versión | Login | Crear cliente | Crear orden | Semáforo | Técnico | Entrega | Portal cliente | Resultado |
| ------- | ----- | ------------- | ----------- | -------- | ------- | ------- | -------------- | --------- |
| `HEAD` (`3000`) | No | No alcanzado | No alcanzado | No alcanzado | No alcanzado | No alcanzado | No alcanzado | Se rompe en `Login` por `Module not found: Can't resolve '@/components/dashboard/sidebar'` |
| `2c54f4e9` (`3001`) | No | No alcanzado | No alcanzado | No alcanzado | No alcanzado | No alcanzado | No alcanzado | Se rompe en `Login` por `Module not found: Can't resolve '@/lib/supabase-browser'` |
| `71f3fe59` (`3002`) | No | No alcanzado | No alcanzado | No alcanzado | No alcanzado | No alcanzado | No alcanzado | Se rompe en `Login` por `Module not found: Can't resolve '@/lib/supabase-browser'` |

## Evidencia funcional por versión

### `HEAD`

- La ruta `/login` responde `500 Internal Server Error`.
- Error preciso:
  - `Module not found: Can't resolve '@/components/dashboard/sidebar'`
- Categoría:
  - `frontend`
  - `module resolution`
  - `ruta de layout`
- Recuperabilidad:
  - Alta, porque el fallo es de compilación/importación y no de datos.

### `2c54f4e9`

- La ruta `/login` responde `500 Internal Server Error`.
- Error preciso:
  - `Module not found: Can't resolve '@/lib/supabase-browser'`
- Categoría:
  - `frontend`
  - `module resolution`
  - `auth/login`
- Recuperabilidad:
  - Alta, porque el fallo está aislado en una dependencia de cliente no resuelta.

### `71f3fe59`

- La ruta `/login` responde `500 Internal Server Error`.
- Error preciso:
  - `Module not found: Can't resolve '@/lib/supabase-browser'`
- Categoría:
  - `frontend`
  - `module resolution`
  - `auth/login`
- Recuperabilidad:
  - Alta, porque el fallo también está en importación/resolución y no en backend.

## Conclusión operativa

### Base recomendada

No existe una versión que complete el flujo operativo completo en el estado validado. Ninguna pasa siquiera el paso 1.

### Qué se debe conservar de `HEAD`

- No se validó funcionalmente más allá del arranque.
- No hay evidencia funcional suficiente para conservar `HEAD` como base operativa.

### Qué se debe recuperar de `71f3fe59`

- La dirección correcta del shell operativo:
  - `DashboardShell`
  - layout más orientado a operación de taller
- Es el commit con mejor intención de “integrador operativo”, aunque hoy no arranca por import faltante.

### Qué se debe tomar de `2c54f4e9`

- La mayor parte del panel legado transplantado.
- La estructura más cercana a la operación diaria clásica.
- La base más probable para reactivar módulos funcionales una vez corregido el arranque.

### Módulos a corregir primero

1. `src/app/login/page.tsx`
2. `src/lib/supabase-browser.ts` y su resolución real en cada worktree
3. `src/app/dashboard/layout.tsx`
4. `src/components/dashboard/sidebar.tsx` o su sustituto equivalente
5. Validación de rutas bajo `dashboard`

## Recomendación final

**Mezclar versiones**, pero no a partir de una valoración visual.

Orden técnico recomendado:
1. Tomar `2c54f4e9` como base de reactivación funcional.
2. Recuperar de `71f3fe59` el shell operativo nuevo y su lógica de taller.
3. Conservar de `HEAD` únicamente lo que sobreviva a la corrección de imports/rutas, no como base principal.

## Observación final

El bloqueo actual no está en el flujo de negocio; está antes, en compilación y resolución de módulos.  
Hasta que eso no se corrija, ningún flujo completo es operable.

