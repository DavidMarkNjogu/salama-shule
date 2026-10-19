import { Kysely, CamelCasePlugin } from "kysely";
import { PostgresJSDialect } from "kysely-postgres-js";
import postgres from "postgres";
import { DB, kyselyIdentifierOverrides } from "./schema";

class OverrideCamelCasePlugin extends CamelCasePlugin {
  protected override snakeCase(str: string): string {
    return kyselyIdentifierOverrides[str] ?? super.snakeCase(str);
  }
}

// Neon (via the Vercel integration) provides DATABASE_URL.
export const databaseUrl =
  process.env.DATABASE_URL || process.env.POSTGRES_URL || "";

export const sql = postgres(
  databaseUrl || "postgres://missing:missing@127.0.0.1:1/missing",
  { prepare: false, idle_timeout: 10, max: 3 },
);

export const db = new Kysely<DB>({
  plugins: [new OverrideCamelCasePlugin()],
  dialect: new PostgresJSDialect({ postgres: sql }),
});
