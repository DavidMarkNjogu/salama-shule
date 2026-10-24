import { api, ApiError } from './api';
import type { LocalAttempt, SalamaDB } from './localdb';

/**
 * The sync engine. Drains saved attempts from the on-device outbox to the server.
 *  - network failure / 5xx / 429  -> 'retrying' with exponential backoff (data kept)
 *  - 401                          -> 'needs_signin' (data kept, student asked to sign in)
 *  - other 4xx                    -> 'rejected' with the server's reason (permanent)
 *  - 2xx                          -> 'synced' with the server's confirmation
 * Retries are safe because the attempt ID is generated on the device and the server
 * treats it as the primary key.
 */
const running = new Set<string>();

export type SyncListener = (e: { type: 'auth_lost' } | { type: 'synced'; attempt: LocalAttempt }) => void;
const listeners = new Set<SyncListener>();
export const onSyncEvent = (fn: SyncListener) => (listeners.add(fn), () => listeners.delete(fn));

export function backoffMs(tries: number) {
  return Math.min(60_000, 2_000 * 2 ** Math.max(0, tries - 1));
}

export async function recoverInterrupted(db: SalamaDB) {
  // If the app closed mid-upload we don't know whether the server got it — retry (idempotent).
  await db.attempts.where('status').equals('syncing').modify({ status: 'retrying', nextRetryAt: 0 });
}

export async function syncNow(db: SalamaDB, opts: { force?: boolean } = {}) {
  if (running.has(db.name)) return;
  running.add(db.name);
  try {
    const due = await db.attempts.where('status').anyOf('saved_local', 'retrying', 'needs_signin').toArray();
    due.sort((a, b) => (a.savedAt ?? '').localeCompare(b.savedAt ?? ''));
    for (const a of due) {
      if (!opts.force && a.status === 'retrying' && a.nextRetryAt > Date.now()) continue;
      await db.attempts.update(a.id, { status: 'syncing' });
      try {
        const res = await api<{ receivedAt: string; score: number | null; total: number; flags: string[]; duplicate: boolean }>('/api/attempts', {
          body: {
            id: a.id,
            assessmentId: a.assessmentId,
            answers: a.answers,
            startedAt: a.startedAt,
            submittedAt: a.submittedAt,
            ticket: a.ticket,
            localScore: a.localScore ?? null,
            checksum: a.checksum
          }
        });
        await db.attempts.update(a.id, {
          status: 'synced',
          lastError: undefined,
          server: { receivedAt: res.receivedAt, score: res.score ?? null, total: res.total ?? a.total, flags: res.flags ?? [], duplicate: res.duplicate }
        });
        const updated = await db.attempts.get(a.id);
        if (updated) listeners.forEach((l) => l({ type: 'synced', attempt: updated }));
      } catch (e) {
        const err = e as ApiError;
        const tries = a.tries + 1;
        if (err.kind === 'http' && err.status === 401) {
          await db.attempts.update(a.id, { status: 'needs_signin', tries, lastError: 'Signed out — sign in to send.' });
          listeners.forEach((l) => l({ type: 'auth_lost' }));
          break; // every other request would fail the same way
        } else if (err.kind === 'http' && err.status >= 400 && err.status < 500 && err.status !== 429) {
          await db.attempts.update(a.id, { status: 'rejected', tries, lastError: err.message });
        } else {
          await db.attempts.update(a.id, {
            status: 'retrying', tries, nextRetryAt: Date.now() + backoffMs(tries),
            lastError: err.kind === 'network' ? 'No connection — will retry automatically.' : err.message
          });
          if (err.kind === 'network') break; // still offline; don't hammer the rest
        }
      }
    }
  } finally {
    running.delete(db.name);
  }
}
