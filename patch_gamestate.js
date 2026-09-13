const fs = require('fs');
const path = 'src/game/GameState.js';
let content = fs.readFileSync(path, 'utf8');

// Allow 5 players
content = content.replace('if (this.players.length >= 4) return false;', 'if (this.players.length >= 5) return false;');

// Initialize player assets with jahudiCoins and inventory
content = content.replace(
  'if (!p.assets) p.assets = { house: null, houseValue: 0, vehicle: null, vehicleValue: 0, spouse: false, children: 0 };',
  'if (!p.assets) p.assets = { house: null, houseValue: 0, vehicle: null, vehicleValue: 0, spouse: false, children: 0 };\n      if (p.jahudiCoins === undefined) p.jahudiCoins = 50;\n      if (!p.inventory) p.inventory = [];'
);

fs.writeFileSync(path, content);
console.log('GameState patched');
