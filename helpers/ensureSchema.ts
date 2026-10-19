import { databaseUrl, sql } from "./db";

// Creates the tables on first use. Safe to run many times, and safe when
// several cold starts run it at once (advisory lock).
const DDL = `
create table if not exists class_codes (
  code text primary key,
  label text not null,
  created_at timestamptz not null default now()
);
create table if not exists attempts (
  attempt_id text primary key,
  student_code text not null,
  student_name text not null,
  unit_id text not null,
  quiz_id text not null,
  score integer not null,
  total integer not null,
  answers jsonb not null,
  client_time timestamptz not null,
  synced_at timestamptz not null default now(),
  join_code text not null default '',
  checksum text not null default '',
  client_score integer not null default 0,
  score_corrected boolean not null default false
);
create index if not exists attempts_student_synced_idx on attempts (student_code, synced_at);
create table if not exists login_attempts (
  id serial primary key,
  email text not null,
  success boolean not null default false,
  ip text not null default 'unknown',
  attempted_at timestamptz not null default now()
);
create index if not exists login_attempts_ip_idx on login_attempts (ip, attempted_at);
insert into class_codes (code, label)
values ('SAFE-2026', 'Demo class: Staying safe online')
on conflict (code) do nothing;
`;

let ready: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!databaseUrl) {
    return Promise.reject(
      new Error("DATABASE_URL is not set. Connect the Neon database to this Vercel project."),
    );
  }
  if (!ready) {
    ready = sql
      .begin(async (tx) => {
        await tx`select pg_advisory_xact_lock(727274)`;
        await tx.unsafe(DDL);
      })
      .then(() => undefined)
      .catch((e) => {
        ready = null;
        throw e;
      });
  }
  return ready;
}
