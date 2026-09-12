// Host Logic for TV Screen with 3D Dubai Board
const socket = io();

let currentRoomCode = '';
let currentPlayers = [];
let activePlayer = null;
let dubaiBoard3D = null;

// DOM Elements
const lobbyView = document.getElementById('lobby-view');
const gameView = document.getElementById('game-view');
const lobbyRoomCode = document.getElementById('lobby-room-code');
const headerRoomCode = document.getElementById('header-room-code');
const roomBadge = document.getElementById('room-badge');
const joinUrlText = document.getElementById('join-url-text');
const qrImage = document.getElementById('qr-image');
const lobbyPlayersGrid = document.getElementById('lobby-players-grid');
const playerCount = document.getElementById('player-count');
const btnStartGame = document.getElementById('btn-start-game');

// Game View Elements
const turnText = document.getElementById('turn-text');
const leaderboardBar = document.getElementById('leaderboard-bar');
const wheelOverlay = document.getElementById('wheel-overlay');
const wheelPlayerName = document.getElementById('wheel-player-name');
const wheelCanvas = document.getElementById('wheel-canvas');
const actionOverlay = document.getElementById('action-overlay');
const cardIcon = document.getElementById('card-icon');
const cardTitle = document.getElementById('card-title');
const cardDesc = document.getElementById('card-desc');
const cardRewards = document.getElementById('card-rewards');
const reactionsContainer = document.getElementById('reactions-container');

// 1. Initialize Host Room with browser location
socket.emit('host_create_room', {
  host: window.location.host,
  protocol: window.location.protocol
});

socket.on('room_created', (data) => {
  currentRoomCode = data.roomCode;
  lobbyRoomCode.textContent = data.roomCode;
  headerRoomCode.textContent = data.roomCode;
  roomBadge.style.display = 'flex';
  joinUrlText.textContent = data.joinUrl;
  qrImage.src = data.qrCodeDataUrl;
  console.log('Room created with 3D Dubai Board:', data);
});

socket.on('qr_updated', ({ joinUrl, qrCodeDataUrl }) => {
  joinUrlText.textContent = joinUrl;
  qrImage.src = qrCodeDataUrl;
});

// 2. Lobby Updates
socket.on('lobby_updated', ({ players }) => {
  currentPlayers = players;
  playerCount.textContent = `(${players.length} Spieler)`;
  btnStartGame.disabled = players.length === 0;

  lobbyPlayersGrid.innerHTML = '';
  players.forEach(p => {
    const card = document.createElement('div');
    card.className = 'player-lobby-card';
    card.innerHTML = `
      <div class="player-avatar" style="border-color: ${p.character.color}; background: ${p.character.color}22">
        ${p.character.icon}
      </div>
      <div>
        <div class="player-name">${p.name}</div>
        <div class="player-outfit">${p.character.name} • ${p.character.car}</div>
      </div>
    `;
    lobbyPlayersGrid.appendChild(card);
  });
});

// 3. Start Game
btnStartGame.addEventListener('click', () => {
  window.soundEngine.init();
  window.soundEngine.play('cheer');
  socket.emit('start_game', { roomCode: currentRoomCode });
});

socket.on('game_started', ({ players, currentTurnPlayer }) => {
  currentPlayers = players;
  activePlayer = currentTurnPlayer;

  lobbyView.classList.remove('active');
  gameView.classList.add('active');

  // Initialize 3D Dubai Board
  if (!dubaiBoard3D) {
    dubaiBoard3D = new DubaiBoard3D('board-3d-container');
    dubaiBoard3D.init();
  }

  dubaiBoard3D.updatePlayers(currentPlayers);
  updateLeaderboard();
  updateTurnDisplay();
});

function updateTurnDisplay() {
  if (!activePlayer) return;
  turnText.innerHTML = `🎲 <span class="turn-player-highlight">${activePlayer.name}</span> ist am Zug!`;
}

function updateLeaderboard() {
  leaderboardBar.innerHTML = '';
  currentPlayers.forEach(p => {
    const isCurrent = activePlayer && activePlayer.socketId === p.socketId;
    const card = document.createElement('div');
    card.className = `player-score-card ${isCurrent ? 'active-turn' : ''}`;
    card.innerHTML = `
      <div class="score-header">
        <span>${p.character.icon} ${p.name}</span>
        <span style="font-size: 11px; color: ${p.character.color}; font-weight: 700;">${p.character.name}</span>
      </div>
      <div class="score-stats">
        <div class="stat-item money">💰 ${(p.money || 0).toLocaleString()} €</div>
        <div class="stat-item knowledge">🧠 ${p.knowledge || 0}</div>
        <div class="stat-item happiness">❤️ ${p.happiness || 0}</div>
      </div>
    `;
    leaderboardBar.appendChild(card);
  });
}

// 4. Drehrad Spinning Animation
const WHEEL_SECTORS = [
  { num: 1, color: '#ef4444' },
  { num: 2, color: '#f97316' },
  { num: 3, color: '#f59e0b' },
  { num: 4, color: '#84cc16' },
  { num: 5, color: '#10b981' },
  { num: 6, color: '#06b6d4' },
  { num: 7, color: '#3b82f6' },
  { num: 8, color: '#6366f1' },
  { num: 9, color: '#8b5cf6' },
  { num: 10, color: '#ec4899' }
];

function drawWheel(angleOffset = 0) {
  const ctx = wheelCanvas.getContext('2d');
  const cx = wheelCanvas.width / 2;
  const cy = wheelCanvas.height / 2;
  const radius = cx - 10;
  const arc = (2 * Math.PI) / WHEEL_SECTORS.length;

  ctx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);

  WHEEL_SECTORS.forEach((sec, i) => {
    const angle = angleOffset + i * arc;
    ctx.beginPath();
    ctx.fillStyle = sec.color;
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, angle, angle + arc);
    ctx.lineTo(cx, cy);
    ctx.fill();
    ctx.stroke();

    // Number text
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle + arc / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px Plus Jakarta Sans, sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.fillText(sec.num, radius - 20, 10);
    ctx.restore();
  });
}

drawWheel();

socket.on('wheel_spun', ({ player, spinValue }) => {
  activePlayer = player;
  wheelPlayerName.textContent = `${player.name} dreht das Rad...`;
  wheelOverlay.classList.add('active');

  const sectorIndex = WHEEL_SECTORS.findIndex(s => s.num === spinValue);
  const arc = (2 * Math.PI) / WHEEL_SECTORS.length;
  const targetSectorAngle = (3 * Math.PI / 2) - (sectorIndex * arc + arc / 2);
  const totalSpins = 4 * 2 * Math.PI;
  const finalAngle = totalSpins + targetSectorAngle;

  const duration = 2800;
  const startTime = performance.now();
  let lastTickAngle = 0;

  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const currentAngle = ease * finalAngle;

    drawWheel(currentAngle);

    if (Math.abs(currentAngle - lastTickAngle) >= arc) {
      window.soundEngine.play('wheel_tick');
      lastTickAngle = currentAngle;
    }

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      setTimeout(() => {
        wheelOverlay.classList.remove('active');
        execute3DPlayerMove(player, spinValue);
      }, 700);
    }
  }

  requestAnimationFrame(animate);
});

// 5. 3D Step-by-step Movement & Camera Follow
async function execute3DPlayerMove(player, steps) {
  if (dubaiBoard3D) {
    await dubaiBoard3D.animateCarMove(player, steps, () => {
      window.soundEngine.play('move_step');
    });
  }

  const finalNode = BOARD_NODES.find(n => n.id === player.position) || BOARD_NODES[0];
  handleTileLanding(player, finalNode);
}

// 6. Handle Tile Landing & Dubai Action Cards
function handleTileLanding(player, node) {
  let tileEffect = { ...(node.effect || {}) };

  if (node.type === 'action') {
    const randomCard = ACTION_CARDS[Math.floor(Math.random() * ACTION_CARDS.length)];
    window.soundEngine.play('card_flip');

    cardIcon.textContent = randomCard.icon;
    cardTitle.textContent = randomCard.headline;
    cardDesc.textContent = randomCard.desc;

    let rewardsHtml = '';
    if (randomCard.effect.money) {
      rewardsHtml += `<span style="color: #22c55e;">${randomCard.effect.money > 0 ? '+' : ''}${randomCard.effect.money.toLocaleString()} €</span> `;
    }
    if (randomCard.effect.knowledge) {
      rewardsHtml += `<span style="color: #3b82f6;">+${randomCard.effect.knowledge} 🧠</span> `;
    }
    if (randomCard.effect.happiness) {
      rewardsHtml += `<span style="color: #ec4899;">+${randomCard.effect.happiness} ❤️</span> `;
    }
    cardRewards.innerHTML = rewardsHtml;

    actionOverlay.classList.add('active');
    tileEffect = { ...randomCard.effect };

    setTimeout(() => {
      actionOverlay.classList.remove('active');
      finalizeTurn(player, node.id, tileEffect);
    }, 3500);

  } else if (node.type === 'payday') {
    window.soundEngine.play('kaching');
    finalizeTurn(player, node.id, tileEffect);
  } else if (node.type === 'finish') {
    window.soundEngine.play('cheer');
    finalizeTurn(player, node.id, tileEffect);
  } else {
    finalizeTurn(player, node.id, tileEffect);
  }
}

function finalizeTurn(player, targetNodeId, tileEffect) {
  socket.emit('player_moved_to_tile', {
    roomCode: currentRoomCode,
    playerId: player.socketId,
    targetNodeId,
    tileEffect
  });

  setTimeout(() => {
    socket.emit('next_turn', { roomCode: currentRoomCode });
  }, 1200);
}

socket.on('player_stats_updated', ({ players }) => {
  currentPlayers = players;
  updateLeaderboard();
  if (dubaiBoard3D) dubaiBoard3D.updatePlayers(currentPlayers);
});

socket.on('turn_changed', ({ currentTurnPlayer, players }) => {
  currentPlayers = players;
  activePlayer = currentTurnPlayer;
  updateTurnDisplay();
  updateLeaderboard();
});

// 7. Soundboard Reaction Receiver (Spawns 3D & Screen Effects)
const REACTION_EMOJIS = {
  honk: '🚗💨 *HUP!*',
  kaching: '💸 KACHING!',
  laugh: '😂 HAHAHA!',
  cheer: '🎉 JUBEL!',
  fail: '🎺 FAIL!'
};

socket.on('soundboard_reaction', ({ player, soundId }) => {
  window.soundEngine.play(soundId);

  const emoji = REACTION_EMOJIS[soundId] || '🎉';
  const floater = document.createElement('div');
  floater.className = 'floating-reaction';
  floater.textContent = emoji;

  // Random / Center Position with animation
  floater.style.left = `${Math.random() * 50 + 25}%`;
  floater.style.top = `${Math.random() * 40 + 30}%`;

  reactionsContainer.appendChild(floater);
  setTimeout(() => floater.remove(), 1800);
});
