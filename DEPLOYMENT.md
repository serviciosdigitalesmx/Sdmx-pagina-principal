# Deployment Matrix

## Vercel - `apps/web`

Set these environment variables:

- `NEXT_PUBLIC_API_BASE_URL` -> `https://sdmx-backend-api.onrender.com`
- `NEXT_PUBLIC_APP_URL` -> `https://servicios-digitales-mx-frontend-web.vercel.app`
- `NEXT_PUBLIC_SUPABASE_URL` -> `https://wtufavwzvcoabjrfkqcg.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` -> Supabase anon key
- `NEXT_PUBLIC_STRIPE_PRICE_BASIC` -> Stripe price id
- `NEXT_PUBLIC_STRIPE_PRICE_PRO` -> Stripe price id
- `NEXT_PUBLIC_STRIPE_PRICE_SCALE` -> Stripe price id

## Render - `apps/backend-api`

Set these environment variables:

- `PORT` -> `10000`
- `SUPABASE_URL` -> `https://wtufavwzvcoabjrfkqcg.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` -> Supabase service role key
- `NEXT_PUBLIC_APP_URL` -> `https://servicios-digitales-mx-frontend-web.vercel.app`
- `ALLOWED_ORIGINS` -> `https://servicios-digitales-mx-frontend-web.vercel.app,https://servicios-digitales-mx-frontend-serviciosdigitalesmx-projects.vercel.app,https://*.vercel.app`
- `TRUST_PROXY` -> `1`
- `STRIPE_SECRET_KEY` -> Stripe secret
- `STRIPE_WEBHOOK_SECRET` -> Stripe webhook secret
- `MERCADOPAGO_ACCESS_TOKEN` -> Mercado Pago access token
- `MERCADOPAGO_BASE_URL` -> `https://servicios-digitales-mx-frontend-web.vercel.app`
- `MERCADOPAGO_PUBLIC_KEY` -> Mercado Pago public key
- `MERCADOPAGO_SUPPORT_PHONE` -> `+528129716587`
- `MERCADOPAGO_WEBHOOK_BASE_URL` -> `https://sdmx-backend-api.onrender.com`
- `SRFIX_INTERNAL_API_KEY` -> internal API key
- `API_VERSION` -> `3.2.8`

## Supabase

Required setup:

- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are used by the backend only.
- Configure Auth redirect URLs for the Vercel frontend.
- Apply the SQL migrations.
- Create the `repair-photos` storage bucket.
- Ensure RLS is enabled and the policies are applied.
