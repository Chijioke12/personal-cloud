
import fs from 'fs';
import path from 'path';
import { requireUser } from '../../../lib/auth';

export default async function handler(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;
  const p = req.query.path;
  if (!p) return res.status(400).end('path required');
  const fp = decodeURIComponent(p);
  if (!fp.startsWith(path.join(process.cwd(), 'storage'))) return res.status(400).end('invalid path');
  if (!fs.existsSync(fp)) return res.status(404).end('not found');
  const stat = fs.statSync(fp);
  res.setHeader('Content-Length', stat.size);
  const stream = fs.createReadStream(fp);
  stream.pipe(res);
}
