# Plan: Visual Non-Technical Judge Attack & Defense Wiki Manual

## Goal Description
Create a dedicated, visually rich, and non-technical "Judge Attack & Defense Manual" formatted for easy reading by non-technical team members, presenters, and student founders. The manual translates complex cryptographic and distributed system vulnerabilities into plain English analogies (e.g. digital seal stamps, airline boarding passes, offline SMS queues), with clear visual flowcharts (Mermaid) and exact word-for-word scripts to say when challenged on stage.

---

## User Review Required
> [!IMPORTANT]
> The manual will be published in both repositories as `docs/JUDGE_DEFENSE_MANUAL.md` so non-technical teammates can review directly on GitHub or in markdown readers.
> 
> No source code or UI logic is modified by this task; it strictly augments documentation and presentation preparation.

---

## Proposed Structure of `docs/JUDGE_DEFENSE_MANUAL.md`

### 1. The Judge's Mindset (How Hackathon Judges Think)
- Plain explanation of what judges look for: feasibility, defense against cheating, market realism, and Kenyan legal compliance.
- Visual diagram: The 4 Filter Test (Idea -> Architecture -> Kenyan Reality -> Business).

### 2. ChetiCheck: Non-Technical Attack & Defense Cards
- **Attack 1: The Forged Stamp (Private Key Custody)**:
  - *Plain Analogy*: The official Riara University rubber stamp left unattended on a desk vs locked in an armored safe.
  - *What to say on stage*: Word-for-word defense.
- **Attack 2: The Stolen PDF (File Hash vs QR Data)**:
  - *Plain Analogy*: Changing the name on a printed paper certificate vs scanning the tamper-proof bar code.
  - *What to say on stage*.
- **Attack 3: The Revocation Question (Why Asymmetric Crypto?)**:
  - *Plain Analogy*: Canceling a stolen passport vs calling the embassy.
  - *What to say on stage*.

### 3. Salama Shule: Non-Technical Attack & Defense Cards
- **Attack 1: The Impersonator (Identity & Sybil Attacks)**:
  - *Plain Analogy*: Submitting an exam paper with someone else's name written at the top.
  - *What to say on stage*.
- **Attack 2: The Real Airplane Mode Test (PWA & Offline Limits)**:
  - *Plain Analogy*: A downloaded Spotify playlist vs streaming.
  - *What to say on stage*.
- **Attack 3: The "Moodle Already Does This" Trap (The Moat)**:
  - *Plain Analogy*: A heavy 40-ton truck (Moodle) vs a nimble Boda-boda (Salama Shule).
  - *What to say on stage*.

### 4. Kenyan Business & Legal Realities (KDPA 2019 & Universities)
- Explanation of the 12-month procurement hurdle and the "Departmental Pilot" workaround.
- Explanation of student privacy under the Kenya Data Protection Act and "Cryptographic Erasure".
- The KES 250 Employer Verification business model made simple.

### 5. Quick-Reference Stage Defense Cheat Sheet (1-Page Table)
- A condensed table for quick glance backstage 5 minutes before presentation.

---

## Proposed File Changes
- `[NEW] cheti-check/docs/JUDGE_DEFENSE_MANUAL.md`
- `[NEW] salama-shule/docs/JUDGE_DEFENSE_MANUAL.md`
- `[MODIFY] cheti-check/README.md` (Add link in documentation section)
- `[MODIFY] salama-shule/README.md` (Add link in documentation section)

---

## Verification Plan
1. **Markdown & Visual Rendering**: Verify Mermaid diagrams and markdown tables render cleanly with zero syntax errors.
2. **Zero Emoji Audit**: Machine-scan both files to guarantee zero emojis are present per invariant rules.
3. **Commit & Push**: Commit with granular messages (`docs: add visual non-technical judge defense manual`) and push to GitHub `main` for instant team review.
