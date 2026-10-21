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
  if (!result.ok) {
    const err = superjson.parse<{ error: string }>(await result.text());
    throw new Error(err.error);
  }
  return superjson.parse<OutputType>(await result.text());
};
