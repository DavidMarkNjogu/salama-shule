import { z } from "zod";
import { User } from "../../helpers/User";
import superjson from "superjson";

export const schema = z.object({
  email: z.string().email("Email is required"),
  password: z.string().min(1, "Password is required"),
});

export type OutputType = { user: User };

export const postLogin = async (
  body: z.infer<typeof schema>,
  init?: RequestInit,
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/auth/login_with_password`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    credentials: "include",
  });
  const text = await result.text();
  if (!result.ok) {
    try {
      const errorData = superjson.parse<{ message: string }>(text);
      throw new Error(errorData.message || "Login failed");
    } catch (e) {
      if (e instanceof Error && e.message && !e.message.includes("is not valid JSON")) {
        throw e;
      }
      throw new Error(text.slice(0, 160) || `HTTP ${result.status}`);
    }
  }
  return superjson.parse<OutputType>(text);
};
