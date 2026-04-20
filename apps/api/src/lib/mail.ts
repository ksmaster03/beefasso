/**
 * Minimal email sender. Uses AWS SES v2 via @aws-sdk/client-sesv2 if
 * MAIL_FROM + AWS creds are configured; otherwise logs to stdout so the
 * dev flow keeps moving without a real SMTP transport.
 */
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

const REGION = process.env.SES_REGION ?? process.env.AWS_REGION ?? 'ap-southeast-1';
const FROM = process.env.MAIL_FROM;
const hasStaticCreds = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;

const ses = new SESv2Client({
  region: REGION,
  ...(hasStaticCreds
    ? {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      }
    : {}),
});

export async function sendMail(opts: { to: string; subject: string; html: string; text: string }): Promise<void> {
  if (!FROM) {
    console.log(`[mail:console] to=${opts.to} subject="${opts.subject}"\n${opts.text}`);
    return;
  }
  try {
    await ses.send(
      new SendEmailCommand({
        FromEmailAddress: FROM,
        Destination: { ToAddresses: [opts.to] },
        Content: {
          Simple: {
            Subject: { Data: opts.subject, Charset: 'UTF-8' },
            Body: {
              Html: { Data: opts.html, Charset: 'UTF-8' },
              Text: { Data: opts.text, Charset: 'UTF-8' },
            },
          },
        },
      }),
    );
  } catch (err) {
    console.error(`[mail:error] falling back to console`, err);
    console.log(`[mail:console-fallback] to=${opts.to}\n${opts.text}`);
  }
}
