# Salama Shule: Non-Technical User & Testing Manual

Welcome to Salama Shule! This guide is written for non-technical team members, hackathon judges, peer testers, and evaluators. You do **not** need any programming knowledge or technical tools to test, explore, and contribute to this project.

---

## 1. What is Salama Shule? (In Plain English)

Salama Shule ("Safe School") is an educational learning web app designed for students across Kenya who experience frequent internet dropouts, slow mobile networks, or expensive cellular data.

Unlike standard e-learning platforms (like Moodle) that freeze or erase your answers when the internet drops, Salama Shule works completely offline. You can read lesson units, answer continuous assessment test (CAT) quizzes, and receive your grades immediately, even with airplane mode turned on.

Once your phone or computer reconnects to the internet, Salama Shule automatically uploads your score to the teacher's gradebook in the background without requiring you to do anything.

---

## 2. Quick 5-Minute Testing Walkthrough

Follow these steps on your mobile phone, tablet, or laptop browser to test the full offline-first experience:

### Step 1: Open the Application
- **Live Web App**: [https://salama-shule.vercel.app](https://salama-shule.vercel.app)
- You will see the student welcome screen asking you to enter your name and class code.

### Step 2: Join a Class
- Enter your **Student Name** (e.g., *Amina Wanjiku*).
- In the **Class Code** box, enter the official demo code: `SAFE-2026`
- Click **"Enter Class"**.
- You will be taken to the unit dashboard for *Introduction to Web Security & Cyber Hygiene*.

### Step 3: Read an Offline Lesson
- Click on **"Lesson 1: Understanding Phishing and Passwords"**.
- Read through the lesson notes and tips.
- Notice how smoothly the pages load: all the curriculum content is saved directly on your device, meaning it does not rely on an external server for every page tap.

### Step 4: Take the Quiz in Simulated Offline Mode (The Core Feature!)
- Look at the top bar of the application: locate the switch labeled **"Simulate Offline"**.
- Toggle **"Simulate Offline" to ON** (or simply turn off your Wi-Fi / turn on Airplane Mode).
- Notice the clear status banner: **"Offline Mode Active (Working locally)"**.
- Click the button to **"Start Unit Quiz"**.
- Answer the multiple-choice questions.
- Click **"Submit Quiz"**.
- Observe what happens immediately:
  1. Your score and answer explanations appear **instantly** without waiting for network loading.
  2. Notice the yellow badge at the top: **"Saved on device"**.
  3. This confirms your score is safely stored in your browser memory and will never be lost, even if your phone reboots.

### Step 5: Reconnect and Watch Background Sync
- Toggle **"Simulate Offline" to OFF** (or turn your Wi-Fi back on).
- Watch the sync chip in the top right corner:
  1. It briefly shows a blue indicator: **"Syncing..."**.
  2. Within 2 seconds, it switches to a bright green badge: **"Synced"**.
- Your completed quiz has now been permanently transmitted to the university's cloud database!

### Step 6: Verify in the Lecturer Dashboard
- In the navigation bar or footer, click on **"Lecturer Portal"**.
- Use the demo lecturer credentials:
  - **Email**: `lecturer@salama.ac.ke`
  - **Password**: `lecturer123`
- Inside the dashboard, look at the student attempt table:
  - You will see your student name (*Amina Wanjiku*), the score you achieved, the exact submission time, and the status marked as **Synced**.

---

## 3. Expected Outcomes vs What to Watch Out For

| Step | Expected Outcome | Issue / Bug (Report This!) |
| :--- | :--- | :--- |
| **Join Class** | Accepts code `SAFE-2026` and opens the unit syllabus. | Says invalid code or gives an unhandled error message. |
| **Lesson Reader** | Clear text, easy-to-read typography, Next Lesson button works. | Text cut off on smaller phone screens or navigation buttons disabled. |
| **Offline Quiz** | Can submit quiz while offline; shows instant score and explanations. | Quiz hangs on "Submitting...", gives a network error, or loses answers. |
| **Sync Badge** | Transitions from "Saved on device" (Yellow) to "Synced" (Green) upon reconnection. | Stays stuck on "Syncing..." forever or remains yellow after reconnection. |
| **Lecturer Portal** | Displays student name and score in the live grade table. | Login fails or table is empty after a successful sync. |

---

## 4. How You Can Contribute (Without Writing Code)

You do not need to be a software engineer to make Salama Shule better. Non-technical contributions are essential:

### A. Testing on Low-End Mobile Phones
- Test the application on entry-level Android devices and slower networks (2G/3G or throttled Wi-Fi).
- Verify whether the buttons are responsive and whether the text is comfortable to read in direct sunlight.

### B. Creating Curriculum Lessons & Quiz Questions
- Write lessons for additional subjects (e.g., Mathematics, Kiswahili, Financial Literacy, Biology).
- Draft realistic multiple-choice questions with practical explanations for each answer.

### C. Student Usability Interviews
- Show Salama Shule to student peers and ask:
  - *"Was it obvious that your work was safe while offline?"*
  - *"Did you understand what the 'Saved on device' badge meant?"*
- Share their honest feedback with the development team.

---

## 5. How to Report a Bug or Share Feedback

If you run into an issue or confusing interface, copy this template and send it to our team channel:

```markdown
### What I was doing:
(e.g., I toggled Simulate Offline and pressed Submit on Question 3)

### What happened:
(e.g., The screen stayed on the question and did not show the score)

### What I expected:
(e.g., It should show my score and display 'Saved on device')

### Device & Browser:
(e.g., Tecno Spark 10, Chrome for Android)

### Screenshot (if available):
[Attach screenshot or photo of screen]
```
