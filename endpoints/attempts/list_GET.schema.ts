import superjson from "superjson";

export type AttemptRow = {
  attemptId: string;
  studentCode: string;
  studentName: string;
  joinCode: string;
  unitId: string;
  quizId: string;
  score: number;
  total: number;
  clientScore: number;
  scoreCorrected: boolean;
  clientTime: Date;
  syncedAt: Date;
};

export type ClassCodeRow = { code: string; label: string };
export type OutputType = { attempts: AttemptRow[]; classCodes: ClassCodeRow[] };

export const getAttemptsList = async (
  init?: RequestInit,
): Promise<OutputType> => {
  const result = await fetch(`/_api/attempts/list`, { method: "GET", ...init });
  if (!result.ok) {
    const err = superjson.parse<{ error: string }>(await result.text());
    throw new Error(err.error);
  }
  return superjson.parse<OutputType>(await result.text());
};
