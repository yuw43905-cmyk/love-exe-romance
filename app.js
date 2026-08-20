const $ = (selector) => document.querySelector(selector);
const app = $("#app");
const intro = $("#intro");
const story = $("#story");
const particles = $("#particleLayer");
const soundToggle = $("#soundToggle");
let soundOn = true;
let timers = [];
let matrixRain;

class CodeWaterfall {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: true });
    this.glyphs = Array.from("LOVE♥LOVE♥♥");
    this.mode = "intro";
    this.pulseUntil = 0;
    this.lastFrame = 0;
    this.reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.resize = this.resize.bind(this);
    this.draw = this.draw.bind(this);
    addEventListener("resize", this.resize, { passive: true });
    this.resize();
    requestAnimationFrame(this.draw);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    this.dpr = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.fontSize = Math.max(10, Math.min(14, this.width / 33));
    this.columns = Math.ceil(this.width / this.fontSize) + 1;
    this.drops = Array.from({ length: this.columns }, () => Math.random() * (this.height / this.fontSize));
    this.speeds = Array.from({ length: this.columns }, () => .72 + Math.random() * 1.08);
    this.ctx.fillStyle = "#02040d";
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  setMode(mode) { this.mode = mode; }
  pulse() { this.pulseUntil = performance.now() + 900; }

  inHeart(x, y) {
    const nx = (x - this.width / 2) / (this.width * .23);
    const ny = (y - this.height * .36) / (this.height * .145);
    const q = nx * nx + ny * ny - 1;
    return q * q * q - nx * nx * ny * ny * ny < 0;
  }

  draw(time) {
    if (time - this.lastFrame < (this.reducedMotion ? 180 : 34)) {
      requestAnimationFrame(this.draw);
      return;
    }
    this.lastFrame = time;
    const story = this.mode === "story";
    const pulsing = time < this.pulseUntil;
    this.ctx.fillStyle = story ? "rgba(2,4,13,.055)" : "rgba(2,4,13,.072)";
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.font = `600 ${this.fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    this.ctx.textBaseline = "top";

    for (let i = 0; i < this.columns; i++) {
      const x = i * this.fontSize;
      const y = this.drops[i] * this.fontSize;
      for (let tail = 0; tail < 4; tail++) {
        const glyphY = y - tail * this.fontSize;
        const heart = this.inHeart(x, glyphY);
        const head = tail === 0 && Math.random() > .74;
        const alpha = Math.max(.3, .98 - tail * .2);
        if (heart && (pulsing || Math.random() > .34)) {
          this.ctx.fillStyle = head ? "#fff4f8" : `rgba(255,${92 + Math.floor(Math.random() * 60)},${150 + Math.floor(Math.random() * 55)},${alpha})`;
        } else {
          const light = 68 + Math.floor(Math.random() * 24);
          this.ctx.fillStyle = head ? "#effdff" : `hsla(${184 + Math.random() * 18},98%,${light}%,${alpha})`;
        }
        this.ctx.fillText(this.glyphs[Math.floor(Math.random() * this.glyphs.length)], x, glyphY);
      }
      const speedBoost = story ? 1.55 : 1;
      this.drops[i] += this.speeds[i] * speedBoost;
      if (y > this.height + Math.random() * 180) {
        this.drops[i] = -2 - Math.random() * 22;
        this.speeds[i] = .72 + Math.random() * 1.08;
      }
    }
    requestAnimationFrame(this.draw);
  }
}

function burst(x, y, amount = 9) {
  for (let i = 0; i < amount; i++) {
    const heart = document.createElement("span");
    const angle = (Math.PI * 2 * i) / amount + Math.random() * .4;
    const distance = 45 + Math.random() * 85;
    heart.className = "particle";
    heart.textContent = i % 3 ? "♥" : "·";
    heart.style.left = `${x}px`;
    heart.style.top = `${y}px`;
    heart.style.setProperty("--x", `${Math.cos(angle) * distance}px`);
    heart.style.setProperty("--y", `${Math.sin(angle) * distance - 35}px`);
    heart.style.setProperty("--s", `${.6 + Math.random() * .9}`);
    heart.style.setProperty("--r", `${-70 + Math.random() * 140}deg`);
    particles.append(heart);
    setTimeout(() => heart.remove(), 1300);
  }
}

function chime() {
  if (!soundOn) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    [261.63, 329.63, 392, 523.25].forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(.055, ctx.currentTime + .03 + index * .1);
      gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + 1.1 + index * .1);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(ctx.currentTime + index * .1);
      oscillator.stop(ctx.currentTime + 1.25 + index * .1);
    });
  } catch (_) {}
}

function clearTimers() { timers.forEach(clearTimeout); timers = []; }

function runStory() {
  clearTimers();
  chime();
  const rect = $("#runButton").getBoundingClientRect();
  burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 15);
  matrixRain.setMode("story");
  app.classList.add("story-mode");
  intro.classList.remove("is-active");
  story.classList.add("is-active");
  document.querySelectorAll("[data-step]").forEach((line, index) => {
    timers.push(setTimeout(() => line.classList.add("show"), 550 + index * 430));
  });
  timers.push(setTimeout(() => $("#commitCard").classList.add("show"), 3300));
  timers.push(setTimeout(() => {
    $("#storyActions").classList.add("show");
    burst(innerWidth / 2, innerHeight * .64, 20);
  }, 4100));
}

function resetStory() {
  clearTimers();
  document.querySelectorAll("[data-step]").forEach((line) => line.classList.remove("show"));
  $("#commitCard").classList.remove("show");
  $("#storyActions").classList.remove("show");
  story.classList.remove("is-active");
  app.classList.remove("story-mode");
  matrixRain.setMode("intro");
  intro.classList.add("is-active");
}

$("#heartButton").addEventListener("click", (event) => {
  const rect = event.currentTarget.getBoundingClientRect();
  burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 12);
  matrixRain.pulse();
  if (navigator.vibrate) navigator.vibrate([20, 35, 35]);
});
$("#runButton").addEventListener("click", runStory);
$("#replayButton").addEventListener("click", resetStory);
soundToggle.addEventListener("click", () => {
  soundOn = !soundOn;
  soundToggle.setAttribute("aria-pressed", String(soundOn));
  soundToggle.textContent = soundOn ? "♪" : "×";
});
$("#shareButton").addEventListener("click", async () => {
  const data = { title: "Love.exe · 程序员的浪漫", text: "在所有可能的世界里，我都选择与你相遇。", url: location.href };
  try { if (navigator.share) await navigator.share(data); else await navigator.clipboard.writeText(location.href); } catch (_) {}
});
document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && intro.classList.contains("is-active")) runStory();
});
document.addEventListener("pointerdown", (event) => {
  if (event.target.closest("button")) return;
  burst(event.clientX, event.clientY, 5);
});

const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
const standalone = window.navigator.standalone === true || matchMedia("(display-mode: standalone)").matches;
if (isIos && !standalone && !localStorage.getItem("love-install-tip")) {
  timers.push(setTimeout(() => $("#installTip").classList.add("show"), 5200));
}
$("#closeTip").addEventListener("click", () => {
  $("#installTip").classList.remove("show");
  localStorage.setItem("love-install-tip", "closed");
});
if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
matrixRain = new CodeWaterfall($("#codeRain"));

