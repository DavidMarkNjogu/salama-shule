import { jwtVerify, SignJWT } from "jose";
import type { User } from "./User";

// Stateless lecturer session: a signed cookie. One lecturer account, set by
// environment variables (LECTURER_EMAIL, LECTURER_PASSWORD, SESSION_SECRET).
export const SESSION_COOKIE = "salama_session";
const MAX_AGE_SECONDS = 60 * 60 * 12;

export class NotAuthenticatedError extends Error {
  constructor(message?: string) {
    super(message ?? "Not authenticated");
    this.name = "NotAuthenticatedError";
  }
}

const key = () => {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(s);
};

export const lecturerUser = (email: string): User => ({
  id: 1,
  email,
  displayName: "Lecturer",
  avatarUrl: null,
  role: "admin",
});

export const signSessionToken = (email: string) =>
  new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(key());

const cookieAttrs = ["HttpOnly", "Secure", "SameSite=Lax", "Path=/"];
export const sessionCookieHeader = (token: string) =>
  [`${SESSION_COOKIE}=${token}`, ...cookieAttrs, `Max-Age=${MAX_AGE_SECONDS}`].join("; ");
export const clearCookieHeader = () =>
  [`${SESSION_COOKIE}=`, ...cookieAttrs, "Max-Age=0"].join("; ");

export async function readSessionEmail(request: Request): Promise<string> {
  const header = request.headers.get("cookie") || "";
  const raw = header
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  if (!raw) throw new NotAuthenticatedError();
  try {
    const { payload } = await jwtVerify(decodeURIComponent(raw.slice(SESSION_COOKIE.length + 1)), key());
    if (typeof payload.email !== "string") throw new NotAuthenticatedError();
    return payload.email;
  } catch {
    throw new NotAuthenticatedError();
  }
}
