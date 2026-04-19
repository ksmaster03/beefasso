# Beefasso (Jungdee)

Multi-tenant SaaS platform for Thai cattle breeders associations.

- **Web:** `jungdee.growgenius.co.th` (landing + platform admin)
- **Per-tenant:** `{slug}.jungdee.growgenius.co.th`

## Stack

- Next.js 15 (App Router, PWA)
- Auth.js v5
- Prisma + PostgreSQL with Row-Level Security
- Turborepo + pnpm workspaces
- Deploy: EC2 (Bangkok) + Cloudflare Tunnel (`growgenius-tunnel`)

## Dev

```bash
pnpm install
docker compose up -d postgres
cp .env.example .env
pnpm db:push
pnpm dev
```

Visit:
- `http://localhost:3000` — landing / platform
- `http://<tenant-slug>.localhost:3000` — tenant app (add to hosts or use `nip.io`)
