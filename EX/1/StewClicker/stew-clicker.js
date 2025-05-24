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

    // Set upgrade values and costs
    for (let i = 0; i < 50; i++) {
      // Exponential cost scaling
      this.cpsCosts[i] = Math.floor(100 * Math.pow(1.15, i));
      this.cpCosts[i] = Math.floor(75 * Math.pow(1.17, i));
      // Power scaling
      this.cpsUpgrades[i] = 1 + i; // Each CPS upgrade gives +1, +2, ... +50
      this.cpUpgrades[i] = 1 + Math.floor(i / 2); // Each CP upgrade gives +1, +1, +2, +2, ... +25
    }
  }

  click() {
    this.stews += this.clickPower;
    this.update();
  }

  buyCpsUpgrade(idx) {
    if (this.stews >= this.cpsCosts[idx]) {
      this.stews -= this.cpsCosts[idx];
      this.cps += this.cpsUpgrades[idx];
      this.cpsLevels[idx]++;
      this.cpsCosts[idx] = Math.floor(this.cpsCosts[idx] * 1.35); // Cost increases after buy
      this.update();
    }
  }

  buyCpUpgrade(idx) {
    if (this.stews >= this.cpCosts[idx]) {
      this.stews -= this.cpCosts[idx];
      this.clickPower += this.cpUpgrades[idx];
      this.cpLevels[idx]++;
      this.cpCosts[idx] = Math.floor(this.cpCosts[idx] * 1.32);
      this.update();
    }
  }

  tick() {
    this.stews += this.cps / 10;
    this.update();
  }

  update() {
    if (typeof render === 'function') render();
  }
}

// UI Rendering (basic, for browser)
let game = new StewClicker();

function render() {
  document.getElementById('stew-count').textContent = Math.floor(game.stews);
  document.getElementById('cps').textContent = game.cps.toFixed(1);
  document.getElementById('cp').textContent = game.clickPower;
  // Upgrades
  let cpsHtml = '';
  for (let i = 0; i < 50; i++) {
    cpsHtml += `<button class="upgrade-btn" onclick="game.buyCpsUpgrade(${i})" ${game.stews < game.cpsCosts[i] ? 'disabled' : ''}>
      <strong>${cpsUpgradeNames[i]}</strong>
      <span>+${game.cpsUpgrades[i]} CPS</span>
      <span>Cost: ${game.cpsCosts[i]} Stews</span>
    </button>`;
  }
  document.getElementById('cps-upgrades').innerHTML = cpsHtml;

  let cpHtml = '';
  for (let i = 0; i < 50; i++) {
    cpHtml += `<button class="upgrade-btn" onclick="game.buyCpUpgrade(${i})" ${game.stews < game.cpCosts[i] ? 'disabled' : ''}>
      <strong>${cpUpgradeNames[i]}</strong>
      <span>+${game.cpUpgrades[i]} CP</span>
      <span>Cost: ${game.cpCosts[i]} Stews</span>
    </button>`;
  }
  document.getElementById('cp-upgrades').innerHTML = cpHtml;
}

// Hook up stew icon click
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('stew-icon').onclick = () => game.click();
  render();
});

// Game Loop
setInterval(() => game.tick(), 100);
