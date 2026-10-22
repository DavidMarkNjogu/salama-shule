# Salama Shule: Hackathon Pitch Script & Judge Walkthrough

**Project:** Salama Shule (Offline-First Resilient Learning)  
**Track:** EdTech Innovation and Cybersecurity  
**Event:** Riara University Inter-University Design Thinking Hackathon 2026  
**Live URL:** [https://salama-shule.vercel.app](https://salama-shule.vercel.app)

---

## 1. The 90-Second Stage Demo Script
1. **The Context (15 seconds)**:
   "Kenyan students on daily data bundles face frequent disconnections during online tests. On ordinary learning platforms, a single network drop discards their answers and awards a zero."
2. **The Offline Experience (35 seconds)**:
   "On `salama-shule.vercel.app`, student Amina Wanjiku joins class `SAFE-2026` with 1 click. The lesson module is cached locally in her browser. We toggle 'Demo: simulate offline'. Amina reads her lesson and completes the cybersecurity quiz without active internet. The score is evaluated locally with zero latency."
3. **The Cryptographic Sync (25 seconds)**:
   "Her attempt is cryptographically fingerprinted with a SHA-256 checksum and stored in local queue. When internet connectivity returns, we toggle back to Online. The 3-state sync engine automatically transmits the submission in the background."
4. **The Lecturer Audit (15 seconds)**:
   "On the Lecturer Dashboard (`lecturer@salama.ac.ke`), the attempt arrives instantly. The server independently re-marks her quiz to prevent client score tampering and confirms receipt idempotently."

---

## 2. 60-Second Hands-On Walkthrough for Judges
1. Open [https://salama-shule.vercel.app](https://salama-shule.vercel.app).
2. Click **Fill demo details (SAFE-2026)** -> Click **Start learning**.
3. In the top navigation bar, toggle **Demo: simulate offline** to red.
4. Click **Practice quiz: staying safe online** and complete the quiz.
5. Notice the score appears immediately without network requests.
6. Toggle back to **Online** -> Watch the sync chip pulse from *Saved on device* to *Synced*.
7. Click **Lecturer view** in top bar, click **Use demo credentials**, and log in to inspect the synced submissions.

---

## 3. Architecture & Security Highlights
- **Zero-Trust Client Scoring**: The server independently re-marks quizzes; client scores are claims, not truth.
- **Data Integrity**: SHA-256 payload checksums prevent transit tampering.
- **Idempotent Sync Engine**: Duplicate submissions under network jitter resolve safely via primary-key constraints.
- **Light on Data**: Full application payload is under 135 kB gzipped, optimized for 390px mobile screens.
