/**
 * Idempotent seed for the platform super-admin user.
 * Reads SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD from env.
 * Safe to run multiple times — upserts on email and only rewrites the
 * password hash if SUPER_ADMIN_RESET_PASSWORD=1.
 */
import bcrypt from 'bcryptjs';
import { db, users } from './index.ts';
import { eq } from 'drizzle-orm';

const email = process.env.SUPER_ADMIN_EMAIL;
const password = process.env.SUPER_ADMIN_PASSWORD;
const resetPw = process.env.SUPER_ADMIN_RESET_PASSWORD === '1';

if (!email || !password) {
  console.error('SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD required');
  process.exit(1);
}

const existing = await db.select().from(users).where(eq(users.email, email));
if (existing.length === 0) {
  const hash = await bcrypt.hash(password, 10);
  await db.insert(users).values({
    email,
    passwordHash: hash,
    name: 'Super Admin',
    platformRole: 'super_admin',
  });
  console.log(`created super_admin: ${email}`);
} else if (resetPw) {
  const hash = await bcrypt.hash(password, 10);
  await db.update(users).set({ passwordHash: hash }).where(eq(users.email, email));
  console.log(`rotated password for super_admin: ${email}`);
} else {
  const u = existing[0]!;
  if (u.platformRole !== 'super_admin') {
    await db.update(users).set({ platformRole: 'super_admin' }).where(eq(users.email, email));
    console.log(`elevated ${email} to super_admin`);
  } else {
    console.log(`super_admin exists: ${email} (skipping, use SUPER_ADMIN_RESET_PASSWORD=1 to rotate)`);
  }
}

process.exit(0);
