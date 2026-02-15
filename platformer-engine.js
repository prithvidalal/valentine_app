export const DEFAULT_INPUT_MAP = {
  left: ["ArrowLeft", "KeyA"],
  right: ["ArrowRight", "KeyD"],
  jump: ["Space", "ArrowUp", "KeyW"],
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function intersects(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function centerDistance(a, b) {
  const ax = a.x + a.width / 2;
  const ay = a.y + a.height / 2;
  const bx = b.x + b.width / 2;
  const by = b.y + b.height / 2;
  return Math.hypot(ax - bx, ay - by);
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawHeart(ctx, x, y, size, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.24);
  ctx.bezierCurveTo(x, y, x - size * 0.5, y, x - size * 0.5, y + size * 0.24);
  ctx.bezierCurveTo(x - size * 0.5, y + size * 0.5, x, y + size * 0.8, x, y + size);
  ctx.bezierCurveTo(x, y + size * 0.8, x + size * 0.5, y + size * 0.5, x + size * 0.5, y + size * 0.24);
  ctx.bezierCurveTo(x + size * 0.5, y, x, y, x, y + size * 0.24);
  ctx.fill();
  ctx.restore();
}

function buildDefaultDecorLayers(themePreset, worldWidth, skylineY) {
  const tone = themePreset === "question" ? "#ff8fb7" : themePreset === "trivia" ? "#ff769f" : "#ff89ae";
  const cloudY = themePreset === "intro" ? 70 : 78;

  const clouds = [];
  for (let x = -200; x < worldWidth + 280; x += 460) {
    clouds.push({ type: "cloud", x, y: cloudY + ((x / 150) % 2) * 24, w: 170, h: 72, speed: 1.8, alpha: 0.82 });
  }

  const hills = [];
  for (let x = -220; x < worldWidth + 220; x += 380) {
    hills.push({ type: "hill", x, y: skylineY - 24, w: 430, h: 170, alpha: 0.56, color: "#f06c9f" });
  }

  const sparkles = [];
  for (let x = 120; x < worldWidth; x += 320) {
    sparkles.push({ type: "sparkles", x, y: 170 + ((x / 90) % 3) * 44, w: 20, h: 20, alpha: 0.42, speed: 1.2 });
  }

  return [
    { depth: 0.14, plane: "back", elements: clouds },
    { depth: 0.26, plane: "back", elements: hills },
    { depth: 0.08, plane: "back", elements: sparkles },
    {
      depth: 1.04,
      plane: "front",
      elements: [{ type: "hearts", x: 0, y: skylineY + 196, w: worldWidth, h: 24, alpha: 0.18, speed: 0.1, color: tone }],
    },
  ];
}

function createGrainTexture() {
  const grain = document.createElement("canvas");
  grain.width = 96;
  grain.height = 96;
  const ctx = grain.getContext("2d");

  for (let i = 0; i < 760; i += 1) {
    const x = Math.floor(Math.random() * grain.width);
    const y = Math.floor(Math.random() * grain.height);
    const alpha = 0.02 + Math.random() * 0.06;
    ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
    ctx.fillRect(x, y, 1, 1);
  }

  return grain;
}

export class LoveQuestAudio {
  constructor(storageKey = "loveQuestSoundEnabled") {
    this.storageKey = storageKey;
    const fromStorage = window.localStorage.getItem(storageKey);
    this.enabled = fromStorage === null ? true : fromStorage === "true";
    this.audioContext = null;
    this.started = false;
    this.intervalId = null;
    this.noteIndex = 0;
    this.sequence = [392.0, 493.88, 587.33, 659.25, 587.33, 523.25, 440.0, 523.25, 659.25, 587.33, 493.88, 440.0];
    this.bassSequence = [196.0, 220.0, 174.61, 146.83];
    this.stepMs = 240;
  }

  get isEnabled() {
    return this.enabled;
  }

  async ensureContext() {
    if (!this.audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        return false;
      }
      this.audioContext = new AudioContextClass();
    }

    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    return true;
  }

  playNote(freq, durationMs = 170, options = {}) {
    if (!this.enabled || !this.audioContext) {
      return;
    }

    const startAt = this.audioContext.currentTime;
    const endAt = startAt + durationMs / 1000;

    const osc = this.audioContext.createOscillator();
    osc.type = options.wave ?? "square";
    osc.frequency.setValueAtTime(freq, startAt);
    if (options.freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(options.freqEnd, endAt);
    }

    const gain = this.audioContext.createGain();
    const volume = options.volume ?? 0.08;
    const attack = options.attack ?? 0.01;
    const release = options.release ?? 0.0001;
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(volume, startAt + attack);
    gain.gain.exponentialRampToValueAtTime(release, endAt);

    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    osc.start(startAt);
    osc.stop(endAt);
  }

  playJump() {
    if (!this.enabled) {
      return;
    }
    if (!this.audioContext || this.audioContext.state === "suspended") {
      this.ensureContext().then((ready) => {
        if (ready) {
          this.playJump();
        }
      });
      return;
    }

    this.playNote(420, 130, {
      wave: "square",
      freqEnd: 760,
      volume: 0.09,
      attack: 0.004,
      release: 0.0001,
    });
    this.playNote(860, 95, {
      wave: "triangle",
      freqEnd: 620,
      volume: 0.035,
      attack: 0.003,
      release: 0.0001,
    });
  }

  async start() {
    if (!this.enabled || this.started) {
      return;
    }

    const ready = await this.ensureContext();
    if (!ready) {
      return;
    }

    this.started = true;
    this.intervalId = window.setInterval(() => {
      const step = this.noteIndex;
      const lead = this.sequence[step % this.sequence.length];
      this.playNote(lead, 180, {
        wave: "triangle",
        volume: 0.05,
        attack: 0.008,
        release: 0.0001,
      });
      if (step % 2 === 0) {
        const bass = this.bassSequence[Math.floor(step / 2) % this.bassSequence.length];
        this.playNote(bass, 210, {
          wave: "square",
          volume: 0.028,
          attack: 0.01,
          release: 0.0001,
        });
      }
      this.noteIndex += 1;
    }, this.stepMs);
  }

  stop() {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.started = false;
  }

  async unlockFromGesture() {
    if (!this.enabled) {
      return;
    }
    await this.start();
  }

  toggle() {
    this.enabled = !this.enabled;
    window.localStorage.setItem(this.storageKey, String(this.enabled));

    if (!this.enabled) {
      this.stop();
    }

    return this.enabled;
  }
}

export class PlatformerGame {
  constructor(config) {
    this.canvas = config.canvas;
    this.ctx = this.canvas.getContext("2d");
    this.worldWidth = config.worldWidth;
    this.worldHeight = config.worldHeight;
    this.groundHeight = config.groundHeight ?? 130;
    this.themePreset = config.themePreset ?? "intro";
    this.skylineY = config.skylineY ?? Math.round(this.worldHeight * 0.56);
    this.decorLayers = config.decorLayers ?? buildDefaultDecorLayers(this.themePreset, this.worldWidth, this.skylineY);
    this.platforms = config.platforms ?? [];
    this.triggers = (config.triggers ?? []).map((trigger) => ({ ...trigger }));
    this.labels = config.labels ?? [];
    this.screenLabels = config.screenLabels ?? [];
    this.onTriggerTouch = config.onTriggerTouch ?? (() => {});
    this.onTriggerProximity = config.onTriggerProximity ?? (() => {});
    this.onUpdate = config.onUpdate ?? (() => {});
    this.onRenderHud = config.onRenderHud ?? (() => {});
    this.inputMap = config.inputMap ?? DEFAULT_INPUT_MAP;
    this.audioManager = config.audioManager;
    this.gravity = config.gravity ?? 2600;
    this.moveSpeed = config.moveSpeed ?? 340;
    this.jumpVelocity = config.jumpVelocity ?? -930;
    const requestedFxQuality = config.fxQuality ?? "balanced";
    this.fxQuality = ["max", "balanced", "low"].includes(requestedFxQuality)
      ? requestedFxQuality
      : "balanced";
    this.fxScale = this.fxQuality === "max" ? 1 : this.fxQuality === "low" ? 0.5 : 0.75;

    this.cameraDeadZoneX = config.camera?.deadZoneX ?? 120;
    this.cameraFocusYOffset = config.camera?.focusYOffset ?? 0;

    this.hudConfig = {
      autoHide: config.hud?.autoHide ?? false,
      hideDelayMs: config.hud?.hideDelayMs ?? 6000,
      revealOnInput: config.hud?.revealOnInput ?? true,
      selector: config.hud?.selector ?? "[data-hud]",
    };

    this.player = {
      x: config.spawn.x,
      y: config.spawn.y,
      width: config.player?.width ?? 42,
      height: config.player?.height ?? 56,
      vx: 0,
      vy: 0,
      onGround: false,
      facing: 1,
      runFrame: 0,
    };

    this.keysDown = new Set();
    this.cameraX = 0;
    this.frameId = null;
    this.lastTime = 0;
    this.elapsedTime = 0;
    this.isPaused = false;
    this.message = "";
    this.messageTimeout = null;
    this.hudTimer = null;
    this.hudMode = "full";
    this.lastInputAt = performance.now();
    this.lastContextRevealAt = 0;
    this.grainTexture = createGrainTexture();

    this.hudElements = Array.from(document.querySelectorAll(this.hudConfig.selector));

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handlePointerUnlock = this.handlePointerUnlock.bind(this);
    this.loop = this.loop.bind(this);

    this.bindEvents();
    this.showHud("init");
  }

  bindEvents() {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("pointerdown", this.handlePointerUnlock);
  }

  destroy() {
    this.stop();
    if (this.hudTimer) {
      window.clearTimeout(this.hudTimer);
      this.hudTimer = null;
    }
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("pointerdown", this.handlePointerUnlock);
  }

  showHud(_reason = "manual") {
    this.setHudMode("full");
    if (this.hudConfig.autoHide) {
      this.scheduleHudHide();
    }
  }

  hideHud() {
    this.setHudMode("minimal");
  }

  setHudMode(mode) {
    this.hudMode = mode;

    document.body.classList.toggle("hud-full", mode === "full");
    document.body.classList.toggle("hud-minimal", mode === "minimal");

    for (const element of this.hudElements) {
      element.classList.remove("hud-visible", "hud-hidden", "hud-peek");
      const persistent = element.dataset.hudPersistent === "true";

      if (mode === "full") {
        element.classList.add("hud-visible");
      } else if (mode === "minimal") {
        if (persistent) {
          element.classList.add("hud-peek");
        } else {
          element.classList.add("hud-hidden");
        }
      }
    }
  }

  scheduleHudHide() {
    if (this.hudTimer) {
      window.clearTimeout(this.hudTimer);
    }

    this.hudTimer = window.setTimeout(() => {
      this.hideHud();
    }, this.hudConfig.hideDelayMs);
  }

  handlePointerUnlock() {
    this.lastInputAt = performance.now();
    if (this.audioManager) {
      this.audioManager.unlockFromGesture();
    }
    if (this.hudConfig.revealOnInput) {
      this.showHud("pointer");
    }
  }

  handleKeyDown(event) {
    this.keysDown.add(event.code);

    if (event.code === "KeyH") {
      this.showHud("hotkey");
      return;
    }

    if (
      this.inputMap.left.includes(event.code) ||
      this.inputMap.right.includes(event.code) ||
      this.inputMap.jump.includes(event.code)
    ) {
      event.preventDefault();
      this.lastInputAt = performance.now();
      if (this.audioManager) {
        this.audioManager.unlockFromGesture();
      }
      if (this.hudConfig.revealOnInput) {
        this.showHud("input");
      }
    }
  }

  handleKeyUp(event) {
    this.keysDown.delete(event.code);
  }

  getTrigger(id) {
    return this.triggers.find((trigger) => trigger.id === id);
  }

  setTriggerPosition(id, x, y) {
    const trigger = this.getTrigger(id);
    if (!trigger) {
      return;
    }

    trigger.x = x;
    trigger.y = y;
  }

  setPaused(value) {
    this.isPaused = value;
  }

  setMessage(message, ms = 1200) {
    this.message = message;
    if (this.messageTimeout) {
      window.clearTimeout(this.messageTimeout);
    }

    if (ms > 0) {
      this.messageTimeout = window.setTimeout(() => {
        this.message = "";
      }, ms);
    }
  }

  redirect(url, delay = 500) {
    this.setPaused(true);
    window.setTimeout(() => {
      window.location.href = url;
    }, delay);
  }

  controlState() {
    const left = this.inputMap.left.some((code) => this.keysDown.has(code));
    const right = this.inputMap.right.some((code) => this.keysDown.has(code));
    const jump = this.inputMap.jump.some((code) => this.keysDown.has(code));
    return { left, right, jump };
  }

  updateCamera() {
    const centerX = this.player.x + this.player.width / 2;
    const cameraCenter = this.cameraX + this.canvas.width / 2;

    if (centerX < cameraCenter - this.cameraDeadZoneX) {
      this.cameraX = centerX - (this.canvas.width / 2 - this.cameraDeadZoneX);
    } else if (centerX > cameraCenter + this.cameraDeadZoneX) {
      this.cameraX = centerX - (this.canvas.width / 2 + this.cameraDeadZoneX);
    }

    this.cameraX = clamp(this.cameraX, 0, Math.max(0, this.worldWidth - this.canvas.width));
  }

  maybeRevealHudByContext() {
    if (!this.hudConfig.autoHide) {
      return;
    }

    const now = performance.now();
    const idleMs = now - this.lastInputAt;
    if (idleMs < 2000) {
      return;
    }

    const nearTarget = this.triggers.some((trigger) => {
      const isActive = trigger.active !== false;
      if (!isActive) {
        return false;
      }

      const radius = trigger.proximityRadius ?? 150;
      return centerDistance(this.player, trigger) <= radius + 18;
    });

    if (nearTarget && now - this.lastContextRevealAt > 1800) {
      this.lastContextRevealAt = now;
      this.showHud("context");
    }
  }

  step(deltaSeconds) {
    if (this.isPaused) {
      return;
    }

    const dt = Math.min(deltaSeconds, 1 / 24);
    this.elapsedTime += dt;

    const controls = this.controlState();

    if (controls.left && !controls.right) {
      this.player.vx = -this.moveSpeed;
      this.player.facing = -1;
      this.lastInputAt = performance.now();
    } else if (controls.right && !controls.left) {
      this.player.vx = this.moveSpeed;
      this.player.facing = 1;
      this.lastInputAt = performance.now();
    } else {
      this.player.vx = 0;
    }

    if (controls.jump && this.player.onGround) {
      this.player.vy = this.jumpVelocity;
      this.player.onGround = false;
      this.lastInputAt = performance.now();
      if (this.audioManager) {
        this.audioManager.playJump();
      }
    }

    this.player.vy += this.gravity * dt;

    const prevX = this.player.x;
    this.player.x += this.player.vx * dt;
    this.player.x = clamp(this.player.x, 0, this.worldWidth - this.player.width);

    const hitboxes = [
      ...this.platforms,
      {
        x: 0,
        y: this.worldHeight - this.groundHeight,
        width: this.worldWidth,
        height: this.groundHeight,
      },
    ];

    for (const platform of hitboxes) {
      if (!intersects(this.player, platform)) {
        continue;
      }

      if (this.player.vx > 0 && prevX + this.player.width <= platform.x) {
        this.player.x = platform.x - this.player.width;
      } else if (this.player.vx < 0 && prevX >= platform.x + platform.width) {
        this.player.x = platform.x + platform.width;
      }
    }

    const prevY = this.player.y;
    this.player.y += this.player.vy * dt;
    this.player.onGround = false;

    for (const platform of hitboxes) {
      if (!intersects(this.player, platform)) {
        continue;
      }

      const wasAbovePlatform = prevY + this.player.height <= platform.y + 8;
      const crossedPlatformTop = prevY <= platform.y && this.player.y + this.player.height >= platform.y;

      if (this.player.vy > 0 && (wasAbovePlatform || crossedPlatformTop)) {
        this.player.y = platform.y - this.player.height;
        this.player.vy = 0;
        this.player.onGround = true;
      } else if (this.player.vy < 0 && prevY >= platform.y + platform.height) {
        this.player.y = platform.y + platform.height;
        this.player.vy = 0;
      }
    }

    this.player.y = clamp(this.player.y, 0, this.worldHeight - this.player.height);
    this.player.runFrame = this.player.onGround && Math.abs(this.player.vx) > 2 ? Math.floor(this.elapsedTime * 12) % 2 : 0;

    this.updateCamera();
    this.resolveTriggers();
    this.maybeRevealHudByContext();
    this.onUpdate(this.api());
  }

  resolveTriggers() {
    for (const trigger of this.triggers) {
      const isActive = trigger.active !== false;
      const proximityRadius = trigger.proximityRadius ?? 120;

      if (isActive && intersects(this.player, trigger)) {
        if (!trigger.__touching) {
          trigger.__touching = true;
          this.onTriggerTouch(trigger, this.api());
        }
      } else {
        trigger.__touching = false;
      }

      if (isActive && proximityRadius > 0) {
        const distance = centerDistance(this.player, trigger);
        if (distance <= proximityRadius) {
          const now = performance.now();
          const cooldown = trigger.proximityCooldown ?? 220;
          const last = trigger.__proximityLast ?? 0;
          if (now - last > cooldown) {
            trigger.__proximityLast = now;
            this.onTriggerProximity(trigger, distance, this.api());
          }
        }
      }
    }
  }

  drawDecorElement(layer, element, timeSeconds) {
    const depth = layer.depth ?? 1;
    const xBase = element.x - this.cameraX * depth;
    const drift = element.speed ? Math.sin(timeSeconds * element.speed + element.x * 0.017) * 8 : 0;
    const x = xBase + drift;
    const y = element.y;
    const w = element.w;
    const h = element.h;
    const alpha = element.alpha ?? 1;

    this.ctx.save();
    this.ctx.globalAlpha = alpha;

    if (element.type === "cloud") {
      this.ctx.fillStyle = "rgba(255,240,247,0.92)";
      this.ctx.beginPath();
      this.ctx.ellipse(x + w * 0.2, y + h * 0.62, w * 0.2, h * 0.24, 0, 0, Math.PI * 2);
      this.ctx.ellipse(x + w * 0.47, y + h * 0.44, w * 0.24, h * 0.3, 0, 0, Math.PI * 2);
      this.ctx.ellipse(x + w * 0.74, y + h * 0.56, w * 0.23, h * 0.25, 0, 0, Math.PI * 2);
      this.ctx.fill();
    } else if (element.type === "hill") {
      this.ctx.fillStyle = element.color ?? "#e24e85";
      this.ctx.beginPath();
      this.ctx.ellipse(x + w / 2, y + h, w / 2, h, 0, Math.PI, Math.PI * 2);
      this.ctx.fill();
    } else if (element.type === "heart_hill") {
      this.ctx.save();
      this.ctx.fillStyle = element.color ?? "#d96388";
      this.ctx.beginPath();
      this.ctx.ellipse(x + w / 2, y + h, w / 2, h, 0, Math.PI, Math.PI * 2);
      this.ctx.fill();
      this.ctx.clip();

      const heartColor = element.patternColor ?? "#c65179";
      for (let hx = x - 10; hx < x + w + 10; hx += 24) {
        for (let hy = y + 6; hy < y + h + 8; hy += 20) {
          this.ctx.fillStyle = heartColor;
          drawHeart(this.ctx, hx + ((hy / 20) % 2 ? 8 : 0), hy, 9, 0.45);
        }
      }
      this.ctx.restore();
    } else if (element.type === "arch") {
      this.ctx.fillStyle = element.color ?? "#ff7cad";
      drawRoundedRect(this.ctx, x, y, w, h, 26);
      this.ctx.fill();
      this.ctx.globalAlpha = alpha * 0.45;
      this.ctx.fillStyle = "rgba(255, 191, 214, 0.75)";
      drawRoundedRect(this.ctx, x + 18, y + 16, w - 36, h - 32, 18);
      this.ctx.fill();
    } else if (element.type === "hearts") {
      this.ctx.fillStyle = element.color ?? "#ff8eb7";
      const count = Math.max(1, Math.floor(w / 18));
      for (let i = 0; i < count; i += 1) {
        const hx = x + i * 18;
        const hy = y + ((i % 2) ? 4 : 0);
        drawHeart(this.ctx, hx, hy, Math.max(8, h * 0.8), alpha);
      }
    } else if (element.type === "sparkles") {
      const pulse = 0.6 + Math.sin(timeSeconds * 4 + element.x * 0.01) * 0.4;
      this.ctx.strokeStyle = `rgba(255,247,209,${Math.max(0.1, pulse)})`;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(x + w / 2, y);
      this.ctx.lineTo(x + w / 2, y + h);
      this.ctx.moveTo(x, y + h / 2);
      this.ctx.lineTo(x + w, y + h / 2);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  drawDecorLayers(plane = "back") {
    const stride = this.fxQuality === "low" ? 2 : 1;
    for (const layer of this.decorLayers) {
      if ((layer.plane ?? "back") !== plane) {
        continue;
      }
      const elements = layer.elements ?? [];
      for (let i = 0; i < elements.length; i += stride) {
        const element = elements[i];
        this.drawDecorElement(layer, element, this.elapsedTime);
      }
    }
  }

  drawBackground() {
    const horizon = clamp(this.skylineY + this.cameraFocusYOffset, 240, this.worldHeight - 190);

    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    if (this.themePreset === "intro") {
      gradient.addColorStop(0, "#e5a7bc");
      gradient.addColorStop(0.72, "#e1a2b7");
      gradient.addColorStop(1, "#d98fa8");
    } else {
      gradient.addColorStop(0, "#ffb6ce");
      gradient.addColorStop(0.3, "#ff8fb4");
      gradient.addColorStop(0.58, "#ff628f");
      gradient.addColorStop(1, "#d73063");
    }
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.themePreset !== "intro") {
      const glow = this.ctx.createRadialGradient(this.canvas.width * 0.62, 120, 24, this.canvas.width * 0.62, 120, 260);
      glow.addColorStop(0, "rgba(255,255,226,0.36)");
      glow.addColorStop(1, "rgba(255,255,226,0)");
      this.ctx.fillStyle = glow;
      this.ctx.fillRect(0, 0, this.canvas.width, 320);
    }

    this.drawDecorLayers("back");

    const horizonGradient = this.ctx.createLinearGradient(0, horizon - 20, 0, this.canvas.height);
    if (this.themePreset === "intro") {
      horizonGradient.addColorStop(0, "rgba(223,133,161,0.24)");
      horizonGradient.addColorStop(1, "rgba(150,33,77,0.2)");
    } else {
      horizonGradient.addColorStop(0, "rgba(255,182,206,0.22)");
      horizonGradient.addColorStop(1, "rgba(121,18,56,0.42)");
    }
    this.ctx.fillStyle = horizonGradient;
    this.ctx.fillRect(0, horizon - 20, this.canvas.width, this.canvas.height - horizon + 20);

    if (this.themePreset !== "intro") {
      this.ctx.save();
      this.ctx.globalAlpha = 0.14 + this.fxScale * 0.12;
      this.ctx.drawImage(this.grainTexture, 0, 0, this.canvas.width, this.canvas.height);
      this.ctx.restore();
    }

    const vignette = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    vignette.addColorStop(0, "rgba(36,0,14,0.06)");
    vignette.addColorStop(0.82, "rgba(36,0,14,0)");
    vignette.addColorStop(
      1,
      this.themePreset === "intro"
        ? "rgba(54,3,23,0.16)"
        : `rgba(36,0,14,${(0.2 + this.fxScale * 0.2).toFixed(3)})`
    );
    this.ctx.fillStyle = vignette;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawPlatforms() {
    for (const platform of this.platforms) {
      const x = platform.x - this.cameraX;
      const y = platform.y;

      const gradient = this.ctx.createLinearGradient(0, y, 0, y + platform.height);
      if (this.themePreset === "intro") {
        gradient.addColorStop(0, "#e53e67");
        gradient.addColorStop(0.6, "#c62554");
        gradient.addColorStop(1, "#98173e");
      } else {
        gradient.addColorStop(0, "#ff4f7d");
        gradient.addColorStop(0.52, "#dc2b63");
        gradient.addColorStop(1, "#a71645");
      }
      this.ctx.fillStyle = gradient;
      drawRoundedRect(this.ctx, x, y, platform.width, platform.height, 8);
      this.ctx.fill();

      this.ctx.fillStyle = this.themePreset === "intro" ? "rgba(255,179,205,0.65)" : "rgba(255,219,234,0.76)";
      this.ctx.fillRect(x + 6, y + 4, platform.width - 12, 4);

      this.ctx.fillStyle = this.themePreset === "intro" ? "rgba(86,8,35,0.55)" : "rgba(88,7,35,0.45)";
      this.ctx.fillRect(x + 5, y + platform.height - 5, platform.width - 10, 3);
    }

    const groundY = this.worldHeight - this.groundHeight;

    const baseGradient = this.ctx.createLinearGradient(0, groundY, 0, this.worldHeight);
    if (this.themePreset === "intro") {
      baseGradient.addColorStop(0, "#cf3e6b");
      baseGradient.addColorStop(0.56, "#a82552");
      baseGradient.addColorStop(1, "#6d1736");
    } else {
      baseGradient.addColorStop(0, "#ce2a61");
      baseGradient.addColorStop(0.55, "#a01949");
      baseGradient.addColorStop(1, "#631231");
    }
    this.ctx.fillStyle = baseGradient;
    this.ctx.fillRect(0, groundY, this.canvas.width, this.groundHeight);

    this.ctx.fillStyle = this.themePreset === "intro" ? "rgba(240,126,162,0.55)" : "rgba(255,184,209,0.5)";
    this.ctx.fillRect(0, groundY, this.canvas.width, 10);

    this.ctx.fillStyle = this.themePreset === "intro" ? "rgba(214,74,120,0.34)" : "rgba(255,104,151,0.32)";
    const heartStep = this.fxQuality === "max" ? 18 : this.fxQuality === "low" ? 34 : 24;
    for (let x = -12; x < this.canvas.width + 20; x += heartStep) {
      drawHeart(this.ctx, x, groundY + 18, 9, 0.44);
      drawHeart(this.ctx, x + 9, groundY + 32, 8, 0.3);
    }

    this.ctx.fillStyle = this.themePreset === "intro" ? "rgba(101,20,48,0.56)" : "rgba(58,4,23,0.45)";
    this.ctx.fillRect(0, this.worldHeight - 18, this.canvas.width, 18);
  }

  drawPlayer() {
    const drawX = this.player.x - this.cameraX;
    const grounded = this.player.onGround;
    const moving = grounded && Math.abs(this.player.vx) > 2;
    const drawY = this.player.y;

    const baseRows = [
      "..HHHHHHHHHHHHHHHH..",
      "..HLLLLLLLLLLLLLLH..",
      "..HLLLRRRRRRRRRLLH..",
      "..RRRRRRRRRRRRRRRR..",
      ".RRRSSPPSS..SSPPSRR.",
      ".RRSSSWWW..WWWSSSRR.",
      ".RSSSSWPE..EPWSSSSR.",
      ".RSSSSWWW..WWWSSSSR.",
      ".RSSSSSSSSSSSSSSSSR.",
      "..RRSSSSSSSSSSSSRR..",
      "..DDDDDDDDDDDDDDDD..",
      ".DDDDDDQQCCQQDDDDDD.",
      ".DDDDDQQQCCQQQDDDDD.",
      ".GDDDDDQQQQQQDDDDDG.",
      ".GGDDDDDDDDDDDDDDGG.",
      "..GDDDDDDDDDDDDDDG..",
      "..GDDDDDDDDDDDDDDG..",
      "..GGDDDDDDDDDDDDGG..",
    ];

    const idleLegs = [
      "..JJJJ........JJJJ..",
      "..JJJJ........JJJJ..",
      "..KKKK........KKKK..",
      "..KKKK........KKKK..",
      "..KKKK........KKKK..",
      "..KKKK........KKKK..",
    ];

    const runLegsA = [
      "..JJJJ.......JJJJ...",
      "...JJJJ....JJJJ.....",
      "...KKKK....KKKK.....",
      "..KKKK.......KKKK...",
      "..KKK........KKKK...",
      ".KKK..........KKKK..",
    ];

    const runLegsB = [
      "...JJJJ.......JJJJ..",
      ".....JJJJ....JJJJ...",
      ".....KKKK....KKKK...",
      "...KKKK.......KKKK..",
      "...KKKK........KKK..",
      "..KKKK..........KKK.",
    ];

    const spriteRows = [
      ...baseRows,
      ...(moving ? (this.player.runFrame === 0 ? runLegsA : runLegsB) : idleLegs),
    ];

    const pixel = 2;
    const spriteWidth = spriteRows[0].length;
    const spriteHeight = spriteRows.length;
    const spriteOffsetX = Math.round(-(spriteWidth * pixel) / 2);
    const spriteOffsetY = Math.round(-(spriteHeight * pixel) / 2);
    const palette = {
      H: "#f594ca",
      L: "#ffc8e6",
      R: "#e160a6",
      S: "#f5d5b7",
      W: "#fffdfd",
      E: "#8fc0f8",
      P: "#3a2f40",
      D: "#f26faf",
      Q: "#d12f59",
      C: "#ff6889",
      G: "#ffcce7",
      J: "#d96f88",
      K: "#8f5e35",
    };

    this.ctx.save();
    this.ctx.translate(
      Math.round(drawX + this.player.width / 2),
      Math.round(drawY + this.player.height / 2)
    );
    this.ctx.scale(this.player.facing, 1);
    for (let row = 0; row < spriteRows.length; row += 1) {
      const line = spriteRows[row];
      for (let col = 0; col < line.length; col += 1) {
        const key = line[col];
        if (key === ".") {
          continue;
        }
        const color = palette[key];
        if (!color) {
          continue;
        }
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
          spriteOffsetX + col * pixel,
          spriteOffsetY + row * pixel,
          pixel,
          pixel
        );
      }
    }

    this.ctx.restore();
  }

  drawEnvelopeTrigger(trigger, x, y, isActive) {
    const tone = trigger.envelopeTone ?? (trigger.type === "yes" ? "yes" : "no");
    const palette = tone === "yes"
      ? {
          bodyTop: isActive ? "#fff8fa" : "#e6d9dd",
          bodyBottom: isActive ? "#ffdce9" : "#d9ccd0",
          flap: isActive ? "#ffc7db" : "#d8c2cb",
          seam: "#d184a3",
          edge: "#b34a72",
          seal: isActive ? "#e84d7f" : "#a77f8f",
          sealHeart: "#ffe6f0",
          glow: "rgba(255, 176, 209, 0.28)",
        }
      : {
          bodyTop: isActive ? "#f6eef1" : "#e2d7dc",
          bodyBottom: isActive ? "#e9dbe1" : "#d4c7ce",
          flap: isActive ? "#d8c7cf" : "#c8bcc3",
          seam: "#b99aaa",
          edge: "#8c6677",
          seal: isActive ? "#a0617c" : "#8e8089",
          sealHeart: "#fbe8f0",
          glow: "rgba(216, 163, 190, 0.2)",
        };

    const w = trigger.width;
    const h = trigger.height;
    const bodyY = y + 10;
    const bodyH = h - 10;

    this.ctx.save();
    const glow = this.ctx.createRadialGradient(
      x + w / 2,
      y + h / 2,
      10,
      x + w / 2,
      y + h / 2,
      Math.max(w, h)
    );
    glow.addColorStop(0, palette.glow);
    glow.addColorStop(1, "rgba(255,255,255,0)");
    this.ctx.fillStyle = glow;
    this.ctx.fillRect(x - 14, y - 14, w + 28, h + 28);

    const bodyGradient = this.ctx.createLinearGradient(0, bodyY, 0, bodyY + bodyH);
    bodyGradient.addColorStop(0, palette.bodyTop);
    bodyGradient.addColorStop(1, palette.bodyBottom);
    this.ctx.fillStyle = bodyGradient;
    drawRoundedRect(this.ctx, x, bodyY, w, bodyH, 7);
    this.ctx.fill();

    this.ctx.strokeStyle = palette.edge;
    this.ctx.lineWidth = 2.5;
    this.ctx.stroke();

    this.ctx.fillStyle = palette.flap;
    this.ctx.beginPath();
    this.ctx.moveTo(x + 3, bodyY + 2);
    this.ctx.lineTo(x + w / 2, y + h * 0.64);
    this.ctx.lineTo(x + w - 3, bodyY + 2);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.strokeStyle = palette.seam;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(x + 4, bodyY + 2);
    this.ctx.lineTo(x + w / 2, y + h * 0.64);
    this.ctx.lineTo(x + w - 4, bodyY + 2);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(x + 4, bodyY + bodyH - 2);
    this.ctx.lineTo(x + w / 2, y + h * 0.64);
    this.ctx.lineTo(x + w - 4, bodyY + bodyH - 2);
    this.ctx.stroke();

    this.ctx.fillStyle = "rgba(255,255,255,0.36)";
    this.ctx.fillRect(x + 7, bodyY + 5, w - 14, 3);

    const sealX = x + w / 2;
    const sealY = y + h * 0.64;
    this.ctx.fillStyle = palette.seal;
    this.ctx.beginPath();
    this.ctx.arc(sealX, sealY, 8.5, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = "rgba(77, 19, 39, 0.55)";
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();

    this.ctx.fillStyle = palette.sealHeart;
    drawHeart(this.ctx, sealX, sealY - 4, 7, 0.95);

    if (tone === "no") {
      this.ctx.strokeStyle = "#6e4053";
      this.ctx.lineWidth = 1.8;
      this.ctx.beginPath();
      this.ctx.moveTo(sealX - 4, sealY + 2);
      this.ctx.lineTo(sealX + 4, sealY - 7);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  drawMysteryGoldTrigger(trigger, x, y, isActive) {
    const state = trigger.resultState ?? "unanswered";
    let palette;

    if (state === "correct") {
      palette = {
        glow: "rgba(133, 246, 171, 0.28)",
        faceTop: "#84e6a8",
        faceBottom: "#42b871",
        edge: "#1f7f47",
        edgeShadow: "#175e36",
        highlight: "#c9f8db",
        holeOuter: "#2f9158",
        holeInner: "#56bf81",
        glyph: "#f4fff8",
        glyphShadow: "#2d7d52",
      };
    } else if (state === "wrong") {
      palette = {
        glow: "rgba(189, 189, 197, 0.24)",
        faceTop: "#c7ccd5",
        faceBottom: "#9097a3",
        edge: "#5b6170",
        edgeShadow: "#454b59",
        highlight: "#edf0f6",
        holeOuter: "#5a606f",
        holeInner: "#8f97a7",
        glyph: "#ffffff",
        glyphShadow: "#6e7384",
      };
    } else {
      palette = {
        glow: "rgba(255, 219, 102, 0.3)",
        faceTop: "#ffe03c",
        faceBottom: "#f0c300",
        edge: "#9b5d10",
        edgeShadow: "#7d4808",
        highlight: "#fff08e",
        holeOuter: "#9e7b00",
        holeInner: "#c8ab14",
        glyph: "#f8f8f8",
        glyphShadow: "#808080",
      };
    }

    const w = trigger.width;
    const h = trigger.height;
    const depth = Math.max(3, Math.floor(w * 0.08));

    this.ctx.save();

    const glow = this.ctx.createRadialGradient(
      x + w / 2,
      y + h / 2,
      8,
      x + w / 2,
      y + h / 2,
      Math.max(w, h)
    );
    glow.addColorStop(0, palette.glow);
    glow.addColorStop(1, "rgba(255,255,255,0)");
    this.ctx.fillStyle = glow;
    this.ctx.fillRect(x - 12, y - 12, w + 24, h + 24);

    this.ctx.fillStyle = palette.edgeShadow;
    this.ctx.fillRect(x + depth, y + h - depth, w - depth, depth);
    this.ctx.fillRect(x + w - depth, y + depth, depth, h - depth);

    const face = this.ctx.createLinearGradient(0, y, 0, y + h);
    face.addColorStop(0, palette.faceTop);
    face.addColorStop(1, palette.faceBottom);
    this.ctx.fillStyle = face;
    this.ctx.fillRect(x, y, w, h);

    this.ctx.strokeStyle = palette.edge;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

    this.ctx.fillStyle = palette.highlight;
    this.ctx.fillRect(x + 3, y + 3, w - 6, 3);
    this.ctx.fillRect(x + 3, y + 3, 3, h - 6);

    const sweepX = x + ((Math.sin(this.elapsedTime * 4 + trigger.x * 0.012) * 0.5 + 0.5) * (w - 14));
    this.ctx.fillStyle = "rgba(255,255,255,0.2)";
    this.ctx.fillRect(sweepX, y + 6, 3, h - 12);

    const holes = [
      [x + 8, y + 8],
      [x + w - 8, y + 8],
      [x + 8, y + h - 8],
      [x + w - 8, y + h - 8],
    ];
    for (const [hx, hy] of holes) {
      this.ctx.fillStyle = palette.holeOuter;
      this.ctx.beginPath();
      this.ctx.arc(hx, hy, 4.6, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = palette.holeInner;
      this.ctx.beginPath();
      this.ctx.arc(hx + 0.6, hy + 0.4, 3.1, 0, Math.PI * 2);
      this.ctx.fill();
    }

    const glyph = "?";
    this.ctx.textAlign = "center";
    this.ctx.font = `700 ${Math.floor(h * 0.62)}px 'Press Start 2P', 'Baloo 2', sans-serif`;
    this.ctx.fillStyle = palette.glyphShadow;
    this.ctx.fillText(glyph, x + w / 2 + 2, y + h * 0.73 + 2);
    this.ctx.fillStyle = palette.glyph;
    this.ctx.fillText(glyph, x + w / 2, y + h * 0.73);

    this.ctx.strokeStyle = palette.edge;
    if (isActive) {
      this.ctx.strokeStyle = "rgba(255, 248, 214, 0.66)";
      this.ctx.lineWidth = 1.5;
      this.ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
    }

    this.ctx.restore();
  }

  drawLoveLetterTrigger(trigger, x, y, isActive) {
    const w = trigger.width;
    const h = trigger.height;
    const bodyTop = isActive ? "#fffdfd" : "#e7dfe2";
    const bodyBottom = isActive ? "#ffe9f1" : "#d8ccd2";
    const border = isActive ? "#b34771" : "#8f7080";
    const flap = isActive ? "#ffd4e4" : "#d9c5cf";
    const glowColor = isActive ? "rgba(255, 182, 214, 0.34)" : "rgba(194, 164, 180, 0.2)";

    this.ctx.save();
    const glow = this.ctx.createRadialGradient(
      x + w / 2,
      y + h / 2,
      6,
      x + w / 2,
      y + h / 2,
      Math.max(w, h) * 1.1
    );
    glow.addColorStop(0, glowColor);
    glow.addColorStop(1, "rgba(255,255,255,0)");
    this.ctx.fillStyle = glow;
    this.ctx.fillRect(x - 16, y - 16, w + 32, h + 32);

    const bodyGradient = this.ctx.createLinearGradient(0, y, 0, y + h);
    bodyGradient.addColorStop(0, bodyTop);
    bodyGradient.addColorStop(1, bodyBottom);
    this.ctx.fillStyle = bodyGradient;
    drawRoundedRect(this.ctx, x, y + 8, w, h - 8, 8);
    this.ctx.fill();

    this.ctx.strokeStyle = border;
    this.ctx.lineWidth = 2.4;
    this.ctx.stroke();

    this.ctx.fillStyle = flap;
    this.ctx.beginPath();
    this.ctx.moveTo(x + 3, y + 10);
    this.ctx.lineTo(x + w / 2, y + h * 0.62);
    this.ctx.lineTo(x + w - 3, y + 10);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.strokeStyle = "rgba(188, 112, 143, 0.9)";
    this.ctx.lineWidth = 1.6;
    this.ctx.beginPath();
    this.ctx.moveTo(x + 4, y + 10);
    this.ctx.lineTo(x + w / 2, y + h * 0.62);
    this.ctx.lineTo(x + w - 4, y + 10);
    this.ctx.stroke();

    this.ctx.fillStyle = "rgba(255,255,255,0.5)";
    this.ctx.fillRect(x + 8, y + 12, w - 16, 3);

    const sealX = x + w / 2;
    const sealY = y + h * 0.62;
    this.ctx.fillStyle = isActive ? "#e24f7f" : "#9e7b8c";
    this.ctx.beginPath();
    this.ctx.arc(sealX, sealY, 8.4, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = "#ffeef6";
    drawHeart(this.ctx, sealX, sealY - 4, 7, 1);

    const sparkleAlpha = 0.35 + Math.sin(this.elapsedTime * 5 + trigger.x * 0.02) * 0.2;
    this.ctx.fillStyle = `rgba(255, 238, 247, ${Math.max(0.1, sparkleAlpha).toFixed(3)})`;
    drawHeart(this.ctx, x + w - 10, y - 8, 7, 0.8);
    drawHeart(this.ctx, x + 10, y - 6, 6, 0.75);

    this.ctx.restore();
  }

  drawTrigger(trigger) {
    if (trigger.visible === false) {
      return;
    }

    const isActive = trigger.active !== false;
    const bob = isActive ? Math.sin(this.elapsedTime * 4 + trigger.x * 0.02) * 2.5 : 0;
    const x = trigger.x - this.cameraX;
    const y = trigger.y + bob;

    if (trigger.spotlight) {
      this.ctx.save();
      const beam = this.ctx.createLinearGradient(0, 0, 0, 160);
      beam.addColorStop(0, "rgba(255,249,196,0.38)");
      beam.addColorStop(1, "rgba(255,249,196,0)");
      this.ctx.fillStyle = beam;
      this.ctx.beginPath();
      this.ctx.moveTo(x + trigger.width / 2 - 16, y - 160);
      this.ctx.lineTo(x + trigger.width / 2 + 16, y - 160);
      this.ctx.lineTo(x + trigger.width + 26, y + trigger.height);
      this.ctx.lineTo(x - 26, y + trigger.height);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.restore();
    }

    let boxColor = "#ffbf2e";
    if (trigger.type === "yes") {
      boxColor = isActive ? "#49e677" : "#8aa998";
    } else if (trigger.type === "no") {
      boxColor = isActive ? "#ff5b7f" : "#8aa998";
    } else if (trigger.type === "trivia_box") {
      boxColor = isActive ? "#ff9d44" : "#8aa998";
    } else if (trigger.type === "start") {
      boxColor = isActive ? "#e43d62" : "#8aa998";
    }
    const renderStyle = trigger.renderStyle ?? "default";

    if (renderStyle === "envelope") {
      this.drawEnvelopeTrigger(trigger, x, y, isActive);
    } else if (renderStyle === "love_letter") {
      this.drawLoveLetterTrigger(trigger, x, y, isActive);
    } else if (renderStyle === "mystery_gold") {
      this.drawMysteryGoldTrigger(trigger, x, y, isActive);
    } else if (renderStyle === "arcade_cube") {
      this.drawMysteryGoldTrigger(trigger, x, y, isActive);
    } else if (trigger.type === "start") {
      this.ctx.save();
      const glow = this.ctx.createRadialGradient(
        x + trigger.width / 2,
        y + trigger.height / 2,
        8,
        x + trigger.width / 2,
        y + trigger.height / 2,
        trigger.width
      );
      glow.addColorStop(0, "rgba(255,226,132,0.35)");
      glow.addColorStop(1, "rgba(255,226,132,0)");
      this.ctx.fillStyle = glow;
      this.ctx.fillRect(x - 20, y - 20, trigger.width + 40, trigger.height + 40);

      const outer = this.ctx.createLinearGradient(0, y, 0, y + trigger.height);
      outer.addColorStop(0, "#e64569");
      outer.addColorStop(1, "#a81645");
      this.ctx.fillStyle = outer;
      drawRoundedRect(this.ctx, x, y, trigger.width, trigger.height, 6);
      this.ctx.fill();

      this.ctx.strokeStyle = "#ffe5a0";
      this.ctx.lineWidth = 3;
      this.ctx.stroke();

      const inset = 6;
      const innerW = trigger.width - inset * 2;
      const innerH = trigger.height - inset * 2;
      this.ctx.fillStyle = "#8f1b40";
      drawRoundedRect(this.ctx, x + inset, y + inset, innerW, innerH, 4);
      this.ctx.fill();

      this.ctx.fillStyle = "#ffd86a";
      this.ctx.beginPath();
      this.ctx.moveTo(x + trigger.width * 0.36, y + trigger.height * 0.3);
      this.ctx.lineTo(x + trigger.width * 0.7, y + trigger.height * 0.5);
      this.ctx.lineTo(x + trigger.width * 0.36, y + trigger.height * 0.7);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.fillStyle = "#f17190";
      this.ctx.fillRect(x + inset + 3, y + inset + 2, innerW - 6, 3);

      this.ctx.fillStyle = "#7b1638";
      this.ctx.beginPath();
      this.ctx.arc(x + 9, y + 9, 2.8, 0, Math.PI * 2);
      this.ctx.arc(x + trigger.width - 9, y + 9, 2.8, 0, Math.PI * 2);
      this.ctx.arc(x + 9, y + trigger.height - 9, 2.8, 0, Math.PI * 2);
      this.ctx.arc(x + trigger.width - 9, y + trigger.height - 9, 2.8, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    } else {
      const gradient = this.ctx.createLinearGradient(0, y, 0, y + trigger.height);
      gradient.addColorStop(0, boxColor);
      gradient.addColorStop(1, "#b32552");
      this.ctx.fillStyle = gradient;
      drawRoundedRect(this.ctx, x, y, trigger.width, trigger.height, 8);
      this.ctx.fill();

      this.ctx.strokeStyle = "#fff0cc";
      this.ctx.lineWidth = 3;
      this.ctx.stroke();

      this.ctx.fillStyle = "rgba(255,255,255,0.28)";
      this.ctx.fillRect(x + 5, y + 5, trigger.width - 10, 4);

      const shine = Math.sin(this.elapsedTime * 3 + trigger.x * 0.01) * 0.5 + 0.5;
      this.ctx.fillStyle = `rgba(255,255,255,${(0.06 + shine * 0.18).toFixed(3)})`;
      this.ctx.fillRect(x + trigger.width * 0.35, y + 6, 5, trigger.height - 12);

      this.ctx.textAlign = "center";
      this.ctx.fillStyle = "#fff6dc";
      this.ctx.font = "700 28px 'Press Start 2P', 'Chewy', sans-serif";
      this.ctx.fillText("?", x + trigger.width / 2, y + trigger.height * 0.68);
    }

    this.ctx.textAlign = "center";
    const labelY = renderStyle === "envelope" || renderStyle === "love_letter" ? y - 14 : y - 12;
    const captionY = renderStyle === "envelope" || renderStyle === "love_letter"
      ? y + trigger.height + 22
      : y + trigger.height + 24;

    if (trigger.label) {
      this.ctx.font = "700 14px 'Press Start 2P', 'Baloo 2', sans-serif";
      this.ctx.fillStyle = "#fff7fb";
      this.ctx.fillText(trigger.label, x + trigger.width / 2, labelY);
    }

    if (trigger.caption) {
      this.ctx.font = "700 15px 'Baloo 2', sans-serif";
      this.ctx.fillStyle = "#fff8fb";
      this.ctx.fillText(trigger.caption, x + trigger.width / 2, captionY);
    }

    if (trigger.spotlight) {
      const arrowBounce = Math.sin(this.elapsedTime * 7) * 6;
      this.ctx.fillStyle = "#fff3ae";
      this.ctx.font = "700 18px 'Press Start 2P', sans-serif";
      this.ctx.fillText("v", x + trigger.width / 2, y - 34 + arrowBounce);
    }
  }

  drawWorldLabels() {
    for (const label of this.labels) {
      const x = label.x - this.cameraX;
      const y = label.y;
      const font = label.font ?? "700 18px 'Baloo 2', sans-serif";
      this.ctx.font = font;

      if (label.panel) {
        const padX = 18;
        const padY = 12;
        const width = (label.width ?? this.ctx.measureText(label.text).width + padX * 2);
        const height = label.height ?? 56;
        this.ctx.fillStyle = label.panelColor ?? "rgba(111,15,48,0.78)";
        drawRoundedRect(this.ctx, x - 12, y - height + 16, width, height, 12);
        this.ctx.fill();

        this.ctx.strokeStyle = label.borderColor ?? "rgba(255,216,232,0.9)";
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      }

      this.ctx.fillStyle = label.color ?? "#fff7fd";
      this.ctx.textAlign = label.align ?? "left";
      this.ctx.fillText(label.text, x, y);
    }
  }

  drawScreenLabels() {
    for (const label of this.screenLabels) {
      this.ctx.fillStyle = label.color ?? "#fff2f8";
      this.ctx.font = label.font ?? "700 22px 'Baloo 2', sans-serif";
      this.ctx.textAlign = label.align ?? "left";
      this.ctx.fillText(label.text, label.x, label.y);
    }
  }

  render() {
    this.drawBackground();
    this.drawPlatforms();

    for (const trigger of this.triggers) {
      this.drawTrigger(trigger);
    }

    this.drawPlayer();
    this.drawDecorLayers("front");
    this.drawWorldLabels();
    this.drawScreenLabels();
    this.onRenderHud(this.api());
  }

  api() {
    return {
      canvas: this.canvas,
      ctx: this.ctx,
      player: this.player,
      triggers: this.triggers,
      cameraX: this.cameraX,
      time: this.elapsedTime,
      hudMode: this.hudMode,
      fxQuality: this.fxQuality,
      setMessage: (message, ms) => this.setMessage(message, ms),
      setPaused: (value) => this.setPaused(value),
      redirect: (url, delay) => this.redirect(url, delay),
      getTrigger: (id) => this.getTrigger(id),
      setTriggerPosition: (id, x, y) => this.setTriggerPosition(id, x, y),
      showHud: (reason) => this.showHud(reason),
      hideHud: () => this.hideHud(),
      setHudMode: (mode) => this.setHudMode(mode),
    };
  }

  start() {
    if (this.frameId) {
      return;
    }

    this.lastTime = performance.now();
    this.frameId = requestAnimationFrame(this.loop);
  }

  stop() {
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  loop(now) {
    const deltaSeconds = (now - this.lastTime) / 1000;
    this.lastTime = now;

    this.step(deltaSeconds);
    this.render();

    this.frameId = requestAnimationFrame(this.loop);
  }
}
