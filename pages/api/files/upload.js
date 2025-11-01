
import formidable from 'formidable';
import fs from 'fs';
import { requireUser } from '../../../lib/auth';
import { storeBuffer } from '../../../lib/storage';
import { PrismaClient } from '@prisma/client';

export const config = { api: { bodyParser: false } };
const prisma = new PrismaClient();

export default async function handler(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;
  if (req.method !== 'POST') return res.status(405).end();

  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'upload error' });
    }
    const file = files.file;
    if (!file) return res.status(400).json({ error: 'no file provided' });

    try {
      const data = fs.readFileSync(file.filepath);
      const { key } = await storeBuffer(data, file.originalFilename || file.newFilename, file.mimetype || 'application/octet-stream');
      const rec = await prisma.file.create({
        data: {
          filename: file.originalFilename || 'file',
          key,
          size: file.size,
          mime: file.mimetype || 'application/octet-stream',
          ownerId: user.id
        }
      });
      res.json({ ok: true, file: { id: rec.id, filename: rec.filename, size: rec.size, uploadedAt: rec.uploadedAt } });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'upload failed' });
    }
  });
}
