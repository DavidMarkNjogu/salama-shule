import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { fmtTime } from '../components';
import { FLAG_LABELS, type FlagCode } from '../../shared/schemas';

export default function AttemptDetail() {
  const { id } = useParams();
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    api(`/api/lecturer/attempts/${id}`).then(setD).catch((e) => setErr(e.message));
  }, [id]);
  if (err) return <div className="banner warn">{err}</div>;
  if (!d) return <p className="muted">Loading…</p>;
  const t = d.attempt;
  const flags: FlagCode[] = t.flags;
  return (
    <>
      <Link to="/lecturer" className="back">← Submissions</Link>
      <h1>{t.student} — {t.assessment}</h1>
      <p className="muted">{t.email} · attempt <span className="mono">{t.id}</span></p>
      <div className="stats">
        <div className="stat"><b>{t.score}/{t.total}</b><span>server grade</span></div>
        {t.mode === 'practice' && <div className="stat"><b>{t.local_score ?? '—'}</b><span>score the device reported</span></div>}
        <div className="stat"><b>{flags.length || 'None'}</b><span>{flags.length ? 'flags' : 'no integrity issues'}</span></div>
      </div>
      {flags.length > 0 && <div className="banner warn">{flags.map((f) => <div key={f}>{FLAG_LABELS[f] ?? f}</div>)}</div>}

      <div className="card">
        <h3>Timeline</h3>
        <ol className="timeline">
          {t.ticket_issued_at && <li><b>Quiz downloaded</b> (signed exam ticket issued by server) — {fmtTime(t.ticket_issued_at)}</li>}
          <li><b>Started on device</b> — {fmtTime(t.started_at)} <span className="small muted">(device clock)</span></li>
          <li><b>Submitted on device</b> — {fmtTime(t.submitted_at)} <span className="small muted">(device clock)</span></li>
          <li><b>Received & graded by server</b> — {fmtTime(t.received_at)} <span className="small muted">(trusted clock)</span></li>
          {d.events.map((e: any, i: number) => <li key={i} className="small muted">Sync event: {e.outcome}{e.detail ? ` (${e.detail})` : ''} — {fmtTime(e.at)}</li>)}
        </ol>
      </div>

      <h2 className="section-title">Answers</h2>
      {d.questions.map((q: any, i: number) => {
        const mine = t.answers[q.id];
        const ok = mine === q.correctOptionId;
        return (
          <div key={q.id} className={`card review ${ok ? 'ok' : 'bad'}`}>
            <p className="eyebrow">{ok ? 'Correct' : 'Incorrect'} · Q{i + 1}</p>
            <p><b>{q.prompt}</b></p>
            <p className="small">Answer: {q.options.find((o: any) => o.id === mine)?.text ?? 'No answer'}</p>
            {!ok && <p className="small">Correct: {q.options.find((o: any) => o.id === q.correctOptionId)?.text}</p>}
          </div>
        );
      })}
    </>
  );
}
