#!/bin/bash

# Utility to add environment variables
add_env() {
  local project=$1
  local key=$2
  local value=$3
  
  echo "Setting $key for $project..."
  cd "apps/$project" || exit
  # Remove if exists to avoid conflict
  for env in production preview development; do
    vercel env rm "$key" "$env" --yes > /dev/null 2>&1
    # Add the new variable for this specific environment
    echo -n "$value" | vercel env add "$key" "$env" > /dev/null
  done
  cd ../..
}

echo "Configuring web-public..."
add_env "web-public" "NEXT_PUBLIC_API_URL" "https://api.serviciosdigitalesmx.online"
add_env "web-public" "NEXT_PUBLIC_API_BASE_URL" "https://api.serviciosdigitalesmx.online"
add_env "web-public" "NEXT_PUBLIC_RENDER_API_URL" "https://sdmx-backend-api.onrender.com"
add_env "web-public" "NEXT_PUBLIC_WEB_ADMIN_URL" "https://app.serviciosdigitalesmx.online"
add_env "web-public" "NEXT_PUBLIC_WEB_PUBLIC_URL" "https://serviciosdigitalesmx.online"
add_env "web-public" "NEXT_PUBLIC_BASE_DOMAIN" "serviciosdigitalesmx.online"
add_env "web-public" "NEXT_PUBLIC_HUB_NAME" "Hub operativo"
add_env "web-public" "NEXT_PUBLIC_TENANT_LANDING_URL_TEMPLATE" "/{tenant}"
add_env "web-public" "NEXT_PUBLIC_SUPABASE_URL" "https://your-project.supabase.co"
add_env "web-public" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "your-supabase-anon-key"
add_env "web-public" "NEXT_PUBLIC_SAAS_BRAND_NAME" "FIXI"
add_env "web-public" "NEXT_PUBLIC_SAAS_LEGAL_NAME" "Servicios Digitales MX"
add_env "web-public" "NEXT_PUBLIC_SAAS_BRAND_SHORT" "SF"
add_env "web-public" "NEXT_PUBLIC_SAAS_DEMO_URL" "https://clientes.serviciosdigitalesmx.online"
add_env "web-public" "NEXT_PUBLIC_SAAS_CONTACT_EMAIL" "contacto@serviciosdigitalesmx.online"
add_env "web-public" "NEXT_PUBLIC_SAAS_CONTACT_PHONE" "+52 8129716587"
add_env "web-public" "NEXT_PUBLIC_SAAS_TRIAL_DAYS" "14"

echo "Configuring web-admin..."
add_env "web-admin" "NEXT_PUBLIC_AUTH_TOKEN_KEY" "srfix_auth_token"
add_env "web-admin" "NEXT_PUBLIC_DEFAULT_TENANT_ID" "demo"
add_env "web-admin" "NEXT_PUBLIC_DEFAULT_TENANT_NAME" "Taller Demo"
add_env "web-admin" "NEXT_PUBLIC_TENANT_BRAND_NAME" "Sr. Fix Admin"
add_env "web-admin" "NEXT_PUBLIC_THEME_PRIMARY" "#22d3ee"
add_env "web-admin" "NEXT_PUBLIC_THEME_SECONDARY" "#0f172a"
add_env "web-admin" "NEXT_PUBLIC_THEME_ACCENT" "#34d399"

echo "Configuring web-clientes..."
add_env "web-clientes" "NEXT_PUBLIC_API_URL" "https://api.serviciosdigitalesmx.online"
add_env "web-clientes" "NEXT_PUBLIC_API_BASE_URL" "https://api.serviciosdigitalesmx.online"
add_env "web-clientes" "NEXT_PUBLIC_RENDER_API_URL" "https://sdmx-backend-api.onrender.com"
add_env "web-clientes" "NEXT_PUBLIC_CUSTOMER_PORTAL_NAME" "Portal de Seguimiento"
add_env "web-clientes" "NEXT_PUBLIC_WORKSHOP_NAME" "Sr. Fix"
add_env "web-clientes" "NEXT_PUBLIC_CUSTOMER_SUPPORT_EMAIL" "soporte@serviciosdigitalesmx.online"
add_env "web-clientes" "NEXT_PUBLIC_CUSTOMER_TRACKING_URL" "https://clientes.serviciosdigitalesmx.online"

echo "Done configuring environments!"
