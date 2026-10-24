import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, ApiError } from './api';
import { deleteUserDb } from './localdb';

export type User = { id: string; name: string; email: string; role: 'student' | 'lecturer' };
const KEY = 'salama:user';

function readCached(): User | null {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? 'null');
  } catch {
    return null;
  }
}

type Ctx = {
  user: User | null;
  ready: boolean;
  offlineSession: boolean; // using the cached profile because the server is unreachable
  login: (email: string, password: string) => Promise<User>;
  logout: (opts?: { wipe?: boolean }) => Promise<void>;
};
const AuthCtx = createContext<Ctx>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readCached);
  const [ready, setReady] = useState(false);
  const [offlineSession, setOfflineSession] = useState(false);

  useEffect(() => {
    api<{ user: User }>('/api/auth/me')
      .then(({ user }) => {
        setUser(user);
        localStorage.setItem(KEY, JSON.stringify(user));
        setOfflineSession(false);
      })
      .catch((e: ApiError) => {
        if (e.kind === 'network') setOfflineSession(true); // keep cached profile: learning continues offline
        // On 401 we also keep the cached profile so unsynced work stays reachable;
        // the sync engine will ask the student to sign in again before sending.
      })
      .finally(() => setReady(true));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user } = await api<{ user: User }>('/api/auth/login', { body: { email, password } });
    // A different person on this device gets their own local DB; nobody else's data is loaded.
    localStorage.setItem(KEY, JSON.stringify(user));
    setUser(user);
    setOfflineSession(false);
    return user;
  }, []);

  const logout = useCallback(async (opts: { wipe?: boolean } = {}) => {
    const u = readCached();
    await api('/api/auth/logout', { method: 'POST' }).catch(() => {});
    if (u && opts.wipe !== false) await deleteUserDb(u.id);
    localStorage.removeItem(KEY);
    setUser(null);
  }, []);

  return <AuthCtx.Provider value={{ user, ready, offlineSession, login, logout }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
