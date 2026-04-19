import { Hono } from 'hono';

export const verifyRoutes = new Hono();

verifyRoutes.get('/:certNo', async (c) => {
  const certNo = c.req.param('certNo');
  // TODO: look up certificate by cert_no (without tenant scope — public),
  // then set tenant context to return sanitized public fields of cattle.
  return c.json({ certNo, verified: false, note: 'not_implemented' });
});
