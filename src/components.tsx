import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock3, LogOut, RefreshCw, Send, Wifi, WifiOff } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from './lib/auth';
import { useDb, useOnline, usePendingCount, useSyncLoop } from './lib/hooks';
import type { AttemptStatus } from './lib/localdb';

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="14" fill="var(--green)" />
      <path d="M32 12l16 6v12c0 11-7 19-16 22-9-3-16-11-16-22V18z" fill="var(--ochre)" />
      <path d="M24 32l6 6 11-12" stroke="var(--green)" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function OnlinePill() {
  const online = useOnline();
  const Icon = online ? Wifi : WifiOff;
  return (
    <span className={`pill ${online ? 'pill-online' : 'pill-offline'}`} role="status">
      <Icon size={14} aria-hidden /> {online ? 'Online' : 'Offline'}
    </span>
  );
}

const STATUS: Record<AttemptStatus, { label: string; cls: string; icon: typeof Clock3 }> = {
  in_progress: { label: 'In progress', cls: 'st-progress', icon: Clock3 },
  saved_local: { label: 'Saved on device', cls: 'st-local', icon: CheckCircle2 },
  syncing: { label: 'Syncing…', cls: 'st-syncing', icon: Send },
  retrying: { label: 'Waiting to retry', cls: 'st-local', icon: RefreshCw },
  needs_signin: { label: 'Sign in to send', cls: 'st-warn', icon: AlertTriangle },
  synced: { label: 'Synced', cls: 'st-synced', icon: CheckCircle2 },
  rejected: { label: 'Rejected', cls: 'st-rejected', icon: AlertTriangle }
};
export function StatusBadge({ status }: { status: AttemptStatus }) {
  const s = STATUS[status];
  const Icon = s.icon;
  return <span className={`badge ${s.cls}`}><Icon size={13} aria-hidden /> {s.label}</span>;
}

export function Layout() {
  const { user, logout } = useAuth();
  const online = useOnline();
  const db = useDb();
  const pending = usePendingCount();
  const needsSignin = useLiveQuery(() => (db ? db.attempts.where('status').equals('needs_signin').count() : 0), [db], 0);
  const nav = useNavigate();
  useSyncLoop();

  async function onLogout() {
    if (pending > 0 && !confirm(`${pending} attempt(s) have NOT reached your lecturer yet. Logging out deletes them from this device. Log out anyway?`)) return;
    await logout();
    nav('/login');
  }

  const isStudent = user?.role === 'student';
  return (
    <div className="app">
      <header className="topbar">
        <Link to={isStudent ? '/student' : '/lecturer'} className="brand">
          <Logo /> <span>Salama Shule</span>
        </Link>
        <div className="topbar-right">
          <OnlinePill />
          <button className="btn-ghost small" onClick={onLogout}><LogOut size={14} aria-hidden /> Log out</button>
        </div>
      </header>
      <nav className="tabs">
        {isStudent ? (
          <>
            <NavLink to="/student" end>Learn</NavLink>
            <NavLink to="/student/sync">
              Sync Center {pending > 0 && <span className="count">{pending}</span>}
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/lecturer" end>Submissions</NavLink>
            <NavLink to="/lecturer/builder">Assessment builder</NavLink>
          </>
        )}
      </nav>
      {(needsSignin ?? 0) > 0 && (
        <div className="banner warn">
          Your session expired. {needsSignin} saved attempt(s) are safe on this device. <Link to="/login">Sign in to send them</Link>
        </div>
      )}
      {!online && <div className="banner info">You're offline. Downloaded lessons and quizzes still work — work is saved on this device.</div>}
      <main className="container">
        <Outlet />
      </main>
      <footer className="foot muted">Signed in as {user?.name} · {user?.role}</footer>
    </div>
  );
}

export function LessonBlocks({ blocks }: { blocks: import('../shared/schemas').LessonBlock[] }) {
  return (
    <div className="prose">
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'h': return <h3 key={i}>{b.text}</h3>;
          case 'p': return <p key={i}>{b.text}</p>;
          case 'list': return <ul key={i}>{b.items.map((t, j) => <li key={j}>{t}</li>)}</ul>;
          case 'tip': return <div key={i} className="callout tip"><strong>Tip</strong> {b.text}</div>;
          case 'warn': return <div key={i} className="callout warn"><strong>Watch out</strong> {b.text}</div>;
        }
      })}
    </div>
  );
}

export const fmtTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';
export const fmtKb = (b: number) => `${Math.max(1, Math.round(b / 1024))} KB`;
