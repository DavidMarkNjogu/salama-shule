import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useOnline } from '../lib/hooks';
import { fmtTime } from '../components';
import { FLAG_LABELS, type FlagCode } from '../../shared/schemas';

type Overview = {
  classes: { id: string; name: string; joinCode: string; students: number }[];
  assessments: { id: string; title: string; mode: string; unitTitle: string; questionCount: number; submissions: number; avgPct: number | null; released: boolean; deadline: string | null }[];
};
type Sub = { id: string; student: string; assessment: string; mode: string; score: number; total: number; flags: FlagCode[]; submittedAt: string; receivedAt: string };

export default function LecturerHome() {
  const online = useOnline();
  const [ov, setOv] = useState<Overview | null>(null);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [err, setErr] = useState('');
  const seen = useRef<Set<string> | null>(null);
  const [fresh, setFresh] = useState<Set<string>>(new Set());

  async function load() {
    try {
      const [o, s] = await Promise.all([api<Overview>('/api/lecturer/overview'), api<{ submissions: Sub[] }>('/api/lecturer/submissions')]);
      setOv(o);
      if (seen.current) {
        const newOnes = s.submissions.filter((x) => !seen.current!.has(x.id)).map((x) => x.id);
        if (newOnes.length) setFresh(new Set(newOnes));
      }
      seen.current = new Set(s.submissions.map((x) => x.id));
      setSubs(s.submissions);
      setErr('');
    } catch (e: any) {
      setErr(e.kind === 'network' ? 'Offline — the lecturer portal shows only what the server has confirmed, so it needs a connection.' : e.message);
    }
  }
  useEffect(() => {
    load();
    const t = setInterval(load, 4000); // live: new synced submissions appear on their own
    return () => clearInterval(t);
  }, []);

  async function toggleRelease(id: string) {
    await api(`/api/lecturer/assessments/${id}/release`, { method: 'POST' });
    load();
  }

  const offlineSynced = subs.filter((s) => new Date(s.receivedAt).getTime() - new Date(s.submittedAt).getTime() > 60_000).length;
  const flagged = subs.filter((s) => s.flags.length).length;

  return (
    <>
      <h1>Lecturer dashboard</h1>
      {err && <div className="banner warn">{err}</div>}
      {!online && !err && <div className="banner warn">You're offline.</div>}

      {ov?.classes.map((c) => (
        <div className="card class-card" key={c.id}>
          <div><h3>{c.name}</h3><p className="muted small">{c.students} {c.students === 1 ? 'student' : 'students'} enrolled</p></div>
          <div className="code">Join code <b>{c.joinCode}</b></div>
        </div>
      ))}

      <div className="stats">
        <div className="stat"><b>{subs.length}</b><span>server-confirmed submissions</span></div>
        <div className="stat"><b>{offlineSynced}</b><span>completed offline, synced later</span></div>
        <div className="stat"><b>{flagged}</b><span>flagged for review</span></div>
      </div>

      <h2 className="section-title">Live submissions <span className="live">Live</span></h2>
      <p><a className="btn-ghost small" href="/api/lecturer/submissions.csv">Download CSV report</a></p>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Student</th><th>Assessment</th><th>Score</th><th>Done on device</th><th>Received by server</th><th>Integrity</th></tr></thead>
          <tbody>
            {subs.length === 0 && <tr><td colSpan={6} className="muted">No submissions yet. They appear here the moment a student's device syncs.</td></tr>}
            {subs.map((s) => {
              const delayMin = Math.round((new Date(s.receivedAt).getTime() - new Date(s.submittedAt).getTime()) / 60000);
              return (
                <tr key={s.id} className={fresh.has(s.id) ? 'flash' : ''}>
                  <td><Link to={`/lecturer/attempt/${s.id}`}><b>{s.student}</b></Link></td>
                  <td>{s.assessment}<div className="small muted">{s.mode}</div></td>
                  <td><b>{s.score}/{s.total}</b></td>
                  <td>{fmtTime(s.submittedAt)}</td>
                  <td>{fmtTime(s.receivedAt)}{delayMin >= 1 && <div className="small badge st-local">synced {delayMin} min later</div>}</td>
                  <td>{s.flags.length === 0 ? <span className="badge st-synced">Verified</span> : s.flags.map((f) => <div key={f} className="badge st-warn">{FLAG_LABELS[f] ?? f}</div>)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 className="section-title">Assessments</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Title</th><th>Mode</th><th>Questions</th><th>Submissions</th><th>Average</th><th>Results</th></tr></thead>
          <tbody>
            {ov?.assessments.map((a) => (
              <tr key={a.id}>
                <td><b>{a.title}</b><div className="small muted">{a.unitTitle}</div></td>
                <td>{a.mode === 'formal' ? 'Formal' : 'Practice'}</td>
                <td>{a.questionCount}</td>
                <td>{a.submissions}</td>
                <td>{a.avgPct != null ? `${a.avgPct}%` : '—'}</td>
                <td>{a.mode === 'formal'
                  ? <button className="btn-ghost small" onClick={() => toggleRelease(a.id)}>{a.released ? 'Released (hide)' : 'Release results'}</button>
                  : <span className="small muted">Instant</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
