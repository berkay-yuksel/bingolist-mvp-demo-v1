import crypto from 'crypto';

// A prototype-grade auth layer: scrypt password hashing (built into
// Node, no bcrypt dependency needed) and an HMAC-signed session cookie
// value. Good enough to stop casual tampering and keep passwords out of
// plaintext, but set a real AUTH_SECRET env var before this goes anywhere
// more public than a private test link — the fallback below is NOT safe
// for a genuinely public deployment.
const SECRET = process.env.AUTH_SECRET || 'bingolist-dev-secret-change-me';

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const candidate = crypto.scryptSync(password, salt, 64).toString('hex');
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(candidate, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function sign(value) {
  return crypto.createHmac('sha256', SECRET).update(value).digest('hex');
}

export function createSessionToken(userId) {
  return `${userId}.${sign(userId)}`;
}

export function verifySessionToken(token) {
  if (!token || !token.includes('.')) return null;
  const idx = token.lastIndexOf('.');
  const userId = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = sign(userId);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return userId;
}

export const SESSION_COOKIE = 'bl_session';
