import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db, certificates } from '@beefasso/db';
import type { CertificateSnapshot } from '@beefasso/shared';
import { getObjectStream } from '../lib/s3.ts';

export const verifyRoutes = new Hono();

// Public JSON: tenant + snapshot (no secrets).
verifyRoutes.get('/:certNo', async (c) => {
  const certNo = c.req.param('certNo');
  const [cert] = await db
    .select({
      certNo: certificates.certNo,
      issuedAt: certificates.issuedAt,
      snapshot: certificates.snapshot,
    })
    .from(certificates)
    .where(eq(certificates.certNo, certNo));
  if (!cert) return c.json({ verified: false }, 404);
  return c.json({
    verified: true,
    certNo: cert.certNo,
    issuedAt: cert.issuedAt,
    snapshot: cert.snapshot as CertificateSnapshot,
  });
});

// Public PDF proxy: cert_no -> stream from private S3.
verifyRoutes.get('/:certNo/pdf', async (c) => {
  const certNo = c.req.param('certNo');
  const [cert] = await db
    .select({ pdfS3Key: certificates.pdfS3Key })
    .from(certificates)
    .where(eq(certificates.certNo, certNo));
  if (!cert) return c.notFound();
  const { body, contentLength } = await getObjectStream(cert.pdfS3Key);
  return new Response(body as unknown as ReadableStream, {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `inline; filename="${certNo}.pdf"`,
      ...(contentLength ? { 'content-length': String(contentLength) } : {}),
    },
  });
});
