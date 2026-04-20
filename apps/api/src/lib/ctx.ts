// Typed helpers to avoid `c.get('x' as never) as T` repetition across routes.
import type { Context } from 'hono';
import type { SessionUser } from '@beefasso/shared';

export const getUser = (c: Context): SessionUser => c.get('user' as never) as SessionUser;
export const getTenantId = (c: Context): string => c.get('tenantId' as never) as string;
export const getFarmId = (c: Context): string => c.get('farmId' as never) as string;
