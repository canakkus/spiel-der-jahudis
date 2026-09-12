const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const os = require('os');
const QRCode = require('qrcode');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Helper to get local Wi-Fi / LAN IP address
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIp = getLocalIpAddress();

// Preset Characters
const PRESET_CHARACTERS = [
  { id: 'business', name: 'Business Jahudi', icon: '💼', outfit: 'Nadelstreifenanzug & Rolex', color: '#3b82f6', car: '🏎️' },
  { id: 'party', name: 'Party Jahudi', icon: '🪩', outfit: 'VIP Club Outfit & Sunglasses', color: '#ec4899', car: 'Convertible 🚗' },
  { id: 'crypto', name: 'Krypto Jahudi', icon: '🚀', outfit: 'Hoodie & Diamond Hands', color: '#f59e0b', car: 'Cybertruck 🚙' },
  { id: 'student', name: 'Student Jahudi', icon: '🎓', outfit: 'Vintage Rucksack & Mate', color: '#10b981', car: 'Vespa 🛵' },
  { id: 'fitness', name: 'Fitness Jahudi', icon: '🏋️', outfit: 'Gymwear & Shaker', color: '#8b5cf6', car: 'SUV 🚙' },
  { id: 'artist', name: 'Künstler Jahudi', icon: '🎨', outfit: 'Boho Chic & Beret', color: '#06b6d4', car: 'Oldtimer 🚐' }
];

// Room state storage
const rooms = {};

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Generate QR code for a specific target URL
async function createQrCode(targetUrl) {
  try {
    return await QRCode.toDataURL(targetUrl, {
      margin: 2,
      scale: 8,
      errorCorrectionLevel: 'M',
      color: { dark: '#0b1329', light: '#ffffff' }
    });
  } catch (err) {
    console.error('QR generation error:', err);
    return '';
  }
}

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Host creates room with optional client-provided host origin (e.g. from browser or tunnel)
  socket.on('host_create_room', async (data = {}) => {
    let roomCode = generateRoomCode();
    while (rooms[roomCode]) {
      roomCode = generateRoomCode();
    }

    // Determine best join URL for mobile scanning
    let clientHost = data.host || '';
    let baseUrl;
    
    // If client provides a public hostname (e.g. ngrok, domain) that is not localhost, use it!
    if (clientHost && !clientHost.includes('localhost') && !clientHost.includes('127.0.0.1')) {
      baseUrl = `${data.protocol || 'http:'}//${clientHost}`;
    } else {
      baseUrl = `http://${localIp}:${PORT}`;
    }

    const joinUrl = `${baseUrl}/?room=${roomCode}`;
    const qrCodeDataUrl = await createQrCode(joinUrl);

    rooms[roomCode] = {
      code: roomCode,
      hostSocketId: socket.id,
      joinUrl,
      qrCodeDataUrl,
      players: [],
      gameState: 'LOBBY',
      currentTurnIndex: 0,
      boardStepHistory: []
    };

    socket.join(roomCode);
    socket.emit('room_created', {
      roomCode,
      joinUrl,
      localIp,
      port: PORT,
      qrCodeDataUrl,
      presetCharacters: PRESET_CHARACTERS
    });
    console.log(`Room created: ${roomCode} | Join URL: ${joinUrl}`);
  });

  // Host can request QR update if switching IP or URL
  socket.on('update_host_url', async ({ roomCode, customUrl }) => {
    const room = rooms[roomCode];
    if (!room) return;

    const newJoinUrl = `${customUrl}/?room=${roomCode}`;
    const newQr = await createQrCode(newJoinUrl);
    room.joinUrl = newJoinUrl;
    room.qrCodeDataUrl = newQr;

    socket.emit('qr_updated', {
      joinUrl: newJoinUrl,
      qrCodeDataUrl: newQr
    });
  });

  // Client requests available characters
  socket.on('get_characters', () => {
    socket.emit('characters_list', PRESET_CHARACTERS);
  });

  // Player joins room
  socket.on('player_join_room', ({ roomCode, playerName, characterId }) => {
    const code = (roomCode || '').toUpperCase().trim();
    const room = rooms[code];

    if (!room) {
      socket.emit('join_error', { message: `Raum "${code}" wurde nicht gefunden!` });
      return;
    }

    if (room.gameState !== 'LOBBY') {
      socket.emit('join_error', { message: 'Dieses Spiel läuft bereits!' });
      return;
    }

    const character = PRESET_CHARACTERS.find(c => c.id === characterId) || PRESET_CHARACTERS[0];
    const playerIndex = room.players.length;

    const newPlayer = {
      socketId: socket.id,
      name: playerName.trim() || `Spieler ${playerIndex + 1}`,
      character: character,
      color: character.color,
      position: 0,
      money: 50000,
      knowledge: 10,
      happiness: 20,
      isTurn: false,
      ready: true
    };

    room.players.push(newPlayer);
    socket.join(code);
    socket.roomCode = code;

    socket.emit('join_success', {
      player: newPlayer,
      roomCode: code
    });

    // Notify host and all clients in room
    io.to(code).emit('lobby_updated', {
      players: room.players,
      gameState: room.gameState
    });

    console.log(`Player ${newPlayer.name} (${newPlayer.character.name}) joined room ${code}`);
  });

  // Host starts game
  socket.on('start_game', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || room.players.length === 0) return;

    room.gameState = 'PLAYING';
    room.currentTurnIndex = 0;
    room.players.forEach((p, idx) => {
      p.isTurn = (idx === 0);
      p.position = 0;
    });

    io.to(roomCode).emit('game_started', {
      players: room.players,
      currentTurnPlayer: room.players[0]
    });
    console.log(`Game started in room ${roomCode}`);
  });

  // Player spins wheel from phone
  socket.on('player_spin_wheel', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || room.gameState !== 'PLAYING') return;

    const currentPlayer = room.players[room.currentTurnIndex];
    if (!currentPlayer || currentPlayer.socketId !== socket.id) {
      return;
    }

    const spinValue = Math.floor(Math.random() * 10) + 1;

    io.to(roomCode).emit('wheel_spun', {
      player: currentPlayer,
      spinValue
    });
  });

  // Host completes movement and updates stats
  socket.on('player_moved_to_tile', ({ roomCode, playerId, targetNodeId, tileEffect }) => {
    const room = rooms[roomCode];
    if (!room) return;

    const player = room.players.find(p => p.socketId === playerId);
    if (!player) return;

    player.position = targetNodeId;

    if (tileEffect) {
      if (tileEffect.money) player.money = Math.max(0, player.money + tileEffect.money);
      if (tileEffect.knowledge) player.knowledge = Math.max(0, player.knowledge + tileEffect.knowledge);
      if (tileEffect.happiness) player.happiness = Math.max(0, player.happiness + tileEffect.happiness);
    }

    io.to(roomCode).emit('player_stats_updated', {
      players: room.players,
      updatedPlayer: player,
      tileEffect
    });
  });

  // Advance turn to next player
  socket.on('next_turn', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || room.players.length === 0) return;

    room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length;
    room.players.forEach((p, idx) => {
      p.isTurn = (idx === room.currentTurnIndex);
    });

    const nextPlayer = room.players[room.currentTurnIndex];
    io.to(roomCode).emit('turn_changed', {
      currentTurnPlayer: nextPlayer,
      players: room.players
    });
  });

  // Soundboard Reaction Trigger
  socket.on('soundboard_trigger', ({ roomCode, soundId }) => {
    const code = roomCode || socket.roomCode;
    const room = rooms[code];
    if (!room) return;

    const player = room.players.find(p => p.socketId === socket.id) || {
      name: 'Zuschauer',
      character: { car: '🚗', icon: '🎉', color: '#f59e0b' }
    };

    io.to(code).emit('soundboard_reaction', {
      player,
      soundId,
      timestamp: Date.now()
    });
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    for (const code in rooms) {
      const room = rooms[code];
      if (room.hostSocketId === socket.id) {
        io.to(code).emit('host_disconnected');
        delete rooms[code];
        console.log(`Host closed room ${code}`);
      } else {
        const pIndex = room.players.findIndex(p => p.socketId === socket.id);
        if (pIndex !== -1) {
          const removed = room.players.splice(pIndex, 1)[0];
          console.log(`Player ${removed.name} left room ${code}`);
          io.to(code).emit('lobby_updated', {
            players: room.players,
            gameState: room.gameState
          });
        }
      }
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=========================================`);
  console.log(`🎮 SPIEL DER JAHUDIS - SERVER GESTARTET!`);
  console.log(`📺 TV / Host Bildschirm: http://localhost:${PORT}/host.html`);
  console.log(`📱 Handy Controller:     http://${localIp}:${PORT}`);
  console.log(`=========================================`);
});
