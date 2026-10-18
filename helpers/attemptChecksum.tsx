// Shared by the phone (before sending) and the server (on receipt).
// SHA-256 over a fixed-order JSON array of the attempt's fields. It catches
// corruption and edits in storage or in transit. It is not a secret, so it
// does not stop a determined cheater: the server re-marks every attempt itself.
export type ChecksumFields = {
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
};

export const canonicalAttempt = (f: ChecksumFields): string =>
  JSON.stringify([
    f.attemptId,
    f.studentCode,
    f.studentName,
    f.joinCode,
    f.unitId,
    f.quizId,
    f.score,
    f.total,
    f.answers,
    f.clientTime,
  ]);

export async function computeAttemptChecksum(
  fields: ChecksumFields,
): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("Secure hashing is not available in this browser");
  }
  const bytes = new TextEncoder().encode(canonicalAttempt(fields));
  const digest = await subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
