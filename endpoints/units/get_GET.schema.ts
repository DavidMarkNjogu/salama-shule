import superjson from "superjson";
import type { Unit } from "../../helpers/unitContent";

export type OutputType = { unit: Unit };

export const getUnit = async (init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/units/get`, { method: "GET", ...init });
  if (!result.ok) {
    const err = superjson.parse<{ error: string }>(await result.text());
    throw new Error(err.error);
  }
  return superjson.parse<OutputType>(await result.text());
};
