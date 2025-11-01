
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

export function setTokenCookie(res, token) {
  const cookieStr = cookie.serialize('pc_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });
  res.setHeader('Set-Cookie', cookieStr);
}

export function clearTokenCookie(res) {
  const cookieStr = cookie.serialize('pc_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });
  res.setHeader('Set-Cookie', cookieStr);
}

export async function requireUser(req, res) {
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies.pc_token;
  if (!token) {
    res.status(401).json({ error: 'not authenticated' });
    return null;
  }
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'invalid token' });
    return null;
  }
  const user = await prisma.user.findUnique({ where: { id: payload.uid } });
  if (!user) {
    res.status(401).json({ error: 'user not found' });
    return null;
  }
  return user;
}

export async function createUser(username, password) {
  const hashed = await bcrypt.hash(password, 10);
  return prisma.user.create({ data: { username, password: hashed } });
}
export async function validateUser(username, password) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return null;
  return user;
}
