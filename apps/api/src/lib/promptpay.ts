import generatePayload from 'promptpay-qr';
import QRCode from 'qrcode';

/**
 * Build a dynamic PromptPay QR for the given PromptPay ID + amount.
 * Returns the raw EMV-QR payload string and a PNG data URL for display.
 */
export async function promptPayQr(promptpayId: string, amount: number): Promise<{ payload: string; qrDataUrl: string }> {
  const payload: string = generatePayload(promptpayId, { amount });
  const qrDataUrl = await QRCode.toDataURL(payload, { errorCorrectionLevel: 'M', margin: 1, width: 320 });
  return { payload, qrDataUrl };
}

/** Short, readable ref code for payments. Timestamp + random → tenant-unique with high probability. */
export function newRefCode(): string {
  const ts = new Date().toISOString().replace(/[^0-9]/g, '').slice(2, 12); // YYMMDDHHMM
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BF${ts}${r}`;
}
