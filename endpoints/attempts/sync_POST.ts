import superjson from "superjson";
import { ZodError } from "zod";
import { db } from "../../helpers/db";
import {
  isMemoryMode,
  memoryAttempts,
  memoryClassCodes,
} from "../../helpers/memoryStore";
import { SAMPLE_UNIT } from "../../helpers/unitContent";
import { computeAttemptChecksum } from "../../helpers/attemptChecksum";
import { schema, OutputType } from "./sync_POST.schema";

// Per student code: at most this many NEW attempts per minute.
const MAX_NEW_PER_MINUTE = 12;

const fail = (status: number, code: string, error: string) =>
  new Response(superjson.stringify({ error, code }), { status });
const ok = (body: OutputType) => new Response(superjson.stringify(body));

// Secure sync: join code, integrity checksum, server-side marking, rate limit,
// and an idempotent insert (the attempt ID is the primary key).
export async function handle(request: Request) {
  try {
    const input = schema.parse(superjson.parse(await request.text()));

    const clientTime = new Date(input.clientTime);
    if (Number.isNaN(clientTime.getTime())) {
      return fail(422, "INVALID_ATTEMPT", "Invalid clientTime");
    }

    // 1. The class join code must exist.
    const joinCode = input.joinCode.toUpperCase();
    if (isMemoryMode()) {
      const cls = memoryClassCodes.find((c) => c.code === joinCode);
      if (!cls) {
        return fail(
          403,
          "INVALID_JOIN_CODE",
          "Class code not recognised. Check it with your lecturer.",
        );
      }
    } else {
      const cls = await db
        .selectFrom("classCodes")
        .select("code")
        .where("code", "=", joinCode)
        .executeTakeFirst();
      if (!cls) {
        return fail(
          403,
          "INVALID_JOIN_CODE",
          "Class code not recognised. Check it with your lecturer.",
        );
      }
    }

    // 2. The checksum must match what arrived (data integrity in transit).
    const expected = await computeAttemptChecksum({
      attemptId: input.attemptId,
      studentCode: input.studentCode,
      studentName: input.studentName,
      joinCode: input.joinCode,
      unitId: input.unitId,
      quizId: input.quizId,
      score: input.score,
      total: input.total,
      answers: input.answers,
      clientTime: input.clientTime,
    });
    if (expected !== input.checksum.toLowerCase()) {
      return fail(
        422,
        "CHECKSUM_MISMATCH",
        "Integrity check failed: this result changed after it was saved on the phone.",
      );
    }

    // 3. The quiz must exist and the answers must fit it.
    const unit = SAMPLE_UNIT;
    const questions = unit.quiz.questions;
    const answersFit =
      input.answers.length === questions.length &&
      input.answers.every((a, i) => a >= -1 && a < questions[i].options.length);
    if (input.unitId !== unit.id || input.quizId !== unit.quiz.id || !answersFit) {
      return fail(422, "INVALID_ATTEMPT", "Unknown quiz or malformed answers.");
    }

    // 4. Resending the same attempt is safe: confirm what is already stored.
    if (isMemoryMode()) {
      const existing = memoryAttempts.find((a) => a.attemptId === input.attemptId);
      if (existing) {
        return ok({
          confirmed: true,
          duplicate: true,
          attemptId: input.attemptId,
          syncedAt: new Date(),
          score: existing.score,
          total: existing.total,
          scoreCorrected: existing.scoreCorrected,
        });
      }
    } else {
      const existing = await db
        .selectFrom("attempts")
        .select(["score", "total", "scoreCorrected"])
        .where("attemptId", "=", input.attemptId)
        .executeTakeFirst();
      if (existing) {
        return ok({
          confirmed: true,
          duplicate: true,
          attemptId: input.attemptId,
          syncedAt: new Date(),
          score: existing.score,
          total: existing.total,
          scoreCorrected: existing.scoreCorrected,
        });
      }
    }

    // 5. Rate limit new attempts per student code.
    if (isMemoryMode()) {
      const oneMinuteAgo = Date.now() - 60_000;
      const recentCount = memoryAttempts.filter(
        (a) => a.studentCode === input.studentCode && a.syncedAt.getTime() > oneMinuteAgo,
      ).length;
      if (recentCount >= MAX_NEW_PER_MINUTE) {
        return fail(
          429,
          "RATE_LIMITED",
          "Too many results from this student code. Try again in a minute.",
        );
      }
    } else {
      const recent = await db
        .selectFrom("attempts")
        .select((eb) => eb.fn.countAll<string>().as("n"))
        .where("studentCode", "=", input.studentCode)
        .where("syncedAt", ">", new Date(Date.now() - 60_000))
        .executeTakeFirst();
      if (Number(recent?.n ?? 0) >= MAX_NEW_PER_MINUTE) {
        return fail(
          429,
          "RATE_LIMITED",
          "Too many results from this student code. Try again in a minute.",
        );
      }
    }

    // 6. The server marks the answers itself. The phone's score is only a claim.
    const serverScore = questions.reduce(
      (n, q, i) => n + (input.answers[i] === q.correctIndex ? 1 : 0),
      0,
    );
    const total = questions.length;
    const scoreCorrected = serverScore !== input.score || total !== input.total;

    if (isMemoryMode()) {
      memoryAttempts.push({
        attemptId: input.attemptId,
        studentCode: input.studentCode,
        studentName: input.studentName,
        unitId: input.unitId,
        quizId: input.quizId,
        score: serverScore,
        total,
        answers: input.answers,
        clientTime,
        syncedAt: new Date(),
        joinCode,
        checksum: expected,
        clientScore: input.score,
        scoreCorrected,
      });

      return ok({
        confirmed: true,
        duplicate: false,
        attemptId: input.attemptId,
        syncedAt: new Date(),
        score: serverScore,
        total,
        scoreCorrected,
      });
    }

    const inserted = await db
      .insertInto("attempts")
      .values({
        attemptId: input.attemptId,
        studentCode: input.studentCode,
        studentName: input.studentName,
        unitId: input.unitId,
        quizId: input.quizId,
        score: serverScore,
        total,
        answers: input.answers,
        clientTime,
        joinCode,
        checksum: expected,
        clientScore: input.score,
        scoreCorrected,
      })
      .onConflict((oc) => oc.column("attemptId").doNothing())
      .executeTakeFirst();
    const duplicate = Number(inserted.numInsertedOrUpdatedRows ?? 0) === 0;

    return ok({
      confirmed: true,
      duplicate,
      attemptId: input.attemptId,
      syncedAt: new Date(),
      score: serverScore,
      total,
      scoreCorrected,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return fail(400, "BAD_REQUEST", "Malformed request");
    }
    return fail(
      500,
      "SERVER_ERROR",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}
