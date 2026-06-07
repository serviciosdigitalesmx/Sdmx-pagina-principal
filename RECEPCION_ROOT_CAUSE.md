# Recepción Root Cause

## 1. ¿Dónde se rompe?

Se rompe en `Step 2`, dentro de `apps/web-admin/src/components/operativo/step-2.tsx`, antes de llegar a `Step 3`.

### Evidencia

En la traza del navegador:

- el formulario sí recibe el evento `submit`:

```text
console log submit-capture FORM
```

- pero no avanza a `Step 3`
- y no aparece ningún `POST /orders`

Eso prueba que el bloqueo ocurre antes del envío al backend.

## 2. ¿Por qué se rompe?

Porque `Step 2` valida `fechaPromesa` sobre `localData.fechaPromesa`, pero en la ejecución real ese campo queda vacío al momento del submit.

### Evidencia observada en runtime

En la traza del submit:

```text
console log STEP2_HANDLE_SUBMIT {"dispositivo":"Laptop","modelo":"Dell XPS 15","falla":"No enciende y calienta demasiado","fechaPromesa":"","costo":1250,"notas":"Cliente autorizó revisión completa","checks":{"cargador":true,"pantalla":false,"prende":true,"respaldo":false}}
console log STEP2_VALIDATE_INPUT {"dispositivo":"Laptop","modelo":"Dell XPS 15","falla":"No enciende y calienta demasiado","fechaPromesa":"","costo":1250,"notas":"Cliente autorizó revisión completa","checks":{"cargador":true,"pantalla":false,"prende":true,"respaldo":false}}
console log STEP2_VALIDATE_ERRORS {"fechaPromesa":"Selecciona fecha de entrega"}
```

Eso significa:

- `Step 2` sí ejecuta `handleSubmit`.
- `Step 2` sí ejecuta `validate()`.
- `Step 2` sí bloquea el avance.
- La única validación que queda activa en esa corrida es `fechaPromesa`.

## 3. ¿Qué archivo exacto contiene el problema?

- [apps/web-admin/src/components/operativo/step-2.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/operativo/step-2.tsx)

### Línea lógica culpable

```tsx
if (!localData.fechaPromesa) newErrors.fechaPromesa = 'Selecciona fecha de entrega';
```

### Contexto del defecto

El campo de fecha usa un valor visible derivado de `getDefaultFecha()`, pero la validación no consume ese valor visible como fuente de verdad:

```tsx
<Input
  type="date"
  value={localData.fechaPromesa || getDefaultFecha()}
  onChange={(e) => {
    const next = { ...localData, fechaPromesa: e.target.value };
    setLocalData(next);
    onUpdate({ fechaPromesa: e.target.value });
  }}
/>
```

En la ejecución medida, `localData.fechaPromesa` sigue vacío en submit.

## 4. ¿Cuál es la corrección mínima?

Hacer que `fechaPromesa` tenga una única fuente de verdad y que esa fuente no dependa de una rama visible distinta a la que valida el submit.

Corrección mínima:

- inicializar `localData.fechaPromesa` con un valor real desde el inicio del paso
- o, alternativamente, hacer que la validación lea el mismo valor que se muestra en el input

Con eso `validate()` deja de ver `fechaPromesa` vacía y el flujo puede pasar a `Step 3`.

## 5. ¿Cuál es la corrección definitiva?

La corrección definitiva es eliminar la discrepancia entre:

- el valor visible del input de fecha
- el estado real validado por `Step 2`
- el estado persistido por `onUpdate`

### Debe quedar así:

1. `fechaPromesa` vive en un solo estado real.
2. el input de fecha lee ese mismo estado.
3. `validate()` usa ese mismo estado.
4. `onSubmit(localData)` recibe un objeto ya consistente.
5. `Step 3` puede llamar `POST /orders`.

## Contrato backend comprobado

El backend no es el punto de ruptura. El contrato de `POST /orders` existe y espera:

- `clientName`
- `clientPhone`
- `clientEmail`
- `deviceType`
- `deviceModel`
- `issue`
- `estimatedCost`
- `promisedDate`
- `includeIva`
- `checklist`
- `receiptUrl`
- `metadata`

### Backend

- [apps/api/src/routes/orders.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/routes/orders.ts)
- [apps/api/src/controllers/orders.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/controllers/orders.ts)

### Esquema real

```ts
const createOrderSchema = z.object({
  clientName: z.string().min(1, 'El nombre del cliente es requerido'),
  clientPhone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
  clientEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  deviceType: z.string().min(1, 'El tipo de dispositivo es requerido'),
  deviceModel: z.string().min(1, 'La marca y modelo son requeridos'),
  issue: z.string().min(1, 'La falla es requerida'),
  quoteFolio: z.string().optional(),
  estimatedCost: z.coerce.number().min(0).default(0),
  promisedDate: z.string().optional().or(z.literal('')),
  includeIva: z.coerce.boolean().default(false),
  checklist: z.object({
    hasCharger: z.coerce.boolean().default(false),
    screenCondition: z.string().optional().default(''),
    powersOn: z.coerce.boolean().default(false),
    backupRequired: z.coerce.boolean().default(false),
    notes: z.string().optional().default(''),
  }),
  receiptUrl: z.string().optional().or(z.literal('')),
  sucursalId: z.string().min(1).optional(),
  metadata: z.record(z.unknown()).optional(),
});
```

## Evidencia de API

`POST /orders` no se ejecuta en la corrida fallida.

### URL final

- no hay request a `POST /api/orders`

### tenantSlug

- en el flujo probado, el tenant activo fue `otriz-valle`

### sucursalId

- `null` en la sesión probada

### headers

- no aplica para `POST /orders` porque la request no salió

### respuesta HTTP

- no aplica

### body de respuesta

- no aplica

## Respuesta final

1. **¿Dónde se rompe?** En `Step 2`, antes de `Step 3`.
2. **¿Por qué se rompe?** Porque `fechaPromesa` llega vacío a `validate()` y bloquea el submit.
3. **¿Qué archivo exacto contiene el problema?** `apps/web-admin/src/components/operativo/step-2.tsx`
4. **¿Cuál es la corrección mínima?** Unificar el estado de `fechaPromesa` para que el valor visible y el valor validado sean el mismo.
5. **¿Cuál es la corrección definitiva?** Hacer que `Step 2` tenga una única fuente de verdad para `fechaPromesa`, sin defaults visuales desalineados con la validación.

