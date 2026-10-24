import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import type { Context, Next } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { db } from './db.js';

// ---- Server secret (signs exam tickets). Set SALAMA_SECRET in production. ----
const SECRET_FILE = '.data/secret';
export const SECRET =
  process.env.SALAMA_SECRET ??
  (existsSync(SECRET_FILE)
    ? readFileSync(SECRET_FILE, 'utf8')
    : (() => {
        const s = randomBytes(32).toString('hex');
        writeFileSync(SECRET_FILE, s, { mode: 0o600 });
        return s;
      })());

export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

// ---- Sessions: random token in an HttpOnly cookie, only its hash stored in the DB ----
export const COOKIE = 'ss_session';
const SESSION_DAYS = 7;

export type SessionUser = { id: string; name: string; email: string; role: 'student' | 'lecturer' };

export async function createSession(c: Context, userId: string) {
  const token = randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5);
  await db.query('INSERT INTO sessions (token_hash,user_id,expires_at) VALUES ($1,$2,$3)', [sha256(token), userId, expires.toISOString()]);
  setCookie(c, COOKIE, token, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: c.req.header('x-forwarded-proto') === 'https' || c.req.url.startsWith('https'),
    path: '/',
    expires
  });
}

export async function destroySession(c: Context) {
  const token = getCookie(c, COOKIE);
  if (token) await db.query('DELETE FROM sessions WHERE token_hash=$1', [sha256(token)]);
  deleteCookie(c, COOKIE, { path: '/' });
}

export async function currentUser(c: Context): Promise<SessionUser | null> {
  const token = getCookie(c, COOKIE);
  if (!token) return null;
  const { rows } = await db.query<SessionUser>(
    `SELECT u.id,u.name,u.email,u.role FROM sessions s JOIN users u ON u.id=s.user_id
     WHERE s.token_hash=$1 AND s.expires_at > now()`,
    [sha256(token)]
  );
  return rows[0] ?? null;
}

/** Authorization middleware: signed in, and (optionally) the right role. */
export const requireRole = (role?: 'student' | 'lecturer') => async (c: Context, next: Next) => {
  const user = await currentUser(c);
  if (!user) return c.json({ error: 'auth_required', message: 'Please sign in.' }, 401);
  if (role && user.role !== role) return c.json({ error: 'forbidden', message: 'Not allowed for your role.' }, 403);
  c.set('user', user);
  await next();
};

/** CSRF hardening: state-changing requests must be JSON (cross-site forms cannot send JSON without CORS). */
export const requireJson = async (c: Context, next: Next) => {
  if (c.req.method !== 'GET' && !(c.req.header('content-type') ?? '').includes('application/json')) {
    return c.json({ error: 'bad_request', message: 'JSON body required.' }, 415);
  }
  await next();
};

// ---- Simple in-memory login rate limiter ----
const hits = new Map<string, { n: number; reset: number }>();
export function rateLimited(key: string, max = 10, windowMs = 5 * 60_000) {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.reset < now) {
    hits.set(key, { n: 1, reset: now + windowMs });
    return false;
  }
  h.n++;
  return h.n > max;
}

// ---- Exam tickets: server-signed proof of who downloaded which quiz, and when ----
export function issueTicket(studentId: string, assessmentId: string) {
  const payload = Buffer.from(JSON.stringify({ sid: studentId, aid: assessmentId, iat: new Date().toISOString() })).toString('base64url');
  const sig = createHmac('sha256', SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyTicket(ticket: string): { sid: string; aid: string; iat: string } | null {
  const [payload, sig] = ticket.split('.');
  if (!payload || !sig) return null;
  const expected = createHmac('sha256', SECRET).update(payload).digest();
  const given = Buffer.from(sig, 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString());
  } catch {
    return null;
  }
}
