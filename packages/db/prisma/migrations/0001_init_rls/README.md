RLS (Row-Level Security) policies applied after `prisma db push` / `prisma migrate deploy`.
Run: `psql $DATABASE_URL -f ./packages/db/prisma/rls.sql`
