# Salama Shule: Learning That Can Wait for the Network

> An offline-first digital learning and assessment platform built for Kenyan students facing unstable internet connectivity, high data costs, and intermittent power. Students read lessons and complete graded quizzes completely offline; progress synchronizes seamlessly to the cloud upon reconnection without data loss.

Built for the **Riara University Inter-University Hackathon 2026** under the **EdTech Innovation & Cybersecurity** track.

- **Live Production URL**: [https://salama-shule.vercel.app](https://salama-shule.vercel.app)
- **Non-Technical Guide & Testing Manual**: [HOW_TO_USE.md](HOW_TO_USE.md)
- **Dual-Track Contributor Guide**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **Design Thinking Methodology Mapping**: [docs/design-thinking-mapping.md](docs/design-thinking-mapping.md)
- **Riara Training Workshop Playbook**: [docs/riara-training-playbook-raw.md](docs/riara-training-playbook-raw.md)

---

## System Architecture & Offline Sync Protocol

```mermaid
flowchart TD
    subgraph Client["1. Student Mobile Browser (Offline Capable)"]
        direction TB
        A["Pre-loaded Unit Content<br/>(Cached in deviceStore)"] --> B["Student Reads Lessons Offline"]
        B --> C["Student Completes Interactive Quiz"]
        C --> D["Local Grading Engine Computes Score"]
        D --> E["Generate SHA-256 Attempt Checksum"]
        E --> F["State: Saved on device<br/>(Yellow Chip)"]
    end

    subgraph Sync["2. Resilient Background Synchronization Engine"]
        direction TB
        G{"Network Status Detected<br/>(useNetwork Hook)"}
        F --> G
        G -->|"Offline"| H["Retain in deviceStore Queue"]
        G -->|"Online"| I["State: Syncing...<br/>(Blue Spinner)"]
        I --> J["Dispatch Batch Attempt POST to API"]
    end

    subgraph Server["3. Cloud Backend & Lecturer Gradebook"]
        direction TB
        J --> K["Verify SHA-256 Checksum on Ingestion"]
        K --> L{"Idempotent Duplicate Check<br/>(attempt_id Primary Key)"}
        L -->|"New Attempt"| M["Insert into Neon PostgreSQL DB"]
        L -->|"Already Processed"| N["Return HTTP 200 (No-Op)"]
        M --> O["State: Synced<br/>(Green Checkmark)"]
        N --> O
        M --> P["Update Lecturer Analytics Dashboard<br/>(Grade Distributions & Progress)"]
    end

    style Client fill:#1e293b,stroke:#475569,stroke-width:2px,color:#f8fafc
    style Sync fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#f8fafc
    style Server fill:#1e1b4b,stroke:#6366f1,stroke-width:2px,color:#f8fafc
    style F fill:#78350f,stroke:#f59e0b,stroke-width:2px,color:#fffbeb
    style I fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#eff6ff
    style O fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#ecfdf5
```

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite, CSS Modules
- **Client Storage**: LocalStorage / IndexedDB with JSON serialization
- **Backend**: Vercel Serverless Functions (`api/index.ts`)
- **Database**: Neon Serverless PostgreSQL with Kysely query builder
- **Integrity**: SHA-256 client attempt checksums via Web Crypto API
- **Deployment**: Vercel Edge Network

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- npm

### Installation & Setup
```bash
git clone https://github.com/DavidMarkNjogu/salama-shule.git
cd salama-shule
npm install
```

### Environment Configuration
Create a `.env` file in the root directory:
```env
DATABASE_URL=postgresql://user:password@host/neondb?sslmode=require
LECTURER_EMAIL=lecturer@salama.ac.ke
LECTURER_PASSWORD=lecturer123
SESSION_SECRET=super_secret_session_key_16_chars_min
```

### Run Locally
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### Run Verification & Type Checks
```bash
npm run typecheck
npm run build
npx tsx _test.mts
```

---

## Project Structure

```
salama-shule/
├── api/                           # Vercel serverless request routing
│   └── index.ts                   # Unified API router
├── components/                    # Reusable UI component primitives
│   ├── AppFrame.tsx               # Mobile-first viewport container
│   ├── SyncChip.tsx               # 3-state sync indicator
│   └── JoinCodeEditor.tsx         # Class enrollment input
├── endpoints/                     # Domain API handlers
│   ├── attempts/                  # Sync attempts & lecturer list queries
│   ├── auth/                      # Lecturer session & password authentication
│   ├── classes/                   # Join class validation
│   └── units/                     # Curriculum content retrieval
├── helpers/                       # Core utilities and data layer
│   ├── attemptChecksum.tsx        # SHA-256 attempt hashing
│   ├── db.tsx                     # Kysely client connection
│   ├── deviceStore.tsx            # Local storage persistence
│   ├── ensureSchema.ts            # Idempotent auto-migration runner
│   ├── unitContent.tsx            # Pre-loaded syllabus and question bank
│   ├── useNetwork.tsx             # Online/offline state & demo simulation hook
│   └── useSyncEngine.tsx          # 3-state background sync state machine
├── pages/                         # Application route pages
│   ├── _index.tsx                 # Student unit overview & progress
│   ├── lesson.$lessonId.tsx       # Offline lesson reader
│   ├── quiz.tsx                   # Interactive quiz runner with instant grading
│   └── lecturer.tsx               # Lecturer analytics & gradebook dashboard
├── docs/                          # Design thinking & workshop playbooks
│   ├── spec-problem-definition.md # Initial conception and PRD
│   ├── design-thinking-mapping.md # Alignment to Riara training frameworks
│   └── riara-training-playbook-raw.md # Raw workshop transcript
├── HOW_TO_USE.md                  # Non-technical testing guide
├── CONTRIBUTING.md                # Dual-track developer instructions
└── README.md                      # Project documentation
```

---

## Honest Boundaries & Security Scope

1. **Attempt Checksum**: The SHA-256 checksum verifies that an attempt was not altered in the local browser between completion and network synchronization.
2. **Offline Quiz Security**: In this hackathon prototype, lesson content and answer keys are pre-cached on the device to allow 100% offline grading. In high-stakes examinations, answer keys are retained server-side.
3. **Identity Model**: The student name is a local identifier; class code `SAFE-2026` acts as the shared enrollment key.
