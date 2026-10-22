import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  joinCode: z.string().trim().min(3).max(40),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = { valid: boolean; label?: string };

export const postJoinCheck = async (
  body: InputType,
  init?: RequestInit,
): Promise<OutputType> => {
  const validated = schema.parse(body);
  const result = await fetch(`/_api/classes/join`, {
    method: "POST",
    body: superjson.stringify(validated),
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
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
