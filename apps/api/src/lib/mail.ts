/**
 * Minimal email sender.
 * Priority of transports:
 *  1. SMTP (Gmail or any provider) if SMTP_HOST + SMTP_USER + SMTP_PASS are set
 *  2. Console stdout logger (dev fallback)
 *
 * Recommended for a quick Gmail setup:
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=465
 *   SMTP_SECURE=true
 *   SMTP_USER=<your-gmail>@gmail.com
 *   SMTP_PASS=<16-char-app-password>   (https://myaccount.google.com/apppasswords)
 *   MAIL_FROM=Jungdee <your-gmail@gmail.com>
 */
import nodemailer, { type Transporter } from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 465);
const SMTP_SECURE = (process.env.SMTP_SECURE ?? 'true').toLowerCase() !== 'false';
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM = process.env.MAIL_FROM ?? (SMTP_USER ? `Jungdee <${SMTP_USER}>` : '');

let transporter: Transporter | null = null;
if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export function mailTransport(): 'smtp' | 'console' {
  return transporter ? 'smtp' : 'console';
}

export async function sendMail(opts: { to: string; subject: string; html: string; text: string }): Promise<void> {
  if (!transporter || !FROM) {
    console.log(`[mail:console] to=${opts.to} subject="${opts.subject}"\n${opts.text}`);
    return;
  }
  try {
    const info = await transporter.sendMail({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    console.log(`[mail:smtp] to=${opts.to} id=${info.messageId}`);
  } catch (err) {
    console.error(`[mail:error] falling back to console`, err);
    console.log(`[mail:console-fallback] to=${opts.to}\n${opts.text}`);
  }
}
