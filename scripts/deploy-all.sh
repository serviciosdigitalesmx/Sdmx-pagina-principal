#!/bin/bash
set -e

deploy_app() {
  local project=$1
  echo "======================================="
  echo "Deploying $project from monorepo root"
  echo "======================================="
  
  # Link the root to the specific project
  vercel link --project "$project" --yes
  
  # Pull the production environment variables to build locally
  vercel env pull .vercel/.env.production.local --environment production --yes
  
  # Build the project locally
  # (Vercel CLI uses the project settings to know it's in apps/$project)
  vercel build --prod --yes
  
  # Deploy the prebuilt artifacts
  vercel deploy --prebuilt --prod
}

deploy_app "web-public"
deploy_app "web-admin"
deploy_app "web-clientes"

echo "All deployments finished successfully!"
