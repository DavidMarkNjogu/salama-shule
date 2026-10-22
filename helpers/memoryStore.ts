export type MemoryAttempt = {
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
  answers: number[];
  checksum: string;
};

export type MemoryClassCode = {
  code: string;
  label: string;
  createdAt: Date;
};

export const memoryAttempts: MemoryAttempt[] = [];

export const memoryClassCodes: MemoryClassCode[] = [
  {
    code: "SAFE-2026",
    label: "Demo class: Staying safe online",
    createdAt: new Date("2026-01-01T00:00:00Z"),
  },
];

export const isMemoryMode = () => {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
  return !url || url.includes("missing:missing");
};
