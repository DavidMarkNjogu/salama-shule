import type { Unit } from "./unitContent";

// Everything the student needs offline lives here: profile, the downloaded unit,
// in-progress quiz answers and the queue of finished attempts.
// Persisted to localStorage (wrapped in try/catch; falls back to memory).

export type Profile = { name: string; code: string; joinCode: string };
export type AttemptStatus = "saved" | "syncing" | "synced";
export type StoredAttempt = {
  attemptId: string;
  studentCode: string;
  studentName: string;
  joinCode: string;
  unitId: string;
  quizId: string;
  score: number;
  total: number;
  answers: number[];
  clientTime: string;
  status: AttemptStatus;
  syncedAt?: string;
  error?: string;
  // The server refused this attempt for a reason retrying cannot fix.
  rejected?: boolean;
  // The server re-marked the answers and recorded a different score.
  scoreCorrected?: boolean;
  deviceScore?: number;
};
export type Progress = { quizId: string; answers: number[]; index: number };
export type DeviceState = {
  profile: Profile | null;
  unit: Unit | null;
  unitSavedAt: string | null;
  attempts: StoredAttempt[];
  progress: Progress | null;
  simulateOffline: boolean;
};

const KEY = "salama-shule-v1";
const EMPTY: DeviceState = {
  profile: null,
  unit: null,
  unitSavedAt: null,
  attempts: [],
  progress: null,
  simulateOffline: false,
};

let cache: DeviceState | null = null;
const listeners = new Set<() => void>();

function load(): DeviceState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = { ...EMPTY, ...JSON.parse(raw) } as DeviceState;
    // Older saves have no class code: keep them, and ask for the code.
    parsed.profile = parsed.profile
      ? { ...parsed.profile, joinCode: parsed.profile.joinCode ?? "" }
      : null;
    parsed.attempts = parsed.attempts.map((a) => ({
      ...a,
      joinCode: a.joinCode ?? "",
      // A send interrupted by closing the app was never confirmed: back to "saved".
      status: a.status === "syncing" ? ("saved" as const) : a.status,
    }));
    return parsed;
  } catch {
    return EMPTY;
  }
}

function getSnapshot(): DeviceState {
  if (!cache) cache = load();
  return cache;
}

function update(fn: (s: DeviceState) => DeviceState) {
  cache = fn(getSnapshot());
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // storage unavailable: keep working from memory
  }
  listeners.forEach((l) => l());
}

export const deviceStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot,
  setProfile(profile: Profile) {
    update((s) => ({ ...s, profile }));
  },
  // Changing the class code also re-queues attempts that were refused or had no code.
  setJoinCode(joinCode: string) {
    update((s) => ({
      ...s,
      profile: s.profile ? { ...s.profile, joinCode } : s.profile,
      attempts: s.attempts.map((a) =>
        a.status !== "synced" && (a.rejected || !a.joinCode)
          ? {
              ...a,
              joinCode,
              rejected: false,
              error: undefined,
              status: "saved" as const,
            }
          : a,
      ),
    }));
  },
  cacheUnit(unit: Unit) {
    update((s) => ({
      ...s,
      unit,
      unitSavedAt: new Date().toISOString(),
    }));
  },
  saveProgress(progress: Progress) {
    update((s) => ({ ...s, progress }));
  },
  clearProgress() {
    update((s) => ({ ...s, progress: null }));
  },
  addAttempt(attempt: StoredAttempt) {
    update((s) => ({ ...s, attempts: [attempt, ...s.attempts] }));
  },
  updateAttempt(attemptId: string, patch: Partial<StoredAttempt>) {
    update((s) => ({
      ...s,
      attempts: s.attempts.map((a) =>
        a.attemptId === attemptId ? { ...a, ...patch } : a,
      ),
    }));
  },
  setSimulateOffline(simulateOffline: boolean) {
    update((s) => ({ ...s, simulateOffline }));
  },
};
