let timerInterval = null;
let totalSeconds = 90;
let remainingSeconds = 90;

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateDisplay() {
  const display = document.getElementById('timerDisplay');
  if (display) {
    display.textContent = formatTime(remainingSeconds);
  }
  highlightCurrentStep();
}

function startTimer() {
  if (timerInterval) return;
  const startBtn = document.getElementById('startTimerBtn');
  if (startBtn) startBtn.textContent = 'Pause Rehearsal';

  timerInterval = setInterval(() => {
    if (remainingSeconds > 0) {
      remainingSeconds--;
      updateDisplay();
    } else {
      stopTimer();
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  const startBtn = document.getElementById('startTimerBtn');
  if (startBtn) startBtn.textContent = 'Resume Rehearsal';
}

function toggleTimer() {
  if (timerInterval) {
    stopTimer();
  } else {
    startTimer();
  }
}

function resetTimer(seconds) {
  stopTimer();
  totalSeconds = seconds;
  remainingSeconds = seconds;
  const startBtn = document.getElementById('startTimerBtn');
  if (startBtn) startBtn.textContent = 'Start Rehearsal';
  updateDisplay();
}

function highlightCurrentStep() {
  const elapsed = totalSeconds - remainingSeconds;
  const steps = document.querySelectorAll('.pitch-step');
  steps.forEach((step) => {
    const min = parseInt(step.getAttribute('data-min') || '0', 10);
    const max = parseInt(step.getAttribute('data-max') || '999', 10);
    if (elapsed >= min && elapsed <= max) {
      step.classList.add('current');
    } else {
      step.classList.remove('current');
    }
  });
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });
  document.querySelectorAll('.section').forEach(sec => {
    sec.classList.toggle('active', sec.id === tabId);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      if (tabId) switchTab(tabId);
    });
  });

  const startBtn = document.getElementById('startTimerBtn');
  if (startBtn) startBtn.addEventListener('click', toggleTimer);

  const reset90Btn = document.getElementById('reset90Btn');
  if (reset90Btn) reset90Btn.addEventListener('click', () => resetTimer(90));

  const mode3mBtn = document.getElementById('mode3mBtn');
  if (mode3mBtn) mode3mBtn.addEventListener('click', () => resetTimer(180));

  updateDisplay();
});
