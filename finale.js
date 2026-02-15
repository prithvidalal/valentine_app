import { DEFAULT_INPUT_MAP, LoveQuestAudio, PlatformerGame } from "./platformer-engine.js";

const TRIVIA_CLEAR_KEY = "loveQuestTriviaCleared";

function getProgressKey() {
  try {
    return window.sessionStorage.getItem(TRIVIA_CLEAR_KEY);
  } catch {
    return null;
  }
}

function setProgressKey() {
  try {
    window.sessionStorage.setItem(TRIVIA_CLEAR_KEY, "true");
  } catch {
    // Ignore storage failures.
  }
}

const params = new URLSearchParams(window.location.search);
const hasUnlockQuery = params.get("unlock") === "1";
const hasProgressKey = getProgressKey() === "true";

if (!hasProgressKey && !hasUnlockQuery) {
  window.location.replace("trivia.html");
} else if (!hasProgressKey && hasUnlockQuery) {
  setProgressKey();
}

const canvas = document.getElementById("game-canvas");
const soundButton = document.getElementById("sound-toggle");
const controlsPanel = document.querySelector(".controls-toggle");
const letterModal = document.getElementById("love-letter-modal");
const letterBody = document.getElementById("love-letter-body");
const replayQuestButton = document.getElementById("replay-quest-button");

const letterText = `Happy Valentine's Day! I've been thinking about how lucky I am to have you in my life, and I couldn't let today pass without telling you how much you mean to me.

You have this incredible way of making everything brighter just by being yourself. Your laugh, your kindness, your little quirks, they all make my world so much better. I love how we can talk for hours or just sit together in silence, and it always feels right.

Every day with you is a reminder of how wonderful love can be. You inspire me, you challenge me, and you make me feel more alive than I ever thought possible.

Thank you for being my person, my comfort, and my joy. I hope this Valentine's Day reminds you how deeply you are loved, not just today, but every day.`;

letterBody.textContent = letterText;

const audio = new LoveQuestAudio();

function refreshSoundButton() {
  soundButton.textContent = audio.isEnabled ? "🎵" : "🔇";
  soundButton.title = audio.isEnabled ? "Sound On" : "Sound Off";
}

soundButton.addEventListener("click", async () => {
  audio.toggle();
  refreshSoundButton();
  if (audio.isEnabled) {
    await audio.unlockFromGesture();
  }
});

refreshSoundButton();

let game;
let letterOpened = false;

function setModalVisibility(modal, visible) {
  modal.classList.toggle("visible", visible);
  modal.setAttribute("aria-hidden", visible ? "false" : "true");
}

function toggleControls() {
  if (!controlsPanel) {
    return;
  }
  const nowHidden = controlsPanel.classList.toggle("is-hidden");
  controlsPanel.setAttribute("aria-hidden", String(nowHidden));
}

function handleControlsToggle(event) {
  if (event.code !== "KeyH") {
    return;
  }
  event.preventDefault();
  toggleControls();
}

const finaleDecor = [
  {
    depth: 0.14,
    plane: "back",
    elements: [
      { type: "cloud", x: -170, y: 72, w: 170, h: 72, speed: 1.8, alpha: 0.82 },
      { type: "cloud", x: 360, y: 62, w: 165, h: 70, speed: 1.8, alpha: 0.82 },
      { type: "cloud", x: 940, y: 80, w: 170, h: 72, speed: 1.8, alpha: 0.82 },
      { type: "cloud", x: 1490, y: 64, w: 166, h: 70, speed: 1.8, alpha: 0.82 },
      { type: "cloud", x: 1990, y: 78, w: 170, h: 72, speed: 1.8, alpha: 0.82 },
    ],
  },
  {
    depth: 0.28,
    plane: "back",
    elements: [
      { type: "heart_hill", x: -200, y: 676, w: 460, h: 140, alpha: 0.58, color: "#e76d97", patternColor: "#cc5079" },
      { type: "heart_hill", x: 220, y: 642, w: 520, h: 164, alpha: 0.58, color: "#df5f8d", patternColor: "#c84a74" },
      { type: "heart_hill", x: 720, y: 682, w: 430, h: 124, alpha: 0.58, color: "#d95382", patternColor: "#c34470" },
      { type: "heart_hill", x: 1100, y: 700, w: 430, h: 108, alpha: 0.58, color: "#cf4978", patternColor: "#b83c65" },
      { type: "heart_hill", x: 1480, y: 660, w: 460, h: 150, alpha: 0.58, color: "#ca3f6f", patternColor: "#b2325e" },
    ],
  },
  {
    depth: 0.08,
    plane: "back",
    elements: [
      { type: "sparkles", x: 240, y: 180, w: 20, h: 20, alpha: 0.42, speed: 1.2 },
      { type: "sparkles", x: 760, y: 160, w: 20, h: 20, alpha: 0.42, speed: 1.3 },
      { type: "sparkles", x: 1280, y: 182, w: 20, h: 20, alpha: 0.42, speed: 1.2 },
      { type: "sparkles", x: 1740, y: 150, w: 20, h: 20, alpha: 0.42, speed: 1.3 },
    ],
  },
];

game = new PlatformerGame({
  canvas,
  inputMap: DEFAULT_INPUT_MAP,
  audioManager: audio,
  themePreset: "intro",
  skylineY: 700,
  fxQuality: "balanced",
  hud: {
    autoHide: false,
    hideDelayMs: 6000,
    revealOnInput: false,
  },
  camera: {
    deadZoneX: 145,
    focusYOffset: 0,
  },
  worldWidth: 2100,
  worldHeight: 934,
  groundHeight: 86,
  spawn: { x: 120, y: 748 },
  decorLayers: finaleDecor,
  platforms: [
    { x: 330, y: 758, width: 240, height: 30 },
    { x: 760, y: 682, width: 240, height: 30 },
    { x: 1210, y: 606, width: 240, height: 30 },
    { x: 1660, y: 520, width: 250, height: 30 },
  ],
  triggers: [
    {
      id: "final-love-letter",
      type: "start",
      x: 1750,
      y: 442,
      width: 72,
      height: 58,
      caption: "Open",
      proximityRadius: 0,
      spotlight: true,
      renderStyle: "love_letter",
    },
  ],
  labels: [],
  onTriggerTouch(trigger, api) {
    if (trigger.id !== "final-love-letter" || letterOpened) {
      return;
    }

    letterOpened = true;
    trigger.active = false;
    trigger.visible = false;
    trigger.caption = "";
    api.setPaused(true);
    setModalVisibility(letterModal, true);
  },
});

window.addEventListener("keydown", handleControlsToggle);

replayQuestButton.addEventListener("click", () => {
  try {
    window.sessionStorage.removeItem(TRIVIA_CLEAR_KEY);
  } catch {
    // Ignore storage failures.
  }
  window.location.href = "index.html";
});

game.start();

window.addEventListener("beforeunload", () => {
  window.removeEventListener("keydown", handleControlsToggle);
  game.destroy();
});
