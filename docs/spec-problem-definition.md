# Salama Shule: Learning That Can Wait for the Network Specification & Problem Definition

**Project**: Salama Shule  
**Conception Date**: Wednesday, October 7, 2026  
**Event**: Riara University Inter-University Design Thinking Hackathon 2026  
**Track**: EdTech Innovation and Cybersecurity  
**Author**: David Mark Njogu  

---

## 1. Executive Summary

Digital education platforms across Kenya and Sub-Saharan Africa assume continuous, high-speed broadband connectivity. In reality, university and secondary school students frequently face network dropouts, prohibitive mobile data bundle prices, and intermittent electrical power. When attempting coursework or taking time-sensitive exams on standard Learning Management Systems (LMS), unexpected disconnections result in lost answers, failed submissions, and significant academic anxiety.

Salama Shule ("Safe School") is an offline-first resilient digital learning application built specifically for infrastructure-constrained environments. It pre-caches modular curriculum units directly in the student's browser. Students can read lecture materials, complete interactive quizzes, and receive instant graded feedback entirely without an active internet connection. Student attempts are cryptographically hashed using SHA-256 on the local device, queued in local storage, and automatically synchronized to the institutional Neon PostgreSQL backend through a resilient 3-state sync engine once network connectivity resumes.

---

## 2. Problem Framing & Design Thinking Canvas

### 2.1 The Problem Card
- **Who has the problem?**
  1. **Students in Remote or Low-Connectivity Areas**: Experience network failure mid-quiz, losing work and failing assessments through no fault of their own.
  2. **Cost-Sensitive Learners**: Cannot afford continuous mobile data streaming to stay connected to live LMS portals.
  3. **Lecturers and Course Instructors**: Lack visibility into whether students failed to submit assignments due to non-compliance or infrastructure failure.
- **Where does it happen?**
  Rural homesteads, transit vehicles, student hostels with overloaded Wi-Fi routers, and regions experiencing localized power blackouts.
- **When does it happen?**
  During continuous assessment tests (CATs), end-of-unit revisions, and self-paced homework modules.
- **What is the core pain?**
  Current educational systems are fragile and network-dependent. A single dropped packet can discard 45 minutes of exam answers.
- **Why does it matter?**
  Educational equity requires technology that adapts to real-world infrastructure constraints rather than penalizing students for unstable connectivity.

### 2.2 How Might We (HMW) Questions
1. *How might we enable students to complete full interactive learning modules and quizzes without requiring an active internet connection?*
2. *How might we guarantee that offline quiz submissions cannot be tampered with or submitted multiple times once connectivity returns?*
3. *How might we provide lecturers with complete transparent analytics on student completion, scores, and synchronization status?*

---

## 3. Core System Architecture & Offline Protocol

Salama Shule decouples learning execution from network availability through client-side state containment.

```
+-----------------------------------------------------------------------------------+
|                         SALAMA SHULE OFFLINE-FIRST LIFECYCLE                      |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [ Student Device / Browser ]                                                     |
|             |                                                                     |
|             v                                                                     |
|   1. Pre-load Modular Unit & Question Bank (Cached in deviceStore)                |
|             |                                                                     |
|             v                                                                     |
|   2. Student Reads Lessons & Completes Assessment (100% Offline Capable)          |
|             |                                                                     |
|             v                                                                     |
|   3. Local Grading Engine Evaluates Score & Computes SHA-256 Attempt Checksum     |
|             |                                                                     |
|             v                                                                     |
|   4. Attempt Stored Locally -> State: [ Saved on device ]                         |
|             |                                                                     |
|             v                                                                     |
|   5. Background Sync Engine Detects Online State (useNetwork / window.ononline)   |
|             |                                                                     |
|             v                                                                     |
|   6. Dispatch Queue -> State: [ Syncing... ]                                      |
|             |                                                                     |
|             v                                                                     |
|  [ Neon PostgreSQL Cloud Database ]                                              |
|             |                                                                     |
|             v                                                                     |
|   7. Idempotent Ingestion (De-duplicate via attempt_id & verify Checksum)         |
|             |                                                                     |
|             v                                                                     |
|   8. Acknowledgment Received -> State: [ Synced ]                                 |
|                                                                                   |
|  [ Lecturer Analytics Dashboard ]                                                 |
|   Real-time aggregation of student scores, completion rates, and offline metrics  |
+-----------------------------------------------------------------------------------+
```

### 3.1 Key Technical Invariants
1. **Zero Data Loss Guarantee**: Unsynced quiz attempts persist in IndexedDB / localStorage across browser restarts, page refreshes, and device reboots.
2. **Attempt Integrity via SHA-256**: Each quiz attempt computes a checksum of `student_id + unit_id + answers + timestamp`, preventing post-hoc score manipulation before synchronization.
3. **Idempotent Synchronization**: The sync endpoint enforces unique constraints on `attempt_id`. Repeated sync dispatches caused by flapping network connections never create duplicate records.
4. **Transparent Sync State Machine**: The user interface always displays the explicit synchronization status:
   - `Saved on device` (Yellow): Attempt stored securely on phone/laptop; awaiting network.
   - `Syncing...` (Blue): Transmission in flight.
   - `Synced` (Green): Server acknowledged and permanently stored in cloud database.

---

## 4. Prototype Scope (Hackathon Deliverables)

1. **Student Unit Reader**: Lightweight, responsive lesson browser pre-loaded with modular cybersecurity and computer science units.
2. **Offline Quiz Runner**: Client-side interactive assessment engine featuring instant scoring and explanation generation without API round-trips.
3. **Simulate Offline Mode**: Built-in testing toggle enabling judges, testers, and evaluators to manually sever simulated connectivity and verify end-to-end offline persistence and post-reconnection sync.
4. **Lecturer Analytics Portal**: Protected instructor dashboard showcasing class enrollment, grade distributions, and synchronization status across student cohorts.
