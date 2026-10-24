import { PGlite } from '@electric-sql/pglite';
import { mkdirSync } from 'node:fs';
import { seed } from './seed.js';

// Local PostgreSQL (PGlite) so the app runs with zero setup.
// The SQL is plain Postgres, so moving to Neon later means swapping this client.
mkdirSync('.data', { recursive: true });
export const db = new PGlite('.data/pg');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student','lecturer'))
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  join_code TEXT NOT NULL UNIQUE,
  lecturer_id TEXT NOT NULL REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS class_members (
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (class_id, user_id)
);
CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  position INT NOT NULL DEFAULT 0,
  version INT NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  unit_id TEXT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  minutes INT NOT NULL DEFAULT 5,
  blocks JSONB NOT NULL
);
CREATE TABLE IF NOT EXISTS assessments (
  id TEXT PRIMARY KEY,
  unit_id TEXT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('practice','formal')),
  time_limit_min INT,
  deadline TIMESTAMPTZ,
  max_attempts INT NOT NULL DEFAULT 1,
  results_released BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  position INT NOT NULL,
  prompt TEXT NOT NULL,
  options JSONB NOT NULL,            -- [{id, text}]
  correct_option_id TEXT NOT NULL,   -- never sent to devices for formal assessments
  explanation TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS attempts (
  id UUID PRIMARY KEY,               -- client-generated: retries can never duplicate
  student_id TEXT NOT NULL REFERENCES users(id),
  assessment_id TEXT NOT NULL REFERENCES assessments(id),
  answers JSONB NOT NULL,
  score INT NOT NULL,
  total INT NOT NULL,
  local_score INT,
  started_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL, -- device clock
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(), -- server clock
  ticket_issued_at TIMESTAMPTZ,
  flags JSONB NOT NULL DEFAULT '[]'
);
CREATE TABLE IF NOT EXISTS sync_events (
  id SERIAL PRIMARY KEY,
  attempt_id TEXT,
  user_id TEXT,
  outcome TEXT NOT NULL,
  detail TEXT,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

export async function initDb() {
  await db.exec(SCHEMA);
  const { rows } = await db.query<{ n: number }>('SELECT count(*)::int AS n FROM users');
  if (rows[0].n === 0) {
    await seed(db);
    console.log('Seeded demo data.');
  }
}
