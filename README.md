# Salama Shule — offline-first learning & secure assessment

Students keep learning and taking quizzes with no connection. Work is saved on the device first and delivered to the lecturer safely when the connection returns — never duplicated, never falsely marked as sent.

## Run it (needs Node.js 20+)

```bash
npm install
npm run demo        # builds the PWA and starts it at http://localhost:3000
```

The first start creates a local PostgreSQL database (`.data/`) with demo content. To start over: `npm run reset-db`, then `npm run demo`.

> Use `npm run demo` for the offline demo. `npm run dev` is for editing code and has the service worker switched off.

### Mobile compatibility

The PWA is designed and checked for Android Chrome at 412 × 915 CSS pixels and
iPhone Safari at 390 × 844 CSS pixels. The layout uses responsive navigation,
44px minimum touch targets, safe-area insets, IndexedDB for offline work, and
Safari-compatible timer and reconnect fallbacks. Install the app over HTTPS
for service-worker and offline support on a phone. iPhone Safari may evict
site storage under device pressure, so students should reconnect periodically
to sync completed attempts.

### Demo accounts

| Who | Email | Password |
|---|---|---|
| Student | amina@salama.ac.ke | amina123 |
| Student (not yet in a class — join code `WEBSEC24`) | brian@salama.ac.ke | brian123 |
| Lecturer | lecturer@salama.ac.ke | lecturer123 |

The sign-in page has one-tap buttons for each.

## How it works

```
Device (PWA)                                   Server (Hono + PostgreSQL)
──────────────                                 ──────────────────────────
Service worker caches the app shell
Unit download → IndexedDB (per-user DB)  ◀──   lessons + quizzes (+ signed exam ticket
                                                for formal; NO answer key)
Every answer saved instantly
Submit → saved locally FIRST → outbox
Outbox drains: on start, on reconnect,   ──▶   validate → check ticket → re-grade →
on focus, every 8s, backoff on failure         flag issues → store (UUID = primary key)
Status: Saved → Syncing → Synced ✓       ◀──   confirmation
                                               Lecturer portal reads ONLY server records
```

### Security built into the platform

| Threat | Control |
|---|---|
| Student reads the answer key from the phone | Formal quizzes are downloaded **without** correct answers; the server grades them |
| Retry after a dropped upload creates duplicates | Device-generated UUID is the database primary key → idempotent |
| Edited or corrupted submission | SHA-256 checksum re-computed on the server (detects corruption — not proof of honesty, so the server also re-grades everything) |
| Fake "I took it offline before the deadline" | Server-signed (HMAC) exam ticket records when the quiz was downloaded; impossible timelines are flagged |
| Device clock manipulation | Device times are compared with the trusted server clock and flagged for the lecturer |
| Device-side score tampering (practice) | Server re-grades; mismatches flagged |
| Accessing other classes or students' data | Every API route checks role and class membership server-side |
| Session theft / CSRF | Random tokens, only hashes stored; HttpOnly + SameSite cookies; JSON-only writes |
| Password guessing | bcrypt hashing, generic error messages, login rate limiting |
| Shared family phone | Separate local database per user; logout wipes it (warning first if work is unsynced) |
| False reassurance | "Synced ✓" only after the server confirms |

## Project structure

```
src/            React 19 + TypeScript PWA
  lib/sync.ts   the sync engine (outbox, retries, error classification)
  lib/localdb.ts IndexedDB schema (Dexie)
  student/      dashboard, unit, lesson reader, quiz player, Sync Center
  lecturer/     live submissions, attempt detail, assessment builder
server/         Hono API, security (sessions, tickets, rate limit), schema, seed content
shared/         Zod schemas used by both client and server
tests/          security-check.mjs (API) · e2e_offline_demo.py (Playwright, full offline flow)
```
