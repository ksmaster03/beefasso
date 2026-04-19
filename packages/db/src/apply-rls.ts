import postgres from 'postgres';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL required');
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlFile = join(__dirname, 'rls.sql');
const ddl = readFileSync(sqlFile, 'utf8');

const sql = postgres(DATABASE_URL, { prepare: false });
try {
  await sql.unsafe(ddl);
  console.log('RLS policies applied.');
} finally {
  await sql.end();
}
