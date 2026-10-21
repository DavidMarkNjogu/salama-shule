import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  attemptId: z.string().min(8).max(64),
  studentCode: z.string().trim().min(1).max(40),
  studentName: z.string().trim().min(1).max(120),
  joinCode: z.string().trim().min(3).max(40),
  unitId: z.string().min(1).max(80),
  quizId: z.string().min(1).max(80),
  score: z.number().int().min(0).max(1000),
  total: z.number().int().min(1).max(1000),
  answers: z.array(z.number().int().min(-1).max(20)).max(200),
  clientTime: z.string().min(10).max(40),
  checksum: z.string().regex(/^[0-9a-fA-F]{64}$/),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = {
  confirmed: true;
  duplicate: boolean;
  attemptId: string;
  syncedAt: Date;
  // What the server recorded after re-marking the answers itself.
  score: number;
  total: number;
  scoreCorrected: boolean;
};

// Retrying these never helps, so the phone stops resending until the cause is fixed.
const PERMANENT_REJECTIONS = [
  "INVALID_JOIN_CODE",
  "CHECKSUM_MISMATCH",
  "INVALID_ATTEMPT",
  "BAD_REQUEST",
];

export class SyncRejectedError extends Error {
  code: string;
  permanent: boolean;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
    this.permanent = PERMANENT_REJECTIONS.includes(code);
  }
}

export const postSyncAttempt = async (
  body: InputType,
  init?: RequestInit,
): Promise<OutputType> => {
  const validated = schema.parse(body);
  const result = await fetch(`/_api/attempts/sync`, {
    method: "POST",
    body: superjson.stringify(validated),
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!result.ok) {
    const err = superjson.parse<{ error: string; code?: string }>(
      await result.text(),
    );
    throw new SyncRejectedError(err.error, err.code ?? "SERVER_ERROR");
  }
  return superjson.parse<OutputType>(await result.text());
};
