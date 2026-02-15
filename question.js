import { DEFAULT_INPUT_MAP, LoveQuestAudio, PlatformerGame } from "./platformer-engine.js";

const canvas = document.getElementById("game-canvas");
const soundButton = document.getElementById("sound-toggle");
const controlsPanel = document.querySelector(".controls-toggle");

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

let noEvadeCount = 0;
const noPositions = [
  { x: 980, y: 586 },
  { x: 1360, y: 512 },
  { x: 1680, y: 748 },
];

function evadeNo(trigger, api) {
  if (trigger.active === false) {
    return;
  }

  if (noEvadeCount < noPositions.length) {
    const next = noPositions[noEvadeCount];
    trigger.x = next.x;
    trigger.y = next.y;
    noEvadeCount += 1;
    api.setMessage("Nope 💌", 700);

    if (noEvadeCount === noPositions.length) {
      const yes = api.getTrigger("yes-box");
      trigger.x = yes.x + yes.width + 24;
      trigger.y = yes.y - 4;
      trigger.caption = "";
      trigger.active = false;
      api.setMessage("No ran out of tricks. Touch Yes!", 1300);
    }
  }
}

const questionDecor = [
  {
    depth: 0.16,
    plane: "back",
    elements: [
      { type: "cloud", x: -40, y: 34, w: 128, h: 56, speed: 0.9, alpha: 0.94 },
      { type: "cloud", x: 392, y: 70, w: 130, h: 58, speed: 0.9, alpha: 0.95 },
      { type: "cloud", x: 552, y: 20, w: 140, h: 60, speed: 1.0, alpha: 0.95 },
      { type: "cloud", x: 954, y: -14, w: 140, h: 60, speed: 0.9, alpha: 0.94 },
      { type: "cloud", x: 1358, y: 44, w: 128, h: 56, speed: 1.0, alpha: 0.95 },
      { type: "cloud", x: 1710, y: 66, w: 124, h: 54, speed: 0.95, alpha: 0.95 },
    ],
  },
  {
    depth: 0.3,
    plane: "back",
    elements: [
      { type: "heart_hill", x: -110, y: 668, w: 340, h: 120, alpha: 0.64, color: "#da5f81", patternColor: "#c64c75" },
      { type: "heart_hill", x: 220, y: 636, w: 560, h: 158, alpha: 0.62, color: "#d96f8f", patternColor: "#c95c83" },
      { type: "heart_hill", x: 760, y: 694, w: 420, h: 112, alpha: 0.58, color: "#d36287", patternColor: "#c3567f" },
      { type: "heart_hill", x: 1170, y: 684, w: 420, h: 122, alpha: 0.58, color: "#d75a82", patternColor: "#c74d77" },
      { type: "heart_hill", x: 1380, y: 650, w: 320, h: 134, alpha: 0.58, color: "#da4f77", patternColor: "#cb416d" },
      { type: "heart_hill", x: 1630, y: 690, w: 360, h: 116, alpha: 0.58, color: "#d05078", patternColor: "#c1436d" },
    ],
  },
  {
    depth: 0.44,
    plane: "back",
    elements: [
      { type: "heart_hill", x: 20, y: 690, w: 400, h: 120, alpha: 0.72, color: "#cb466f", patternColor: "#b63a61" },
      { type: "heart_hill", x: 370, y: 710, w: 390, h: 96, alpha: 0.74, color: "#c44169", patternColor: "#ad355a" },
      { type: "heart_hill", x: 742, y: 700, w: 400, h: 106, alpha: 0.74, color: "#c8426a", patternColor: "#b2365d" },
      { type: "heart_hill", x: 1100, y: 710, w: 370, h: 98, alpha: 0.74, color: "#c53c64", patternColor: "#af3158" },
      { type: "heart_hill", x: 1400, y: 690, w: 380, h: 116, alpha: 0.74, color: "#c63b63", patternColor: "#ad2e54" },
    ],
  },
  {
    depth: 0.08,
    plane: "back",
    elements: [
      { type: "sparkles", x: 260, y: 188, w: 20, h: 20, alpha: 0.34, speed: 1.2 },
      { type: "sparkles", x: 720, y: 162, w: 20, h: 20, alpha: 0.34, speed: 1.3 },
      { type: "sparkles", x: 1180, y: 182, w: 20, h: 20, alpha: 0.34, speed: 1.2 },
      { type: "sparkles", x: 1660, y: 152, w: 20, h: 20, alpha: 0.34, speed: 1.3 },
    ],
  },
  {
    depth: 1.03,
    plane: "front",
    elements: [
      { type: "hearts", x: 0, y: 842, w: 1900, h: 20, alpha: 0.2, speed: 0.05, color: "#d44f78" },
    ],
  },
];

const game = new PlatformerGame({
  canvas,
  inputMap: DEFAULT_INPUT_MAP,
  audioManager: audio,
  themePreset: "intro",
  skylineY: 706,
  fxQuality: "balanced",
  hud: {
    autoHide: false,
    hideDelayMs: 6000,
    revealOnInput: false,
  },
  camera: {
    deadZoneX: 150,
    focusYOffset: 0,
  },
  worldWidth: 1900,
  worldHeight: 934,
  groundHeight: 86,
  spawn: { x: 96, y: 748 },
  decorLayers: questionDecor,
  platforms: [
    { x: 220, y: 762, width: 220, height: 30 },
    { x: 560, y: 706, width: 240, height: 30 },
    { x: 930, y: 642, width: 230, height: 30 },
    { x: 1310, y: 568, width: 220, height: 30 },
  ],
  triggers: [
    {
      id: "no-box",
      type: "no",
      x: 610,
      y: 650,
      width: 84,
      height: 56,
      label: "No",
      caption: "Can't touch this!",
      proximityRadius: 140,
      proximityCooldown: 420,
      renderStyle: "envelope",
      envelopeTone: "no",
    },
    {
      id: "yes-box",
      type: "yes",
      x: 280,
      y: 706,
      width: 84,
      height: 56,
      label: "Yes",
      caption: "Touch me!",
      proximityRadius: 85,
      spotlight: true,
      renderStyle: "envelope",
      envelopeTone: "yes",
    },
  ],
  labels: [],
  onTriggerTouch(trigger, api) {
    if (trigger.id === "yes-box") {
      trigger.active = false;
      trigger.caption = "Chosen";
      api.setMessage("Perfect choice. Loading trivia quest...", 1100);
      api.redirect("trivia.html", 1100);
      return;
    }

    if (trigger.id === "no-box") {
      evadeNo(trigger, api);
    }
  },
  onTriggerProximity(trigger, _distance, api) {
    if (trigger.id !== "no-box") {
      return;
    }

    evadeNo(trigger, api);
  },
  onRenderHud() {},
});

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

window.addEventListener("keydown", handleControlsToggle);

game.start();

window.addEventListener("beforeunload", () => {
  window.removeEventListener("keydown", handleControlsToggle);
  game.destroy();
});
