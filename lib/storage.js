
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { hasVercelBlob, uploadToVercelBlob, presignVercelBlob } from './blob';

const bucket = process.env.S3_BUCKET;
const region = process.env.S3_REGION || 'us-east-1';
const endpoint = process.env.S3_ENDPOINT || undefined;
const accessKey = process.env.S3_ACCESS_KEY_ID;
const secretKey = process.env.S3_SECRET_ACCESS_KEY;

let s3client = null;
if (bucket && accessKey && secretKey) {
  s3client = new S3Client({
    region,
    endpoint: endpoint || undefined,
    forcePathStyle: !!endpoint,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey }
  });
}

const LOCAL_STORAGE_DIR = path.join(process.cwd(), 'storage');
if (!fs.existsSync(LOCAL_STORAGE_DIR)) fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });

export async function storeBuffer(buffer, filename, contentType) {
  if (hasVercelBlob()) {
    const res = await uploadToVercelBlob(filename, buffer, contentType);
    const key = res.id || res.key || res.url || filename;
    return { key, url: res.url || null };
  }

  if (s3client) {
    const key = `${Date.now()}-${randomUUID()}-${filename.replace(/\s+/g, '_')}`;
    const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: contentType });
    await s3client.send(cmd);
    return { key, url: null };
  } else {
    const key = `${Date.now()}-${randomUUID()}-${filename.replace(/\s+/g, '_')}`;
    const fp = path.join(LOCAL_STORAGE_DIR, key);
    fs.writeFileSync(fp, buffer);
    return { key: fp, url: null };
  }
}

export async function deleteByKey(key) {
  if (hasVercelBlob()) {
    const mod = await import('@vercel/blob');
    if (mod.del) {
      await mod.del(key);
      return;
    }
  }

  if (s3client) {
    const cmd = new DeleteObjectCommand({ Bucket: bucket, Key: key });
    await s3client.send(cmd);
  } else {
    if (fs.existsSync(key)) fs.unlinkSync(key);
  }
}

export async function presign(key, expiresIn = 300) {
  if (hasVercelBlob()) {
    if (typeof key === 'string' && key.startsWith('http')) return key;
    return presignVercelBlob(key);
  }

  if (s3client) {
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
    return await getSignedUrl(s3client, cmd, { expiresIn });
  } else {
    return `/api/files/local-download?path=${encodeURIComponent(key)}`;
  }
}
