# Riara Hackathon Training Session Slides: Visual Archive & Evidence Catalog

**Workshop Source**: Social Entrepreneurship & Innovation Hub (SEIH), Riara University  
**Lead Facilitator**: Stephen Kagwathi  
**Theme**: EdTech Innovation and Cybersecurity (Design Thinking Sprint)  
**Total Images**: 32 (Session 1: 7 room photos | Session 2: 25 presentation captures)  

---

## 1. Digital Enhancement & Clarity Processing

The raw workshop images comprise two distinct cohorts:
1. **Session 1 (Projected Room Photos)**: WhatsApp photos of slides projected in the training hall. Due to projector wash, lighting variance, and mobile lens blur, initial focus variance was low (**18.1 - 87.3**).
2. **Session 2 (Digital Desktop Captures)**: Direct screen captures of the slide deck (**focus variance 237 - 579**).

### Automated Processing Pipeline
To guarantee readability for judges, founders, and reviewers, all images underwent a deterministic Python image enhancement pipeline (`Pillow` and `NumPy`):
- **Contrast & Level Normalization**: `ImageOps.autocontrast(cutoff=0.5)` to remove projector haze and restore solid black typography.
- **Unsharp Masking**: `ImageFilter.UnsharpMask(radius=2.0, percent=180, threshold=2)` to re-establish crisp character boundaries.
- **Micro-Sharpness Enhancement**: `ImageEnhance.Sharpness(1.4)` and `ImageEnhance.Contrast(1.35)`.

**Clarity Metric Result**: Session 1 focus variance improved from **18.1 to 243.6 (+1,242.4% edge sharpness improvement)**.

---

## 2. Directory Structure

```text
docs/training-slides/
├── raw/
│   ├── session-1/ (7 untouched camera captures: IMG-20261022-WA0123.jpg - WA0129.jpg)
│   └── session-2/ (25 untouched digital captures: Screenshot (1444).png - (1468).png)
├── enhanced/
│   ├── session-1/ (7 sharpened, high-contrast images)
│   └── session-2/ (25 optimized digital images)
└── SLIDES_CATALOG.md (This primary evidence index)
```

---

## 3. Session 1: Problem Framing & Empathy ("Don't Solve It Yet")

The foundation of the hackathon: turning vague themes into human-centered, designable problems.

| Slide # | Title / Topic | Raw Asset | Enhanced Asset | Focus Gain |
|---|---|---|---|---|
| **S1-01** | The Design Thinking Mindset | [WA0123.jpg](raw/session-1/IMG-20261022-WA0123.jpg) | [Enhanced](enhanced/session-1/IMG-20261022-WA0123.jpg) | **+1,242%** (18.1 -> 243.6) |
| **S1-02** | Empathize: Look Before You Solve | [WA0124.jpg](raw/session-1/IMG-20261022-WA0124.jpg) | [Enhanced](enhanced/session-1/IMG-20261022-WA0124.jpg) | **+963%** (23.2 -> 246.7) |
| **S1-03** | Observation & Interviewing Rules | [WA0125.jpg](raw/session-1/IMG-20261022-WA0125.jpg) | [Enhanced](enhanced/session-1/IMG-20261022-WA0125.jpg) | **+688%** (57.3 -> 451.9) |
| **S1-04** | Define: Narrowing the Focus | [WA0126.jpg](raw/session-1/IMG-20261022-WA0126.jpg) | [Enhanced](enhanced/session-1/IMG-20261022-WA0126.jpg) | **+653%** (51.4 -> 387.6) |
| **S1-05** | The Problem Card Framework | [WA0127.jpg](raw/session-1/IMG-20261022-WA0127.jpg) | [Enhanced](enhanced/session-1/IMG-20261022-WA0127.jpg) | **+449%** (87.3 -> 479.2) |
| **S1-06** | How Might We (HMW) Questions | [WA0128.jpg](raw/session-1/IMG-20261022-WA0128.jpg) | [Enhanced](enhanced/session-1/IMG-20261022-WA0128.jpg) | **+693%** (59.8 -> 474.3) |
| **S1-07** | Workshop Deliverable Checkpoint | [WA0129.jpg](raw/session-1/IMG-20261022-WA0129.jpg) | [Enhanced](enhanced/session-1/IMG-20261022-WA0129.jpg) | **+741%** (40.7 -> 342.4) |

### Key Session 1 Insights & Application:
- **Core Principle**: *"A topic is not yet a problem you can design for."*
- **Application to ChetiCheck**: Refined the vague topic of "university certificate fraud" into a specific user pain point: *Employers waiting up to 6 weeks for manual registry verifications while forged degrees bypass unverified HR checks.*
- **Application to Salama Shule**: Refined "remote learning difficulties" into an exact technical bottleneck: *Kenyan university students on daily data bundles losing completed quiz progress and receiving zeros when cellular networks drop mid-assessment.*

---

## 4. Session 2: Ideation, Prototyping & Feasibility Filters

The execution phase: converting problem statements into rapid prototypes and filtering for 48-hour feasibility.

| Slide # | Slide Subject | Raw Asset | Enhanced Asset | Project Feature Linked |
|---|---|---|---|---|
| **S2-01** | Workshop Introduction & Review | [1444.png](raw/session-2/Screenshot%20(1444).png) | [Enhanced](enhanced/session-2/Screenshot%20(1444).png) | Empathy baseline |
| **S2-02** | Idea Generation: SCAMPER Model | [1445.png](raw/session-2/Screenshot%20(1445).png) | [Enhanced](enhanced/session-2/Screenshot%20(1445).png) | Feature brainstorming |
| **S2-03** | Brainstorming: Quantity Over Quality | [1446.png](raw/session-2/Screenshot%20(1446).png) | [Enhanced](enhanced/session-2/Screenshot%20(1446).png) | Divergent ideation |
| **S2-04** | Convergence: Idea Selection Grid | [1447.png](raw/session-2/Screenshot%20(1447).png) | [Enhanced](enhanced/session-2/Screenshot%20(1447).png) | Concept downselection |
| **S2-05** | The 48-Hour Feasibility Filter | [1448.png](raw/session-2/Screenshot%20(1448).png) | [Enhanced](enhanced/session-2/Screenshot%20(1448).png) | Zero blockchain choice |
| **S2-06** | User Journey Mapping | [1449.png](raw/session-2/Screenshot%20(1449).png) | [Enhanced](enhanced/session-2/Screenshot%20(1449).png) | Student & Employer flows |
| **S2-07** | Low-Fidelity Prototyping | [1450.png](raw/session-2/Screenshot%20(1450).png) | [Enhanced](enhanced/session-2/Screenshot%20(1450).png) | 1-click helper buttons |
| **S2-08** | Digital Mockups & Storyboarding | [1451.png](raw/session-2/Screenshot%20(1451).png) | [Enhanced](enhanced/session-2/Screenshot%20(1451).png) | Wireframe layouts |
| **S2-09** | User Feedback Loops | [1452.png](raw/session-2/Screenshot%20(1452).png) | [Enhanced](enhanced/session-2/Screenshot%20(1452).png) | Bluetooth mesh pivot |
| **S2-10** | Technical Feasibility Matrix | [1453.png](raw/session-2/Screenshot%20(1453).png) | [Enhanced](enhanced/session-2/Screenshot%20(1453).png) | Asymmetric crypto choice |
| **S2-11** | Kenyan Economic Constraints | [1454.png](raw/session-2/Screenshot%20(1454).png) | [Enhanced](enhanced/session-2/Screenshot%20(1454).png) | KES 250 API monetization |
| **S2-12** | Mobile Accessibility Principles | [1455.png](raw/session-2/Screenshot%20(1455).png) | [Enhanced](enhanced/session-2/Screenshot%20(1455).png) | 390px mobile viewport |
| **S2-13** | Edge Case Analysis | [1456.png](raw/session-2/Screenshot%20(1456).png) | [Enhanced](enhanced/session-2/Screenshot%20(1456).png) | Zero-trust server grading |
| **S2-14** | Pitch Structure Framework | [1457.png](raw/session-2/Screenshot%20(1457).png) | [Enhanced](enhanced/session-2/Screenshot%20(1457).png) | 90-second stage script |
| **S2-15** | Demonstration Flow Design | [1458.png](raw/session-2/Screenshot%20(1458).png) | [Enhanced](enhanced/session-2/Screenshot%20(1458).png) | 60-second judge test |
| **S2-16** | The Trapdoor Defense | [1459.png](raw/session-2/Screenshot%20(1459).png) | [Enhanced](enhanced/session-2/Screenshot%20(1459).png) | 10 judge attack cards |
| **S2-17** | Data Privacy Considerations | [1460.png](raw/session-2/Screenshot%20(1460).png) | [Enhanced](enhanced/session-2/Screenshot%20(1460).png) | KDPA 2019 compliance |
| **S2-18** | Institutional Buy-in Strategies | [1461.png](raw/session-2/Screenshot%20(1461).png) | [Enhanced](enhanced/session-2/Screenshot%20(1461).png) | Departmental pilot |
| **S2-19** | Testing Under Network Latency | [1462.png](raw/session-2/Screenshot%20(1462).png) | [Enhanced](enhanced/session-2/Screenshot%20(1462).png) | Offline IndexedDB queue |
| **S2-20** | Iteration Cycle (Prototype 1 to 2) | [1463.png](raw/session-2/Screenshot%20(1463).png) | [Enhanced](enhanced/session-2/Screenshot%20(1463).png) | PWA vs Bluetooth pivot |
| **S2-21** | Slide Deck Timing Principles | [1464.png](raw/session-2/Screenshot%20(1464).png) | [Enhanced](enhanced/session-2/Screenshot%20(1464).png) | 4-phase rehearsal timer |
| **S2-22** | Q&A Panel Readiness | [1465.png](raw/session-2/Screenshot%20(1465).png) | [Enhanced](enhanced/session-2/Screenshot%20(1465).png) | Flashcard trainer tool |
| **S2-23** | Product Sustainability | [1466.png](raw/session-2/Screenshot%20(1466).png) | [Enhanced](enhanced/session-2/Screenshot%20(1466).png) | Unit economics |
| **S2-24** | Final Judging Criteria Alignment | [1467.png](raw/session-2/Screenshot%20(1467).png) | [Enhanced](enhanced/session-2/Screenshot%20(1467).png) | 4 scoring pillars |
| **S2-25** | Stage Presence & Wrap-up | [1468.png](raw/session-2/Screenshot%20(1468).png) | [Enhanced](enhanced/session-2/Screenshot%20(1468).png) | Closing delivery |

---

## 5. Primary Documents Mapping

This visual archive supports and anchors the full documentation suite:
- **Transcribed Workshop Playbook**: [`docs/riara-training-playbook-raw.md`](../riara-training-playbook-raw.md)
- **Design Thinking Methodology**: [`docs/design-thinking-mapping.md`](../design-thinking-mapping.md)
- **Interactive Pitch Trainer**: [`public/pitch-trainer.html`](../../public/pitch-trainer.html)
- **Judge Attack & Defense Manual**: [`docs/JUDGE_DEFENSE_MANUAL.md`](../JUDGE_DEFENSE_MANUAL.md)
