
import { requireUser } from '../../../lib/auth';
import { PrismaClient } from '@prisma/client';
import { presign } from '../../../lib/storage';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;
  const id = parseInt(req.query.id || '');
  if (!id) return res.status(400).json({ error: 'id required' });
  const file = await prisma.file.findUnique({ where: { id } });
  if (!file || file.ownerId !== user.id) return res.status(404).json({ error: 'file not found' });
  try {
    const url = await presign(file.key, 60 * 5);
    res.json({ url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'could not create download link' });
  }
}
