
import { createUser, signToken, setTokenCookie } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username & password required' });
  try {
    const user = await createUser(username, password);
    const token = signToken({ uid: user.id, username: user.username });
    setTokenCookie(res, token);
    res.json({ ok: true, user: { id: user.id, username: user.username } });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: 'user exists or db error' });
  }
}
