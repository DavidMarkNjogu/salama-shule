let isOnline = false;
let currentAttempt = {
  attempt_id: "att_9f82c410_2026",
  student_name: "Amina Wanjiku",
  reg_no: "SC/1042/24",
  unit_code: "CYB-201",
  raw_answers: [
    { question_id: "q1", selected_option: 2 },
    { question_id: "q2", selected_option: 0 },
    { question_id: "q3", selected_option: 1 }
  ],
  client_claimed_score: 3,
  client_timestamp: new Date().toISOString()
};

const MASTER_ANSWER_KEY = {
  q1: 2,
  q2: 0,
  q3: 1
};

function updateSimView() {
  const netPill = document.getElementById("netStatusPill");
  const queueView = document.getElementById("queueJsonView");
  const badgeEl = document.getElementById("syncStatusBadge");
  const remarkLogEl = document.getElementById("remarkLog");

  if (!netPill || !queueView || !badgeEl || !remarkLogEl) return;

  netPill.className = isOnline ? "network-pill online" : "network-pill offline";
  netPill.textContent = isOnline ? "Network: Online (Wi-Fi/4G)" : "Network: Offline (Simulated Airplane Mode)";

  queueView.textContent = JSON.stringify(currentAttempt, null, 2);

  if (!isOnline) {
    badgeEl.className = "status-badge queued";
    badgeEl.textContent = "Saved on device (IndexedDB Queue)";
    remarkLogEl.innerHTML = `<strong>Local State:</strong> Attempt persisted in <code>deviceStore</code>.<br>Waiting for network connectivity to dispatch idempotent sync POST.`;
  } else {
    badgeEl.className = "status-badge synced";
    badgeEl.textContent = "Synced with cloud (Server Verified)";
    
    // Compute server re-marking
    let serverScore = 0;
    currentAttempt.raw_answers.forEach(ans => {
      if (MASTER_ANSWER_KEY[ans.question_id] === ans.selected_option) {
        serverScore++;
      }
    });

    remarkLogEl.innerHTML = `<strong>Zero-Trust Ingestion Telemetry:</strong><br>
    - Attempt ID: <code>${currentAttempt.attempt_id}</code><br>
    - Client Claim: ${currentAttempt.client_claimed_score} / 3<br>
    - Server Re-Marked Score: <strong>${serverScore} / 3</strong><br>
    - Action: Score verified by server key and written to Neon Postgres. Zero client tampering possible.`;
  }
}

function toggleNetwork() {
  isOnline = !isOnline;
  updateSimView();
}

function tamperClientScore() {
  // Simulate a student hacking local storage to claim 100% when answers were wrong
  currentAttempt = {
    ...currentAttempt,
    client_claimed_score: 3,
    raw_answers: [
      { question_id: "q1", selected_option: 0 }, // wrong answer
      { question_id: "q2", selected_option: 0 },
      { question_id: "q3", selected_option: 1 }
    ]
  };
  updateSimView();
}

function resetAttempt() {
  isOnline = false;
  currentAttempt = {
    attempt_id: "att_9f82c410_2026",
    student_name: "Amina Wanjiku",
    reg_no: "SC/1042/24",
    unit_code: "CYB-201",
    raw_answers: [
      { question_id: "q1", selected_option: 2 },
      { question_id: "q2", selected_option: 0 },
      { question_id: "q3", selected_option: 1 }
    ],
    client_claimed_score: 3,
    client_timestamp: new Date().toISOString()
  };
  updateSimView();
}

document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("btnToggleNet");
  if (toggleBtn) toggleBtn.addEventListener("click", toggleNetwork);

  const tamperBtn = document.getElementById("btnTamperClient");
  if (tamperBtn) tamperBtn.addEventListener("click", tamperClientScore);

  const resetBtn = document.getElementById("btnResetAttempt");
  if (resetBtn) resetBtn.addEventListener("click", resetAttempt);

  updateSimView();
});
