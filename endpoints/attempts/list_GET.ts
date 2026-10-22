import superjson from "superjson";
import { db } from "../../helpers/db";
import {
  isMemoryMode,
  memoryAttempts,
  memoryClassCodes,
} from "../../helpers/memoryStore";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { OutputType } from "./list_GET.schema";

const fail = (status: number, error: string) =>
  new Response(superjson.stringify({ error }), { status });

// Lecturer only: needs a signed-in admin session.
export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    if (user.role !== "admin") {
      return fail(403, "Lecturer access only");
    }

    if (isMemoryMode()) {
      const attempts = [...memoryAttempts]
        .sort((a, b) => b.syncedAt.getTime() - a.syncedAt.getTime())
        .slice(0, 300)
        .map((a) => ({
          attemptId: a.attemptId,
          studentCode: a.studentCode,
          studentName: a.studentName,
          joinCode: a.joinCode,
          unitId: a.unitId,
          quizId: a.quizId,
          score: a.score,
          total: a.total,
          clientScore: a.clientScore,
          scoreCorrected: a.scoreCorrected,
          clientTime: a.clientTime,
          syncedAt: a.syncedAt,
        }));
      const classCodes = memoryClassCodes.map((c) => ({
        code: c.code,
        label: c.label,
      }));
      return new Response(
        superjson.stringify({ attempts, classCodes } satisfies OutputType),
      );
    }

    const attempts = await db
      .selectFrom("attempts")
      .select([
        "attemptId",
        "studentCode",
        "studentName",
        "joinCode",
        "unitId",
        "quizId",
        "score",
        "total",
        "clientScore",
        "scoreCorrected",
        "clientTime",
        "syncedAt",
      ])
      .orderBy("syncedAt", "desc")
      .limit(300)
      .execute();
    const classCodes = await db
      .selectFrom("classCodes")
      .select(["code", "label"])
      .orderBy("createdAt")
      .execute();
    return new Response(
      superjson.stringify({ attempts, classCodes } satisfies OutputType),
    );
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return fail(401, "Please sign in as a lecturer");
    }
    return fail(
      500,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}
