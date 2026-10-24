import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDb, useOnline } from '../lib/hooks';
import { syncNow } from '../lib/sync';
import { StatusBadge, fmtTime } from '../components';

export default function SyncCenter() {
  const db = useDb()!;
  const online = useOnline();
  const [busy, setBusy] = useState(false);
  const attempts = useLiveQuery(() => db.attempts.toArray(), [db], []);
  const list = (attempts ?? [])
    .filter((a) => a.status !== 'in_progress')
    .sort((a, b) => (b.savedAt ?? '').localeCompare(a.savedAt ?? ''));
  const unfinished = (attempts ?? []).filter((a) => a.status === 'in_progress');

  async function run() {
    setBusy(true);
    await syncNow(db, { force: true });
    setBusy(false);
  }

  return (
    <>
      <div className="row-between">
        <div>
          <h1>Sync Center</h1>
          <p className="muted">Every attempt and exactly where it is. “Synced” means the server confirmed it — nothing less.</p>
        </div>
        <button className="btn" disabled={!online || busy} onClick={run}>{busy ? 'Syncing…' : online ? <><RefreshCw size={16} aria-hidden /> Sync now</> : 'Offline'}</button>
      </div>

      {unfinished.length > 0 && (
        <div className="banner info">
          Unfinished: {unfinished.map((u) => <Link key={u.id} to={`/student/quiz/${u.assessmentId}`}>{u.assessmentTitle}</Link>)}
        </div>
      )}

      {list.length === 0 ? (
        <p className="muted">No submissions yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Assessment</th><th>Status</th><th>Saved on device</th><th>Received by server</th><th>Result</th></tr>
            </thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id}>
                  <td><b>{a.assessmentTitle}</b><div className="small muted mono">{a.id.slice(0, 8)}</div></td>
                  <td><StatusBadge status={a.status} />{a.lastError && a.status !== 'synced' && <div className="small muted">{a.lastError}</div>}{a.status === 'retrying' && <div className="small muted">Retry #{a.tries}</div>}</td>
                  <td>{fmtTime(a.savedAt)}</td>
                  <td>{a.server ? fmtTime(a.server.receivedAt) : '—'}</td>
                  <td>
                    {a.mode === 'practice' && a.localScore != null ? `${a.localScore}/${a.total}` : a.server?.score != null ? `${a.server.score}/${a.server.total}` : a.mode === 'formal' ? 'Awaiting release' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card legend small">
        <b>How syncing works</b>
        <ul>
          <li><b>Saved on device</b> — stored safely on this phone. Not yet with your lecturer.</li>
          <li><b>Waiting to retry</b> — the connection dropped; we retry automatically with increasing delays.</li>
          <li><b>Synced</b> — the server validated and recorded it. Retries can never create duplicates.</li>
          <li><b>Rejected</b> — the server refused it (e.g. attempt limit). The reason is shown.</li>
        </ul>
      </div>
    </>
  );
}
