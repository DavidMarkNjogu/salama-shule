import { createServer } from "node:http";
import superjson from "superjson";
import * as apiMod from "./api/index";
const handler: any = (apiMod as any).default?.default ?? (apiMod as any).default;
import { computeAttemptChecksum } from "./helpers/attemptChecksum";
import { SAMPLE_UNIT } from "./helpers/unitContent";

const srv = createServer((req, res) => void handler(req, res));
await new Promise<void>((r) => srv.listen(8787, r));
const base = "http://127.0.0.1:8787";
let pass = 0, fail = 0;
const check = (name: string, ok: boolean, extra?: unknown) => {
  (ok ? pass++ : fail++);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + JSON.stringify(extra)}`);
};
const call = async (method: string, path: string, body?: unknown, headers: Record<string, string> = {}) => {
  const r = await fetch(`${base}/api/index?path=${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body === undefined ? undefined : superjson.stringify(body),
  });
  const text = await r.text();
  let data: any; try { data = superjson.parse(text); } catch { data = text; }
  return { status: r.status, data, cookie: r.headers.get("set-cookie") };
};

const good = [2, 1, 0, 1, 2, 2];
const mk = async (over: Record<string, unknown> = {}) => {
  const f: any = { attemptId: "att-" + Math.random().toString(36).slice(2, 12), studentCode: "TEST-A", studentName: "Test Student", joinCode: "safe-2026", unitId: SAMPLE_UNIT.id, quizId: SAMPLE_UNIT.quiz.id, score: 6, total: 6, answers: good, clientTime: new Date().toISOString(), ...over };
  return { ...f, checksum: await computeAttemptChecksum(f) };
};

let r = await call("GET", "units/get");
check("units/get returns the unit", r.status === 200 && r.data.unit?.id === SAMPLE_UNIT.id, r);
r = await call("POST", "classes/join", { joinCode: "safe-2026" });
check("join code valid", r.data.valid === true, r);
r = await call("POST", "classes/join", { joinCode: "NOPE-1" });
check("join code invalid", r.data.valid === false, r);

const a1 = await mk();
r = await call("POST", "attempts/sync", a1);
check("valid attempt stored", r.status === 200 && r.data.confirmed && !r.data.duplicate && r.data.score === 6, r);
r = await call("POST", "attempts/sync", a1);
check("resend is a duplicate, not a second row", r.status === 200 && r.data.duplicate === true, r);

const inflated = await mk({ studentCode: "TEST-B", answers: [0, 0, 0, 0, 0, 0], score: 6 });
r = await call("POST", "attempts/sync", inflated);
check("inflated score re-marked by server", r.status === 200 && r.data.score === 1 && r.data.scoreCorrected === true, r);

const t = await mk({ studentCode: "TEST-C" });
r = await call("POST", "attempts/sync", { ...t, score: 5 });
check("edited after checksum rejected (422)", r.status === 422 && r.data.code === "CHECKSUM_MISMATCH", r);
r = await call("POST", "attempts/sync", { ...(await mk({ studentCode: "TEST-D" })), checksum: "0".repeat(64) });
check("wrong checksum rejected (422)", r.status === 422, r);
r = await call("POST", "attempts/sync", await mk({ studentCode: "TEST-E", joinCode: "BAD-CODE" }));
check("unknown class code rejected (403)", r.status === 403 && r.data.code === "INVALID_JOIN_CODE", r);
r = await call("POST", "attempts/sync", await mk({ studentCode: "TEST-F", answers: [1, 2] }));
check("short answers rejected (422)", r.status === 422, r);

let okCount = 0, last = 0;
for (let i = 0; i < 13; i++) {
  const x = await call("POST", "attempts/sync", await mk({ studentCode: "TEST-RL" }));
  if (x.status === 200) okCount++; last = x.status;
}
check("rate limit: 12 accepted then 429", okCount === 12 && last === 429, { okCount, last });

r = await call("GET", "attempts/list");
check("list without sign-in -> 401", r.status === 401, r);
r = await call("GET", "auth/session");
check("session without cookie -> 401", r.status === 401, r);
r = await call("POST", "auth/login_with_password", { email: "davidmarknjogu@gmail.com", password: "wrong" }, { "x-forwarded-for": "1.1.1.1" });
check("wrong password -> 401", r.status === 401, r);
r = await call("POST", "auth/login_with_password", { email: "davidmarknjogu@gmail.com", password: process.env.LECTURER_PASSWORD }, { "x-forwarded-for": "2.2.2.2" });
check("right password -> 200 + cookie", r.status === 200 && r.data.user?.role === "admin" && /salama_session=/.test(r.cookie ?? ""), r);
const cookie = (r.cookie ?? "").split(";")[0];
r = await call("GET", "auth/session", undefined, { cookie });
check("session with cookie -> user", r.status === 200 && r.data.user?.email === "davidmarknjogu@gmail.com", r);
r = await call("GET", "attempts/list", undefined, { cookie });
check("list with sign-in -> attempts", r.status === 200 && r.data.attempts.length >= 14 && r.data.classCodes.length === 1, { s: r.status, n: r.data?.attempts?.length });
r = await call("GET", "attempts/list", undefined, { cookie: cookie.slice(0, -3) + "xyz" });
check("forged cookie -> 401", r.status === 401, r);
r = await call("POST", "auth/logout", {}, { cookie });
check("logout clears cookie", r.status === 200 && /Max-Age=0/.test(r.cookie ?? ""), r);
let last2 = 0;
for (let i = 0; i < 9; i++) last2 = (await call("POST", "auth/login_with_password", { email: "a@b.co", password: "x" }, { "x-forwarded-for": "9.9.9.9" })).status;
check("login brute force limited (429)", last2 === 429, last2);

console.log(`\n${pass} passed, ${fail} failed`);
srv.close(); process.exit(fail ? 1 : 0);
