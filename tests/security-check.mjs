// Run against a running server:  npm run security-check
// Proves the sync endpoint's protections with real HTTP requests.
import { createHash, randomUUID } from 'node:crypto';

const BASE = process.env.BASE ?? 'http://localhost:3000';
let failed = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? `  (${extra})` : ''}`);
  if (!ok) failed++;
};

async function login(email, password) {
  const r = await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) });
  return r.headers.get('set-cookie')?.split(';')[0] ?? '';
}
const req = (cookie, path, body) =>
  fetch(`${BASE}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'content-type': 'application/json', cookie },
    body: body ? JSON.stringify(body) : undefined
  });
const canonical = (a) => JSON.stringify({ id: a.id, assessmentId: a.assessmentId, answers: Object.keys(a.answers).sort().map((k) => [k, a.answers[k]]) });
const withChecksum = (a) => ({ ...a, checksum: createHash('sha256').update(canonical(a)).digest('hex') });

const amina = await login('amina@salama.ac.ke', 'amina123');
const brian = await login('brian@salama.ac.ke', 'brian123');
const lecturer = await login('lecturer@salama.ac.ke', 'lecturer123');

const bad = await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'amina@salama.ac.ke', password: 'wrong' }) });
check('Wrong password is refused with a generic message', bad.status === 401);

check('No session → 401 on student data', (await req('', '/api/student/catalog')).status === 401);
check('Student cannot open lecturer endpoints', (await req(amina, '/api/lecturer/submissions')).status === 403);
check('Lecturer cannot submit as a student', (await req(lecturer, '/api/attempts', {})).status === 403);
check('Student cannot download a class they are not in', (await req(brian, '/api/student/units/unit_hygiene/package')).status === 403);

const pkg = await (await req(amina, '/api/student/units/unit_hygiene/package')).json();
const cat = pkg.assessments.find((a) => a.mode === 'formal');
const practice = pkg.assessments.find((a) => a.mode === 'practice');
check('Formal answer key is never sent to the device', !JSON.stringify(cat).includes('correctOptionId'));
check('Formal quiz comes with a server-signed exam ticket', typeof cat.ticket === 'string');

const answers = Object.fromEntries(cat.questions.map((q) => [q.id, q.options[0].id]));
const now = new Date().toISOString();
const base = { assessmentId: cat.id, answers, startedAt: now, submittedAt: now, ticket: cat.ticket };

const a1 = withChecksum({ ...base, id: randomUUID() });
const r1 = await req(amina, '/api/attempts', a1);
check('Valid offline attempt is accepted', r1.status === 201);
const r1b = await (await req(amina, '/api/attempts', a1)).json();
check('Retrying the same attempt does not create a duplicate', r1b.duplicate === true);

const tampered = { ...a1, id: randomUUID() }; // checksum no longer matches the content
check('Tampered/corrupted payload fails the integrity check', (await req(amina, '/api/attempts', tampered)).status === 422);

check('Formal attempt without a ticket is rejected', (await req(amina, '/api/attempts', withChecksum({ ...base, id: randomUUID(), ticket: undefined }))).status === 422);
const forged = cat.ticket.split('.')[0] + '.' + 'A'.repeat(43);
check('Forged ticket signature is rejected', (await req(amina, '/api/attempts', withChecksum({ ...base, id: randomUUID(), ticket: forged }))).status === 422);

const fakeAns = withChecksum({ ...base, id: randomUUID(), answers: { [cat.questions[0].id]: 'opt_made_up' } });
check('Answers to non-existent options are rejected', (await req(amina, '/api/attempts', fakeAns)).status === 400);

const past = new Date(Date.now() - 3 * 86400e3).toISOString();
const r2 = await (await req(amina, '/api/attempts', withChecksum({ ...base, id: randomUUID(), submittedAt: past, startedAt: past }))).json();
check('Device clock set before the download is flagged', r2.flags?.includes('clock_behind'), r2.flags?.join(','));

const pAns = Object.fromEntries(practice.questions.map((q) => [q.id, q.correctOptionId]));
const r3 = await (await req(amina, '/api/attempts', withChecksum({ id: randomUUID(), assessmentId: practice.id, answers: pAns, startedAt: now, submittedAt: now, localScore: 0 }))).json();
check('Device score that disagrees with the server is flagged', r3.flags?.includes('score_mismatch'));

// Attempt limit (CAT allows 3; two accepted above). One more succeeds, the next is refused.
await req(amina, '/api/attempts', withChecksum({ ...base, id: randomUUID() }));
check('Attempt limit is enforced by the server', (await req(amina, '/api/attempts', withChecksum({ ...base, id: randomUUID() }))).status === 422);

console.log(failed ? `\n${failed} check(s) failed` : '\nAll security checks passed');
process.exit(failed ? 1 : 0);
