// Stew Clicker Game

// Utility to generate unhinged stew names
const stewAdjectives = [
  "Uranium", "Ectoplasmic", "Quantum", "Cursed", "Galactic", "Forbidden", "Nuclear",
  "Haunted", "Cryptid", "Interdimensional", "Vampiric", "Gooey", "Radioactive", "Eldritch",
  "Spicy", "Lava", "Fungal", "Sludge", "Toxic", "Slippery", "Rotten", "Feral", "Warped", "Wormy",
  "Electric", "Ghostly", "Frostbitten", "Magma", "Turbo", "Mutant", "Abyssal", "Cosmic", "Inverted",
  "Molten", "Sticky", "Shattered", "Scream", "Venomous", "Obsidian", "Plutonium", "Spectral", "Cackling",
  "Blighted", "Carnivorous", "Dreaming", "Corrosive", "Vortex", "Jelly", "Nightmare", "Void"
];

const stewNouns = [
  "Cranium", "Eyeball", "Toenail", "Mushroom", "Scream", "Basilisk", "Goblin",
  "Dimension", "Night", "Slime", "Rat", "Bat", "Chasm", "Acid", "Worm", "Cactus",
  "Comet", "Brain", "Mist", "Mire", "Soup", "Chowder", "Broth", "Sludge", "Lich",
  "Toad", "Enigma", "Crypt", "Growth", "Fever", "Goo", "Sting", "Hex", "Curse",
  "Shriek", "Gloom", "Specter", "Fang", "Flesh", "Wraith", "Gargoyle", "Ooze", "Sap",
  "Plague", "Mold", "Rift", "Gears", "Ghoul", "Thorn", "Venom"
];

function generateStewNames(count) {
  const names = [];
  const used = new Set();
  while (names.length < count) {
    let adj = stewAdjectives[Math.floor(Math.random() * stewAdjectives.length)];
    let noun = stewNouns[Math.floor(Math.random() * stewNouns.length)];
    let name = `${adj} ${noun} Stew`;
    if (!used.has(name)) {
      used.add(name);
      names.push(name);
    }
  }
  return names;
}

// Generate upgrade names
const cpsUpgradeNames = generateStewNames(50);
const cpUpgradeNames = generateStewNames(50);

// ---- BUFF MULTIPLIER: Adjust this to change the buff dynamically ----
const UPGRADE_BUFF_MULTIPLIER_CPS = 5; // Buffs the CPS gain per upgrade (OG was 1)
const UPGRADE_BUFF_MULTIPLIER_CP = 3;  // Buffs the CP gain per upgrade (OG was 1)

// ---- REBIRTH COST CONFIG ----
const REBIRTH_BASE_COST = 5000000;      // Base cost for first rebirth
const REBIRTH_COST_MULTIPLIER = 2;      // Cost multiplies by this every rebirth

class StewClicker {
  constructor() {
    this.stews = 0;
    this.clickPower = 1;
    this.cps = 0;
    this.cpsUpgrades = [];
    this.cpUpgrades = [];
    this.cpsCosts = [];
    this.cpCosts = [];
    this.cpsLevels = Array(50).fill(0);
    this.cpLevels = Array(50).fill(0);
    this.multiplier = 1; // Rebirth multiplier
    this.rebirths = 0;
    this.maxStews = 0; // For generation-based rebirth

    // Set upgrade values and costs
    for (let i = 0; i < 50; i++) {
      // Exponential cost scaling (Original)
      this.cpsCosts[i] = Math.floor(100 * Math.pow(1.15, i));
      this.cpCosts[i] = Math.floor(75 * Math.pow(1.17, i));
      // OG: this.cpsUpgrades[i] = 1 + i;
      // OG: this.cpUpgrades[i] = 1 + Math.floor(i / 2);

      // BUFF: Multiply OG values by buff multiplier constants
      this.cpsUpgrades[i] = (1 + i) * UPGRADE_BUFF_MULTIPLIER_CPS;
      this.cpUpgrades[i] = (1 + Math.floor(i / 2)) * UPGRADE_BUFF_MULTIPLIER_CP;
    }
  }

  click(showFloat = true) {
    const amount = this.clickPower * this.multiplier;
    this.stews += amount;
    if (this.stews > this.maxStews) this.maxStews = this.stews;
    this.update();
    if (showFloat && typeof showFloatingAmount === "function") {
      showFloatingAmount(amount);
    }
    autosaveGame(); // Autosave after click
  }

  buyCpsUpgrade(idx) {
    if (this.stews >= this.cpsCosts[idx]) {
      this.stews -= this.cpsCosts[idx];
      this.cps += this.cpsUpgrades[idx] * this.multiplier;
      this.cpsLevels[idx]++;
      this.cpsCosts[idx] = Math.floor(this.cpsCosts[idx] * 1.35); // Cost increases after buy
      if (this.stews > this.maxStews) this.maxStews = this.stews;
      this.update();
      autosaveGame(); // Autosave after buy
    }
  }

  buyCpUpgrade(idx) {
    if (this.stews >= this.cpCosts[idx]) {
      this.stews -= this.cpCosts[idx];
      this.clickPower += this.cpUpgrades[idx] * this.multiplier;
      this.cpLevels[idx]++;
      this.cpCosts[idx] = Math.floor(this.cpCosts[idx] * 1.32);
      if (this.stews > this.maxStews) this.maxStews = this.stews;
      this.update();
      autosaveGame(); // Autosave after buy
    }
  }

  tick() {
    this.stews += (this.cps / 10);
    if (this.stews > this.maxStews) this.maxStews = this.stews;
    this.update();
    // No autosave here (ticks are too frequent)
  }

  canRebirth() {
    // Only allow rebirth after reaching calculated rebirth cost
    return this.stews >= this.getRebirthCost();
  }

  getRebirthCost() {
    // Cost increases exponentially by REBIRTH_COST_MULTIPLIER for each rebirth
    return Math.floor(REBIRTH_BASE_COST * Math.pow(REBIRTH_COST_MULTIPLIER, this.rebirths));
  }

  getNextMultiplier() {
    // Multiplier is based on the highest stew ever held (maxStews).
    // For every full 5,000,000 stews ever held, gain +1 to the multiplier (minimum 2x per rebirth)
    // e.g. 5,000,000 = x2, 10,000,000 = x3, 15,000,000 = x4, etc.
    if (this.maxStews < 5000000) return 1;
    return 1 + Math.floor(this.maxStews / 5000000);
  }

  rebirth() {
    if (!this.canRebirth()) return;
    this.rebirths++;
    this.multiplier = this.getNextMultiplier();
    // Reset stews and upgrades, but keep multiplier and rebirth count
    this.stews = 0;
    this.clickPower = 1;
    this.cps = 0;
    this.cpsLevels = Array(50).fill(0);
    this.cpLevels = Array(50).fill(0);

    // Reset upgrade costs
    for (let i = 0; i < 50; i++) {
      this.cpsCosts[i] = Math.floor(100 * Math.pow(1.15, i));
      this.cpCosts[i] = Math.floor(75 * Math.pow(1.17, i));
    }

    // Keep maxStews for future rebirths
    this.update();
    autosaveGame(); // Autosave after rebirth
  }

  update() {
    if (typeof render === 'function') render();
  }
}

function stewIconGrow() {
  const stewIcon = document.getElementById('stew-icon');
  if (!stewIcon) return;
  stewIcon.classList.add('grow');
  setTimeout(() => {
    stewIcon.classList.remove('grow');
  }, 700);
}

let game = new StewClicker();

function render() {
  document.getElementById('stew-count').textContent = Math.floor(game.stews);
  document.getElementById('cps').textContent = game.cps.toFixed(1);
  document.getElementById('cp').textContent = game.clickPower;
  document.getElementById('rebirth-mult').textContent = `x${game.multiplier}`;
  document.getElementById('rebirth-count').textContent = game.rebirths;
  document.getElementById('generation-highest').textContent = Math.floor(game.maxStews);
  const rebirthBtn = document.getElementById('rebirth-btn');
  rebirthBtn.disabled = !game.canRebirth();
  if (game.canRebirth()) {
    rebirthBtn.textContent = `Rebirth (Cost: ${game.getRebirthCost().toLocaleString()} stews, Next Multiplier: x${game.getNextMultiplier()})`;
  } else {
    rebirthBtn.textContent = `Rebirth (Need ${game.getRebirthCost().toLocaleString()} stews)`;
  }

  // Upgrades
  let cpsHtml = '';
  for (let i = 0; i < 50; i++) {
    cpsHtml += `<button class="upgrade-btn" onclick="game.buyCpsUpgrade(${i})" ${game.stews < game.cpsCosts[i] ? 'disabled' : ''}>
      <strong>${cpsUpgradeNames[i]}</strong>
      <span>+${game.cpsUpgrades[i] * game.multiplier} CPS</span>
      <span>Cost: ${game.cpsCosts[i]} Stews</span>
    </button>`;
  }
  document.getElementById('cps-upgrades').innerHTML = cpsHtml;

  let cpHtml = '';
  for (let i = 0; i < 50; i++) {
    cpHtml += `<button class="upgrade-btn" onclick="game.buyCpUpgrade(${i})" ${game.stews < game.cpCosts[i] ? 'disabled' : ''}>
      <strong>${cpUpgradeNames[i]}</strong>
      <span>+${game.cpUpgrades[i] * game.multiplier} CP</span>
      <span>Cost: ${game.cpCosts[i]} Stews</span>
    </button>`;
  }
  document.getElementById('cp-upgrades').innerHTML = cpHtml;
}

// Floating Stew Amount Effect
function showFloatingAmount(amount) {
  const stewIcon = document.getElementById('stew-icon');
  const rect = stewIcon.getBoundingClientRect();
  const parentRect = stewIcon.parentElement.getBoundingClientRect();

  // Create the floating element
  const float = document.createElement('div');
  float.className = 'floating-stew';
  float.textContent = `+${amount}`;
  // Position: over the stew icon, centered horizontally
  float.style.left = (rect.left - parentRect.left + rect.width / 2) + 'px';
  float.style.top = (rect.top - parentRect.top + rect.height * 0.25) + 'px';

  stewIcon.parentElement.appendChild(float);

  // Animate: move up and fade out
  setTimeout(() => {
    float.style.transform = 'translate(-50%, -60px)';
    float.style.opacity = '0';
  }, 10);

  // Remove after animation
  setTimeout(() => {
    float.remove();
  }, 900);
}

// Helper function to download stats as a TXT file
function downloadStats() {
  let lines = [
    "Stew Clicker Save",
    "-------------------------",
    `Stews: ${Math.floor(game.stews)}`,
    `CPS: ${game.cps}`,
    `Click Power: ${game.clickPower}`,
    `Rebirths: ${game.rebirths}`,
    `Multiplier: x${game.multiplier}`,
    `Generation Best: ${Math.floor(game.maxStews)}`,
    "",
    "CPS Upgrades:",
    ...game.cpsLevels.map((lvl, i) => `${cpsUpgradeNames[i]}: Level ${lvl}`),
    "",
    "CP Upgrades:",
    ...game.cpLevels.map((lvl, i) => `${cpUpgradeNames[i]}: Level ${lvl}`)
  ];
  const blob = new Blob([lines.join('\n')], { type: "text/plain" });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = "stew_clicker_save.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Helper function to load stats from a TXT file
function loadStatsFile(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    try {
      parseStewSave(text);
      afterManualLoad();
    } catch (err) {
      alert("Failed to load save: " + err);
    }
  };
  reader.readAsText(file);
}

// Parse a save file and update the game state
function parseStewSave(text) {
  const lines = text.split(/\r?\n/);
  let stats = {};
  let section = "";
  let cpsUpgradeLevels = [];
  let cpUpgradeLevels = [];
  for (let line of lines) {
    if (line.startsWith("Stews:")) stats.stews = parseInt(line.split(":")[1]);
    else if (line.startsWith("CPS:")) stats.cps = parseFloat(line.split(":")[1]);
    else if (line.startsWith("Click Power:")) stats.clickPower = parseInt(line.split(":")[1]);
    else if (line.startsWith("Rebirths:")) stats.rebirths = parseInt(line.split(":")[1]);
    else if (line.startsWith("Multiplier:")) stats.multiplier = parseInt(line.split(":")[1].replace(/x/, ""));
    else if (line.startsWith("Generation Best:")) stats.maxStews = parseInt(line.split(":")[1]);
    else if (line.trim() === "CPS Upgrades:") section = "cps";
    else if (line.trim() === "CP Upgrades:") section = "cp";
    else if (/^.+: Level \d+$/.test(line.trim())) {
      let lvl = parseInt(line.trim().split("Level ")[1]);
      if (section === "cps") cpsUpgradeLevels.push(lvl);
      else if (section === "cp") cpUpgradeLevels.push(lvl);
    }
  }
  // Restore state
  if (typeof stats.stews === "number") game.stews = stats.stews;
  if (typeof stats.cps === "number") game.cps = stats.cps;
  if (typeof stats.clickPower === "number") game.clickPower = stats.clickPower;
  if (typeof stats.rebirths === "number") game.rebirths = stats.rebirths;
  if (typeof stats.multiplier === "number") game.multiplier = stats.multiplier;
  if (typeof stats.maxStews === "number") game.maxStews = stats.maxStews;
  if (cpsUpgradeLevels.length === 50) game.cpsLevels = cpsUpgradeLevels;
  if (cpUpgradeLevels.length === 50) game.cpLevels = cpUpgradeLevels;

  // Recalculate upgrade costs and effects
  game.cps = 0;
  game.clickPower = 1;
  for (let i = 0; i < 50; i++) {
    game.cpsCosts[i] = Math.floor(100 * Math.pow(1.15, i));
    game.cpCosts[i] = Math.floor(75 * Math.pow(1.17, i));
    // Add upgrades according to level
    for (let l = 0; l < (game.cpsLevels[i] || 0); l++) {
      game.cps += game.cpsUpgrades[i] * game.multiplier;
      game.cpsCosts[i] = Math.floor(game.cpsCosts[i] * 1.35);
    }
    for (let l = 0; l < (game.cpLevels[i] || 0); l++) {
      game.clickPower += game.cpUpgrades[i] * game.multiplier;
      game.cpCosts[i] = Math.floor(game.cpCosts[i] * 1.32);
    }
  }
}

// --- AUTOSAVE/LOAD: LOCALSTORAGE ---

const LOCALSTORAGE_KEY = "stew-clicker-autosave-v1";

// Save game state to localStorage
function autosaveGame() {
  const saveData = {
    stews: game.stews,
    clickPower: game.clickPower,
    cps: game.cps,
    cpsLevels: game.cpsLevels,
    cpLevels: game.cpLevels,
    multiplier: game.multiplier,
    rebirths: game.rebirths,
    maxStews: game.maxStews
  };
  try {
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(saveData));
  } catch (e) {
    // Handle quota exceeded or other storage issues
  }
}

// Load game state from localStorage (if present)
function autoloadGame() {
  const data = localStorage.getItem(LOCALSTORAGE_KEY);
  if (!data) return;
  try {
    const saveData = JSON.parse(data);
    if (typeof saveData.stews === "number") game.stews = saveData.stews;
    if (typeof saveData.clickPower === "number") game.clickPower = saveData.clickPower;
    if (typeof saveData.cps === "number") game.cps = saveData.cps;
    if (Array.isArray(saveData.cpsLevels) && saveData.cpsLevels.length === 50) game.cpsLevels = saveData.cpsLevels;
    if (Array.isArray(saveData.cpLevels) && saveData.cpLevels.length === 50) game.cpLevels = saveData.cpLevels;
    if (typeof saveData.multiplier === "number") game.multiplier = saveData.multiplier;
    if (typeof saveData.rebirths === "number") game.rebirths = saveData.rebirths;
    if (typeof saveData.maxStews === "number") game.maxStews = saveData.maxStews;
    // Recalculate upgrade costs and effects
    game.cps = 0;
    game.clickPower = 1;
    for (let i = 0; i < 50; i++) {
      game.cpsCosts[i] = Math.floor(100 * Math.pow(1.15, i));
      game.cpCosts[i] = Math.floor(75 * Math.pow(1.17, i));
      for (let l = 0; l < (game.cpsLevels[i] || 0); l++) {
        game.cps += game.cpsUpgrades[i] * game.multiplier;
        game.cpsCosts[i] = Math.floor(game.cpsCosts[i] * 1.35);
      }
      for (let l = 0; l < (game.cpLevels[i] || 0); l++) {
        game.clickPower += game.cpUpgrades[i] * game.multiplier;
        game.cpCosts[i] = Math.floor(game.cpCosts[i] * 1.32);
      }
    }
    render();
  } catch (e) {
    // If parsing failed, ignore and do not load
  }
}

// Also autosave after manual load or file load
function afterManualLoad() {
  autosaveGame();
  render();
  alert("Save loaded!");
}

// Load from autosave on page load
window.addEventListener('DOMContentLoaded', () => {
  autoloadGame();
  document.getElementById('stew-icon').onclick = () => {
    stewIconGrow();
    game.click(true);
  };
  document.getElementById('rebirth-btn').onclick = () => game.rebirth();
  document.getElementById('save-btn').onclick = downloadStats;

  // Add load functionality
  document.getElementById('load-btn').onclick = () => {
    let input = document.createElement('input');
    input.type = "file";
    input.accept = ".txt";
    input.style.display = "none";
    input.onchange = function(e) {
      if (input.files && input.files[0]) {
        loadStatsFile(input.files[0]);
      }
    };
    document.body.appendChild(input);
    input.click();
    setTimeout(() => document.body.removeChild(input), 1000); // Clean up
  };

  render();
});

// Spacebar support for stew clicking + "p" triggers simulateSpacebarClicks
window.addEventListener('keydown', (e) => {
  // Ignore if focus is on an input, textarea, select, or contenteditable
  const active = document.activeElement;
  if (
    active && (
      active.tagName === "INPUT" ||
      active.tagName === "TEXTAREA" ||
      active.tagName === "SELECT" ||
      active.isContentEditable
    )
  ) return;
  if (e.code === 'Space' || e.key === ' ') {
    e.preventDefault();
    stewIconGrow();
    game.click(true);
  }
  if (e.key === 'p' || e.key === 'P') {
    simulateSpacebarClicks();
  }
});

// Game Loop
setInterval(() => game.tick(), 100);

// --- Simulate 500 spacebar clicks (for testing/automation) ---
function simulateSpacebarClicks(times = 500, delay = 10) {
  let count = 0;
  function send() {
    // Create and dispatch a KeyboardEvent for the spacebar
    const e = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: ' ',
      code: 'Space'
    });
    document.dispatchEvent(e);
    count++;
    if (count < times) {
      setTimeout(send, delay);
    }
  }
  send();
}
// Usage: Open console and run simulateSpacebarClicks();