import superjson from "superjson";
import { db } from "../../helpers/db";
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
