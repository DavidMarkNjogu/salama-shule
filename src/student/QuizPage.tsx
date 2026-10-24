import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDb, useOnline } from '../lib/hooks';
import type { LocalAssessment, LocalAttempt } from '../lib/localdb';
import { sha256Hex, uuid } from '../lib/crypto';
import { syncNow } from '../lib/sync';
import { canonicalAttempt } from '../../shared/schemas';
import { StatusBadge, fmtTime } from '../components';

export default function QuizPage() {
  const { id } = useParams();
  const db = useDb()!;
  const online = useOnline();
  const quiz = useLiveQuery(async () => (await db.assessments.get(id!)) ?? false, [db, id]);
  const attempts = useLiveQuery(() => db.attempts.where('assessmentId').equals(id!).toArray(), [db, id], []);
  const [doneId, setDoneId] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [reviewing, setReviewing] = useState(false);

  if (quiz === undefined) return <p className="muted">Loading…</p>;
  if (quiz === false) return <p className="muted">This quiz isn't on your device.</p>;

  const active = attempts?.find((a) => a.status === 'in_progress');
  const finished = (attempts ?? []).filter((a) => a.status !== 'in_progress');
  const done = doneId ? attempts?.find((a) => a.id === doneId) : undefined;

  if (done) return <Result quiz={quiz} attempt={done} online={online} />;

  if (!active) {
    const blocked = finished.length >= quiz.maxAttempts;
    const qz: LocalAssessment = quiz;
    async function start() {
      const a: LocalAttempt = {
        id: uuid(), assessmentId: qz.id, assessmentTitle: qz.title,
        mode: qz.mode, answers: {}, startedAt: new Date().toISOString(),
        ticket: qz.ticket, total: qz.questions.length,
        status: 'in_progress', tries: 0, nextRetryAt: 0
      };
      await db.attempts.put(a);
      setCurrent(0);
    }
    return (
      <div className="card narrow">
        <Link to={`/student/unit/${quiz.unitId}`} className="back">← Back to unit</Link>
        <span className={`badge ${quiz.mode === 'formal' ? 'st-warn' : 'st-synced'}`}>{quiz.mode === 'formal' ? 'Formal assessment' : 'Practice quiz'}</span>
        <h1>{quiz.title}</h1>
        <ul className="rules">
          <li>{quiz.questions.length} multiple-choice questions</li>
          {quiz.timeLimitMin && <li>Time limit: {quiz.timeLimitMin} minutes</li>}
          {quiz.deadline && <li>Deadline: {fmtTime(quiz.deadline)}</li>}
          <li>Attempts used: {finished.length} of {quiz.maxAttempts}</li>
          <li>{online ? 'You are online.' : 'You are offline — that’s fine.'} Answers are saved on this device as you go and sent when you're connected.</li>
          {quiz.mode === 'formal'
            ? <li>Correct answers are not stored on your phone. Your lecturer’s server grades this after it syncs.</li>
            : <li>You’ll see your score and explanations immediately.</li>}
        </ul>
        {blocked ? <div className="error">You've used all {quiz.maxAttempts} attempts.</div> : <button className="btn big" onClick={start}>Start</button>}
      </div>
    );
  }

  return <Player quiz={quiz} attempt={active} current={current} setCurrent={setCurrent} reviewing={reviewing} setReviewing={setReviewing} onDone={setDoneId} />;
}

function Player({ quiz, attempt, current, setCurrent, reviewing, setReviewing, onDone }: {
  quiz: LocalAssessment; attempt: LocalAttempt; current: number; setCurrent: (n: number) => void; reviewing: boolean; setReviewing: (value: boolean) => void; onDone: (id: string) => void;
}) {
  const db = useDb()!;
  const q = quiz.questions[current];
  const answered = Object.keys(attempt.answers).length;
  const unanswered = quiz.questions.length - answered;
  const deadlineMs = quiz.timeLimitMin ? new Date(attempt.startedAt).getTime() + quiz.timeLimitMin * 60_000 : null;
  const [now, setNow] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!deadlineMs) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [deadlineMs]);
  const remaining = deadlineMs ? Math.max(0, deadlineMs - now) : null;
  useEffect(() => { if (remaining === 0 && !submitting) submit(true); }, [remaining]);

  async function choose(optionId: string) {
    // Persist every answer immediately — a reload, crash or dead battery loses nothing.
    // Modify the stored record atomically so rapid taps never overwrite each other.
    await db.attempts.where('id').equals(attempt.id).modify((a) => { a.answers[q.id] = optionId; });
  }

  async function submit(auto = false) {
    if (!auto && answered < quiz.questions.length && !confirm(`${quiz.questions.length - answered} question(s) unanswered. Submit anyway?`)) return;
    setSubmitting(true);
    const fresh = (await db.attempts.get(attempt.id))!;
    const localScore = quiz.mode === 'practice'
      ? quiz.questions.filter((qq) => fresh.answers[qq.id] && fresh.answers[qq.id] === qq.correctOptionId).length
      : null;
    const checksum = await sha256Hex(canonicalAttempt(fresh));
    const now = new Date().toISOString();
    // 1) Save to the device FIRST. 2) Only then try the network.
    await db.attempts.update(attempt.id, { status: 'saved_local', submittedAt: now, savedAt: now, localScore, checksum });
    onDone(attempt.id);
    if (navigator.onLine) syncNow(db, { force: true });
  }

  const mm = remaining != null ? `${Math.floor(remaining / 60000)}:${String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0')}` : null;

  if (reviewing) return (
    <div className="card narrow quiz-review">
      <p className="eyebrow">Final review</p>
      <h1>Check your answers</h1>
      <p className="muted">Review each question before submitting. You can return to any question to make changes.</p>
      <div className="review-summary"><b>{answered} of {quiz.questions.length}</b><span>answered</span><b>{unanswered}</b><span>unanswered</span></div>
      <div className="review-list">
        {quiz.questions.map((question, index) => <button className={`review-item ${attempt.answers[question.id] ? 'answered' : 'unanswered'}`} key={question.id} onClick={() => { setCurrent(index); setReviewing(false); }}><span>Question {index + 1}</span><b>{attempt.answers[question.id] ? 'Answered' : 'Unanswered'}</b></button>)}
      </div>
      {unanswered > 0 && <div className="banner warn">You still have {unanswered} unanswered question{unanswered === 1 ? '' : 's'}.</div>}
      <div className="row-between"><button className="btn-ghost" onClick={() => setReviewing(false)}>Return to quiz</button><button className="btn submit" disabled={submitting} onClick={() => submit()}>Submit assessment</button></div>
    </div>
  );

  return (
    <div className="quiz">
      <div className="row-between">
        <span className="small muted">{quiz.title}</span>
        {mm && <span className={`timer ${remaining! < 60000 ? 'urgent' : ''}`}>Time remaining: {mm}</span>}
      </div>
      <div className="progress"><div style={{ width: `${(answered / quiz.questions.length) * 100}%` }} /></div>
      <div className="card">
        <p className="eyebrow">Question {current + 1} of {quiz.questions.length} · <span className="saved">Auto-saved on device</span></p>
        <h2 className="qtext">{q.prompt}</h2>
        <div className="options">
          {q.options.map((o, i) => (
            <button key={o.id} className={`option ${attempt.answers[q.id] === o.id ? 'selected' : ''}`} onClick={() => choose(o.id)}>
              <span className="letter">{String.fromCharCode(65 + i)}</span> {o.text}
            </button>
          ))}
        </div>
      </div>
      <div className="dots">
        {quiz.questions.map((qq, i) => (
          <button key={qq.id} className={`qdot ${i === current ? 'cur' : ''} ${attempt.answers[qq.id] ? 'ans' : ''}`} onClick={() => setCurrent(i)} aria-label={`Question ${i + 1}`}>{i + 1}</button>
        ))}
      </div>
      <div className="row-between">
        <button className="btn-ghost" disabled={current === 0} onClick={() => setCurrent(current - 1)}>← Previous</button>
        {current < quiz.questions.length - 1
          ? <button className="btn" onClick={() => setCurrent(current + 1)}>Next →</button>
          : <button className="btn submit" disabled={submitting} onClick={() => setReviewing(true)}>Review and submit</button>}
      </div>
    </div>
  );
}

function Result({ quiz, attempt, online }: { quiz: LocalAssessment; attempt: LocalAttempt; online: boolean }) {
  const pct = attempt.localScore != null ? Math.round((attempt.localScore / attempt.total) * 100) : null;
  return (
    <div className="narrow">
      <div className="card result">
        <div className="row-between"><h1>Submitted</h1><StatusBadge status={attempt.status} /></div>
        <SyncSteps attempt={attempt} online={online} />
        {quiz.mode === 'practice' && pct != null && (
          <div className="score">
            <b>{attempt.localScore}/{attempt.total}</b> <span>{pct}%</span>
            <p className="small muted">Graded on your device instantly. The server re-checks it when synced.</p>
          </div>
        )}
        {quiz.mode === 'formal' && (
          <p className="muted">
            Your answers are sealed. The server grades formal assessments, and your lecturer releases results.
            {attempt.status === 'synced' && attempt.server?.score != null && <b> Score: {attempt.server.score}/{attempt.server.total}</b>}
          </p>
        )}
        {attempt.lastError && attempt.status !== 'synced' && <p className="small muted">{attempt.lastError}</p>}
        <div className="row">
          <Link className="btn" to={`/student/unit/${quiz.unitId}`}>Back to unit</Link>
          <Link className="btn-ghost" to="/student/sync">Open Sync Center</Link>
        </div>
      </div>

      {quiz.mode === 'practice' && (
        <>
          <h2 className="section-title">Review</h2>
          {quiz.questions.map((q, i) => {
            const mine = attempt.answers[q.id];
            const right = mine === q.correctOptionId;
            return (
              <div key={q.id} className={`card review ${right ? 'ok' : 'bad'}`}>
                <p className="eyebrow">{right ? 'Correct' : 'Incorrect'} · Q{i + 1}</p>
                <p><b>{q.prompt}</b></p>
                <p className="small">Your answer: {q.options.find((o) => o.id === mine)?.text ?? '—'}</p>
                {!right && <p className="small">Correct: {q.options.find((o) => o.id === q.correctOptionId)?.text}</p>}
                {q.explanation && <p className="small muted">{q.explanation}</p>}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

export function SyncSteps({ attempt, online }: { attempt: LocalAttempt; online: boolean }) {
  const reached = {
    saved: attempt.status !== 'in_progress',
    syncing: ['syncing', 'synced'].includes(attempt.status),
    synced: attempt.status === 'synced'
  };
  return (
    <ol className="steps">
      <li className={reached.saved ? 'on' : ''}><b>Saved on device</b><span>{fmtTime(attempt.savedAt)}</span></li>
      <li className={reached.syncing ? 'on' : ''}><b>Sending</b><span>{attempt.status === 'rejected' ? 'Rejected by server' : !online && !reached.synced ? 'Waiting for connection' : attempt.status === 'syncing' ? 'Uploading…' : reached.synced ? 'Done' : 'Queued'}</span></li>
      <li className={reached.synced ? 'on' : ''}><b>Received by lecturer</b><span>{attempt.server ? fmtTime(attempt.server.receivedAt) : 'Not yet'}</span></li>
    </ol>
  );
}
