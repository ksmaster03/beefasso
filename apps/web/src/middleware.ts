import { NextResponse, type NextRequest } from 'next/server';
import { resolveTenantFromHost } from '@/lib/tenant';

export function middleware(req: NextRequest) {
  const host = req.headers.get('host');
  const ctx = resolveTenantFromHost(host);

  const res = NextResponse.next();
  res.headers.set('x-tenant-kind', ctx.kind);
  if (ctx.kind === 'tenant') res.headers.set('x-tenant-slug', ctx.slug);
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/health).*)'],
};
