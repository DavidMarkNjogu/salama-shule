import superjson from "superjson";
import { db } from "../../helpers/db";
import { schema, OutputType } from "./join_POST.schema";

// Lets a phone check a class code while it is online. Sync checks it again.
export async function handle(request: Request) {
  try {
    const input = schema.parse(superjson.parse(await request.text()));
    const row = await db
      .selectFrom("classCodes")
      .select(["code", "label"])
      .where("code", "=", input.joinCode.toUpperCase())
      .executeTakeFirst();
    const body: OutputType = row
      ? { valid: true, label: row.label }
      : { valid: false };
    return new Response(superjson.stringify(body));
  } catch (error) {
    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 400 },
    );
  }
}
