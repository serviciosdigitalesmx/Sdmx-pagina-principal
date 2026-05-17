# New Project 21

Base production-ready for a multi-tenant SaaS:

- Frontend: Next.js
- Backend: Render API
- Database: Supabase with RLS and `tenant_id`

## Environment

Copy `.env.example` to `.env.local` and set real values.

For the chat backend on Render:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `FRONTEND_ORIGIN`
- `API_PORT`

The frontend sends messages to `${NEXT_PUBLIC_API_URL}/chat`.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`

## Deploy

Frontend:

- Vercel
- Set `NEXT_PUBLIC_API_URL` to the Render backend URL

Backend:

- Render using [`/Users/jesusvilla/Documents/New project 21/render.yaml`](/Users/jesusvilla/Documents/New%20project%2021/render.yaml)
- Set `OPENAI_API_KEY`, `FRONTEND_ORIGIN`, and any Supabase variables you add later
