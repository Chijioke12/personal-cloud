
import fs from 'fs';
import path from 'path';
import { requireUser } from '../../../lib/auth';

export const config = { api: { bodyParser: false } };

const UPLOAD_TMP = path.join(process.cwd(), 'tmp-uploads');
if (!fs.existsSync(UPLOAD_TMP)) fs.mkdirSync(UPLOAD_TMP, { recursive: true });

export default async function handler(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;
  if (req.method !== 'POST') return res.status(405).end();
  const uploadId = req.headers['x-upload-id'] || req.query.uploadId;
  const index = parseInt(req.headers['x-chunk-index'] || req.query.index || '-1', 10);
  const filename = req.headers['x-filename'] || req.query.filename;
  if (!uploadId || index < 0 || !filename) return res.status(400).json({ error: 'uploadId, index, filename required' });

  const folder = path.join(UPLOAD_TMP, uploadId);
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const buf = Buffer.concat(chunks);

  const chunkPath = path.join(folder, String(index));
  fs.writeFileSync(chunkPath, buf);
  res.json({ ok: true });
}
