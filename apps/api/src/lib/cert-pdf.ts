import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import type { CertificateSnapshot } from '@beefasso/shared';

/**
 * Render a pedigree certificate PDF and return it as a Buffer.
 * Layout (A4 landscape):
 *   Header: tenant name + cert no + issued date
 *   Left column: cattle info + owner
 *   Right column: 3-generation pedigree tree
 *   Footer: verify URL + QR
 */
export async function renderCertificatePdf(args: {
  certNo: string;
  verifyUrl: string;
  snapshot: CertificateSnapshot;
}): Promise<Buffer> {
  const { certNo, verifyUrl, snapshot } = args;

  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40 });
  const chunks: Buffer[] = [];
  doc.on('data', (c) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));

  // Colors (keep inside 0xff range for PDF RGB).
  const PRIMARY = '#1d4ed8';
  const ACCENT = '#b91c1c';
  const SLATE = '#0f172a';
  const MUTE = '#64748b';

  // --- Page border ---
  doc.lineWidth(2).strokeColor(PRIMARY);
  doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke();
  doc.lineWidth(0.5).strokeColor(ACCENT);
  doc.rect(26, 26, doc.page.width - 52, doc.page.height - 52).stroke();

  // --- Header ---
  doc.fillColor(ACCENT).fontSize(10).text('PEDIGREE CERTIFICATE · ใบเพ็ดดีกรี', 50, 50, { align: 'left' });
  doc
    .fillColor(SLATE)
    .fontSize(20)
    .text(snapshot.tenant.nameTh, 50, 70, { width: doc.page.width - 300, align: 'left' });
  if (snapshot.tenant.nameEn) {
    doc.fillColor(MUTE).fontSize(10).text(snapshot.tenant.nameEn, 50, 95);
  }

  // Cert no + date (right)
  doc
    .fillColor(MUTE)
    .fontSize(9)
    .text('CERTIFICATE NO.', doc.page.width - 240, 55, { width: 190, align: 'right' });
  doc
    .fillColor(PRIMARY)
    .fontSize(14)
    .text(certNo, doc.page.width - 240, 70, { width: 190, align: 'right' });
  doc
    .fillColor(MUTE)
    .fontSize(8)
    .text('ISSUED ' + new Date(snapshot.issuedAtIso).toLocaleDateString('en-GB'), doc.page.width - 240, 90, {
      width: 190,
      align: 'right',
    });

  // Separator
  doc.moveTo(50, 120).lineTo(doc.page.width - 50, 120).lineWidth(1).strokeColor(PRIMARY).stroke();

  // --- Left column: cattle info ---
  const leftX = 50;
  let y = 140;
  doc.fillColor(ACCENT).fontSize(9).text('CATTLE', leftX, y);
  y += 14;
  doc.fillColor(SLATE).fontSize(18).text(snapshot.cattle.name ?? snapshot.cattle.earTag, leftX, y);
  y += 24;
  doc.fillColor(MUTE).fontSize(9);
  drawKV(doc, leftX, y, 'Reg. No.', snapshot.cattle.regNo);
  y += 18;
  drawKV(doc, leftX, y, 'Ear Tag', snapshot.cattle.earTag);
  y += 18;
  drawKV(doc, leftX, y, 'Breed', snapshot.cattle.breed ?? '—');
  y += 18;
  drawKV(doc, leftX, y, 'Sex', snapshot.cattle.sex === 'male' ? 'Male ♂' : 'Female ♀');
  y += 18;
  drawKV(doc, leftX, y, 'Date of Birth', snapshot.cattle.dob ?? '—');
  y += 18;
  drawKV(doc, leftX, y, 'Color', snapshot.cattle.color ?? '—');
  y += 26;

  if (snapshot.owner) {
    doc.fillColor(ACCENT).fontSize(9).text('OWNER', leftX, y);
    y += 14;
    doc.fillColor(SLATE).fontSize(12).text(snapshot.owner.fullName, leftX, y);
    y += 16;
    doc.fillColor(MUTE).fontSize(9).text('Member No. ' + snapshot.owner.memberNo, leftX, y);
  }

  // --- Right column: pedigree tree ---
  const treeX = 340;
  drawPedigreeTree(doc, treeX, 140, snapshot.pedigree);

  // --- Footer / QR ---
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { errorCorrectionLevel: 'M', margin: 0, width: 120 });
  const qrBuf = Buffer.from(qrDataUrl.split(',')[1]!, 'base64');
  const footerY = doc.page.height - 140;
  doc.image(qrBuf, leftX, footerY, { width: 80, height: 80 });
  doc.fillColor(MUTE).fontSize(8).text('SCAN TO VERIFY · ตรวจสอบความแท้จริง', leftX + 90, footerY + 10);
  doc.fillColor(PRIMARY).fontSize(10).text(verifyUrl, leftX + 90, footerY + 26, { width: 400, link: verifyUrl, underline: true });

  doc
    .fillColor(MUTE)
    .fontSize(7)
    .text(
      'ใบรับรองนี้เป็นการยืนยันประวัติพันธุ์ของโคเท่านั้น ข้อมูลถูกบันทึกในระบบ Jungdee ณ วันที่ออกใบรับรอง',
      leftX + 90,
      footerY + 50,
      { width: 500 },
    );

  // Signature line (right)
  const sigX = doc.page.width - 240;
  doc.moveTo(sigX, footerY + 50).lineTo(sigX + 170, footerY + 50).lineWidth(0.5).strokeColor(SLATE).stroke();
  doc.fillColor(MUTE).fontSize(8).text('Authorized by', sigX, footerY + 56, { width: 170, align: 'center' });

  doc.end();
  return done;
}

function drawKV(doc: typeof PDFDocument.prototype, x: number, y: number, k: string, v: string) {
  doc.fillColor('#94a3b8').fontSize(8).text(k.toUpperCase(), x, y, { width: 80 });
  doc.fillColor('#0f172a').fontSize(10).text(v, x + 80, y, { width: 200 });
}

function drawPedigreeTree(
  doc: typeof PDFDocument.prototype,
  x: number,
  y: number,
  pedigree: CertificateSnapshot['pedigree'],
) {
  // Header
  doc.fillColor('#b91c1c').fontSize(9).text('PEDIGREE', x, y);

  const startY = y + 16;
  const colWidth = 170;
  const box = (px: number, py: number, w: number, h: number, label: string | null | undefined, sub: string | null, male: boolean) => {
    doc.roundedRect(px, py, w, h, 4).lineWidth(0.5).strokeColor(male ? '#2563eb' : '#dc2626').stroke();
    if (label) {
      doc.fillColor('#0f172a').fontSize(9).text(label, px + 6, py + 6, { width: w - 12, ellipsis: true });
      doc.fillColor('#64748b').fontSize(7).text(sub ?? '', px + 6, py + 20, { width: w - 12, ellipsis: true });
    } else {
      doc.fillColor('#cbd5e1').fontSize(8).text('—', px + w / 2 - 4, py + h / 2 - 4);
    }
  };

  // Generation 1: sire (top) + dam (bottom)
  const g1H = 150;
  box(x, startY, colWidth, 40, pedigree['S']?.regNo ?? null, pedigree['S']?.name ?? null, true);
  box(x, startY + g1H - 40, colWidth, 40, pedigree['D']?.regNo ?? null, pedigree['D']?.name ?? null, false);

  // Generation 2: 4 boxes
  const g2X = x + colWidth + 20;
  const g2H = g1H / 2;
  box(g2X, startY, colWidth, 32, pedigree['SS']?.regNo ?? null, pedigree['SS']?.name ?? null, true);
  box(g2X, startY + g2H - 32, colWidth, 32, pedigree['SD']?.regNo ?? null, pedigree['SD']?.name ?? null, false);
  box(g2X, startY + g2H, colWidth, 32, pedigree['DS']?.regNo ?? null, pedigree['DS']?.name ?? null, true);
  box(g2X, startY + g1H - 32, colWidth, 32, pedigree['DD']?.regNo ?? null, pedigree['DD']?.name ?? null, false);

  // Generation 3: 8 boxes
  const g3X = g2X + colWidth + 20;
  const g3H = g1H / 4;
  const keys: Array<{ k: string; male: boolean }> = [
    { k: 'SSS', male: true },
    { k: 'SSD', male: false },
    { k: 'SDS', male: true },
    { k: 'SDD', male: false },
    { k: 'DSS', male: true },
    { k: 'DSD', male: false },
    { k: 'DDS', male: true },
    { k: 'DDD', male: false },
  ];
  for (let i = 0; i < 8; i++) {
    const { k, male } = keys[i]!;
    const py = startY + (i * g3H) + (i > 0 ? 2 * i : 0);
    box(g3X, startY + i * (g3H + 2), colWidth, g3H, pedigree[k]?.regNo ?? null, pedigree[k]?.name ?? null, male);
  }
}
