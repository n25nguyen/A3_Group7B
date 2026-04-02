let rectangles = [];

const rectHeight = 30;

// Each lane has its own width. Space is wider. All widths must sum to 600 (canvas width).
const laneWidths = { "D": 100, "F": 100, " ": 200, "J": 100, "K": 100 };

let level = 1;
let gameOver = false;
const maxLevels = 3;

let particles = [];

const hitBuffer = 20;
const barHeight = 12 + hitBuffer;

let laneGlow = { D: 0, F: 0, " ": 0, J: 0, K: 0 };

let paused = false;
let bgMusic;
let menuMusic;

const synthLow = new Audio("assets/audio/beep.wav");
const synthHigh = new Audio("assets/audio/synthHigh.wav");

const levelCompleteScreen = document.getElementById("levelCompleteScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
let levelCompleteTimer = null;

let hadPositiveScore = false;

let combo = 0;
let musicMuted = false;

/* ---------- Scoring ---------- */
let levelScore = 0;
let totalPossibleScore = 0;

const SCORE_MISS    = 0;
const SCORE_EARLY   = 100;
const SCORE_LATE    = 100;
const SCORE_PERFECT = 200;
const SCORE_PENALTY = 100;
const TOTAL_POSSIBLE_ROUND_1 = 5200;
const TOTAL_POSSIBLE_ROUND_2 = 10200;
const TOTAL_POSSIBLE_ROUND_3 = 11200;

/* ---------- Level Progress ---------- */
let levelStartTime = 0;
let levelEndTime = 0;

function showHitFeedback(text, type) {
  const hitFeedback = document.getElementById("hitFeedback");

  // Define neon colors for different feedback types
  const colors = {
    "Perfect": "#00ffea", // Cyan
    "Early":   "#ffea00", // Yellow
    "Late":    "#ff00ff", // Magenta
    "Miss":    "#ff3b3b"  // Red
  };

  hitFeedback.innerText = text;

  // Get color from colors object or fall back to default
  const color = colors[type] || "#ffffff"; // Default to white if unmatched
  hitFeedback.style.color = color;
  
  // Neon glow effect
  hitFeedback.style.textShadow = `
    0 0 6px ${color},
    0 0 12px ${color},
    0 0 18px ${color},
    0 0 24px ${color}
  `;

  // Animation and visibility reset
  hitFeedback.style.animation = 'none';
  hitFeedback.style.opacity = "1";

  // Trigger reflow for animation restart
  void hitFeedback.offsetWidth;

  // Quick pop effect
  hitFeedback.style.animation = 'popQuick 0.3s ease-out';

  // Fade out effect after showing feedback
  setTimeout(() => { hitFeedback.style.opacity = "0"; }, 600); // Adjust fade time if necessary
}

function getStarCount(score, possible) {
  if (possible === 0) return 0;
  const pct = score / possible;
  if (pct <= 0.10) return 0;
  if (pct <= 0.50) return 1;
  if (pct <= 0.90) return 2;
  return 3;
}

function getScoreImage(score, possible) {
  const stars = getStarCount(score, possible);
  return `assets/images/score${stars}.png`;
}

function updateGameplayLevelUI() {
  document.getElementById("gameLevelBadge").textContent = `Level ${level}`;
  document.getElementById("gameScreen").classList.remove("screen--bkgd2");
}

function applyMusicVolume() {
  const v = musicMuted ? 0 : 0.5;
  if (bgMusic) bgMusic.volume = v;
  if (menuMusic) menuMusic.volume = v;
}

function updateMuteButtonVisual() {
  const el = document.getElementById("muteButton");
  if (!el) return;
  el.textContent = musicMuted ? "MUTED" : "MUSIC";
  el.setAttribute("aria-pressed", musicMuted ? "true" : "false");
}

function updatePlayHud() {
  const scoreEl = document.getElementById("playScoreDisplay");
  const comboEl = document.getElementById("playComboDisplay");
  if (!scoreEl || !comboEl) return;
  scoreEl.textContent = `Score ${levelScore} / ${totalPossibleScore}`;
  comboEl.textContent = combo > 0 ? `Combo ×${combo}` : "Combo —";
}

function getHintMessageForLevel() {
  if (level === 1) {
    return "Hit F and J as the notes reach the bar";
  }
  if (level === 2) {
    return "Hit D, F, J, and K as the notes reach the bar";
  }
  return "Hit D, F, space, J, and K as the notes reach the bar";
}

function setTotalPossibleScore() {
  switch (level) {
    case 1:
      totalPossibleScore = TOTAL_POSSIBLE_ROUND_1;
      break;
    case 2:
      totalPossibleScore = TOTAL_POSSIBLE_ROUND_2;
      break;
    case 3:
      totalPossibleScore = TOTAL_POSSIBLE_ROUND_3;
      break;
    default:
      totalPossibleScore = 0;
  }
}

function beginLevel(levelNum) {
  if (levelCompleteTimer) {
    clearTimeout(levelCompleteTimer);
    levelCompleteTimer = null;
  }
  level = levelNum;
  spawnedBeats = new Set();
  rectangles = [];
  particles = [];
  gameOver = false;
  paused = false;
  levelScore = 0;
  setTotalPossibleScore();
  bgMusic.currentTime = 0;
  calculateLevelEndTime();
  hadPositiveScore = false;
  combo = 0;
  updateGameplayLevelUI();
  document.getElementById("message").innerText = getHintMessageForLevel();
  showScreen(gameScreen);
  playBackgroundMusic();
}

function showLevelIntroScreen(targetLevel) {
  introTargetLevel = targetLevel;
  const heading = document.getElementById("levelIntroHeading");
  const content = document.getElementById("levelIntroContent");

  if (targetLevel === 2) {
    heading.textContent = "LEVEL 2 — NEW KEYS";
    content.innerHTML = `
      <div class="instructionsText">
        <p>
          Two more lanes are in play: press <strong>D</strong> for the left outer lane and
          <strong>K</strong> for the right outer lane (the pink lanes). Keep using
          <strong>F</strong> and <strong>J</strong> for the cyan lanes in the middle.
        </p>
        <figure class="keyDiagram" aria-label="Keys D F J and K">
          <div class="keyDiagramRow keyDiagramRowFive">
            <span class="keyCap keyCapLaneOuter">D</span>
            <span class="keyCap keyCapActive">F</span>
            <span class="keyCap keyCapGap" aria-hidden="true">·</span>
            <span class="keyCap keyCapActive">J</span>
            <span class="keyCap keyCapLaneOuter">K</span>
          </div>
          <figcaption class="keyDiagramCaption">
            New outer lanes · <kbd class="keyCapInline keyCapInlineOuter">D</kbd> ·
            <kbd class="keyCapInline keyCapInlineOuter">K</kbd>
          </figcaption>
        </figure>
      </div>`;
  } else if (targetLevel === 3) {
    heading.textContent = "LEVEL 3 — SPACE BAR";
    content.innerHTML = `
      <div class="instructionsText">
        <p>
          The wide center lane uses the <strong>space bar</strong> (yellow notes). All five lanes are
          active: <strong>D</strong>, <strong>F</strong>, <strong>space</strong>, <strong>J</strong>, and <strong>K</strong>.
        </p>
        <figure class="keyDiagram" aria-label="All five keys including space">
          <div class="keyDiagramRow keyDiagramRowFive">
            <span class="keyCap keyCapLaneOuter">D</span>
            <span class="keyCap keyCapActive">F</span>
            <span class="keyCap keyCapSpace">Space</span>
            <span class="keyCap keyCapActive">J</span>
            <span class="keyCap keyCapLaneOuter">K</span>
          </div>
          <figcaption class="keyDiagramCaption">
            Center lane · thumb · <kbd class="keyCapInline keyCapInlineSpace">Space</kbd>
          </figcaption>
        </figure>
      </div>`;
  }

  showScreen(levelIntroScreen);
}

function showGameOver() {
  if (levelCompleteTimer) {
    clearTimeout(levelCompleteTimer);
    levelCompleteTimer = null;
  }
  gameOver = true;
  bgMusic.pause();
  document.getElementById("gameOverLevelLine").textContent = `Level ${level}`;
  document.getElementById("gameOverScoreLine").textContent = `Score: ${levelScore}`;
  showScreen(gameOverScreen);
}

function showLevelComplete() {
  bgMusic.pause();
  const title   = document.getElementById("levelCompleteTitle");
  const winLine = document.getElementById("levelCompleteWinLine");
  const nextBtn = document.getElementById("nextLevelButton");
  const scoreEl = document.getElementById("levelScore");
  const imgEl   = document.getElementById("scoreImage");

  const completedLevel = level;
  const stars = getStarCount(levelScore, totalPossibleScore);

  title.innerText =
    completedLevel === maxLevels ? "GAME OVER" : `LEVEL ${completedLevel} COMPLETE!`;
  winLine.style.display = completedLevel === maxLevels ? "block" : "none";

  nextBtn.style.display = completedLevel < maxLevels ? "block" : "none";

  scoreEl.innerText = "";
  const scoreLine = document.createElement("span");
  scoreLine.className = "levelCompleteScoreLine";
  scoreLine.textContent = `Score: ${levelScore} / ${totalPossibleScore}`;
  scoreEl.appendChild(scoreLine);
  const starsLine = document.createElement("span");
  starsLine.className = "levelCompleteStarsLine";
  scoreEl.appendChild(document.createElement("br"));
  scoreEl.appendChild(starsLine);

  imgEl.src = getScoreImage(levelScore, totalPossibleScore);
  imgEl.alt = `Rating: ${stars} out of 3 stars`;
  imgEl.style.display = "block";

  showScreen(levelCompleteScreen);
  levelCompleteTimer = null;
}

/* ---------- Hit bar ---------- */
const barBaseY = 550;
let barBaseYValue;
const barOscillateStart = 30;
const barAmplitude = 25;
const barPeriod = 1.5;

function getBarY(songTime) {
  if (songTime < barOscillateStart) return barBaseYValue;
  const t = songTime - barOscillateStart;
  return barBaseYValue + barAmplitude * sin((TWO_PI * t) / barPeriod);
}

/* ---------- Beat / timing constants ---------- */
const BPM = 160;
const beatInterval = 60 / BPM;
const beatOffset = 8;
const leadin = 6;
const travelTime = leadin * beatInterval;
let pixelsPerSecond;

/* ---------- Lane layout ---------- */
const laneOrder = ["D", "F", " ", "J", "K"];

function getLaneX(key) {
  let x = 0;
  for (let lane of laneOrder) {
    if (lane === key) return x;
    x += laneWidths[lane];
  }
}

const laneColors = {
  "D": [255, 0, 255],
  "F": [0, 255, 255],
  " ": [255, 220, 0],
  "J": [0, 255, 255],
  "K": [255, 0, 255],
};

/* ---------- Beatmap ---------- */
const beatmap = generateBeatmap();

/* ---------- Track which beatmap notes have been spawned ---------- */
let spawnedBeats = new Set();

/* ---------- SCREEN NAVIGATION ---------- */
const homeScreen         = document.getElementById("homeScreen");
const instructionsScreen = document.getElementById("instructionsScreen");
const gameScreen         = document.getElementById("gameScreen");
const levelIntroScreen   = document.getElementById("levelIntroScreen");

let introTargetLevel = 2;

function showScreen(screen) {
  homeScreen.style.display          = "none";
  instructionsScreen.style.display  = "none";
  gameScreen.style.display          = "none";
  levelCompleteScreen.style.display = "none";
  gameOverScreen.style.display      = "none";
  levelIntroScreen.style.display    = "none";
  screen.style.display = "flex";

  const chill =
    screen === homeScreen ||
    screen === instructionsScreen ||
    screen === levelCompleteScreen;

  if (chill && menuMusic) {
    bgMusic.pause();
    applyMusicVolume();
    menuMusic.play().catch((err) => console.log("Chill music blocked:", err));
  } else if (menuMusic) {
    menuMusic.pause();
  }
}

/* ---------- GAME SETUP ---------- */
function setup() {
  createCanvas(600, 600).parent("gameContainer");
  barBaseYValue = height - 50;
  pixelsPerSecond = (barBaseYValue + rectHeight) / travelTime;

  bgMusic = document.getElementById("bgMusic");
  bgMusic.loop = true;
  menuMusic = document.getElementById("menuMusic");
  menuMusic.loop = true;
  applyMusicVolume();
  updateMuteButtonVisual();
  synthLow.volume = 0.5;

  if (gameScreen.style.display === "none") {
    menuMusic.play().catch(() => {});
  }

  document.getElementById("muteButton").onclick = () => {
    musicMuted = !musicMuted;
    applyMusicVolume();
    updateMuteButtonVisual();
  };
  document.getElementById("muteButton").addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.currentTarget.click();
    }
  });

  document.getElementById("homePlayButton").onclick = () => {
    showScreen(gameScreen);
    resetGame();
    playBackgroundMusic();
  };

  document.getElementById("instructionsPlayButton").onclick = () => {
    showScreen(gameScreen);
    resetGame();
    playBackgroundMusic();
  };

  document.getElementById("pauseButton").onclick = () => {
    paused = !paused;
    document.getElementById("pauseButton").innerText = paused ? "▶ PLAY" : "II PAUSE";
    applyMusicVolume();
    if (paused) bgMusic.pause();
    else bgMusic.play().catch((err) => console.log("Music blocked:", err));
  };

  document.getElementById("retryButton").addEventListener("click", () => {
    const currentLevel = level;
    resetGame();
    level = currentLevel;
    hadPositiveScore = false;
    combo = 0;
    calculateLevelEndTime();
    updateGameplayLevelUI();
    document.getElementById("message").innerText = getHintMessageForLevel();
  });

  document.getElementById("instructionsButton").onclick = () => showScreen(instructionsScreen);
  document.getElementById("instructionsBackButton").onclick = () => showScreen(homeScreen);
  document.getElementById("backButton").onclick = () => showScreen(homeScreen);

  document.getElementById("nextLevelButton").onclick = () => {
    if (levelCompleteTimer) {
      clearTimeout(levelCompleteTimer);
      levelCompleteTimer = null;
    }
    const next = level + 1;
    if (next === 2 || next === 3) {
      showLevelIntroScreen(next);
    }
  };

  document.getElementById("levelIntroContinueButton").onclick = () => {
    beginLevel(introTargetLevel);
  };

  document.getElementById("tryAgainButton").onclick = () => {
    if (levelCompleteTimer) { clearTimeout(levelCompleteTimer); levelCompleteTimer = null; }
    spawnedBeats = new Set();
    rectangles = [];
    particles = [];
    gameOver = false;
    paused = false;
    levelScore = 0;
    setTotalPossibleScore();
    bgMusic.currentTime = 0;
    calculateLevelEndTime();
    hadPositiveScore = false;
    combo = 0;
    updateGameplayLevelUI();
    document.getElementById("message").innerText = getHintMessageForLevel();
    showScreen(gameScreen);
    playBackgroundMusic();
  };

  document.getElementById("gameOverRetryButton").onclick = () => {
    if (levelCompleteTimer) {
      clearTimeout(levelCompleteTimer);
      levelCompleteTimer = null;
    }
    spawnedBeats = new Set();
    rectangles = [];
    particles = [];
    gameOver = false;
    paused = false;
    hadPositiveScore = false;
    combo = 0;
    levelScore = 0;
    setTotalPossibleScore();
    bgMusic.currentTime = 0;
    calculateLevelEndTime();
    document.getElementById("message").innerText = getHintMessageForLevel();
    showScreen(gameScreen);
    updateGameplayLevelUI();
    playBackgroundMusic();
  };

  document.getElementById("gameOverHomeButton").onclick = () => {
    if (levelCompleteTimer) {
      clearTimeout(levelCompleteTimer);
      levelCompleteTimer = null;
    }
    bgMusic.pause();
    bgMusic.currentTime = 0;
    level = 1;
    gameOver = false;
    hadPositiveScore = false;
    showScreen(homeScreen);
  };

  document.getElementById("levelHomeButton").onclick = () => {
    if (levelCompleteTimer) { clearTimeout(levelCompleteTimer); levelCompleteTimer = null; }
    bgMusic.pause();
    bgMusic.currentTime = 0;
    level = 1;
    showScreen(homeScreen);
  };
}

function playBackgroundMusic() {
  applyMusicVolume();
  if (bgMusic.paused) {
    bgMusic.play().catch((err) => console.log("Playback blocked:", err));
  }
}

/* ---------- RESET GAME ---------- */
function resetGame() {
  level = 1;
  gameOver = false;
  paused = false;
  rectangles = [];
  particles = [];
  laneGlow = { D: 0, F: 0, " ": 0, J: 0, K: 0 };
  spawnedBeats = new Set();
  levelCompleteTimer = null;
  levelScore = 0;
  setTotalPossibleScore();
  bgMusic.currentTime = 0;
  document.getElementById("retryButton").style.display = "none";
  document.getElementById("hitFeedback").innerText = "";
  document.getElementById("message").innerText = getHintMessageForLevel();
  hadPositiveScore = false;
  combo = 0;
  calculateLevelEndTime();
  updateGameplayLevelUI();
}

/* ---------- SPAWN NOTES FROM BEATMAP ---------- */
function spawnScheduledNotes() {
  const songTime = bgMusic.currentTime;

  for (let i = 0; i < beatmap.length; i++) {
    const entry = beatmap[i];
    if (entry.level !== level) continue;
    if (spawnedBeats.has(i)) continue;

    const targetTime = (entry.beat + beatOffset) * beatInterval;
    const spawnTime  = targetTime - travelTime;

    if (songTime >= spawnTime) {
      rectangles.push({
        key: entry.key,
        targetTime: targetTime,
        x: getLaneX(entry.key),
        w: laneWidths[entry.key],
        y: -rectHeight,
        hit: false,
      });
      spawnedBeats.add(i);
    }
  }
}

/* ---------- GAME LOOP ---------- */
function draw() {
  background(0);
  noStroke();

  // ---- Progress Bar ----
const songTime = bgMusic.currentTime;
let progress = constrain(songTime / levelEndTime, 0, 1);

const barX = 50;
const barYProgress = 20;
const barW = width - 100;
const barH = 12;

// Outline
noFill();
stroke(255);
strokeWeight(2);
rect(barX, barYProgress, barW, barH);

// Fill
noStroke();
fill(255);
rect(barX, barYProgress, barW * progress, barH);

  if (!gameOver && !paused) {
    spawnScheduledNotes();
  }

  // ---- Draw lanes ----
  const topAlpha    = 102;
  const bottomAlpha = 255;
  const steps       = 60;

  for (let lane of laneOrder) {
    const lx = getLaneX(lane);
    const lw = laneWidths[lane];
    const [r, g, b] = laneColors[lane];

    for (let i = 0; i < steps; i++) {
      const alphaValue = lerp(topAlpha, bottomAlpha, i / (steps - 1));
      const yPos = (height / steps) * i;
      const h    = height / steps;

      strokeWeight(4);
      stroke(r, g, b, laneGlow[lane]);
      noFill();
      rect(lx, yPos, lw, h);

      noStroke();
      const isDark = lane === "D" || lane === " " || lane === "K";
      fill(isDark ? color(35, 35, 35, alphaValue) : color(60, 60, 60, alphaValue));
      rect(lx, yPos, lw, h);
    }

    laneGlow[lane] = max(0, laneGlow[lane] - 5);
  }

  // ---- Hit bar ----
  const currentBarY = getBarY(bgMusic.currentTime);
  drawingContext.shadowBlur  = 25;
  drawingContext.shadowColor = color(255);
  fill(255, 200);
  rect(0, currentBarY, width, barHeight);
  drawingContext.shadowBlur = 0;

  // ---- Update and draw rectangles ----
  if (!gameOver) {
    const songTime = bgMusic.currentTime;

    rectangles.forEach((r) => {
      if (!r.hit) {
        const timeUntilHit = r.targetTime - songTime;
        r.y = getBarY(songTime) - timeUntilHit * pixelsPerSecond;

        const [rc, gc, bc] = laneColors[r.key];
        drawingContext.shadowBlur  = 25;
        drawingContext.shadowColor = color(rc, gc, bc);
        fill(rc, gc, bc);
        rect(r.x, r.y, r.w, rectHeight, 12);
        drawingContext.shadowBlur = 0;

        // Missed note: mark hit, score 0, show "Miss", enable penalties
        if (r.y > getBarY(songTime) + barHeight + 10) {
          r.hit = true;
          levelScore += SCORE_MISS;
          combo = 0;
          showHitFeedback("Miss", "red");
        }
      }
    });

    // Check level complete
    const levelNotes = beatmap.filter((e) => e.level === level);
    const allSpawned = levelNotes.every((_, i) => {
      const globalIndex = beatmap.indexOf(levelNotes[i]);
      return spawnedBeats.has(globalIndex);
    });

    if (allSpawned && rectangles.filter((r) => !r.hit).length === 0 && !gameOver) {
      gameOver = true;
      if (levelCompleteTimer === null) {
        const fourBeats = 4 * beatInterval * 1000;
        levelCompleteTimer = setTimeout(showLevelComplete, fourBeats);
      }
    }
  }

  // ---- Particles ----
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    fill(red(p.color), green(p.color), blue(p.color), p.alpha);
    noStroke();
    ellipse(p.x, p.y, p.size);
    if (!paused) {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 10;
    }
    if (p.alpha <= 0) particles.splice(i, 1);
  }

  // ---- Pause overlay ----
  if (paused) {
    noStroke();
    fill(0, 0, 0, 120);
    rect(0, 0, width, height);
    textAlign(CENTER, CENTER);
    textSize(52);
    textFont('Micro 5'); 
    fill(255);
    text("PAUSED", width * 0.5, height * 0.5);
    textStyle(NORMAL);
  }

  const gameScreenEl = document.getElementById("gameScreen");
  if (gameScreenEl && gameScreenEl.style.display === "flex") {
    updatePlayHud();
  }
}

/* ---------- INPUT ---------- */
function keyPressed() {
  if (paused || gameOver) return;

  const pressedKey = key === " " ? " " : key.toUpperCase();

  if (laneGlow.hasOwnProperty(pressedKey)) {
    laneGlow[pressedKey] = 80;
  }

  synthLow.currentTime = 0;
  synthLow.play().catch((err) => console.log("Sound blocked:", err));

  const songTime    = bgMusic.currentTime;
  const currentBarY = getBarY(songTime);

  // Check if this keypress hit any rectangle
  let hitSomething = false;

  rectangles.forEach((r) => {
    if (!r.hit && r.key === pressedKey) {
      if (
        r.y + rectHeight >= currentBarY - hitBuffer &&
        r.y <= currentBarY + barHeight + hitBuffer
      ) {
        r.hit = true;
        hitSomething = true;

        const timingError = Math.abs(r.targetTime - songTime);
        let hitType, points;
        if (timingError < 0.05) {
          hitType = "Perfect"; points = SCORE_PERFECT;
        } else if (timingError < 0.12) {
          hitType = "Early";   points = SCORE_EARLY;
        } else {
          hitType = "Late";    points = SCORE_LATE;
        }

        levelScore += points;
        if (points > 0) {
          hadPositiveScore = true;
          combo += 1;
        }
        // Show feedback with the appropriate hit type for color
        showHitFeedback(hitType, hitType);

        const [rc, gc, bc] = laneColors[r.key];
        createBurst(r.x, r.y, r.w, color(rc, gc, bc));
      }
    }
  });

  // Handle misses
  if (!hitSomething && laneGlow.hasOwnProperty(pressedKey)) {
    combo = 0;
    levelScore = max(0, levelScore - SCORE_PENALTY);
    showHitFeedback("-100", "Miss"); // Show the penalty feedback in the color for "Miss"
    if (hadPositiveScore && levelScore === 0) {
      showGameOver();
    }
  }

  if (key === " ") return false;
}


function createBurst(x, y, w, noteColor) {
  for (let i = 0; i < 8; i++) {
    particles.push({
      x: x + w / 2,
      y: y + rectHeight / 2,
      vx: random(-2, 2),
      vy: random(-2, -4),
      alpha: 255,
      color: noteColor,
      size: random(4, 8),
    });
  }
}

/* ---------- PROGRESS BAR IDK ---------- */
function calculateLevelEndTime() {
  const levelNotes = beatmap.filter(e => e.level === level);
  let lastBeat = 0;

  levelNotes.forEach(n => {
    if (n.beat > lastBeat) lastBeat = n.beat;
  });

  levelStartTime = 0;
  levelEndTime = (lastBeat + beatOffset) * beatInterval;
}