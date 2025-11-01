
import { validateUser, signToken, setTokenCookie } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username & password required' });
  const user = await validateUser(username, password);
  if (!user) return res.status(401).json({ error: 'invalid credentials' });
  const token = signToken({ uid: user.id, username: user.username });
  setTokenCookie(res, token);
  res.json({ ok: true, user: { id: user.id, username: user.username } });
}
