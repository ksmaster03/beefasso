import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from './schema.ts';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL required');

// Connection pool — postgres.js defaults are sane for Bun.
const client = postgres(DATABASE_URL, { prepare: false, max: 10 });

export const db = drizzle(client, { schema, casing: 'snake_case' });
export { schema };
export * from './schema.ts';

/**
 * Run a callback with `app.tenant_id` set on the connection, so RLS policies
 * on business tables filter by this tenant. Uses a transaction so SET LOCAL
 * is scoped and auto-reverts.
 */
export async function withTenant<T>(tenantId: string, fn: (tx: typeof db) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    // SET LOCAL requires a constant, not a bind param — but tenantId comes from trusted session.
    // Validate UUID to be safe.
    if (!/^[0-9a-f-]{36}$/i.test(tenantId)) throw new Error('invalid tenantId');
    await tx.execute(sql.raw(`SET LOCAL app.tenant_id = '${tenantId}'`));
    return fn(tx as unknown as typeof db);
  });
}
