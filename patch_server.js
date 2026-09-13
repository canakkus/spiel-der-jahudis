const fs = require('fs');

const path = 'server.js';
let content = fs.readFileSync(path, 'utf8');

// Load data files
const requireLine = "const careers = require('./src/data/careers.json');";
const replaceRequire = requireLine + "\nconst casesData = require('./src/data/cases.json');\nconst cosmeticsData = require('./src/data/cosmetics.json');";
content = content.replace(requireLine, replaceRequire);

// Add buy_case event
const getCharactersEvent = `  socket.on('get_characters', () => {
    socket.emit('characters_list', PRESET_CHARACTERS);
  });`;

const newEvents = getCharactersEvent + `

  socket.on('buy_case', ({ roomCode, caseId }) => {
    const code = (roomCode || socket.roomCode || '').toUpperCase().trim();
    const room = rooms[code];
    if (!room) return;
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;

    const caseObj = casesData.find(c => c.id === caseId);
    if (!caseObj) {
      socket.emit('case_error', { message: 'Case not found' });
      return;
    }

    if (player.jahudiCoins < caseObj.cost) {
      socket.emit('case_error', { message: 'Not enough Jahudi Coins' });
      return;
    }

    // Deduct coins
    player.jahudiCoins -= caseObj.cost;

    // Roll rarity
    const rand = Math.random() * 100;
    let cumulative = 0;
    let wonRarity = 'Goy';
    for (const drop of caseObj.drops) {
      cumulative += drop.chance;
      if (rand <= cumulative) {
        wonRarity = drop.rarity;
        break;
      }
    }

    // Pick cosmetic of that rarity
    const possibleCosmetics = cosmeticsData.filter(c => c.rarity === wonRarity);
    let wonCosmetic = null;
    if (possibleCosmetics.length > 0) {
      wonCosmetic = possibleCosmetics[Math.floor(Math.random() * possibleCosmetics.length)];
      if (!player.inventory) player.inventory = [];
      player.inventory.push(wonCosmetic);
    }

    // Inform client
    socket.emit('case_opened', { cosmetic: wonCosmetic, jahudiCoins: player.jahudiCoins });
    // Update host state
    io.to(code).emit('game_state_update', room);
  });

  socket.on('equip_cosmetic', ({ roomCode, cosmeticId }) => {
    const code = (roomCode || socket.roomCode || '').toUpperCase().trim();
    const room = rooms[code];
    if (!room) return;
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;

    const cosmetic = player.inventory.find(c => c.id === cosmeticId);
    if (!cosmetic) return;

    // Example logic: just set activeOutfit based on what is equipped
    if (cosmetic.type === 'White Party Outfit') {
      player.activeOutfit = 'whiteParty';
    } else if (cosmetic.type === 'Island Skin') {
      player.activeOutfit = 'island';
    } else {
      player.activeOutfit = 'default';
    }

    io.to(code).emit('game_state_update', room);
  });
`;

content = content.replace(getCharactersEvent, newEvents);

fs.writeFileSync(path, content);
console.log('Server patched successfully');
