import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { secureHeaders } from 'hono/secure-headers';
import { readFileSync, existsSync } from 'node:fs';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { db, initDb } from './db.js';
import { insertAssessment } from './seed.js';
import {
  createSession, currentUser, destroySession, issueTicket, rateLimited, requireJson, requireRole,
  sha256, verifyTicket, type SessionUser
} from './security.js';
import {
  AttemptSubmissionSchema, JoinClassSchema, LoginSchema, NewAssessmentSchema, canonicalAttempt, type FlagCode
} from '../shared/schemas.js';

type Env = { Variables: { user: SessionUser } };
const app = new Hono<Env>();

app.use('*', secureHeaders({ crossOriginEmbedderPolicy: false }));
app.use('/api/*', requireJson);

const bad = (message: string, details?: unknown) => ({ error: 'validation', message, details });
const csvCell = (value: unknown) => {
  const text = String(value ?? '');
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
};

// ---------------------------------------------------------------- auth
app.get('/api/health', (c) => c.json({ ok: true, time: new Date().toISOString() }));

app.post('/api/auth/login', async (c) => {
  const ip = c.req.header('x-forwarded-for') ?? 'local';
  if (rateLimited(`login:${ip}`)) return c.json({ error: 'rate_limited', message: 'Too many attempts. Try again in a few minutes.' }, 429);
  const parsed = LoginSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json(bad('Enter a valid email and password.'), 400);
  const { rows } = await db.query<SessionUser & { password_hash: string }>('SELECT * FROM users WHERE email=$1', [parsed.data.email]);
  const u = rows[0];
  // Same generic message whether the email or password is wrong (no account enumeration)
  if (!u || !(await bcrypt.compare(parsed.data.password, u.password_hash))) {
    return c.json({ error: 'invalid_credentials', message: 'Incorrect email or password.' }, 401);
  }
  await createSession(c, u.id);
  return c.json({ user: { id: u.id, name: u.name, email: u.email, role: u.role } });
});

app.post('/api/auth/logout', async (c) => {
  await destroySession(c);
  return c.json({ ok: true });
});

app.get('/api/auth/me', async (c) => {
  const user = await currentUser(c);
  if (!user) return c.json({ error: 'auth_required' }, 401);
  return c.json({ user });
});

// ---------------------------------------------------------------- student
const student = new Hono<Env>();
student.use('*', requireRole('student'));

student.post('/join', async (c) => {
  const parsed = JoinClassSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json(bad('Enter a class code.'), 400);
  const { rows } = await db.query<{ id: string; name: string }>('SELECT id,name FROM classes WHERE join_code=$1', [parsed.data.code]);
  if (!rows[0]) return c.json({ error: 'not_found', message: 'No class with that code.' }, 404);
  await db.query('INSERT INTO class_members (class_id,user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [rows[0].id, c.get('user').id]);
  return c.json({ class: rows[0] });
});

student.get('/catalog', async (c) => {
  const uid = c.get('user').id;
  const classes = await db.query(
    `SELECT c.id,c.name FROM classes c JOIN class_members m ON m.class_id=c.id WHERE m.user_id=$1 ORDER BY c.name`, [uid]);
  const units = await db.query(
    `SELECT u.id,u.class_id AS "classId",u.title,u.description,u.version,
       (SELECT count(*)::int FROM lessons l WHERE l.unit_id=u.id) AS "lessonCount",
       (SELECT count(*)::int FROM assessments a WHERE a.unit_id=u.id) AS "assessmentCount",
       (SELECT coalesce(sum(length(l.blocks::text)),0)::int FROM lessons l WHERE l.unit_id=u.id)
         + (SELECT coalesce(sum(length(q.prompt)+length(q.options::text)+length(q.explanation)),0)::int
            FROM questions q JOIN assessments a ON a.id=q.assessment_id WHERE a.unit_id=u.id) AS "sizeBytes"
     FROM units u JOIN class_members m ON m.class_id=u.class_id
     WHERE m.user_id=$1 ORDER BY u.position`, [uid]);
  return c.json({ classes: classes.rows, units: units.rows });
});

/** Download a unit for offline use. Formal answer keys are NEVER included. */
student.get('/units/:id/package', async (c) => {
  const uid = c.get('user').id;
  const unitId = c.req.param('id');
  const unit = await db.query(
    `SELECT u.id,u.class_id AS "classId",u.title,u.description,u.version FROM units u
     JOIN class_members m ON m.class_id=u.class_id WHERE u.id=$1 AND m.user_id=$2`, [unitId, uid]);
  if (!unit.rows[0]) return c.json({ error: 'forbidden', message: 'You are not in this class.' }, 403);

  const lessons = await db.query(
    `SELECT id,title,position,minutes,blocks FROM lessons WHERE unit_id=$1 ORDER BY position`, [unitId]);
  const assessments = await db.query<any>(
    `SELECT id,title,mode,time_limit_min AS "timeLimitMin",deadline,max_attempts AS "maxAttempts"
     FROM assessments WHERE unit_id=$1 ORDER BY created_at`, [unitId]);
  for (const a of assessments.rows) {
    const qs = await db.query<any>(
      `SELECT id,prompt,options,correct_option_id AS "correctOptionId",explanation FROM questions
       WHERE assessment_id=$1 ORDER BY position`, [a.id]);
    a.questions = qs.rows.map((q) =>
      a.mode === 'practice' ? q : { id: q.id, prompt: q.prompt, options: q.options } // strip key + explanation
    );
    if (a.mode === 'formal') a.ticket = issueTicket(uid, a.id);
  }
  return c.json({ unit: unit.rows[0], lessons: lessons.rows, assessments: assessments.rows, downloadedAt: new Date().toISOString() });
});

student.get('/attempts', async (c) => {
  const { rows } = await db.query<any>(
    `SELECT t.id,t.assessment_id AS "assessmentId",t.received_at AS "receivedAt",t.score,t.total,
            a.mode,a.results_released AS "released"
     FROM attempts t JOIN assessments a ON a.id=t.assessment_id WHERE t.student_id=$1 ORDER BY t.received_at DESC`,
    [c.get('user').id]);
  return c.json({
    attempts: rows.map((r) => ({ ...r, score: r.mode === 'practice' || r.released ? r.score : null }))
  });
});

app.route('/api/student', student);

// ---------------------------------------------------------------- sync endpoint
/**
 * Receives an attempt that may have been completed offline.
 * Idempotent: the client-generated UUID is the primary key, so retries never duplicate.
 * The server re-grades everything; the device's score is only compared, never trusted.
 */
app.post('/api/attempts', requireRole('student'), async (c) => {
  const user = c.get('user');
  const log = (attemptId: string | null, outcome: string, detail?: string) =>
    db.query('INSERT INTO sync_events (attempt_id,user_id,outcome,detail) VALUES ($1,$2,$3,$4)', [attemptId, user.id, outcome, detail ?? null]);

  const parsed = AttemptSubmissionSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    await log(null, 'rejected', 'malformed');
    return c.json(bad('Malformed submission.', parsed.error.flatten()), 400);
  }
  const s = parsed.data;

  // Duplicate (retry after a dropped connection): return the original result.
  const existing = await db.query<any>('SELECT student_id,received_at,flags FROM attempts WHERE id=$1', [s.id]);
  if (existing.rows[0]) {
    if (existing.rows[0].student_id !== user.id) return c.json({ error: 'conflict', message: 'Attempt ID belongs to another user.' }, 409);
    await log(s.id, 'duplicate');
    return c.json({ status: 'accepted', duplicate: true, receivedAt: existing.rows[0].received_at, flags: existing.rows[0].flags });
  }

  // Integrity in transit: recompute the checksum (detects corruption, NOT proof of honesty).
  if (sha256(canonicalAttempt(s)) !== s.checksum) {
    await log(s.id, 'rejected', 'checksum');
    return c.json({ error: 'integrity', message: 'Submission failed integrity check.' }, 422);
  }

  // Authorization: the assessment must belong to a class this student is in.
  const asm = await db.query<any>(
    `SELECT a.* FROM assessments a JOIN units u ON u.id=a.unit_id
     JOIN class_members m ON m.class_id=u.class_id WHERE a.id=$1 AND m.user_id=$2`, [s.assessmentId, user.id]);
  const a = asm.rows[0];
  if (!a) {
    await log(s.id, 'rejected', 'forbidden');
    return c.json({ error: 'forbidden', message: 'You cannot submit to this assessment.' }, 403);
  }

  // Formal assessments require a valid server-signed ticket for this student + assessment.
  let ticketIssuedAt: Date | null = null;
  if (a.mode === 'formal') {
    const t = s.ticket ? verifyTicket(s.ticket) : null;
    if (!t || t.sid !== user.id || t.aid !== a.id) {
      await log(s.id, 'rejected', 'ticket');
      return c.json({ error: 'invalid_ticket', message: 'Exam ticket is missing or invalid. Re-download the unit.' }, 422);
    }
    ticketIssuedAt = new Date(t.iat);
  }

  const count = await db.query<{ n: number }>('SELECT count(*)::int AS n FROM attempts WHERE student_id=$1 AND assessment_id=$2', [user.id, a.id]);
  if (count.rows[0].n >= a.max_attempts) {
    await log(s.id, 'rejected', 'max_attempts');
    return c.json({ error: 'max_attempts', message: `Attempt limit (${a.max_attempts}) reached.` }, 422);
  }

  // Server-side grading — the only score that counts.
  const qs = await db.query<{ id: string; correct_option_id: string; options: { id: string }[] }>(
    'SELECT id,correct_option_id,options FROM questions WHERE assessment_id=$1', [a.id]);
  const validQ = new Map(qs.rows.map((q) => [q.id, q]));
  for (const [qid, oid] of Object.entries(s.answers)) {
    const q = validQ.get(qid);
    if (!q || !q.options.some((o) => o.id === oid)) {
      await log(s.id, 'rejected', 'unknown_answer');
      return c.json(bad('Submission references unknown questions or options.'), 400);
    }
  }
  const score = qs.rows.filter((q) => s.answers[q.id] === q.correct_option_id).length;

  // Flags for the lecturer (device clocks can be changed, so we flag rather than silently trust).
  const now = new Date();
  const submitted = new Date(s.submittedAt);
  const started = new Date(s.startedAt);
  const flags: FlagCode[] = [];
  const GRACE = 2 * 60_000;
  if (a.deadline) {
    const deadline = new Date(a.deadline);
    if (submitted.getTime() > deadline.getTime() + GRACE) flags.push('late');
    else if (now > deadline && ticketIssuedAt && ticketIssuedAt <= deadline) flags.push('synced_after_deadline');
  }
  if (a.time_limit_min && submitted.getTime() - started.getTime() > a.time_limit_min * 60_000 + GRACE) flags.push('over_time');
  if (submitted.getTime() > now.getTime() + GRACE) flags.push('clock_ahead');
  if (ticketIssuedAt && submitted.getTime() < ticketIssuedAt.getTime() - GRACE) flags.push('clock_behind');
  if (a.mode === 'practice' && s.localScore != null && s.localScore !== score) flags.push('score_mismatch');

  // ON CONFLICT guards the race where two retries arrive at the same moment.
  await db.query(
    `INSERT INTO attempts (id,student_id,assessment_id,answers,score,total,local_score,started_at,submitted_at,ticket_issued_at,flags)
     VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9,$10,$11::jsonb) ON CONFLICT (id) DO NOTHING`,
    [s.id, user.id, a.id, JSON.stringify(s.answers), score, qs.rows.length, s.localScore ?? null, s.startedAt, s.submittedAt,
     ticketIssuedAt?.toISOString() ?? null, JSON.stringify(flags)]);
  await log(s.id, 'accepted', flags.join(',') || undefined);

  const reveal = a.mode === 'practice' || a.results_released;
  return c.json({ status: 'accepted', duplicate: false, receivedAt: now.toISOString(), flags, score: reveal ? score : null, total: qs.rows.length }, 201);
});

// ---------------------------------------------------------------- lecturer
const lecturer = new Hono<Env>();
lecturer.use('*', requireRole('lecturer'));

lecturer.get('/overview', async (c) => {
  const uid = c.get('user').id;
  const classes = await db.query(
    `SELECT c.id,c.name,c.join_code AS "joinCode",(SELECT count(*)::int FROM class_members m WHERE m.class_id=c.id) AS students
     FROM classes c WHERE c.lecturer_id=$1`, [uid]);
  const units = await db.query(
    `SELECT u.id,u.title,u.class_id AS "classId" FROM units u JOIN classes c ON c.id=u.class_id WHERE c.lecturer_id=$1 ORDER BY u.position`, [uid]);
  const assessments = await db.query(
    `SELECT a.id,a.title,a.mode,a.deadline,a.max_attempts AS "maxAttempts",a.time_limit_min AS "timeLimitMin",
            a.results_released AS "released",u.title AS "unitTitle",
            (SELECT count(*)::int FROM questions q WHERE q.assessment_id=a.id) AS "questionCount",
            (SELECT count(*)::int FROM attempts t WHERE t.assessment_id=a.id) AS submissions,
            (SELECT round(avg(t.score::numeric/t.total)*100)::int FROM attempts t WHERE t.assessment_id=a.id) AS "avgPct"
     FROM assessments a JOIN units u ON u.id=a.unit_id JOIN classes c ON c.id=u.class_id
     WHERE c.lecturer_id=$1 ORDER BY a.created_at`, [uid]);
  return c.json({ classes: classes.rows, units: units.rows, assessments: assessments.rows });
});

lecturer.get('/submissions', async (c) => {
  const { rows } = await db.query<any>(
    `SELECT t.id,t.score,t.total,t.flags,t.submitted_at AS "submittedAt",t.received_at AS "receivedAt",
            t.started_at AS "startedAt",s.name AS student,a.title AS assessment,a.mode
     FROM attempts t JOIN users s ON s.id=t.student_id JOIN assessments a ON a.id=t.assessment_id
     JOIN units u ON u.id=a.unit_id JOIN classes c ON c.id=u.class_id
     WHERE c.lecturer_id=$1 ORDER BY t.received_at DESC LIMIT 200`, [c.get('user').id]);
  return c.json({ submissions: rows });
});

lecturer.get('/submissions.csv', async (c) => {
  const { rows } = await db.query<any>(
    `SELECT s.name AS student,a.title AS assessment,a.mode,t.score,t.total,
            t.submitted_at AS "submittedAt",t.received_at AS "receivedAt",t.flags
     FROM attempts t JOIN users s ON s.id=t.student_id JOIN assessments a ON a.id=t.assessment_id
     JOIN units u ON u.id=a.unit_id JOIN classes cl ON cl.id=u.class_id
     WHERE cl.lecturer_id=$1 ORDER BY t.received_at DESC LIMIT 200`, [c.get('user').id]);
  const header = ['Student', 'Assessment', 'Mode', 'Score', 'Total', 'Completed on device', 'Received by server', 'Flags'];
  const body = rows.map((row) => [
    row.student, row.assessment, row.mode, row.score, row.total,
    row.submittedAt, row.receivedAt, Array.isArray(row.flags) ? row.flags.join('; ') : row.flags
  ].map(csvCell).join(','));
  const csv = [header.map(csvCell).join(','), ...body].join('\r\n') + '\r\n';
  c.header('Content-Type', 'text/csv; charset=utf-8');
  c.header('Content-Disposition', 'attachment; filename="salama-shule-results.csv"');
  return c.body(csv);
});

lecturer.get('/attempts/:id', async (c) => {
  const id = c.req.param('id');
  if (!/^[0-9a-f-]{36}$/i.test(id)) return c.json(bad('Bad id'), 400);
  const t = await db.query<any>(
    `SELECT t.*,s.name AS student,s.email,a.title AS assessment,a.mode,a.deadline,a.time_limit_min AS "timeLimitMin"
     FROM attempts t JOIN users s ON s.id=t.student_id JOIN assessments a ON a.id=t.assessment_id
     JOIN units u ON u.id=a.unit_id JOIN classes c ON c.id=u.class_id WHERE t.id=$1 AND c.lecturer_id=$2`, [id, c.get('user').id]);
  if (!t.rows[0]) return c.json({ error: 'not_found' }, 404);
  const qs = await db.query(
    `SELECT id,prompt,options,correct_option_id AS "correctOptionId",explanation FROM questions WHERE assessment_id=$1 ORDER BY position`,
    [t.rows[0].assessment_id]);
  const events = await db.query(`SELECT outcome,detail,at FROM sync_events WHERE attempt_id=$1 ORDER BY at`, [id]);
  return c.json({ attempt: t.rows[0], questions: qs.rows, events: events.rows });
});

lecturer.post('/assessments', async (c) => {
  const parsed = NewAssessmentSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json(bad('Please complete every field.', parsed.error.flatten()), 400);
  const a = parsed.data;
  for (const q of a.questions) if (q.correctIndex >= q.options.length) return c.json(bad('Pick a correct option for every question.'), 400);
  const own = await db.query('SELECT 1 FROM units u JOIN classes c ON c.id=u.class_id WHERE u.id=$1 AND c.lecturer_id=$2', [a.unitId, c.get('user').id]);
  if (!own.rows[0]) return c.json({ error: 'forbidden' }, 403);
  const id = `asm_${randomUUID().slice(0, 8)}`;
  await insertAssessment(db, { id, unitId: a.unitId, title: a.title, mode: a.mode, timeLimitMin: a.timeLimitMin, deadline: a.deadline, maxAttempts: a.maxAttempts },
    a.questions.map((q) => ({ prompt: q.prompt, options: q.options, correct: q.correctIndex, explanation: q.explanation })));
  return c.json({ id }, 201);
});

lecturer.post('/assessments/:id/release', async (c) => {
  const r = await db.query(
    `UPDATE assessments a SET results_released = NOT results_released FROM units u, classes c
     WHERE a.id=$1 AND u.id=a.unit_id AND c.id=u.class_id AND c.lecturer_id=$2 RETURNING a.results_released AS released`,
    [c.req.param('id'), c.get('user').id]);
  if (!r.rows[0]) return c.json({ error: 'not_found' }, 404);
  return c.json(r.rows[0]);
});

app.route('/api/lecturer', lecturer);
app.all('/api/*', (c) => c.json({ error: 'not_found' }, 404));

// ---------------------------------------------------------------- static (production build)
if (existsSync('dist/index.html')) {
  app.use('/sw.js', async (c, next) => { await next(); c.header('Cache-Control', 'no-cache'); });
  app.use('*', serveStatic({ root: './dist' }));
  const indexHtml = readFileSync('dist/index.html', 'utf8');
  app.get('*', (c) => c.html(indexHtml));
}

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'server_error', message: 'Something went wrong on the server.' }, 500);
});

await initDb();
const port = Number(process.env.PORT ?? 3000);
serve({ fetch: app.fetch, port }, () => console.log(`Salama Shule running at http://localhost:${port}`));
