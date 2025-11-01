
import { requireUser } from '../../../lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;
  const files = await prisma.file.findMany({
    where: { ownerId: user.id },
    orderBy: { uploadedAt: 'desc' },
    select: { id: true, filename: true, size: true, mime: true, uploadedAt: true }
  });
  res.json({ files });
}
