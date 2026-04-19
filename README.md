# Beefasso (Jungdee)

Multi-tenant SaaS platform for Thai cattle breeders associations.

- **Platform:** `jungdee.growgenius.co.th`
- **Per-tenant:** `{slug}.jungdee.growgenius.co.th`

## Stack

- **Runtime:** Bun 1.3+
- **Backend:** Hono (API + JSX SSR for public pages)
- **Frontend:** Vite + React 19 (SPA for logged-in users)
- **DB:** PostgreSQL 16 + Drizzle ORM + Row-Level Security
- **Deploy:** EC2 (ap-southeast-7 Bangkok) + Cloudflare Tunnel (`growgenius-tunnel`)

## Structure

```
apps/
  api/       Hono on Bun — API + public SSR (landing, /verify/:certNo)
  app/       Vite + React 19 SPA — logged-in tenant dashboard
packages/
  db/        Drizzle schema, migrations, RLS SQL
  shared/    Zod schemas and types shared across api/app
```

## Dev

```bash
bun install
docker compose up -d postgres
cp .env.example .env
bun run db:push      # push schema
bun run db:rls       # apply RLS policies
bun run dev          # runs api + app concurrently
```

Visit:
- `http://localhost:3000` — platform landing (SSR)
- `http://<slug>.localhost:3000` — tenant app
- `http://localhost:5173` — SPA dev server (proxied by api in prod)
