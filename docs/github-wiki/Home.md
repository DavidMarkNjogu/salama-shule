# Salama Shule Architectural Wiki

Welcome to the **Salama Shule** Knowledge Base on GitHub.

Salama Shule is an offline-first continuous learning and digital assessment platform engineered for Kenyan students experiencing erratic 2G/EDGE connectivity, high data bundle costs, and power instability.

---

### Quick Navigation
- [[The Incumbent LMS Myth|Incumbent-LMS-Myth]]
- [[Zero-Trust Assessment Architecture|Zero-Trust-Architecture]]
- [[Offline Sync Protocol|Offline-Sync-Protocol]]

---

### The Reality in Kenyan Education
In Kenya, over 70% of students rely on daily cellular micro-bundles (e.g. 50MB for KES 20) and intermittent electricity. When universities deploy Western Learning Management Systems like Moodle or Canvas:
- Student attempts abort when signals drop.
- High data footprints exhaust student airtime within minutes.
- Uninstalled due to heavy storage requirements on budget 16GB/32GB Android devices.

### How Salama Shule Solves It
1. **Lightweight PWA (< 120KB)**: Zero app store downloads; launches directly from a lecturer WhatsApp link.
2. **100% Offline Assessment**: Quizzes execute locally in IndexedDB (`deviceStore`) with zero network connection.
3. **Zero-Trust Server Marking**: When connectivity returns, the background worker sends raw answers to the backend. The server re-marks submissions independently against answer keys, preventing client-side score manipulation.
4. **Idempotent Background Sync**: UUIDv4 attempt records guarantee zero duplicate entries during flaky network re-transmissions.
