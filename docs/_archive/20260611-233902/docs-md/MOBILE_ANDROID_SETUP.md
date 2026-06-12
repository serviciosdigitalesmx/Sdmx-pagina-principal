# FIXI Mobile Android Setup

## Variables necesarias

La app Android Capacitor carga el frontend real existente desde la URL pública del admin.

Usa estas variables:

- `NEXT_PUBLIC_WEB_ADMIN_URL`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_AUTH_TOKEN_KEY`

Opcionalmente puedes definir:

- `MOBILE_WEB_URL`

Si `MOBILE_WEB_URL` está presente, tiene prioridad sobre `NEXT_PUBLIC_WEB_ADMIN_URL`.

## Comandos

Desde la raíz del monorepo:

- `pnpm mobile:sync`
- `pnpm mobile:android`
- `pnpm mobile:open`

## Qué hace cada comando

- `mobile:sync`
  - sincroniza la config de Capacitor
  - copia la configuración actual hacia Android
- `mobile:android`
  - ejecuta la app Android localmente
  - requiere Android SDK / emulator / dispositivo conectado
- `mobile:open`
  - abre el proyecto Android en Android Studio

## Validación de login real

1. Abre la app Android.
2. Verifica que cargue el frontend real del admin en la URL configurada.
3. Entra por la pantalla `/login` del panel y autentícate con una cuenta real.
4. Confirma que el callback `/auth/bridge` guarda el token real en `localStorage`.
5. Cierra la app Android y vuelve a abrirla.
6. Verifica que el panel recuerde la sesión y vuelva a mostrar `/dashboard` sin pedir login si el token sigue vigente.
7. Verifica que los requests al API de Render sigan usando el token real.

## Flujo móvil de autenticación

El wrapper Android no implementa un login paralelo.

Usa el mismo flujo real del panel:

1. `/login` autentica contra Supabase.
2. `/api/auth/exchange` convierte la sesión de Supabase en un token del API.
3. `/auth/bridge` guarda ese token en `localStorage`.
4. `SessionGate` en el panel lee `localStorage` y presenta el dashboard real.

Eso hace que la sesión persista dentro de la app Android mientras el WebView conserve almacenamiento.

## Validación de órdenes

1. Entra al admin real desde la app.
2. Abre una orden existente con datos reales.
3. Verifica que el listado y detalle usen la API real.
4. Confirma que el cambio de estado persiste en Supabase.
5. Reabre la app y comprueba que el estado sigue igual.

## Notas

- No se agregan mocks ni datos fake.
- La app Android funciona como wrapper nativo sobre el frontend existente.
- Si la URL del frontend no está definida, la app mostrará la pantalla base de FIXI Mobile.
