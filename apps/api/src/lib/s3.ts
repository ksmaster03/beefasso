import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import type { Readable } from 'node:stream';

const REGION = process.env.AWS_REGION ?? 'ap-southeast-7';
const BUCKET = process.env.S3_BUCKET ?? 'beefasso-prod-ap-southeast-7';

// Uses the EC2 instance profile's credentials by default (no keys needed).
// Accepts explicit credentials from env if provided (for local dev).
const hasStaticCreds = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;

export const s3 = new S3Client({
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

export const S3_BUCKET = BUCKET;

export async function putObject(key: string, body: Uint8Array | Buffer, contentType: string): Promise<void> {
  await s3.send(
    new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType }),
  );
}

export async function deleteObject(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

export async function getObjectStream(key: string): Promise<{ body: Readable; contentType?: string; contentLength?: number }> {
  const r = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  return {
    body: r.Body as Readable,
    contentType: r.ContentType,
    contentLength: r.ContentLength,
  };
}

/** Cattle photo key scheme: {tenantId}/cattle/{cattleId}/{uuid}.{ext} */
export function cattlePhotoKey(tenantId: string, cattleId: string, ext: string): string {
  const uuid = crypto.randomUUID();
  return `${tenantId}/cattle/${cattleId}/${uuid}.${ext.toLowerCase().replace(/^\./, '')}`;
}
