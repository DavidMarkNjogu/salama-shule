# Hackathon Knowledge Base & Visual Wiki

**Target Audience**: Non-technical team members, presenters, student founders, and hackathon judges.  
**Purpose**: An accessible, visual guide to the technical, legal, and operational reality behind **ChetiCheck** and **Salama Shule**.  
**Live Interactive Web Version**: [https://cheticheck.vercel.app/wiki.html](https://cheticheck.vercel.app/wiki.html)

---

## Executive Navigation & Quick Links

```text
├── 1. The Government Monopoly Myth (KNEC vs ChetiCheck)
├── 2. Centralized Database Honeypots vs Asymmetric Cryptography
├── 3. The Incumbent LMS Myth (Moodle/Canvas vs Salama Shule)
├── 4. Zero-Trust Client Scoring (Why the Bank Teller Counts Cash)
├── 5. Kenyan Institutional Realities (PPADA 2015 & University Procurement)
└── 6. Legal Compliance (KDPA 2019 & Cryptographic Shredding)
```

---

## 1. The Government Monopoly Myth (KNEC vs ChetiCheck)

A common assumption during hackathon evaluations is: *"The Kenyan Government already has a portal (KNEC) and a central database, so why do we need ChetiCheck?"*

This assumption confuses two completely separate regulatory bodies in Kenya:

```mermaid
flowchart TD
    subgraph K12["KNEC Jurisdiction (K-12 Education)"]
        K1["Primary Schools (KCPE)"]
        K2["Secondary Schools (KCSE)"]
        K3["Basic National TVET Certificates"]
        K1 & K2 & K3 --> KP["KNEC QMIS Portal<br/>(qmis.knec.ac.ke)"]
        KP --> KR["- 10 to 14 Working Days<br/>- KES 2,300 per letter<br/>- Physical Courier Dispatch"]
    end

    subgraph HigherEd["University Jurisdiction (Autonomous Charters & CUE)"]
        U1["Riara University"]
        U2["Strathmore University"]
        U3["University of Nairobi"]
        U4["40+ Chartered Public & Private Universities"]
        U1 & U2 & U3 & U4 --> CC["ChetiCheck Platform<br/>(cheticheck.vercel.app)"]
        CC --> CR["- Under 200 Milliseconds<br/>- Zero Cost to Student<br/>- Instant Smartphone QR Scan"]
    end

    style K12 fill:#1e293b,stroke:#ef4444,stroke-width:2px,color:#f8fafc
    style HigherEd fill:#0f172a,stroke:#10b981,stroke-width:2px,color:#f8fafc
    style KP fill:#374151,stroke:#f59e0b,stroke-width:1px,color:#ffffff
    style CC fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#ffffff
```

### The Legal Reality:
- **KNEC has zero jurisdiction, zero database records, and zero mandate over university degrees or postgraduate diplomas.**
- University degrees in Kenya are legally autonomous under individual University Charters and regulated exclusively by the **Commission for University Education (CUE)**.
- If an employer approaches KNEC to verify a Bachelor of Science from Riara University, KNEC will turn them away.
- ChetiCheck solves the massive higher-education credential fraud market that KNEC does not touch.

### Comparison Table: KNEC QMIS vs ChetiCheck

| Feature | KNEC QMIS Portal (`qmis.knec.ac.ke`) | ChetiCheck Platform |
|---|---|---|
| **Target Sector** | Primary & Secondary (KCPE / KCSE) | **Higher Education Degrees, Diplomas, & Short Courses** |
| **Verification Speed** | **10 to 14 working days** (approx. 2 weeks) | **Under 200 milliseconds** (instant) |
| **Cost to Verify** | **KES 2,280 – KES 2,320** per letter | **Free for graduate**, KES 250 for corporate API pull |
| **Verification Method** | Manual staff search in physical/digital archives | Instant mathematical check against public key |
| **Delivery Mechanism** | Physical paper letter or courier dispatch | Real-time digital stamp on any smartphone camera |
| **Tamper Resistance** | Paper letter can still be scanned and altered in Photoshop | Cryptographic Ed25519 signature breaks if 1 byte changes |

---

## 2. Centralized Database Honeypots vs Asymmetric Cryptography

Why does ChetiCheck use **asymmetric Ed25519 digital signatures** instead of just hosting a normal database like traditional university systems?

```mermaid
sequenceDiagram
    autonumber
    actor Attacker as Rogue Staff / Hacker
    participant DB as Centralized SQL Database
    participant Verifier as Corporate Recruiter (Employer)
    
    Note over Attacker,DB: Traditional Centralized System (Vulnerable)
    Attacker->>DB: UPDATE students SET degree = 'First Class Honors' WHERE id = 1042;
    Verifier->>DB: Is Student 1042 Authentic?
    DB-->>Verifier: Status: AUTHENTIC (False Positive: DB reports forged data as valid)
    
    Note over Attacker,DB: ChetiCheck Cryptographic Model (Tamper Proof)
    Attacker->>DB: UPDATE credentials SET graduationYear = 2025 WHERE id = 'CC-1042';
    Verifier->>DB: Scan QR / Upload Certificate File
    Note over Verifier: Recomputes SHA-256 Digest & Checks University Signature
    Verifier-->>Verifier: Mathematical Signature Verification Fails!
    Verifier-->>Verifier: Status: ALTERED (Instant Red Warning)
```

### The Plain-English Mental Model:
- **The Centralized Database Approach**: Trust is placed in whoever currently controls the server. If a rogue database administrator takes a bribe or an SQL injection vulnerability occurs, the database happily tells employers that a forged degree is valid.
- **The ChetiCheck Cryptographic Approach**: Trust is placed in mathematical law. When the degree is issued, the university registrar seals it with the university's private signing key. Even if a hacker alters the database or photoshops a PDF, the mathematical signature does not match the altered data. The verification screen immediately flashes **Altered**.

---

## 3. The Incumbent LMS Myth (Moodle/Canvas vs Salama Shule)

Judges often ask: *"Riara and other universities already run Moodle or Canvas. Both have mobile apps. Why does Salama Shule exist?"*

```mermaid
flowchart LR
    subgraph Heavy["Moodle Mobile (The 40-Ton Lorry)"]
        M1["65 Megabytes App Store Download"]
        M2["Requires High RAM & Storage"]
        M3["Often Uninstalled by Students to Save Space"]
        M4["Complex Navigation & Heavy Server Sync"]
    end

    subgraph Agile["Salama Shule (The Nimble Boda-Boda)"]
        S1["135 Kilobytes Progressive Web App (Zero Install)"]
        S2["Runs inside WhatsApp Link on 1GB RAM Phones"]
        S3["Uses 98% Less Cellular Data to Initialize"]
        S4["Automatic Background Sync with Zero-Trust Grading"]
    end

    style Heavy fill:#1e293b,stroke:#ef4444,stroke-width:2px,color:#f8fafc
    style Agile fill:#0f172a,stroke:#10b981,stroke-width:2px,color:#f8fafc
```

### The Field Reality:
- In Kenya, entry-level smartphones (Tecno, Infinix, itel) typically have 16GB or 32GB of total storage, running Android Go.
- Students actively uninstall heavy 50MB+ applications because storage runs out.
- Salama Shule requires **zero installation from Google Play**. It launches directly from a lecturer's WhatsApp link, caches the lesson unit in IndexedDB under 135kB, and operates completely offline.

---

## 4. Zero-Trust Client Scoring: Why the Bank Teller Counts Cash

When a student finishes a quiz offline, why doesn't the backend just accept the score calculated on their phone?

```mermaid
flowchart TD
    Student["Student (Phone Offline)"] --> LocalScore["Phone Evaluates Score: 3/3 (Claim)"]
    LocalScore --> Queue["IndexedDB Queue with SHA-256 Digest"]
    
    Queue --> Reconnect{"Network Reconnected?"}
    Reconnect -->|"Yes"| Transmit["Background POST /attempts/sync<br/>(Raw Answers [1, 0, 2] + Claim 3/3)"]
    
    Transmit --> Server["Cloud Server Inspection"]
    Server --> ReMark["Server Independently Evaluates Answers Against Master Keys"]
    
    ReMark --> Match{"Server Score == Phone Claim?"}
    Match -->|"Yes"| Confirmed["Marked as Synced<br/>(Score: 3/3)"]
    Match -->|"No (Tampered)"| Flagged["Server Overrides with True Score<br/>Flag: 'Re-marked by server'"]
```

### The Plain-English Mental Model:
When you go to an ATM or a bank teller, you can write "KES 50,000" on the deposit slip. The bank does not credit your account based on your handwriting; the teller feeds the physical banknotes into a counting machine. In Salama Shule:
- The score shown on the student's phone is strictly an **unverified claim** to encourage the student offline.
- Upon reconnection, the server independently counts the raw answers against the master answer key. If a student altered their browser storage to claim 100%, the server re-marks the quiz to their true score and flags the discrepancy on the Lecturer Dashboard.

---

## 5. Kenyan Institutional Realities (PPADA 2015 & Procurement)

### The 18-Month Procurement Obstacle:
Kenyan chartered private and public universities are bound by strict procurement protocols (under the Public Procurement and Asset Disposal Act - PPADA 2015). Selling an enterprise-wide LMS or credential system takes 12 to 18 months of tender notices, ICT committee vetting, Senate approvals, and budget allocations.

### ChetiCheck & Salama Shule Strategy: The Departmental Pilot
- **We do not sell enterprise infrastructure overhauls.**
- **Zero Cost to Faculty**: Lecturers and registrars adopt the platforms as a departmental teaching and continuous-assessment utility at zero setup cost.
- **Downstream Monetization**:
  - For ChetiCheck: Corporate recruiting agencies (BrighterMonday, Shortlist, corporate banks) pay **KES 250 per instant API query** to replace weeks of manual registry clearance calls.
  - For Salama Shule: Departmental continuous assessment modules operate friction-free without requiring university Senate tender approval.

---

## 6. Legal Compliance (KDPA 2019 & Cryptographic Shredding)

Under Section 35 of the **Kenya Data Protection Act 2019 (KDPA)**, individuals have a statutory **Right to Erasure** ("Right to be Forgotten"). How can ChetiCheck comply if cryptographic records are tamper-proof?

```mermaid
flowchart LR
    Record["Student Academic Record<br/>(Name, ID, Degree, Year)"] --> Encrypt["Encrypted with Student's Ephemeral Key"]
    Encrypt --> Digest["Public Cryptographic Hash on Ledger"]
    
    StudentReq["Student Requests Erasure (KDPA Sec 35)"] --> Shred["Purge Ephemeral Decryption Key"]
    Shred --> Anonymous["Stored Data Becomes Unrecoverable Noise<br/>(Public Hash Remains Intact, Identity Erased)"]
```

### The Plain-English Mental Model:
Imagine a lockbox where a graduate's name is inside, but only the graduate holds the key. If the graduate asks to be forgotten, you destroy the key. The lockbox is now permanently unreadable junk numbers, effectively erasing the identity forever without destroying the structural validity of the university registry. This is known as **Cryptographic Shredding**, fully compliant with Office of the Data Protection Commissioner (ODPC) guidelines.
