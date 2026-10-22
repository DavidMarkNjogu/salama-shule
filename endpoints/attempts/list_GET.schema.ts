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
  const text = await result.text();
  if (!result.ok) {
    try {
      const err = superjson.parse<{ error: string }>(text);
      throw new Error(err.error || `HTTP ${result.status}`);
    } catch (e) {
      if (e instanceof Error && e.message && !e.message.includes("is not valid JSON")) {
        throw e;
      }
      throw new Error(text.slice(0, 160) || `HTTP ${result.status}`);
    }
  }
  return superjson.parse<OutputType>(text);
};
