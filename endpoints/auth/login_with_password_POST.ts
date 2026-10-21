import superjson from "superjson";
import { ZodError } from "zod";
import { createHash, timingSafeEqual } from "node:crypto";
import { sql } from "../../helpers/db";
import {
  sessionCookieHeader,
  signSessionToken,
  lecturerUser,
} from "../../helpers/getSetServerSession";
import { schema } from "./login_with_password_POST.schema";

// Failed sign-ins allowed per IP address in 15 minutes.
const MAX_FAILS = 8;

const json = (status: number, body: unknown, headers?: Record<string, string>) =>
  new Response(superjson.stringify(body), { status, headers });
const digest = (s: string) => createHash("sha256").update(s).digest();

export async function handle(request: Request) {
  try {
    const input = schema.parse(superjson.parse(await request.text()));
    const email = process.env.LECTURER_EMAIL?.trim().toLowerCase();
    const password = process.env.LECTURER_PASSWORD;
    if (!email || !password || !process.env.SESSION_SECRET) {
      return json(503, {
        message: "Lecturer sign-in is not set up yet. The course owner must set it.",
      });
    }
    const ip =
      (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
      "unknown";
    const [row] = await sql<{ n: number }[]>`
      select count(*)::int as n from login_attempts
      where ip = ${ip} and success = false
        and attempted_at > now() - interval '15 minutes'`;
    if ((row?.n ?? 0) >= MAX_FAILS) {
      return json(429, { message: "Too many failed attempts. Try again in 15 minutes." });
    }
    const emailOk = input.email.trim().toLowerCase() === email;
    const passOk = timingSafeEqual(digest(input.password), digest(password));
    const ok = emailOk && passOk;
    await sql`insert into login_attempts (email, success, ip)
              values (${input.email.slice(0, 200)}, ${ok}, ${ip})`;
    if (!ok) return json(401, { message: "Incorrect email or password." });
    const token = await signSessionToken(email);
    return json(200, { user: lecturerUser(email) }, {
      "Set-Cookie": sessionCookieHeader(token),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return json(400, { message: "Email and password are required." });
    }
    return json(500, {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
