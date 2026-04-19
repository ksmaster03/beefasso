import { Hono } from 'hono';
import { and, eq, like, sql, desc, count, inArray } from 'drizzle-orm';
import { db, withTenant, certificates, cattle, members, tenants } from '@beefasso/db';
import type { CertificateSnapshot } from '@beefasso/shared';
import { requireTenantAuth } from '../lib/auth.ts';
import { putObject, getObjectStream } from '../lib/s3.ts';
import { renderCertificatePdf } from '../lib/cert-pdf.ts';

export const certificateRoutes = new Hono();

// ---- Authenticated (tenant) ----
certificateRoutes.get('/cattle/:id', requireTenantAuth, async (c) => {
  const tenantId = c.get('tenantId' as never) as string;
  const cattleId = c.req.param('id');
  const rows = await withTenant(tenantId, (tx) =>
    tx
      .select({ id: certificates.id, certNo: certificates.certNo, issuedAt: certificates.issuedAt, pdfS3Key: certificates.pdfS3Key })
      .from(certificates)
      .where(eq(certificates.cattleId, cattleId))
      .orderBy(desc(certificates.issuedAt)),
  );
  return c.json({ certificates: rows });
});

certificateRoutes.post('/cattle/:id', requireTenantAuth, async (c) => {
  const tenantId = c.get('tenantId' as never) as string;
  const user = c.get('user' as never) as { tenantRole?: string };
  if (!user.tenantRole || !['owner', 'admin'].includes(user.tenantRole)) {
    return c.json({ error: 'forbidden' }, 403);
  }
  const cattleId = c.req.param('id');

  // Fetch tenant (no RLS) and build snapshot inside a withTenant transaction.
  const [tenant] = await db
    .select({ slug: tenants.slug, nameTh: tenants.nameTh, nameEn: tenants.nameEn })
    .from(tenants)
    .where(eq(tenants.id, tenantId));
  if (!tenant) return c.json({ error: 'tenant_not_found' }, 404);

  const rootUrl = process.env.APP_URL ?? 'https://jungdee.growgenius.co.th';

  const prepared = await withTenant(tenantId, async (tx) => {
    const [target] = await tx.select().from(cattle).where(eq(cattle.id, cattleId));
    if (!target) return { error: 'not_found' as const };

    // Build 3-generation pedigree snapshot via recursive CTE.
    const r: any = await tx.execute(sql`
      WITH RECURSIVE ancestors AS (
        SELECT id, reg_no, name, sex, sire_id, dam_id, 0 AS depth, '' AS path
        FROM cattle WHERE id = ${cattleId}
        UNION ALL
        SELECT c.id, c.reg_no, c.name, c.sex, c.sire_id, c.dam_id, a.depth + 1,
               a.path || CASE WHEN c.id = a.sire_id THEN 'S' ELSE 'D' END
        FROM cattle c
        JOIN ancestors a ON (c.id = a.sire_id OR c.id = a.dam_id)
        WHERE a.depth < 3
      )
      SELECT id::text, reg_no, name, sex, depth, path FROM ancestors WHERE path <> ''
    `);
    const pedigree: CertificateSnapshot['pedigree'] = {};
    for (const row of r as any[]) pedigree[row.path] = { id: row.id, regNo: row.reg_no, name: row.name, sex: row.sex };

    let owner: { memberNo: string; fullName: string } | null = null;
    if (target.currentOwnerId) {
      const [m] = await tx
        .select({ memberNo: members.memberNo, fullName: members.fullName })
        .from(members)
        .where(eq(members.id, target.currentOwnerId));
      owner = m ?? null;
    }

    // Unique cert no: {TENANT-SLUG}-{YEAR}-{SEQ:5}
    const year = new Date().getFullYear();
    const prefix = `${tenant.slug.toUpperCase()}-${year}-`;
    const [seq] = await tx
      .select({ c: count() })
      .from(certificates)
      .where(and(eq(certificates.tenantId, tenantId), like(certificates.certNo, prefix + '%')));
    const certNo = `${prefix}${String(Number(seq?.c ?? 0) + 1).padStart(5, '0')}`;

    const verifyHash = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 8);

    const snapshot: CertificateSnapshot = {
      tenant: { slug: tenant.slug, nameTh: tenant.nameTh, nameEn: tenant.nameEn },
      issuedAtIso: new Date().toISOString(),
      cattle: {
        regNo: target.regNo,
        earTag: target.earTag,
        name: target.name,
        breed: target.breed,
        sex: target.sex,
        dob: target.dob ? String(target.dob).slice(0, 10) : null,
        color: target.color,
      },
      owner,
      pedigree,
    };

    return { ok: true as const, certNo, verifyHash, snapshot };
  });

  if ('error' in prepared) return c.json({ error: prepared.error }, 404);

  // Render PDF (outside transaction).
  const verifyUrl = `${rootUrl}/verify/${prepared.certNo}`;
  const pdf = await renderCertificatePdf({ certNo: prepared.certNo, verifyUrl, snapshot: prepared.snapshot });
  const pdfKey = `${tenantId}/certificates/${prepared.certNo}.pdf`;
  await putObject(pdfKey, pdf, 'application/pdf');

  const inserted = await withTenant(tenantId, async (tx) => {
    const [row] = await tx
      .insert(certificates)
      .values({
        tenantId,
        cattleId,
        certNo: prepared.certNo,
        pdfS3Key: pdfKey,
        verifyHash: prepared.verifyHash,
        snapshot: prepared.snapshot,
      })
      .returning();
    return row;
  });

  return c.json(
    {
      certificate: {
        id: inserted!.id,
        certNo: inserted!.certNo,
        issuedAt: inserted!.issuedAt,
        pdfS3Key: inserted!.pdfS3Key,
      },
      verifyUrl,
    },
    201,
  );
});

// Tenant-authenticated PDF download (owner/admin).
certificateRoutes.get('/:id/pdf', requireTenantAuth, async (c) => {
  const tenantId = c.get('tenantId' as never) as string;
  const id = c.req.param('id');
  const [cert] = await withTenant(tenantId, (tx) =>
    tx.select().from(certificates).where(eq(certificates.id, id)),
  );
  if (!cert) return c.notFound();
  const { body, contentLength } = await getObjectStream(cert.pdfS3Key);
  return new Response(body as unknown as ReadableStream, {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `inline; filename="${cert.certNo}.pdf"`,
      ...(contentLength ? { 'content-length': String(contentLength) } : {}),
    },
  });
});
