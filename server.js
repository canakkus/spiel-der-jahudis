const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const os = require('os');
const QRCode = require('qrcode');
const path = require('path');
const GameState = require('./src/game/GameState');
const careers = require('./src/data/careers.json');
const events = require('./src/data/events.json');
const decisions = require('./src/data/decisions.json');
const houses = require('./src/data/houses.json');
const vehicles = require('./src/data/vehicles.json');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3001;
app.use(express.static(path.join(__dirname, 'public')));

// Serve data files to frontend
app.get('/api/careers', (req, res) => res.json(careers));
app.get('/api/events', (req, res) => res.json(events));
app.get('/api/decisions', (req, res) => res.json(decisions));
app.get('/api/houses', (req, res) => res.json(houses));
app.get('/api/vehicles', (req, res) => res.json(vehicles));

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return 'localhost';
}
const localIp = getLocalIpAddress();

const PRESET_CHARACTERS = [
  { id: 'business', name: 'Business Bro', icon: '💼', color: '#3b82f6', car: '🏎️' },
  { id: 'party', name: 'Casino Queen', icon: '🪩', color: '#ec4899', car: '🚗' },
  { id: 'crypto', name: 'Krypto Bro', icon: '🚀', color: '#f59e0b', car: '🚙' },
  { id: 'student', name: 'Hustler', icon: '🎓', color: '#10b981', car: '🛵' }
];

const rooms = {};

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

async function createQrCode(url) {
  try {
    return await QRCode.toDataURL(url, { margin: 2, scale: 8, errorCorrectionLevel: 'M', color: { dark: '#0b1329', light: '#ffffff' } });
  } catch { return ''; }
}

function randomCareer() {
  return careers[Math.floor(Math.random() * careers.length)];
}

function randomEvent() {
  return events[Math.floor(Math.random() * events.length)];
}

function processNodeLanding(room, player, node) {
  let result = { type: node.type, tileEffect: node.effect || null, event: null, decision: null };

  switch (node.type) {
    case 'payday': {
      const pd = room.applyPayday(player.socketId);
      result.paydayAmount = pd ? pd.earned : 0;
      break;
    }
    case 'action': {
      // 70% chance of event on action tile
      if (Math.random() < 0.7) {
        const ev = randomEvent();
        room.applyEvent(player.socketId, ev);
        result.event = ev;
      }
      break;
    }
    case 'decision': {
      const decId = node.decisionId;
      if (decId) {
        const dec = decisions.find(d => d.id === decId);
        if (dec) {
          room.setWaitingForDecision(player.socketId, decId);
          result.decision = dec;
          result.waitingForDecision = true;
        }
      }
      break;
    }
    case 'branch': {
      const decId = node.decisionId || 'career_choice';
      const dec = decisions.find(d => d.id === decId);
      if (dec) {
        room.setWaitingForDecision(player.socketId, decId);
        result.decision = dec;
        result.waitingForDecision = true;
      }
      break;
    }
    case 'family': {
      const decId = node.decisionId;
      if (decId) {
        const dec = decisions.find(d => d.id === decId);
        if (dec) {
          room.setWaitingForDecision(player.socketId, decId);
          result.decision = dec;
          result.waitingForDecision = true;
        }
      } else {
        // Random family event
        const familyEvents = events.filter(e => e.id === 'erbschaft' || e.id === 'luxusurlaub');
        if (familyEvents.length) {
          const ev = familyEvents[Math.floor(Math.random() * familyEvents.length)];
          room.applyEvent(player.socketId, ev);
          result.event = ev;
        }
      }
      break;
    }
    case 'house': {
      const dec = decisions.find(d => d.id === 'house_purchase');
      if (dec) {
        room.setWaitingForDecision(player.socketId, 'house_purchase');
        result.decision = dec;
        result.waitingForDecision = true;
      }
      break;
    }
    case 'career': {
      // Career advancement
      if (player.career && player.career.level < player.career.maxLevel) {
        player.career.level++;
        player.salary = player.career.salaryPerLevel[player.career.level - 1];
        result.careerAdvancement = true;
        result.newLevel = player.career.level;
        result.newSalary = player.salary;
        result.tileEffect = { ...result.tileEffect, salary: player.salary };
      } else {
        // Offer a new career decision
        const dec = decisions.find(d => d.id === 'job_offer');
        if (dec) {
          room.setWaitingForDecision(player.socketId, 'job_offer');
          result.decision = dec;
          result.waitingForDecision = true;
        }
      }
      break;
    }
    case 'knowledge': {
      player.knowledge = (player.knowledge || 0) + 20;
      result.tileEffect = { ...(result.tileEffect || {}), knowledge: 20 };
      // Chance of education decision
      if (Math.random() < 0.3) {
        const dec = decisions.find(d => d.id === 'education');
        if (dec) {
          room.setWaitingForDecision(player.socketId, 'education');
          result.decision = dec;
          result.waitingForDecision = true;
        }
      }
      break;
    }
    case 'finish': {
      const retired = room.retirePlayer(player.socketId);
      result.retired = true;
      result.finalScore = retired ? retired.finalScore : 0;
      if (room.allRetired()) {
        room.calculateFinalScores();
        result.gameFinished = true;
        result.rankings = room.players.sort((a, b) => b.finalScore - a.finalScore);
      }
      break;
    }
    default: {
      // Normal tile - 15% random event
      if (Math.random() < 0.15) {
        const ev = randomEvent();
        room.applyEvent(player.socketId, ev);
        result.event = ev;
      }
      break;
    }
  }
  return result;
}

io.on('connection', (socket) => {
  console.log(`[+] Connected: ${socket.id}`);

  socket.on('host_create_room', async (data = {}) => {
    let roomCode = generateRoomCode();
    while (rooms[roomCode]) roomCode = generateRoomCode();

    let clientHost = data.host || '';
    let baseUrl = (clientHost && !clientHost.includes('localhost') && !clientHost.includes('127.0.0.1'))
      ? `${data.protocol || 'http:'}//${clientHost}`
      : `http://${localIp}:${PORT}`;

    const joinUrl = `${baseUrl}/?room=${roomCode}`;
    const qrCodeDataUrl = await createQrCode(joinUrl);

    rooms[roomCode] = new GameState(roomCode, socket.id);
    rooms[roomCode].joinUrl = joinUrl;
    rooms[roomCode].qrCodeDataUrl = qrCodeDataUrl;

    socket.join(roomCode);
    socket.emit('room_created', { roomCode, joinUrl, localIp, port: PORT, qrCodeDataUrl, presetCharacters: PRESET_CHARACTERS });
    console.log(`[ROOM] Created: ${roomCode}`);
  });

  socket.on('update_host_url', async ({ roomCode, customUrl }) => {
    const room = rooms[roomCode];
    if (!room) return;
    const newJoinUrl = `${customUrl}/?room=${roomCode}`;
    const newQr = await createQrCode(newJoinUrl);
    room.joinUrl = newJoinUrl;
    room.qrCodeDataUrl = newQr;
    socket.emit('qr_updated', { joinUrl: newJoinUrl, qrCodeDataUrl: newQr });
  });

  socket.on('player_join_room', ({ roomCode, playerName, characterId }) => {
    const code = (roomCode || '').toUpperCase().trim();
    const room = rooms[code];
    if (!room) return socket.emit('join_error', { message: 'Raum nicht gefunden!' });
    if (room.state !== 'LOBBY') return socket.emit('join_error', { message: 'Spiel läuft bereits!' });
    if (room.players.length >= 4) return socket.emit('join_error', { message: 'Raum voll!' });

    const character = PRESET_CHARACTERS.find(c => c.id === characterId) || PRESET_CHARACTERS[0];
    const career = randomCareer();
    const salary = career.salaryPerPayday;

    const newPlayer = {
      socketId: socket.id,
      name: (playerName || '').trim() || `Spieler ${room.players.length + 1}`,
      character,
      career,
      salary,
      color: character.color,
      position: 0,
      money: 50000,
      knowledge: 10,
      happiness: 20,
      isTurn: false,
      ready: false,
      isRetired: false,
      finalScore: 0,
      assets: { house: null, houseValue: 0, vehicle: null, vehicleValue: 0, spouse: false, children: 0 },
      decisions: [],
      achievements: []
    };

    room.addPlayer(newPlayer);
    socket.join(code);
    socket.roomCode = code;

    socket.emit('join_success', { player: newPlayer, roomCode: code, presetCharacters: PRESET_CHARACTERS });
    io.to(code).emit('lobby_updated', { players: room.players, gameState: room.state });
    console.log(`[JOIN] ${newPlayer.name} -> ${code}`);
  });

  socket.on('player_ready', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    const player = room.players.find(p => p.socketId === socket.id);
    if (player) {
      player.ready = !player.ready;
      io.to(roomCode).emit('lobby_updated', { players: room.players, gameState: room.state });
    }
  });

  socket.on('start_game', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || socket.id !== room.hostSocketId) return;
    if (room.players.length === 0) return;
    if (room.startGame()) {
      io.to(roomCode).emit('game_started', { players: room.players, currentTurnPlayer: room.getCurrentPlayer() });
      console.log(`[GAME] Started: ${roomCode}`);
    }
  });

  socket.on('player_spin_wheel', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || room.state !== 'PLAYING') return;
    const currentPlayer = room.getCurrentPlayer();
    if (!currentPlayer || currentPlayer.socketId !== socket.id) return;

    const spinValue = Math.floor(Math.random() * 10) + 1;
    room.state = 'SPINNING';
    io.to(roomCode).emit('wheel_spun', { player: currentPlayer, spinValue });
    console.log(`[SPIN] ${currentPlayer.name}: ${spinValue}`);
  });

  // Player passed over a payday tile while moving
  socket.on('player_passed_payday', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    const player = room.players.find(p => p.socketId === socket.id) || room.getCurrentPlayer();
    if (!player) return;
    const result = room.applyPayday(player.socketId);
    if (result) {
      io.to(roomCode).emit('payday_collected', { player: result.player, amount: result.earned });
    }
  });

  // Player landed on a tile (final position after movement)
  socket.on('player_moved_to_tile', ({ roomCode, playerId, targetNodeId }) => {
    const room = rooms[roomCode];
    if (!room) return;
    const player = room.players.find(p => p.socketId === playerId);
    if (!player) return;

    player.position = targetNodeId;

    // We need boardData on the server to check tile type
    // For now we rely on the client passing node type info
    // Actually the client sends us the nodeId, we need to know the type
    // The boardData is served as a static file - let's accept nodeType from client
    // Server should ideally have the board data too
    const { nodeType, nodeDecisionId } = arguments[0] && typeof arguments[0] === 'object' ? arguments[0] : {};
    
    // Create a synthetic node from what we know
    const node = { id: targetNodeId, type: nodeType || 'normal', decisionId: nodeDecisionId || null, effect: null };
    const result = processNodeLanding(room, player, node);

    if (result.waitingForDecision) {
      io.to(roomCode).emit('decision_required', { player, decisionData: result.decision });
      io.to(roomCode).emit('player_stats_updated', { players: room.players, updatedPlayer: player });
      return;
    }

    if (result.gameFinished) {
      io.to(roomCode).emit('player_stats_updated', { players: room.players, updatedPlayer: player, event: result.event, paydayAmount: result.paydayAmount });
      io.to(roomCode).emit('game_finished', { rankings: result.rankings, winner: room.getWinner() });
      return;
    }

    if (result.retired) {
      io.to(roomCode).emit('player_retired', { player, finalScore: result.finalScore });
      io.to(roomCode).emit('player_stats_updated', { players: room.players, updatedPlayer: player });
      setTimeout(() => {
        const next = room.nextTurn();
        if (next) io.to(roomCode).emit('turn_changed', { currentTurnPlayer: next, players: room.players });
      }, 3000);
      return;
    }

    io.to(roomCode).emit('player_stats_updated', {
      players: room.players,
      updatedPlayer: player,
      event: result.event || null,
      paydayAmount: result.paydayAmount || null,
      careerAdvancement: result.careerAdvancement || false,
      newSalary: result.newSalary || null
    });
  });

  socket.on('submit_decision', ({ roomCode, optionId }) => {
    const room = rooms[roomCode];
    if (!room || room.state !== 'WAITING_FOR_DECISION') return;
    if (!room.pendingDecision || room.pendingDecision.playerId !== socket.id) return;

    const decisionData = decisions.find(d => d.id === room.pendingDecision.decisionId);
    if (!decisionData) return;

    const result = room.resolveDecision(socket.id, decisionData, optionId);
    if (!result) return;

    const option = result.option;
    io.to(roomCode).emit('decision_resolved', {
      players: room.players,
      updatedPlayer: result.player,
      option,
      decisionData
    });

    console.log(`[DECISION] ${result.player.name}: ${optionId}`);

    if (option.effects && option.effects.earlyRetire) {
      io.to(roomCode).emit('player_retired', { player: result.player, finalScore: result.player.finalScore });
      if (room.allRetired()) {
        const rankings = room.calculateFinalScores();
        io.to(roomCode).emit('game_finished', { rankings, winner: room.getWinner() });
        return;
      }
    }

    setTimeout(() => {
      const next = room.nextTurn();
      if (next) io.to(roomCode).emit('turn_changed', { currentTurnPlayer: next, players: room.players });
    }, 4000);
  });

  socket.on('next_turn', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    if (room.allRetired()) {
      const rankings = room.calculateFinalScores();
      io.to(roomCode).emit('game_finished', { rankings, winner: room.getWinner() });
      return;
    }
    const next = room.nextTurn();
    if (next) io.to(roomCode).emit('turn_changed', { currentTurnPlayer: next, players: room.players });
  });

  socket.on('soundboard_trigger', ({ roomCode, soundId }) => {
    const code = roomCode || socket.roomCode;
    const room = rooms[code];
    if (!room) return;
    const player = room.players.find(p => p.socketId === socket.id) || { name: 'Zuschauer', character: { icon: '🎉' } };
    io.to(code).emit('soundboard_reaction', { player, soundId, timestamp: Date.now() });
  });

  socket.on('disconnect', () => {
    for (const code in rooms) {
      const room = rooms[code];
      if (room.hostSocketId === socket.id) {
        io.to(code).emit('host_disconnected');
        delete rooms[code];
      } else {
        const removed = room.removePlayer(socket.id);
        if (removed) {
          io.to(code).emit('lobby_updated', { players: room.players, gameState: room.state });
        }
      }
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=========================================`);
  console.log(`🎮 SPIEL DER JAHUDIS v2.0 – GESTARTET!`);
  console.log(`📺 TV/Host:      http://localhost:${PORT}/host.html`);
  console.log(`📱 Controller:   http://${localIp}:${PORT}/`);
  console.log(`=========================================`);
});
