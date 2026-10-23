# Offline Sync Protocol & DeviceStore

This guide details the offline-first persistence and background synchronization engine powering Salama Shule.

---

## 1. Architectural Philosophy: Offline as Primary State

Unlike traditional web applications that treat offline as an error condition (displaying generic "No Internet Connection" error pages), Salama Shule treats offline as the **primary normal operating mode**.

```text
[Course Initialization]
  -> Download compressed unit package (< 120KB)
  -> Store lessons and quizzes in IndexedDB (deviceStore)
  -> Cache static assets via Service Worker cache
```

Once initialized, the student can complete the entire curriculum with zero cellular signal or mobile data.

---

## 2. IndexedDB Outbox Queue Structure

Salama Shule persists un-synced user actions in an IndexedDB object store:

```json
{
  "outbox_id": "out_7f2b1a0e_2026",
  "attempt_id": "att_9f82c410_2026",
  "student_id": "SC-1042-24",
  "student_name": "Amina Wanjiku",
  "unit_code": "CYB-201",
  "answers": [
    { "question_id": "q1", "selected_option": 2 },
    { "question_id": "q2", "selected_option": 0 },
    { "question_id": "q3", "selected_option": 1 }
  ],
  "client_started_at": "2026-10-23T07:15:00Z",
  "client_completed_at": "2026-10-23T07:22:30Z",
  "sync_status": "QUEUED_ON_DEVICE"
}
```

---

## 3. Background Sync & Network State Listener

The application monitors network connectivity via a reactive `useNetwork` hook:
- **`offline`**: The submission is placed in the outbox queue. The user interface renders an informative amber chip: `Saved on device`.
- **`online`**: The background sync dispatcher automatically drains the queue, posting pending attempt payloads to `/api/attempts/sync`.
- Upon successful server response, the status chip transitions to green: `Synced with cloud`.

---

## 4. Mobile Bandwidth Optimization

To accommodate Kenyan students operating on daily micro-bundles (e.g. 50MB for KES 20):
- **Zero Heavy Bundles**: No massive client runtime libraries or bloated web fonts.
- **Pure CSS UI**: Clean responsive styles without heavy image assets.
- **Data Footprint**: Initializing a complete multi-chapter unit consumes **less than 120KB**, or less than 0.3% of a typical daily bundle.
