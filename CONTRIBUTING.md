# Contributing to Salama Shule: Dual-Track Contributor Guide

Welcome to Salama Shule! We welcome contributions from everyone across the project team and open-source ecosystem. To make collaboration productive and safe for different skill sets, we offer two distinct contributor tracks:

1. **Track 1: Soft Dev (AI-Assisted, Curriculum & UI Contributors)**: For developers using AI coding assistants (Claude, Cursor, Antigravity) or educators adding lesson content, quiz questions, and interface refinements.
2. **Track 2: Deep Dev (Full-Stack, Offline-Sync & Database Engineers)**: For systems engineers working on the 3-state background sync state machine, SHA-256 attempt checksums, Neon PostgreSQL queries, and serverless ingestion APIs.

---

## Track 1: Soft Dev (AI-Assisted & Curriculum Contributors)

If you are using AI tools or contributing new learning units, quiz assessments, or visual styling, follow this track.

### 1. Adding or Editing Curriculum Units
All offline lesson content and quiz questions live in a single structured file:
- **File Location**: [helpers/unitContent.tsx](file:///c:/Users/user%20pc/Desktop/2026/RIARA%20HACKATHON/salama-shule/helpers/unitContent.tsx)

To add a new quiz question or lesson, simply extend the JSON data structure. Example:
```typescript
{
  id: "q-cyber-04",
  question: "What should you do if an SMS claims your bank account is frozen and asks for your PIN?",
  options: [
    "Reply immediately with your PIN to unfreeze it",
    "Forward the SMS to five friends",
    "Ignore the SMS and call your bank using their official verified hotline",
    "Click the link inside the SMS"
  ],
  correctIndex: 2,
  explanation: "Banks in Kenya will never ask for your PIN via SMS. Always verify independently through official channels."
}
```

### 2. Refining Theme & Styling
- **Design Tokens**: [base.css](file:///c:/Users/user%20pc/Desktop/2026/RIARA%20HACKATHON/salama-shule/base.css) — Edit mobile-friendly font sizes, color variables, and spacing scales.
- **Page Layouts**: `pages/*.module.css` — Fine-tune card padding, button heights (ensure at least 44px for thumb targets on mobile), and status badge appearance.

### 3. High-Risk Zones (Avoid Modifying in Soft Dev)
Do **not** allow AI assistants to modify these core engine files without deep dev review:
- `helpers/useSyncEngine.tsx`: The 3-state offline sync engine and retry logic.
- `helpers/deviceStore.tsx`: Local storage serialization and attempt persistence.
- `helpers/attemptChecksum.tsx`: Cryptographic integrity hashing for offline exam submissions.
- `helpers/schema.tsx` & `helpers/ensureSchema.ts`: Neon PostgreSQL database tables.

### 4. AI Prompting Rules & Guardrails
When prompting Claude, Cursor, or Antigravity, use this exact prompt preamble:
```text
"You are contributing to Salama Shule.
Rules:
1. STRICTLY NO EMOJI in source code, buttons, or lesson copy.
2. Do NOT touch helpers/useSyncEngine.tsx or database schemas.
3. Keep all edits focused on helpers/unitContent.tsx or CSS files.
4. Run 'npm run typecheck' and ensure 0 errors before presenting changes."
```

---

## Track 2: Deep Dev (Full-Stack & Systems Engineers)

For engineers working on the offline-first synchronization architecture, backend APIs, and authentication.

### 1. Technology Stack Overview
- **Runtime**: Node.js 20+ / TypeScript 5.8
- **Frontend**: React 19, Vite, CSS Modules
- **Offline Storage**: LocalStorage / IndexedDB with JSON serialization
- **Database**: Neon Serverless PostgreSQL, Kysely type-safe query builder
- **Integrity**: SHA-256 attempt digests via Web Crypto API
- **Deployment**: Vercel Serverless Functions (`api/index.ts`)

### 2. Core Offline-First Sync Invariants
Salama Shule enforces strict decoupling between student interactions and network connectivity:
1. **Device-Local Containment**:
   - Every quiz submission is stored in `deviceStore` before any network call is attempted.
   - Even if the browser tab is closed or the device loses power immediately after submission, the attempt is preserved.
2. **Attempt Checksum & Anti-Tamper**:
   - Each attempt computes a SHA-256 digest: `SHA256(student_id + unit_id + score + answers_hash + timestamp)`.
   - The backend validates this checksum on ingestion to guarantee that local scores were not artificially inflated.
3. **Idempotent Ingestion**:
   - The sync endpoint (`endpoints/attempts/sync_POST.ts`) uses `attempt_id` as a primary key constraint. Duplicate sync dispatches caused by flapping network connections return HTTP 200 without creating duplicate records.
4. **Finite Sync State Machine**:
   - `Saved on device` -> `Syncing...` -> `Synced`.
   - Transient failures trigger an exponential backoff retry loop without blocking user navigation.

### 3. Database Layer & Auto-Migrations
- Managed via Kysely query builder in [helpers/db.tsx](file:///c:/Users/user%20pc/Desktop/2026/RIARA%20HACKATHON/salama-shule/helpers/db.tsx).
- Auto-migrations execute idempotently at endpoint start via [helpers/ensureSchema.ts](file:///c:/Users/user%20pc/Desktop/2026/RIARA%20HACKATHON/salama-shule/helpers/ensureSchema.ts).

### 4. Automated E2E Verification Suite
Run the automated test harness:
```bash
npx tsx _test.mts
```
Tests cover:
- Pre-loaded unit content retrieval and structure validation.
- Attempt creation, serialization, and SHA-256 checksum verification.
- Offline queue behavior and idempotent sync batching.
- Lecturer password authentication and session cookie generation.
- Real-time grade aggregation and student progress analytics.

### 5. Git Commit & Pull Request Conventions
- Conventional commits required: `type(scope): concise description`.
  - Example: `feat(sync): add exponential backoff retry for network timeouts`
  - Example: `fix(storage): resolve corrupted localStorage JSON parsing edge case`
- Strictly **ZERO EMOJI** in commit messages, code comments, and PR descriptions.
- All PRs must verify with clean `npm run typecheck` and `npx tsx _test.mts`.
