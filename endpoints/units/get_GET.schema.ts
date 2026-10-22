import superjson from "superjson";
import type { Unit } from "../../helpers/unitContent";

export type OutputType = { unit: Unit };

export const getUnit = async (init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/units/get`, { method: "GET", ...init });
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
