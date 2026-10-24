import Dexie, { type Table } from 'dexie';
import type { LessonBlock } from '../../shared/schemas';

export type Option = { id: string; text: string };
export type Question = { id: string; prompt: string; options: Option[]; correctOptionId?: string; explanation?: string };

export type LocalUnit = { id: string; classId: string; title: string; description: string; version: number; downloadedAt: string };
export type LocalLesson = { id: string; unitId: string; title: string; position: number; minutes: number; blocks: LessonBlock[] };
export type LocalAssessment = {
  id: string; unitId: string; title: string; mode: 'practice' | 'formal';
  timeLimitMin: number | null; deadline: string | null; maxAttempts: number;
  questions: Question[]; ticket?: string;
};

export type AttemptStatus = 'in_progress' | 'saved_local' | 'syncing' | 'retrying' | 'needs_signin' | 'synced' | 'rejected';

export type LocalAttempt = {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  mode: 'practice' | 'formal';
  answers: Record<string, string>;
  startedAt: string;
  submittedAt?: string;
  savedAt?: string;
  ticket?: string;
  localScore?: number | null;
  total: number;
  checksum?: string;
  status: AttemptStatus;
  tries: number;
  nextRetryAt: number;
  lastError?: string;
  server?: { receivedAt: string; score: number | null; total: number; flags: string[]; duplicate: boolean };
};

export type Meta = { key: string; value: unknown };

export class SalamaDB extends Dexie {
  units!: Table<LocalUnit, string>;
  lessons!: Table<LocalLesson, string>;
  assessments!: Table<LocalAssessment, string>;
  attempts!: Table<LocalAttempt, string>;
  meta!: Table<Meta, string>;
  constructor(userId: string) {
    // One database per user: on a shared phone, students never see each other's data.
    super(`salama-${userId}`);
    this.version(1).stores({
      units: 'id',
      lessons: 'id, unitId',
      assessments: 'id, unitId',
      attempts: 'id, assessmentId, status',
      meta: 'key'
    });
  }
}

let current: SalamaDB | null = null;
export function getDb(userId: string) {
  if (!current || current.name !== `salama-${userId}`) current = new SalamaDB(userId);
  return current;
}

export async function deleteUserDb(userId: string) {
  if (current?.name === `salama-${userId}`) {
    current.close();
    current = null;
  }
  await Dexie.delete(`salama-${userId}`);
}

export const PENDING: AttemptStatus[] = ['saved_local', 'syncing', 'retrying', 'needs_signin'];
