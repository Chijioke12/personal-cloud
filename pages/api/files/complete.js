
import fs from 'fs';
import path from 'path';
import { requireUser } from '../../../lib/auth';
import { storeBuffer } from '../../../lib/storage';
import { PrismaClient } from '@prisma/client';

export const config = { api: { bodyParser: true } };
const prisma = new PrismaClient();
const UPLOAD_TMP = path.join(process.cwd(), 'tmp-uploads');

export default async function handler(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;
  if (req.method !== 'POST') return res.status(405).end();
  const { uploadId, total, filename, mime } = req.body || {};
  if (!uploadId || !total || !filename) return res.status(400).json({ error: 'uploadId,total,filename required' });

  const folder = path.join(UPLOAD_TMP, uploadId);
  if (!fs.existsSync(folder)) return res.status(400).json({ error: 'upload not found' });

  const parts = [];
  for (let i = 0; i < Number(total); ++i) {
    const p = path.join(folder, String(i));
    if (!fs.existsSync(p)) return res.status(400).json({ error: `missing chunk ${i}` });
    parts.push(fs.readFileSync(p));
  }
  const fileBuffer = Buffer.concat(parts);

  try {
    const { key } = await storeBuffer(fileBuffer, filename, mime || 'application/octet-stream');
    const rec = await prisma.file.create({
      data: {
        filename,
        key,
        size: fileBuffer.length,
        mime: mime || 'application/octet-stream',
        ownerId: user.id
      }
    });
    for (const p of fs.readdirSync(folder)) fs.unlinkSync(path.join(folder, p));
    fs.rmdirSync(folder);
    res.json({ ok: true, file: { id: rec.id, filename: rec.filename, size: rec.size } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'assemble failed' });
  }
}
