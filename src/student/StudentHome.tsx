import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { api, type ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useDb, useOnline, usePendingCount } from '../lib/hooks';
import type { SalamaDB } from '../lib/localdb';
import { fmtKb } from '../components';

type CatalogUnit = { id: string; classId: string; title: string; description: string; version: number; lessonCount: number; assessmentCount: number; sizeBytes: number };
type Catalog = { classes: { id: string; name: string }[]; units: CatalogUnit[] };

export async function downloadUnit(db: SalamaDB, unitId: string) {
  const pkg = await api<any>(`/api/student/units/${unitId}/package`);
  await db.transaction('rw', db.units, db.lessons, db.assessments, async () => {
    await db.lessons.where('unitId').equals(unitId).delete();
    await db.assessments.where('unitId').equals(unitId).delete();
    await db.units.put({ ...pkg.unit, downloadedAt: pkg.downloadedAt });
    await db.lessons.bulkPut(pkg.lessons.map((l: any) => ({ ...l, unitId })));
    await db.assessments.bulkPut(pkg.assessments.map((a: any) => ({ ...a, unitId })));
  });
}

export default function StudentHome() {
  const { user } = useAuth();
  const db = useDb()!;
  const online = useOnline();
  const pending = usePendingCount();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [code, setCode] = useState('');
  const local = useLiveQuery(() => db.units.toArray(), [db], []);
  const synced = useLiveQuery(() => db.attempts.where('status').equals('synced').count(), [db], 0);

  async function loadCatalog() {
    try {
      const c = await api<Catalog>('/api/student/catalog');
      setCatalog(c);
      await db.meta.put({ key: 'catalog', value: c });
    } catch {
      const cached = await db.meta.get('catalog');
      if (cached) setCatalog(cached.value as Catalog);
    }
  }
  useEffect(() => { loadCatalog(); }, [db, online]);

  async function onDownload(id: string) {
    setBusy(id);
    setMsg('');
    try {
      await downloadUnit(db, id);
    } catch (e) {
      setMsg((e as ApiError).message);
    } finally {
      setBusy(null);
    }
  }

  async function onJoin(e: FormEvent) {
    e.preventDefault();
    setMsg('');
    try {
      const r = await api<{ class: { name: string } }>('/api/student/join', { body: { code } });
      setMsg(`Joined ${r.class.name}.`);
      setCode('');
      loadCatalog();
    } catch (e) {
      setMsg((e as ApiError).message);
    }
  }

  const localById = new Map((local ?? []).map((u) => [u.id, u]));
  // Offline: show whatever is on the device even if the catalog was never cached.
  const units: CatalogUnit[] = catalog?.units ?? (local ?? []).map((u) => ({ ...u, lessonCount: 0, assessmentCount: 0, sizeBytes: 0 }));

  return (
    <>
      <section className="hello">
        <h1>Habari, {user?.name.split(' ')[0]}</h1>
        <p className="muted">{catalog?.classes.map((c) => c.name).join(' · ') || 'Your classes'}</p>
        <div className="readiness">
          <div><span className="eyebrow">Offline readiness</span><strong>{local?.length ? 'Ready to learn offline' : 'Prepare your first unit'}</strong><p className="small muted">{local?.length ? `${local.length} unit${local.length === 1 ? '' : 's'} available on this device.` : 'Download a unit while online so lessons and assessments remain available without a connection.'}</p></div>
          {!local?.length && <a className="btn small" href="#learning-units">Get ready</a>}
        </div>
        <div className="stats">
          <div className="stat"><b>{local?.length ?? 0}</b><span>units on device</span></div>
          <div className="stat"><b>{pending}</b><span>waiting to sync</span></div>
          <div className="stat"><b>{synced}</b><span>delivered to lecturer</span></div>
        </div>
      </section>

      {msg && <div className="banner info">{msg}</div>}

      <h2 className="section-title" id="learning-units">Learning units</h2>
      {units.length === 0 && <div className="empty-state"><h3>No learning units yet</h3><p>Join a class with the code from your lecturer. Your available units will appear here.</p><a href="#join-class">Join a class</a></div>}
      <div className="grid">
        {units.map((u) => {
          const l = localById.get(u.id);
          const outdated = l && catalog && l.version < u.version;
          return (
            <div className="card unit" key={u.id}>
              <div className="row-between">
                {l ? <span className="badge st-synced">Available offline</span> : <span className="badge st-progress">Online only</span>}
                {outdated && <span className="badge st-warn">Update available</span>}
              </div>
              <h3>{u.title}</h3>
              <p className="muted">{u.description}</p>
              {catalog && <p className="small muted">{u.lessonCount} lessons · {u.assessmentCount} quizzes · {fmtKb(u.sizeBytes)} download</p>}
              <div className="row">
                {l && <Link className="btn" to={`/student/unit/${u.id}`}>Open</Link>}
                {(!l || outdated) && (
                  <button className={l ? 'btn-ghost' : 'btn'} disabled={!online || busy === u.id} onClick={() => onDownload(u.id)}>
                    {busy === u.id ? 'Downloading…' : l ? 'Update' : online ? 'Download for offline' : 'Connect to download'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <form className="card join" id="join-class" onSubmit={onJoin}>
        <h3>Join another class</h3>
        <div className="row">
          <input placeholder="Class code e.g. WEBSEC24" value={code} onChange={(e) => setCode(e.target.value)} />
          <button className="btn" disabled={!online || !code}>Join</button>
        </div>
      </form>
    </>
  );
}
