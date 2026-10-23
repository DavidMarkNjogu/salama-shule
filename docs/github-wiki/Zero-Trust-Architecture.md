# Zero-Trust Assessment Architecture

This guide explains how Salama Shule prevents client-side cheating and ensures tamper-proof grade reporting during offline quiz execution.

---

## 1. The Offline Assessment Security Challenge

In an offline-first learning system, code runs client-side in the student's browser without continuous server surveillance. 

A common question from evaluators is:  
*"If the quiz runs in local JavaScript, what stops an engineering student from opening browser DevTools, inspecting localStorage/IndexedDB, and modifying their score from 40% to 100%?"*

Salama Shule eliminates this vulnerability through **Zero-Trust Client Telemetry**.

---

## 2. The Mental Model: Why the Bank Teller Counts Cash

When a customer deposits cash at a bank, they can write "KES 50,000" on the paper deposit slip. The bank does not credit their balance based on their handwriting; the teller feeds the physical banknotes into a counting machine.

In Salama Shule:
- The score shown on the student's smartphone while offline is strictly an **unverified estimate** for immediate instructional feedback.
- When network connectivity returns, the student's device **does not transmit the final score**. It transmits only the raw answer array (e.g. `[1, 0, 2]`) and the attempt UUID.
- The server independently evaluates each answer against confidential database answer keys, recalculating the true score before persisting the record into the lecturer gradebook.

```text
[Student Phone (Offline)] 
  -> Evaluates local score (estimate for student morale)
  -> Persists raw answer indices to deviceStore outbox
           ↓ (Network connection restored)
[POST /api/attempts/sync]
  -> Dispatches raw answers + attempt UUID (Client score discarded!)
           ↓
[Server Zero-Trust Ingestion]
  -> Loads answer key from secure Postgres database
  -> Re-marks each question independently
  -> Logs re-marked grade to Lecturer Gradebook
```

---

## 3. Replay Attack & Duplicate Protection

Flaky cellular connections frequently cause HTTP clients to retry requests multiple times:
1. **UUIDv4 Attempt Identifiers**: Each quiz attempt generates a globally unique identifier at the moment of initialization.
2. **Idempotent Upsert**: Our backend uses database-level constraints on `attempt_id`. If an unstable connection retries the sync payload three times, Postgres treats it as an idempotent operation, returning HTTP 200 without creating duplicate records or altering timestamp history.
3. **Cryptographic Checksum**: Each attempt payload computes a SHA-256 digest of `(attempt_id + student_id + unit_code + answers)` to verify packet integrity in transit.
