import { DEFAULT_INPUT_MAP, LoveQuestAudio, PlatformerGame } from "./platformer-engine.js";

const canvas = document.getElementById("game-canvas");
const soundButton = document.getElementById("sound-toggle");
const controlsPanel = document.querySelector(".controls-toggle");
const livesText = document.getElementById("lives-text");
const scoreText = document.getElementById("score-text");
const openedText = document.getElementById("opened-text");
const progressFill = document.getElementById("progress-fill");

const questionModal = document.getElementById("question-modal");
const modalTitle = document.getElementById("modal-title");
const modalQuestion = document.getElementById("modal-question");
const optionsGrid = document.getElementById("options-grid");
const feedback = document.getElementById("feedback");

const endModal = document.getElementById("end-modal");
const endTitle = document.getElementById("end-title");
const endScore = document.getElementById("end-score");
const endLives = document.getElementById("end-lives");
const replayButton = document.getElementById("replay-button");
const continueButton = document.getElementById("continue-button");
const TRIVIA_CLEAR_KEY = "loveQuestTriviaCleared";

function setProgressKey() {
  try {
    window.sessionStorage.setItem(TRIVIA_CLEAR_KEY, "true");
  } catch {
    // Ignore storage failures and rely on URL fallback.
  }
}

function clearProgressKey() {
  try {
    window.sessionStorage.removeItem(TRIVIA_CLEAR_KEY);
  } catch {
    // Ignore storage failures.
  }
}

const fallbackQuestions = [
  {
    id: "q1",
    boxId: "question-box-1",
    prompt: "Which word best describes your smile?",
    choices: ["Sunshine", "Thunder", "Notebook", "Cloud"],
    correctIndex: 0,
    hint: "It lights up the room.",
  },
  {
    id: "q2",
    boxId: "question-box-2",
    prompt: "Our ideal date vibe is...",
    choices: ["Cold emails", "Cozy and fun", "Awkward silence", "Traffic jam"],
    correctIndex: 1,
    hint: "Think warm and happy.",
  },
  {
    id: "q3",
    boxId: "question-box-3",
    prompt: "Love grows best with...",
    choices: ["Patience", "Ignoring texts", "Random panic", "No snacks"],
    correctIndex: 0,
    hint: "Steady and kind.",
  },
  {
    id: "q4",
    boxId: "question-box-4",
    prompt: "Favorite quest reward for us?",
    choices: ["More meetings", "A shared laugh", "No desserts", "Laundry only"],
    correctIndex: 1,
    hint: "It usually starts with a grin.",
  },
  {
    id: "q5",
    boxId: "question-box-5",
    prompt: "Our team name should be...",
    choices: ["No Fun Inc.", "Love Legends", "Lost Socks", "Muted Hearts"],
    correctIndex: 1,
    hint: "It sounds heroic and romantic.",
  },
];

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

const triviaState = {
  score: 0,
  livesRemaining: 3,
  openedBoxes: new Set(),
  activeQuestion: null,
  completed: false,
};

let questionsByBox = new Map();
let game;

function updateStatus() {
  const safeLives = Math.max(0, Math.min(3, triviaState.livesRemaining));
  const hearts = Array.from({ length: 3 }, (_, index) => (index < safeLives ? "❤️" : "🖤")).join(" ");
  livesText.textContent = `Lives: ${hearts}`;
  scoreText.textContent = `Score: ${triviaState.score}/5`;
  openedText.textContent = `Opened: ${triviaState.openedBoxes.size}/5`;
  progressFill.style.width = `${(triviaState.openedBoxes.size / 5) * 100}%`;
}

function setModalVisibility(modal, visible) {
  modal.classList.toggle("visible", visible);
  modal.setAttribute("aria-hidden", visible ? "false" : "true");
}

function finishGame(reason) {
  if (triviaState.completed) {
    return;
  }

  triviaState.completed = true;
  game.setPaused(true);

  if (reason === "lives") {
    endTitle.textContent = "Out of hearts, but you still made it memorable.";
    continueButton.classList.add("is-hidden");
  } else {
    endTitle.textContent = "All mystery boxes opened. Quest complete.";
    continueButton.classList.remove("is-hidden");
  }

  endScore.textContent = `Final Score: ${triviaState.score}/5`;
  endLives.textContent = `Lives Remaining: ${Math.max(0, triviaState.livesRemaining)}`;
  setModalVisibility(endModal, true);
}

function closeQuestionModal() {
  triviaState.activeQuestion = null;
  setModalVisibility(questionModal, false);

  if (!triviaState.completed) {
    game.setPaused(false);
  }

  if (triviaState.livesRemaining <= 0) {
    finishGame("lives");
  } else if (triviaState.openedBoxes.size === 5) {
    finishGame("opened");
  }
}

function answerQuestion(question, trigger, selectedIndex) {
  const isCorrect = selectedIndex === question.correctIndex;

  feedback.classList.remove("success", "fail");

  if (isCorrect) {
    triviaState.score += 1;
    feedback.textContent = "Correct!";
    feedback.classList.add("success");
    trigger.resultState = "correct";
  } else {
    triviaState.livesRemaining -= 1;
    feedback.textContent = `Oops! ${question.hint} (Answer: ${question.choices[question.correctIndex]})`;
    feedback.classList.add("fail");
    trigger.resultState = "wrong";
  }

  trigger.active = false;
  trigger.caption = "";
  triviaState.openedBoxes.add(trigger.id);
  updateStatus();

  window.setTimeout(() => {
    feedback.textContent = "";
    feedback.classList.remove("success", "fail");
    closeQuestionModal();
  }, 1000);
}

function openQuestion(question, trigger) {
  triviaState.activeQuestion = question;
  game.setPaused(true);

  modalTitle.textContent = `Mystery Question ${triviaState.openedBoxes.size + 1}`;
  modalQuestion.textContent = question.prompt;
  optionsGrid.innerHTML = "";
  feedback.textContent = "";
  feedback.classList.remove("success", "fail");

  question.choices.forEach((choice, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-btn";
    button.textContent = choice;
    button.addEventListener("click", () => {
      const allButtons = optionsGrid.querySelectorAll("button");
      allButtons.forEach((btn) => {
        btn.disabled = true;
      });
      answerQuestion(question, trigger, index);
    });
    optionsGrid.appendChild(button);
  });

  setModalVisibility(questionModal, true);
}

async function loadQuestions() {
  try {
    const response = await fetch("./data/trivia-questions.json", { cache: "no-cache" });
    if (!response.ok) {
      return fallbackQuestions;
    }

    const parsed = await response.json();
    if (!Array.isArray(parsed) || parsed.length !== 5) {
      return fallbackQuestions;
    }

    return parsed;
  } catch {
    return fallbackQuestions;
  }
}

async function init() {
  const questions = await loadQuestions();
  questionsByBox = new Map(questions.map((question) => [question.boxId, question]));

  const triviaDecor = [
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
        { type: "cloud", x: 1920, y: 44, w: 128, h: 56, speed: 1.0, alpha: 0.95 },
        { type: "cloud", x: 2330, y: 66, w: 124, h: 54, speed: 0.95, alpha: 0.95 },
        { type: "cloud", x: 2720, y: 44, w: 128, h: 56, speed: 1.0, alpha: 0.95 },
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
        { type: "heart_hill", x: 1960, y: 656, w: 360, h: 136, alpha: 0.58, color: "#cf4f77", patternColor: "#bf406b" },
        { type: "heart_hill", x: 2280, y: 690, w: 420, h: 118, alpha: 0.58, color: "#cb4972", patternColor: "#b93a63" },
        { type: "heart_hill", x: 2640, y: 656, w: 320, h: 130, alpha: 0.58, color: "#c5466d", patternColor: "#b4385d" },
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
        { type: "heart_hill", x: 1760, y: 708, w: 380, h: 104, alpha: 0.74, color: "#c53f66", patternColor: "#af3359" },
        { type: "heart_hill", x: 2120, y: 692, w: 390, h: 118, alpha: 0.74, color: "#c23a62", patternColor: "#ac2f55" },
        { type: "heart_hill", x: 2480, y: 710, w: 390, h: 98, alpha: 0.74, color: "#be355c", patternColor: "#a92b50" },
      ],
    },
    {
      depth: 0.08,
      plane: "back",
      elements: [
        { type: "sparkles", x: 250, y: 190, w: 20, h: 20, alpha: 0.34, speed: 1.2 },
        { type: "sparkles", x: 720, y: 158, w: 20, h: 20, alpha: 0.34, speed: 1.2 },
        { type: "sparkles", x: 1190, y: 178, w: 20, h: 20, alpha: 0.34, speed: 1.2 },
        { type: "sparkles", x: 1680, y: 150, w: 20, h: 20, alpha: 0.34, speed: 1.2 },
        { type: "sparkles", x: 2160, y: 174, w: 20, h: 20, alpha: 0.34, speed: 1.2 },
        { type: "sparkles", x: 2620, y: 156, w: 20, h: 20, alpha: 0.34, speed: 1.2 },
      ],
    },
    {
      depth: 1.03,
      plane: "front",
      elements: [
        { type: "hearts", x: 0, y: 842, w: 2800, h: 20, alpha: 0.2, speed: 0.05, color: "#d44f78" },
      ],
    },
  ];

  game = new PlatformerGame({
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
      deadZoneX: 145,
      focusYOffset: 0,
    },
    worldWidth: 2800,
    worldHeight: 934,
    groundHeight: 86,
    spawn: { x: 130, y: 748 },
    decorLayers: triviaDecor,
    platforms: [
      { x: 270, y: 766, width: 250, height: 30 },
      { x: 620, y: 712, width: 230, height: 30 },
      { x: 960, y: 658, width: 250, height: 30 },
      { x: 1300, y: 604, width: 250, height: 30 },
      { x: 1640, y: 548, width: 240, height: 30 },
      { x: 1980, y: 600, width: 240, height: 30 },
      { x: 2320, y: 540, width: 250, height: 30 },
      { x: 2560, y: 490, width: 190, height: 30 },
    ],
    triggers: [
      {
        id: "question-box-1",
        type: "trivia_box",
        x: 350,
        y: 706,
        width: 58,
        height: 58,
        caption: "Open",
        proximityRadius: 0,
        renderStyle: "mystery_gold",
        resultState: "unanswered",
      },
      {
        id: "question-box-2",
        type: "trivia_box",
        x: 705,
        y: 652,
        width: 58,
        height: 58,
        caption: "Open",
        proximityRadius: 0,
        renderStyle: "mystery_gold",
        resultState: "unanswered",
      },
      {
        id: "question-box-3",
        type: "trivia_box",
        x: 1075,
        y: 596,
        width: 58,
        height: 58,
        caption: "Open",
        proximityRadius: 0,
        renderStyle: "mystery_gold",
        resultState: "unanswered",
      },
      {
        id: "question-box-4",
        type: "trivia_box",
        x: 1705,
        y: 486,
        width: 58,
        height: 58,
        caption: "Open",
        proximityRadius: 0,
        renderStyle: "mystery_gold",
        resultState: "unanswered",
      },
      {
        id: "question-box-5",
        type: "trivia_box",
        x: 2625,
        y: 428,
        width: 58,
        height: 58,
        caption: "Open",
        proximityRadius: 0,
        spotlight: true,
        renderStyle: "mystery_gold",
        resultState: "unanswered",
      },
    ],
    labels: [],
    onTriggerTouch(trigger, api) {
      if (triviaState.completed || triviaState.activeQuestion || trigger.active === false) {
        return;
      }

      const question = questionsByBox.get(trigger.id);
      if (!question) {
        return;
      }

      openQuestion(question, trigger);
    },
  });

  updateStatus();
  game.start();

  window.addEventListener("beforeunload", () => {
    window.removeEventListener("keydown", handleControlsToggle);
    game.destroy();
  });
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

window.addEventListener("keydown", handleControlsToggle);

replayButton.addEventListener("click", () => {
  clearProgressKey();
  window.location.reload();
});

continueButton.addEventListener("click", () => {
  if (triviaState.livesRemaining <= 0 || triviaState.openedBoxes.size < 5) {
    return;
  }
  setProgressKey();
  window.location.href = "finale.html?unlock=1";
});

init();
