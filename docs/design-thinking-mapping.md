# Salama Shule: Riara Design Thinking Methodology Mapping

This document details how **Salama Shule** directly applies the design thinking frameworks, empathy tools, and prototyping principles taught by **Stephen Kagwathi** during the Riara University Inter-University Hackathon 2026 preparation sessions (Session 1: October 7, 2026; Session 2: October 14, 2026).

---

## 1. Session 1 Application: Problem Discovery & Definition

> "Don't solve it yet. Find the problem worth solving." — Stephen Kagwathi

### 1.1 The Empathy Phase (Observe, Ask, Listen, Notice)
- **Observations**: Kenyan university students studying in rural, semi-arid, or peri-urban areas frequently experience mobile network drops and run out of expensive data bundles during online coursework.
- **Interviews Conducted**: Students who lost 40 minutes of quiz progress on Moodle due to sudden network cut-offs; lecturers dealing with dozens of missing assignment complaints caused by connection timeouts.
- **The Core Insight**: Most EdTech products fail in Kenya because they assume continuous 4G/5G connectivity. Technology must adapt to infrastructure realities, not punish learners for unstable bandwidth.

### 1.2 Salama Shule Problem Card
| Field | Salama Shule Definition |
| :--- | :--- |
| **Who** | Tertiary Students with intermittent connectivity and University Lecturers. |
| **Where** | Low-bandwidth areas, rural homes, transit commutes, and rolling blackout zones. |
| **When** | During Continuous Assessment Tests (CATs), lesson revisions, and assignment submissions. |
| **What Pain** | Mid-quiz disconnects drop answers, crash sessions, and register zero scores. |
| **Why it Matters** | Educational access and academic grading must remain equitable regardless of student network stability. |

### 1.3 How Might We (HMW) Statements
- *How might we guarantee that a student can complete an entire educational unit and graded quiz without an internet connection?*
- *How might we make network reconnection seamless and automatic so no student effort is needed to sync completed scores?*

---

## 2. Session 2 Application: Prototype Archetype & 48-Hour Feasibility Filter

> "Build to learn. One question -> one prototype." — Stephen Kagwathi

### 2.1 The Core Prototype Question
- **The Question**: Can a student complete a graded quiz completely offline, maintain cryptographic integrity on the local device, and automatically sync to a cloud database upon reconnection without duplicate submissions?
- **Selected Archetype**: **Clickable Functional Prototype + Offline Simulation Runner**.

### 2.2 The 48-Hour Feasibility Filter Evaluation
Stephen Kagwathi outlined 4 non-negotiable filters for hackathon viability:

| Filter Dimension | Kagwathi Criterion | Salama Shule Implementation & Proof |
| :--- | :--- | :--- |
| **Desirable** | Do target users genuinely want this? | Students eliminate fear of lost work; lecturers receive reliable assessment submissions without manual re-runs. |
| **Useful** | Does it solve the real root friction? | Offline-first reading, instant local grading, zero data loss, automatic background sync. |
| **Feasible** | Can this be engineered and proven in 48 hours? | Built with React 19, client-side localStorage/IndexedDB caching, SHA-256 attempt hashing, and Neon PostgreSQL serverless APIs. |
| **Trustworthy** | Is it secure, private, and resilient? | SHA-256 checksums prevent client-side score manipulation; idempotent backend APIs reject replay attacks. |

---

## 3. The 80/20 User Testing & Feedback Protocol

> "User talks 80%, team listens. Never defend the design during user tests." — Stephen Kagwathi

During usability testing rounds:
1. **Tester Prompt**: *"Pretend you are on a matatu with no network. Read the cybersecurity lesson, take the quiz, and observe what happens when you reconnect."*
2. **Key Feedback Collected**:
   - Testers wanted immediate reassurance that their answers were not vanished into thin air while offline.
   - **Iterative Adaptation**: Designed the explicit 3-State Sync Chip:
     - `Saved on device` (Yellow / amber dot): Immediate feedback that progress is safely stored locally.
     - `Syncing...` (Blue spinner): Active transmission indicator.
     - `Synced` (Green checkmark): Confirmation that the lecturer's cloud gradebook has recorded the score.
   - Added the "Simulate Offline" toggle so testers could verify offline resilience on any live device.

---

## 4. Mapping to the 8-Step Competition Playbook

1. **Step 1: Pick a Problem Worth Solving**: Connectivity barrier in Kenyan digital learning.
2. **Step 2: Know Your User**: Data-constrained students and overburdened lecturers.
3. **Step 3: Define the Core Question**: Does offline caching and background synchronization prevent exam loss?
4. **Step 4: Pick the Right Prototype**: Interactive web app with offline simulation capabilities.
5. **Step 5: Build Lean**: Focus on pre-loaded unit reading, offline quiz grading, and synchronization queue.
6. **Step 6: Test with Real Users**: Observed peer testers navigate offline mode and simulated reconnection.
7. **Step 7: Iterate**: Added instant local explanation feedback so students learn even without internet.
8. **Step 8: Tell the Story**: Problem -> Live Offline Toggle Demo -> Sync Engine Architecture -> Impact on African Education.
