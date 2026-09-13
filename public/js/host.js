// ============================================================
// SPIEL DER JAHUDIS – HOST (TV) Script
// Full Game of Life mechanics wired up
// ============================================================

const socket = io();
let currentRoomCode = null;
let currentPlayers = [];
let dubaiBoard3D = null;
let activePlayer = null;
let pendingBranchResolve = null; // resolves branch Promise with chosen nodeId

// ── DOM refs ─────────────────────────────────────────────────
const lobbyScreen     = document.getElementById('lobby-screen');
const gameScreen      = document.getElementById('game-screen');
const qrCodeImg       = document.getElementById('qr-code-img');
const roomCodeDisplay = document.getElementById('room-code-display');
const joinUrlDisplay  = document.getElementById('join-url-display');
const lobbyPlayersGrid= document.getElementById('lobby-players-grid');
const wheelOverlay    = document.getElementById('wheel-overlay');
const wheelCanvas     = document.getElementById('wheel-canvas');
const wheelPlayerName = document.getElementById('wheel-player-name');
const actionOverlay   = document.getElementById('action-overlay');
const cardIcon        = document.getElementById('card-icon');
const cardTitle       = document.getElementById('card-title');
const cardDesc        = document.getElementById('card-desc');
const cardRewards     = document.getElementById('card-rewards');
const paydayOverlay   = document.getElementById('payday-overlay');
const paydayAmount    = document.getElementById('payday-amount');
const branchOverlay   = document.getElementById('branch-overlay');
const branchPlayerName= document.getElementById('branch-player-name');
const decisionOverlayTv = document.getElementById('decision-overlay-tv');
const decisionTitleTv = document.getElementById('decision-title-tv');
const endgameOverlay  = document.getElementById('endgame-overlay');
const endgameRankings = document.getElementById('endgame-rankings');
const turnText        = document.getElementById('turn-text');
const leaderboardEl   = document.getElementById('score-cards');

// ── Wheel ─────────────────────────────────────────────────────
const WHEEL_SECTORS = [
  { num: 1,  color: '#ef4444' }, // Red
  { num: 2,  color: '#f97316' }, // Orange
  { num: 3,  color: '#f59e0b' }, // Amber
  { num: 4,  color: '#10b981' }, // Green
  { num: 5,  color: '#06b6d4' }, // Cyan
  { num: 6,  color: '#3b82f6' }, // Blue
  { num: 7,  color: '#6366f1' }, // Indigo
  { num: 8,  color: '#a855f7' }, // Purple
  { num: 9,  color: '#ec4899' }, // Pink
  { num: 10, color: '#eab308' }, // Gold
];
let wheelAngle = 0;

function drawWheel(angle) {
  if (!wheelCanvas) return;
  const ctx = wheelCanvas.getContext('2d');
  const size = wheelCanvas.width;
  const cx = size / 2, cy = size / 2, r = cx - 24;
  ctx.clearRect(0, 0, size, size);

  // Outer golden bezel with radial gradient
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r + 18, 0, Math.PI * 2);
  const outerGrad = ctx.createRadialGradient(cx, cy, r - 10, cx, cy, r + 20);
  outerGrad.addColorStop(0, '#f59e0b');
  outerGrad.addColorStop(0.6, '#b45309');
  outerGrad.addColorStop(1, '#78350f');
  ctx.fillStyle = outerGrad;
  ctx.fill();

  // 20 golden studs around the rim
  for (let i = 0; i < 20; i++) {
    const studAngle = (i / 20) * Math.PI * 2 + angle;
    const sx = cx + Math.cos(studAngle) * (r + 9);
    const sy = cy + Math.sin(studAngle) * (r + 9);
    ctx.beginPath();
    ctx.arc(sx, sy, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = '#fef08a';
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();

  // 10 sectors
  const arc = (2 * Math.PI) / WHEEL_SECTORS.length;
  WHEEL_SECTORS.forEach((sec, i) => {
    const start = i * arc + angle;
    const end = start + arc;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle = sec.color;
    ctx.fill();
    ctx.strokeStyle = '#0b1329';
    ctx.lineWidth = 4;
    ctx.stroke();

    // 3D sector lighting overlay
    const grad = ctx.createRadialGradient(cx, cy, r * 0.15, cx, cy, r);
    grad.addColorStop(0, 'rgba(255,255,255,0.22)');
    grad.addColorStop(0.75, 'rgba(0,0,0,0.05)');
    grad.addColorStop(1, 'rgba(0,0,0,0.38)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Number text
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + arc / 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = 8;
    ctx.font = '900 36px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sec.num, r * 0.68, 0);
    ctx.restore();
  });

  // Center cap
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = '#0b1329';
  ctx.fill();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 6;
  ctx.stroke();

  // Sparkle icon in center
  ctx.font = '30px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✨', cx, cy);

  // Golden Pointer at 12 o'clock pointing DOWN into the wheel rim
  ctx.save();
  ctx.translate(cx, cy);
  ctx.shadowColor = 'rgba(0,0,0,0.75)';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(-16, -r - 18);
  ctx.lineTo(16, -r - 18);
  ctx.lineTo(0, -r + 10);
  ctx.closePath();
  ctx.fillStyle = '#f59e0b';
  ctx.fill();
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

// ── Room creation ─────────────────────────────────────────────
socket.emit('host_create_room', { host: window.location.host, protocol: window.location.protocol });

socket.on('room_created', ({ roomCode, joinUrl, qrCodeDataUrl }) => {
  currentRoomCode = roomCode;
  roomCodeDisplay.textContent = roomCode;
  joinUrlDisplay.textContent = joinUrl;
  if (qrCodeImg) qrCodeImg.src = qrCodeDataUrl;
  drawWheel(0);
});

socket.on('qr_updated', ({ joinUrl, qrCodeDataUrl }) => {
  joinUrlDisplay.textContent = joinUrl;
  if (qrCodeImg) qrCodeImg.src = qrCodeDataUrl;
});

// Custom URL input
const customUrlInput = document.getElementById('custom-url-input');
const customUrlBtn = document.getElementById('custom-url-btn');
if (customUrlBtn) {
  customUrlBtn.onclick = () => {
    const url = (customUrlInput.value || '').trim();
    if (url) socket.emit('update_host_url', { roomCode: currentRoomCode, customUrl: url });
  };
}

// ── Lobby ──────────────────────────────────────────────────────
socket.on('lobby_updated', ({ players }) => {
  currentPlayers = players;
  renderLobbyPlayers();
});

function renderLobbyPlayers() {
  if (!lobbyPlayersGrid) return;
  lobbyPlayersGrid.innerHTML = '';
  currentPlayers.forEach(p => {
    const card = document.createElement('div');
    card.className = 'player-card';
    card.style.borderColor = p.character.color;
    card.innerHTML = `
      <div class="player-avatar" style="background:${p.character.color}20; color:${p.character.color}; font-size:2.5rem;">${p.character.icon}</div>
      <div>
        <div class="player-name">${p.name}</div>
        <div class="player-outfit" style="color:${p.character.color}; font-size:12px;">
          ${p.career ? p.career.icon + ' ' + p.career.name : p.character.name}
        </div>
        <div style="font-size:11px; color:#94a3b8; margin-top:4px;">
          Gehalt: ${(p.salary || 0).toLocaleString()} €/Zahltag
        </div>
        <div style="margin-top:6px; font-size:13px;">${p.ready ? '✅ Bereit' : '⏳ Warten...'}</div>
      </div>
    `;
    lobbyPlayersGrid.appendChild(card);
  });
}

const btnCameraToggle = document.getElementById('btn-camera-toggle');
if (btnCameraToggle) {
  btnCameraToggle.addEventListener('click', () => {
    if (dubaiBoard3D) {
      const mode = dubaiBoard3D.toggleCameraMode();
      btnCameraToggle.textContent = mode === 'overview' ? '🚁 Übersicht' : '🎥 Verfolger-Kamera';
    }
  });
}

// ── Start game ─────────────────────────────────────────────────
const startBtn = document.getElementById('start-game-btn');
if (startBtn) {
  startBtn.onclick = () => {
    if (currentPlayers.length > 0) socket.emit('start_game', { roomCode: currentRoomCode });
  };
}

socket.on('game_started', ({ players, currentTurnPlayer }) => {
  currentPlayers = players;
  lobbyScreen.style.display = 'none';
  gameScreen.style.display = 'flex';

  dubaiBoard3D = new DubaiBoard3D('board-canvas');
  dubaiBoard3D.init();
  dubaiBoard3D.updatePlayers(currentPlayers);

  // Wire up branch callback
  dubaiBoard3D.onReachBranch = (player, nodeId, remainingSteps, nextIds) => {
    return new Promise(resolve => {
      pendingBranchResolve = resolve;
      branchPlayerName.textContent = player.name;
      branchOverlay.classList.add('active');

      const options = nextIds.map(id => {
        const n = BOARD_NODES.find(node => node.id === id);
        return {
          id: id,
          title: n ? n.title : `Pfad ${id}`,
          icon: n ? n.icon : '➡️',
          description: n ? n.description : ''
        };
      });

      socket.emit('branch_reached', {
        roomCode: currentRoomCode,
        playerId: player.socketId,
        nodeId,
        remainingSteps,
        options
      });
    });
  };

  updateLeaderboard();
  setTurnText(currentTurnPlayer);
});

// ── Turn / Spin ────────────────────────────────────────────────
function setTurnText(player) {
  if (!player || !turnText) return;
  const isTv = true; // host always shows instruction
  turnText.innerHTML = `🎮 <span style="color:${player.character.color}; font-weight:900;">${player.name}</span> ist dran — Handy: Rad mit Schwung drehen!`;
}

// Spacebar = quick spin for testing
window.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    const cp = currentPlayers.find(p => p.isTurn);
    if (cp) socket.emit('player_spin_wheel', { roomCode: currentRoomCode });
  }
});

// ── Wheel spin ─────────────────────────────────────────────────
socket.on('wheel_spun', ({ player, spinValue, velocity = 1 }) => {
  activePlayer = player;
  wheelPlayerName.textContent = `${player.name} dreht das Rad...`;
  wheelOverlay.classList.add('active');

  if (dubaiBoard3D && typeof dubaiBoard3D.spinBoardWheel === 'function') {
    dubaiBoard3D.spinBoardWheel(spinValue, velocity);
  }

  const sectorIndex = WHEEL_SECTORS.findIndex(s => s.num === spinValue);
  const arc = (2 * Math.PI) / WHEEL_SECTORS.length;
  const targetAngle = (3 * Math.PI / 2) - (sectorIndex * arc + arc / 2);
  
  // Dynamic rotations and duration based on player swipe velocity
  const rotations = Math.min(6, Math.max(3, Math.round(velocity * 1.2)));
  const duration = Math.min(3400, Math.max(2200, 2000 + velocity * 220));
  const finalAngle = rotations * 2 * Math.PI + targetAngle;
  const startTime = performance.now();
  let lastTick = 0;

  function animateWheel(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = ease * finalAngle;
    drawWheel(current);
    if (Math.abs(current - lastTick) >= arc) {
      window.soundEngine && window.soundEngine.play('wheel_tick');
      lastTick = current;
    }
    if (progress < 1) {
      requestAnimationFrame(animateWheel);
    } else {
      setTimeout(() => {
        wheelOverlay.classList.remove('active');
        execute3DMove(player, spinValue);
      }, 700);
    }
  }
  requestAnimationFrame(animateWheel);
});

// ── Movement ───────────────────────────────────────────────────
async function execute3DMove(player, steps) {
  if (!dubaiBoard3D) return;

  // Sync local player with latest from currentPlayers
  const freshPlayer = currentPlayers.find(p => p.socketId === player.socketId) || player;

  const moveRes = await dubaiBoard3D.animateCarMove(freshPlayer, steps, (p, nodeId, type) => {
    if (type === 'payday') {
      // Tell server player passed over a payday tile
      socket.emit('player_passed_payday', { roomCode: currentRoomCode });
      showPaydayFlash();
    }
    // step & stop handled after movement completes
  });

  // Movement done – process final tile
  const finalNodeId = (moveRes && moveRes.finalNodeId !== undefined) ? moveRes.finalNodeId : freshPlayer.position;
  freshPlayer.position = finalNodeId;
  const finalNode = BOARD_NODES.find(n => n.id === finalNodeId) || BOARD_NODES[0];
  handleTileLanding(freshPlayer, finalNode);
}

function showPaydayFlash() {
  paydayOverlay.classList.add('active');
  setTimeout(() => paydayOverlay.classList.remove('active'), 1600);
  window.soundEngine && window.soundEngine.play('kaching');
}

function handleTileLanding(player, node) {
  window.soundEngine && window.soundEngine.play('move_step');
  socket.emit('player_moved_to_tile', {
    roomCode: currentRoomCode,
    playerId: player.socketId,
    targetNodeId: node.id,
    nodeType: node.type,
    nodeDecisionId: node.decisionId || null
  });
}

// ── Branch choice resolved by path-choice-overlay or controller ──
socket.on('path_chosen', ({ playerId, chosenNodeId }) => {
  branchOverlay.classList.remove('active');
  if (pendingBranchResolve) {
    pendingBranchResolve(chosenNodeId);
    pendingBranchResolve = null;
  }
});

// ── Decision events ─────────────────────────────────────────────
socket.on('decision_required', ({ player, decisionData }) => {
  if (dubaiBoard3D) dubaiBoard3D.updatePlayers(currentPlayers);
  if (decisionTitleTv) decisionTitleTv.textContent = `⏳ ${player.name} entscheidet: ${decisionData.title}`;
  if (decisionOverlayTv) decisionOverlayTv.classList.add('active');
  if (turnText) turnText.innerHTML = `⏳ <span style="color:${player.character.color}; font-weight:900;">${player.name}</span> muss eine Entscheidung treffen...`;
});

socket.on('decision_resolved', ({ players, updatedPlayer, option, decisionData }) => {
  currentPlayers = players;
  updateLeaderboard();
  if (dubaiBoard3D) dubaiBoard3D.updatePlayers(currentPlayers);
  if (decisionOverlayTv) decisionOverlayTv.classList.remove('active');

  showCard('⚖️', `${updatedPlayer.name}: ${option.label}`, decisionData.title, buildEffectHtml(option.effects));
});

// ── Stats updates ───────────────────────────────────────────────
socket.on('player_stats_updated', ({ players, updatedPlayer, event, paydayAmount, careerAdvancement, newSalary, nodeTitle, nodeDescription, isDecision }) => {
  currentPlayers = players;
  updateLeaderboard();
  if (dubaiBoard3D) dubaiBoard3D.updatePlayers(currentPlayers);

  // If this update was emitted while waiting for a decision, DO NOT show a card or advance turn!
  if (isDecision) return;
  const landedNode = BOARD_NODES.find(n => n.id === (updatedPlayer ? updatedPlayer.position : null));
  if (landedNode && (landedNode.decisionId || landedNode.type === 'decision' || landedNode.type === 'branch')) {
    return;
  }

  if (careerAdvancement && updatedPlayer) {
    showCard('📈', `${updatedPlayer.name} befördert!`, `Neues Gehalt: ${(newSalary || 0).toLocaleString()} €/Zahltag`, '', 4000);
  } else if (event) {
    const icon = event.type === 'positive' ? '🚀' : event.type === 'negative' ? '📉' : '🎲';
    const amountHtml = event.moneyEffect ? `<span style="color:${event.moneyEffect>0?'#22c55e':'#ef4444'}">${event.moneyEffect>0?'+':''}${event.moneyEffect.toLocaleString()} €</span>` : '';
    showCard(icon, event.title, event.description, amountHtml, 4000);
  } else if (paydayAmount > 0) {
    showCard('💰', 'ZAHLTAG!', 'Gehaltseingang!', `<span style="color:#22c55e">+${paydayAmount.toLocaleString()} €</span>`, 3500);
  } else {
    // Normal / blank tile landing – show tile info or auto-advance
    if (landedNode && landedNode.description) {
      showCard(landedNode.icon || '📍', landedNode.title, landedNode.description, '', 2800);
    } else {
      setTimeout(() => {
        socket.emit('next_turn', { roomCode: currentRoomCode });
      }, 1500);
    }
  }
});

socket.on('payday_collected', ({ player, amount }) => {
  const p = currentPlayers.find(p2 => p2.socketId === player.socketId);
  if (p) { p.money = player.money; updateLeaderboard(); }
  showPaydayFlash();
  paydayAmount.textContent = `+${amount.toLocaleString()} €`;
});

// ── Retirement & Game end ───────────────────────────────────────
socket.on('player_retired', ({ player, finalScore }) => {
  const p = currentPlayers.find(p2 => p2.socketId === player.socketId);
  if (p) { p.isRetired = true; p.finalScore = finalScore; }
  updateLeaderboard();
  if (dubaiBoard3D) {
    const car = dubaiBoard3D.cars[player.socketId];
    if (car) {
      dubaiBoard3D.spawnConfetti(car.position);
    }
  }
  showCard('🏝️', `${player.name} im Ruhestand!`, 'Endabrechnung läuft...', `<span style="color:#f59e0b">Score: ${finalScore.toLocaleString()}</span>`, 5000);
  window.soundEngine && window.soundEngine.play('cheer');
});

socket.on('game_finished', ({ rankings, winner }) => {
  endgameOverlay.classList.add('active');
  let html = `<div style="text-align:center; margin-bottom:20px;"><div style="font-size:48px;">🏆</div><div style="font-size:28px; color:#f59e0b; font-weight:900;">GEWINNER: ${winner.name}</div></div>`;
  rankings.forEach((p, i) => {
    const medals = ['🥇','🥈','🥉','4️⃣'];
    html += `<div class="endgame-row" style="padding:12px; margin:8px 0; background:rgba(255,255,255,0.05); border-radius:12px; display:flex; justify-content:space-between; align-items:center;">
      <span style="font-size:24px;">${medals[i] || i+1}</span>
      <span style="font-weight:700; color:${p.character.color};">${p.character.icon} ${p.name}</span>
      <span style="color:#22c55e; font-weight:700;">${(p.finalScore||0).toLocaleString()} Punkte</span>
    </div>`;
  });
  endgameRankings.innerHTML = html;
  window.soundEngine && window.soundEngine.play('cheer');
});

// ── Turn changed ────────────────────────────────────────────────
socket.on('turn_changed', ({ currentTurnPlayer, players }) => {
  if (currentCardTimer) {
    clearTimeout(currentCardTimer);
    currentCardTimer = null;
  }
  if (decisionOverlayTv) decisionOverlayTv.classList.remove('active');
  if (branchOverlay) branchOverlay.classList.remove('active');
  if (actionOverlay) actionOverlay.classList.remove('active');

  currentPlayers = players;
  updateLeaderboard();
  setTurnText(currentTurnPlayer);
  if (dubaiBoard3D) dubaiBoard3D.updatePlayers(currentPlayers);
  window.soundEngine && window.soundEngine.play('wheel_tick');
});

// ── Leaderboard ─────────────────────────────────────────────────
function updateLeaderboard() {
  if (!leaderboardEl) return;
  leaderboardEl.innerHTML = '';
  currentPlayers.forEach(p => {
    const isCurrent = p.isTurn;
    const card = document.createElement('div');
    card.className = `player-score-card ${isCurrent ? 'active-turn' : ''} ${p.isRetired ? 'retired' : ''}`;
    card.style.borderColor = p.character.color;
    const assets = p.assets || {};
    card.innerHTML = `
      <div class="score-header">
        <span>${p.career ? p.career.icon : p.character.icon} ${p.name}
          ${assets.house ? '🏠' : ''}
          ${assets.spouse ? '💍' : ''}
          ${assets.children > 0 ? '👶'.repeat(Math.min(assets.children, 3)) : ''}
          ${p.isRetired ? ' 🏝️' : ''}
        </span>
        <span style="font-size:11px; color:${p.character.color}; font-weight:700;">${p.career ? p.career.name : p.character.name}</span>
      </div>
      <div class="score-stats">
        <div class="stat-item money">💰 ${(p.money||0).toLocaleString()} €</div>
        <div class="stat-item">📈 ${(p.salary||0).toLocaleString()} €</div>
        <div class="stat-item">❤️ ${p.happiness||0}</div>
        <div class="stat-item">🧠 ${p.knowledge||0}</div>
      </div>
      ${p.isRetired ? `<div style="color:#f59e0b; font-size:12px; font-weight:700;">Score: ${(p.finalScore||0).toLocaleString()}</div>` : ''}
    `;
    leaderboardEl.appendChild(card);
  });
}

// ── Soundboard ──────────────────────────────────────────────────
socket.on('soundboard_reaction', ({ player, soundId }) => {
  window.soundEngine && window.soundEngine.play(soundId);
  spawnFloatingReaction(player, soundId);
});

function spawnFloatingReaction(player, soundId) {
  const soundIcons = { honk: '📢', kaching: '💰', cheer: '👏', laugh: '😂', fail: '💀' };
  const icon = soundIcons[soundId] || (player.character && player.character.icon) || '🎉';
  const el = document.createElement('div');
  el.className = 'soundboard-float';
  el.innerHTML = `
    <span style="font-size:3.5rem; filter:drop-shadow(0 0 12px rgba(255,255,255,0.4));">${icon}</span>
    <span style="font-size:13px; font-weight:900; color:${(player.character && player.character.color) || '#f59e0b'}; background:rgba(0,0,0,0.7); padding:2px 8px; border-radius:8px;">${player.name}</span>
  `;
  el.style.left = `${Math.random() * 65 + 15}%`;
  el.style.bottom = '130px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

// ── Action Card helper ───────────────────────────────────────────
let currentCardTimer = null;
function showCard(icon, title, desc, rewardsHtml, autoDismissMs = 4000) {
  if (currentCardTimer) {
    clearTimeout(currentCardTimer);
    currentCardTimer = null;
  }
  cardIcon.textContent = icon;
  cardTitle.textContent = title;
  cardDesc.textContent = desc;
  cardRewards.innerHTML = rewardsHtml || '';
  actionOverlay.classList.add('active');
  window.soundEngine && window.soundEngine.play('card_flip');
  if (autoDismissMs > 0) {
    currentCardTimer = setTimeout(() => {
      actionOverlay.classList.remove('active');
      currentCardTimer = null;
      socket.emit('next_turn', { roomCode: currentRoomCode });
    }, autoDismissMs);
  }
}

// Allow host to click actionOverlay or decisionOverlay to dismiss if stuck
if (actionOverlay) {
  actionOverlay.addEventListener('click', () => {
    if (currentCardTimer) {
      clearTimeout(currentCardTimer);
      currentCardTimer = null;
    }
    actionOverlay.classList.remove('active');
    socket.emit('next_turn', { roomCode: currentRoomCode });
  });
}

if (decisionOverlayTv) {
  decisionOverlayTv.addEventListener('click', () => {
    decisionOverlayTv.classList.remove('active');
  });
}

function buildEffectHtml(effects) {
  if (!effects) return '';
  let html = '';
  if (effects.money) html += `<span style="color:${effects.money>0?'#22c55e':'#ef4444'}">${effects.money>0?'+':''}${effects.money.toLocaleString()} €</span> `;
  if (effects.happiness) html += `<span style="color:#ec4899">${effects.happiness>0?'+':''}${effects.happiness} ❤️</span> `;
  if (effects.knowledge) html += `<span style="color:#06b6d4">+${effects.knowledge} 🧠</span> `;
  if (effects.salary) html += `<span style="color:#22c55e">Gehalt: ${effects.salary.toLocaleString()} €</span> `;
  if (effects.house) html += `<span style="color:#a855f7">+🏠 ${effects.house}</span> `;
  if (effects.vehicle) html += `<span style="color:#f59e0b">+🚗 ${effects.vehicle}</span> `;
  if (effects.spouse) html += `<span style="color:#f43f5e">+💍 Heirat!</span> `;
  if (effects.children) html += `<span style="color:#f43f5e">+👶 Kind!</span> `;
  return html;
}
