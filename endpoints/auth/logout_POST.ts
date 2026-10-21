import superjson from "superjson";
import { clearCookieHeader } from "../../helpers/getSetServerSession";

export async function handle(_request: Request) {
  return new Response(
    superjson.stringify({ success: true, message: "Signed out" }),
    { headers: { "Set-Cookie": clearCookieHeader() } },
  );
}
