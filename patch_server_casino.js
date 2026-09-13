const fs = require('fs');

const path = 'server.js';
let content = fs.readFileSync(path, 'utf8');

const casinoSocketEvent = `
  socket.on('casino_bet', ({ roomCode, percentage, game }) => {
    const code = (roomCode || socket.roomCode || '').toUpperCase().trim();
    const room = rooms[code];
    if (!room) return;
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;

    const miniGameManager = require('./src/minigames/MiniGameManager');
    const result = miniGameManager.processBet(player, percentage, game, room);
    
    socket.emit('casino_result', result);
    if (result && result.success) {
      io.to(code).emit('game_state_update', room);
    }
  });
`;

if (!content.includes('casino_bet')) {
  // Insert before disconnect
  const disconnectStr = "socket.on('disconnect', () => {";
  content = content.replace(disconnectStr, casinoSocketEvent + '\n  ' + disconnectStr);
  fs.writeFileSync(path, content);
  console.log('server.js patched with casino_bet');
}
