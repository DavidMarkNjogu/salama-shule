import { z } from 'zod';

// Shared between the browser and the server so both sides agree on every request shape.

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(1).max(200)
});

export const JoinClassSchema = z.object({
  code: z.string().trim().toUpperCase().min(3).max(32)
});

export const AttemptSubmissionSchema = z.object({
  id: z.string().uuid(), // generated on the device; makes retries idempotent
  assessmentId: z.string().min(1).max(64),
  answers: z.record(z.string().max(64), z.string().max(64)),
  startedAt: z.string().datetime(),
  submittedAt: z.string().datetime(),
  ticket: z.string().max(1000).optional(),
  localScore: z.number().int().min(0).max(1000).nullable().optional(),
  checksum: z.string().regex(/^[a-f0-9]{64}$/)
});
export type AttemptSubmission = z.infer<typeof AttemptSubmissionSchema>;

export const NewAssessmentSchema = z.object({
  unitId: z.string().min(1).max(64),
  title: z.string().trim().min(3).max(120),
  mode: z.enum(['practice', 'formal']),
  timeLimitMin: z.number().int().min(1).max(300).nullable(),
  deadline: z.string().datetime().nullable(),
  maxAttempts: z.number().int().min(1).max(20),
  questions: z
    .array(
      z.object({
        prompt: z.string().trim().min(3).max(500),
        options: z.array(z.string().trim().min(1).max(200)).min(2).max(6),
        correctIndex: z.number().int().min(0).max(5),
        explanation: z.string().trim().max(800).default('')
      })
    )
    .min(1)
    .max(50)
});
export type NewAssessment = z.infer<typeof NewAssessmentSchema>;

/** Canonical string used for the integrity checksum (same on client and server). */
export function canonicalAttempt(a: { id: string; assessmentId: string; answers: Record<string, string> }) {
  const keys = Object.keys(a.answers).sort();
  return JSON.stringify({ id: a.id, assessmentId: a.assessmentId, answers: keys.map((k) => [k, a.answers[k]]) });
}

export type LessonBlock =
  | { type: 'h'; text: string }
  | { type: 'p'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'tip'; text: string }
  | { type: 'warn'; text: string };

export type FlagCode =
  | 'synced_after_deadline'
  | 'late'
  | 'over_time'
  | 'clock_ahead'
  | 'clock_behind'
  | 'score_mismatch';

export const FLAG_LABELS: Record<FlagCode, string> = {
  synced_after_deadline: 'Done offline before deadline, synced after',
  late: 'Submitted after deadline',
  over_time: 'Exceeded time limit (device clock)',
  clock_ahead: 'Device clock ahead of server',
  clock_behind: 'Submit time is before the quiz was downloaded',
  score_mismatch: 'Device score differs from server grade'
};
