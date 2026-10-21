import superjson from "superjson";
import { SAMPLE_UNIT } from "../../helpers/unitContent";
import { OutputType } from "./get_GET.schema";

export async function handle(request: Request) {
  return new Response(
    superjson.stringify({ unit: SAMPLE_UNIT } satisfies OutputType),
  );
}
