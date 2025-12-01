// ============================================
// POMODORO TIMER - JAVASCRIPT LOGIC
// ============================================

// Timer state
const timerState = {
  isRunning: false,
  isPaused: false,
  isBreak: false,
  timeRemaining: 25 * 60, // in seconds
  focusDuration: 25 * 60,
  breakDuration: 5 * 60,
  sessionsCompleted: 0,
  totalSeconds: 0,
  startTime: null,
  pausedTime: null,
};

// DOM elements
const timerDisplay = document.getElementById("timerDisplay");
const timerLabel = document.getElementById("timerLabel");
const focusInput = document.getElementById("focusInput");
const breakInput = document.getElementById("breakInput");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const themeToggle = document.getElementById("themeToggle");
const progressRing = document.getElementById("progressRing");
const sessionCount = document.getElementById("sessionCount");
const totalTime = document.getElementById("totalTime");
const notificationSound = document.getElementById("notificationSound");

// SVG progress ring circumference (2 * π * radius)
const SVG_RADIUS = 130;
const SVG_CIRCUMFERENCE = 2 * Math.PI * SVG_RADIUS;

// Initialize on load
document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  setupTheme();
  updateDisplay();
  updateProgressRing();
});

// ============================================
// TIMER LOGIC
// ============================================

/**
 * Format seconds into MM:SS format
 */
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * Start the timer
 */
function startTimer() {
  if (timerState.isRunning) return;

  timerState.isRunning = true;
  timerState.isPaused = false;
  timerState.startTime = Date.now() - (timerState.pausedTime || 0);

  startBtn.disabled = true;
  pauseBtn.disabled = false;
  focusInput.disabled = true;
  breakInput.disabled = true;

  // Main timer loop
  const timerInterval = setInterval(() => {
    if (!timerState.isRunning) {
      clearInterval(timerInterval);
      return;
    }

    // Calculate elapsed time
    const elapsedTime = Date.now() - timerState.startTime;
    const totalSeconds = timerState.isBreak
      ? timerState.breakDuration
      : timerState.focusDuration;

    timerState.timeRemaining = Math.max(
      0,
      totalSeconds - Math.floor(elapsedTime / 1000)
    );

    updateDisplay();
    updateProgressRing();

    // Timer finished
    if (timerState.timeRemaining === 0) {
      clearInterval(timerInterval);
      completeTimer();
    }
  }, 100);
}

/**
 * Pause/resume the timer
 */
function togglePause() {
  if (!timerState.isRunning) return;

  timerState.isRunning = false;
  timerState.isPaused = true;
  timerState.pausedTime = Date.now() - timerState.startTime;

  startBtn.disabled = false;
  pauseBtn.disabled = true;

  startBtn.textContent = "Resume";
}

/**
 * Reset the timer
 */
function resetTimer() {
  timerState.isRunning = false;
  timerState.isPaused = false;
  timerState.startTime = null;
  timerState.pausedTime = null;
  timerState.timeRemaining = timerState.focusDuration;

  startBtn.disabled = false;
  pauseBtn.disabled = true;
  startBtn.textContent = "Start";
  focusInput.disabled = false;
  breakInput.disabled = false;

  updateDisplay();
  updateProgressRing();
}

/**
 * Handle timer completion
 */
function completeTimer() {
  playNotification();
  showBrowserNotification();

  if (!timerState.isBreak) {
    // Completed a focus session
    timerState.sessionsCompleted++;
    timerState.totalSeconds += timerState.focusDuration;
    updateStats();

    // Switch to break
    timerState.isBreak = true;
    timerState.timeRemaining = timerState.breakDuration;
    timerState.pausedTime = null;
  } else {
    // Completed a break session
    timerState.totalSeconds += timerState.breakDuration;

    // Switch back to focus
    timerState.isBreak = false;
    timerState.timeRemaining = timerState.focusDuration;
    timerState.pausedTime = null;
  }

  updateDisplay();
  updateProgressRing();

  // Auto-start next session
  setTimeout(() => {
    startTimer();
  }, 1000);
}

// ============================================
// DISPLAY & UI UPDATES
// ============================================

/**
 * Update the timer display
 */
function updateDisplay() {
  timerDisplay.textContent = formatTime(timerState.timeRemaining);
  timerLabel.textContent = timerState.isBreak ? "Break Time" : "Focus Time";
}

/**
 * Update SVG progress ring
 */
function updateProgressRing() {
  const totalSeconds = timerState.isBreak
    ? timerState.breakDuration
    : timerState.focusDuration;

  const progress =
    (timerState.timeRemaining / totalSeconds) * SVG_CIRCUMFERENCE;
  progressRing.style.strokeDashoffset = progress;
}

/**
 * Update session statistics
 */
function updateStats() {
  sessionCount.textContent = timerState.sessionsCompleted;

  const hours = Math.floor(timerState.totalSeconds / 3600);
  const minutes = Math.floor((timerState.totalSeconds % 3600) / 60);

  if (hours > 0) {
    totalTime.textContent = `${hours}h ${minutes}m`;
  } else {
    totalTime.textContent = `${minutes}m`;
  }
}

// ============================================
// SETTINGS & STORAGE
// ============================================

/**
 * Save settings to localStorage
 */
function saveSettings() {
  const focusMins = Number.parseInt(focusInput.value);
  const breakMins = Number.parseInt(breakInput.value);

  localStorage.setItem("pomodoroFocusDuration", focusMins);
  localStorage.setItem("pomodoroBreakDuration", breakMins);

  timerState.focusDuration = focusMins * 60;
  timerState.breakDuration = breakMins * 60;
  timerState.timeRemaining = timerState.focusDuration;

  updateDisplay();
  updateProgressRing();
}

/**
 * Load settings from localStorage
 */
function loadSettings() {
  const savedFocus = localStorage.getItem("pomodoroFocusDuration") || 25;
  const savedBreak = localStorage.getItem("pomodoroBreakDuration") || 5;
  const savedSessions = localStorage.getItem("pomodoroSessionsCompleted") || 0;
  const savedTotalSeconds = localStorage.getItem("pomodoroTotalSeconds") || 0;

  focusInput.value = savedFocus;
  breakInput.value = savedBreak;

  timerState.focusDuration = Number.parseInt(savedFocus) * 60;
  timerState.breakDuration = Number.parseInt(savedBreak) * 60;
  timerState.timeRemaining = timerState.focusDuration;
  timerState.sessionsCompleted = Number.parseInt(savedSessions);
  timerState.totalSeconds = Number.parseInt(savedTotalSeconds);

  updateStats();
}

/**
 * Save stats to localStorage
 */
function saveStats() {
  localStorage.setItem(
    "pomodoroSessionsCompleted",
    timerState.sessionsCompleted
  );
  localStorage.setItem("pomodoroTotalSeconds", timerState.totalSeconds);
}

// ============================================
// NOTIFICATIONS & SOUNDS
// ============================================

/**
 * Play notification sound
 */
function playNotification() {
  try {
    notificationSound.currentTime = 0;
    notificationSound.play().catch(() => {
      // Fallback: use Web Audio API
      playBeepSound();
    });
  } catch (error) {
    console.warn("Could not play notification sound:", error);
  }
}

/**
 * Generate beep sound using Web Audio API
 */
function playBeepSound() {
  try {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.5
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.warn("Could not create beep sound:", error);
  }
}

/**
 * Show browser notification
 */
function showBrowserNotification() {
  if ("Notification" in window && Notification.permission === "granted") {
    const title = timerState.isBreak
      ? "Break Time Over!"
      : "Focus Time Complete!";
    const message = timerState.isBreak
      ? "Time to get back to work!"
      : "Take a well-deserved break!";

    new Notification(title, {
      body: message,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%236366f1"/><text x="50" y="65" font-size="50" fill="white" text-anchor="middle" font-weight="bold">✓</text></svg>',
    });
  } else if ("Notification" in window && Notification.permission !== "denied") {
    Notification.requestPermission();
  }
}

// ============================================
// THEME TOGGLE
// ============================================

/**
 * Setup theme based on system preference
 */
function setupTheme() {
  const savedTheme = localStorage.getItem("pomodoroTheme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  let isDarkMode = savedTheme ? savedTheme === "dark" : prefersDark;

  applyTheme(isDarkMode);

  // Listen for theme toggle button
  themeToggle.addEventListener("click", () => {
    isDarkMode = !isDarkMode;
    applyTheme(isDarkMode);
    localStorage.setItem("pomodoroTheme", isDarkMode ? "dark" : "light");
  });
}

/**
 * Apply theme to document
 */
function applyTheme(isDarkMode) {
  if (isDarkMode) {
    document.documentElement.classList.add("dark-mode");
    themeToggle.textContent = "☀️";
  } else {
    document.documentElement.classList.remove("dark-mode");
    themeToggle.textContent = "🌙";
  }
}

// ============================================
// EVENT LISTENERS
// ============================================

startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", togglePause);
resetBtn.addEventListener("click", resetTimer);

// Save settings when input changes
focusInput.addEventListener("change", saveSettings);
breakInput.addEventListener("change", saveSettings);

// Save stats periodically
setInterval(saveStats, 10000);

// Save stats before leaving page
window.addEventListener("beforeunload", saveStats);
