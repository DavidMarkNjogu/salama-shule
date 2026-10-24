import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from './auth';
import { getDb, PENDING } from './localdb';
import { recoverInterrupted, syncNow } from './sync';

export function useOnline() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  return online;
}

export function useDb() {
  const { user } = useAuth();
  return user ? getDb(user.id) : null;
}

/** Runs the outbox: on start, when the network returns, when the app regains focus, and on a timer (iOS has no Background Sync). */
export function useSyncLoop() {
  const db = useDb();
  useEffect(() => {
    if (!db) return;
    let stop = false;
    const run = () => { if (!stop && navigator.onLine) syncNow(db); };
    recoverInterrupted(db).then(run);
    const onOnline = () => syncNow(db, { force: true });
    const onVis = () => document.visibilityState === 'visible' && run();
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVis);
    const t = setInterval(run, 8000);
    // Ask the browser not to evict our storage under pressure.
    navigator.storage?.persist?.().catch(() => {});
    return () => {
      stop = true;
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVis);
      clearInterval(t);
    };
  }, [db]);
}

export function usePendingCount() {
  const db = useDb();
  return useLiveQuery(() => (db ? db.attempts.where('status').anyOf(PENDING).count() : 0), [db], 0) ?? 0;
}
