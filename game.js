import { DEFAULT_INPUT_MAP, LoveQuestAudio, PlatformerGame } from "./platformer-engine.js";

const canvas = document.getElementById("game-canvas");
const soundButton = document.getElementById("sound-toggle");
const TRIVIA_CLEAR_KEY = "loveQuestTriviaCleared";

window.sessionStorage.removeItem(TRIVIA_CLEAR_KEY);

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

const introDecor = [
  {
    depth: 0.16,
    plane: "back",
    elements: [
      { type: "cloud", x: -40, y: 34, w: 128, h: 56, speed: 0.9, alpha: 0.94 },
      { type: "cloud", x: 392, y: 70, w: 130, h: 58, speed: 0.9, alpha: 0.95 },
      { type: "cloud", x: 552, y: 20, w: 140, h: 60, speed: 1.0, alpha: 0.95 },
      { type: "cloud", x: 954, y: -14, w: 140, h: 60, speed: 0.9, alpha: 0.94 },
      { type: "cloud", x: 1358, y: 44, w: 128, h: 56, speed: 1.0, alpha: 0.95 },
      { type: "cloud", x: 1510, y: 66, w: 124, h: 54, speed: 0.95, alpha: 0.95 },
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
    depth: 1.03,
    plane: "front",
    elements: [
      { type: "hearts", x: 0, y: 842, w: 1650, h: 20, alpha: 0.2, speed: 0.05, color: "#d44f78" },
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
    revealOnInput: true,
  },
  camera: {
    deadZoneX: 0,
    focusYOffset: 0,
  },
  worldWidth: 1536,
  worldHeight: 934,
  groundHeight: 86,
  moveSpeed: 360,
  jumpVelocity: -1000,
  spawn: { x: 90, y: 760 },
  player: { width: 34, height: 46 },
  decorLayers: introDecor,
  platforms: [
    { x: 500, y: 742, width: 110, height: 34 },
    { x: 740, y: 704, width: 140, height: 34 },
    { x: 980, y: 762, width: 92, height: 34 },
  ],
  triggers: [
    {
      id: "start-box",
      type: "start",
      x: 784,
      y: 650,
      width: 52,
      height: 52,
      label: "",
      caption: "",
      proximityRadius: 72,
      spotlight: false,
    },
  ],
  labels: [],
  onTriggerTouch(trigger, api) {
    if (trigger.id !== "start-box") {
      return;
    }

    trigger.active = false;
    trigger.caption = "";
    api.setMessage("Loading next level...", 800);
    api.redirect("question.html", 900);
  },
  onRenderHud(api) {
    const ctx = api.ctx;

    ctx.save();
    ctx.textAlign = "center";
    ctx.fillStyle = "#5a2f44";
    ctx.font = "700 34px 'Baloo 2', sans-serif";
    ctx.fillText("⬇", 810, 614);
    ctx.font = "700 30px 'Baloo 2', sans-serif";
    ctx.fillStyle = "#ab3352";
    ctx.fillText("START", 810, 650);
    ctx.restore();
  },
});

game.start();

window.addEventListener("beforeunload", () => {
  game.destroy();
});
