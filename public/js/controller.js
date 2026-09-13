// ============================================================
// SPIEL DER JAHUDIS – CONTROLLER (Mobile) Script
// Full game flow: join, character, lobby, game, decision, path, retire
// ============================================================

const socket = io();

let myPlayer = null;
let currentRoomCode = null;
let selectedCharacterId = null;
let allCharacters = [];

// ── Screen management ─────────────────────────────────────────
const screens = {};
['join','character','lobby','game','decision','path-choice','retirement','endgame'].forEach(id => {
  screens[id] = document.getElementById(`screen-${id}`);
});

function showScreen(id) {
  Object.values(screens).forEach(s => { if (s) s.classList.remove('active'); });
  if (screens[id]) screens[id].classList.add('active');
  window.scrollTo(0, 0);
}

// ── DOM refs ──────────────────────────────────────────────────
const joinError       = document.getElementById('join-error');
const inputName       = document.getElementById('input-name');
const inputRoom       = document.getElementById('input-room');
const btnJoin         = document.getElementById('btn-join');
const characterGrid   = document.getElementById('character-grid');
const btnReady        = document.getElementById('btn-ready');
const careerReveal    = document.getElementById('career-reveal');
const lobbyCareerIcon = document.getElementById('lobby-career-icon');
const lobbyCareerName = document.getElementById('lobby-career-name');
const lobbyCareerSalary = document.getElementById('lobby-career-salary');
const lobbyCareerDesc = document.getElementById('lobby-career-desc');
const lobbyPlayersList= document.getElementById('lobby-players-list');
const miniHeader      = document.getElementById('mini-header');
const playerAvatarMini= document.getElementById('player-avatar-mini');
const playerNameDisplay = document.getElementById('player-name-display');
const btnShop         = document.getElementById('btn-shop');
const btnRerollJob    = document.getElementById('btn-reroll-job');
const shopModal       = document.getElementById('shop-modal');
const btnCloseShop    = document.getElementById('btn-close-shop');
const shopCasesList   = document.getElementById('shop-cases-list');
const inventoryList   = document.getElementById('inventory-list');
const shopJahudiCoins = document.getElementById('shop-jahudi-coins');

const playerCharDisplay = document.getElementById('player-character-display');
const statMoney       = document.getElementById('stat-money');
const statJahudiCoins = document.getElementById('stat-jahudi-coins');
const statSalary      = document.getElementById('stat-salary');
const statHappiness   = document.getElementById('stat-happiness');
const statKnowledge   = document.getElementById('stat-knowledge');
const assetsRow       = document.getElementById('assets-row');
const turnIndicator   = document.getElementById('turn-indicator');
const wheelContainer  = document.getElementById('wheel-container');
const wheelCanvas     = document.getElementById('controller-wheel-canvas');
const wheelPointer    = document.getElementById('wheel-pointer');
const wheelHint       = document.getElementById('wheel-hint');
const wheelCenterCap  = document.getElementById('wheel-center-cap');
const decIcon         = document.getElementById('dec-icon');
const decTitle        = document.getElementById('dec-title');
const decDesc         = document.getElementById('dec-desc');
const decOptions      = document.getElementById('dec-options');
const pathOptions     = document.getElementById('path-options');
const retireFinalScore = document.getElementById('retire-final-score');
const retireBreakdown = document.getElementById('retire-breakdown');
const endgameList     = document.getElementById('endgame-list');

// ── Pre-fill room from URL ─────────────────────────────────────
const urlParams = new URLSearchParams(window.location.search);
const roomFromUrl = urlParams.get('room');
if (roomFromUrl && inputRoom) inputRoom.value = roomFromUrl.toUpperCase();

// ── JOIN ───────────────────────────────────────────────────────
btnJoin && btnJoin.addEventListener('click', () => {
  const name = (inputName.value || '').trim();
  const room = (inputRoom.value || '').toUpperCase().trim();
  if (!name) return showError('Bitte gib deinen Namen ein.');
  if (room.length !== 4) return showError('Raum-Code muss 4 Zeichen lang sein.');
  socket.emit('get_characters');
  socket.once('characters_list', (chars) => {
    allCharacters = chars;
    renderCharacters(chars);
    showScreen('character');
    currentRoomCode = room;
  });
});

inputRoom && inputRoom.addEventListener('input', () => {
  inputRoom.value = inputRoom.value.toUpperCase();
});

function showError(msg) {
  joinError.textContent = msg;
  joinError.style.display = 'block';
  setTimeout(() => joinError.style.display = 'none', 3000);
}

// ── CHARACTER SELECTION ────────────────────────────────────────
function renderCharacters(chars) {
  characterGrid.innerHTML = '';
  chars.forEach(c => {
    const card = document.createElement('div');
    card.className = 'char-card';
    card.dataset.id = c.id;
    card.style.borderColor = c.color + '40';
    card.innerHTML = `
      <span class="char-icon" style="filter:drop-shadow(0 0 10px ${c.color})">${c.icon}</span>
      <div class="char-name" style="color:#f8fafc;">${c.name}</div>
      <div class="char-car">${c.car || '🚗 Auto'}</div>
      <div class="char-tag" style="color:${c.color}; font-weight:600;">${c.tag || ''}</div>
    `;
    card.addEventListener('click', () => {
      document.querySelectorAll('.char-card').forEach(cc => {
        cc.classList.remove('selected');
        const origChar = chars.find(ch => ch.id === cc.dataset.id);
        cc.style.borderColor = origChar ? (origChar.color + '30') : 'rgba(255,255,255,0.1)';
        cc.style.background = '';
        cc.style.boxShadow = '';
      });
      card.classList.add('selected');
      card.style.borderColor = c.color;
      card.style.background = c.color + '22';
      card.style.boxShadow = `0 0 18px ${c.color}55`;
      selectedCharacterId = c.id;
      btnReady.disabled = false;
    });
    characterGrid.appendChild(card);
  });
}

btnReady && btnReady.addEventListener('click', () => {
  if (!selectedCharacterId) return;
  const name = (inputName.value || '').trim();
  socket.emit('player_join_room', { roomCode: currentRoomCode, playerName: name, characterId: selectedCharacterId });
});

// ── LOBBY ──────────────────────────────────────────────────────
socket.on('join_success', ({ player, roomCode }) => {
  myPlayer = player;
  currentRoomCode = roomCode;
  showScreen('lobby');

  if (player.career) {
    careerReveal.style.display = 'block';
    lobbyCareerIcon.textContent = player.career.icon;
    lobbyCareerName.textContent = player.career.name;
    lobbyCareerSalary.textContent = `${player.career.salaryPerPayday.toLocaleString()} €/Zahltag`;
    lobbyCareerDesc.textContent = player.career.description;
  }

  socket.emit('player_ready', { roomCode });
});

socket.on('join_error', ({ message }) => {
  showScreen('join');
  showError(message);
});

socket.on('lobby_updated', ({ players }) => {
  if (!lobbyPlayersList) return;
  lobbyPlayersList.innerHTML = '';
  players.forEach(p => {
    const div = document.createElement('div');
    div.className = 'lobby-player';
    div.innerHTML = `
      <div class="lp-icon">${p.character.icon}</div>
      <div>
        <div class="lp-name" style="color:${p.character.color}">${p.name}</div>
        <div class="lp-career">${p.career ? p.career.icon + ' ' + p.career.name : '–'} ${p.ready ? '✅' : '⏳'}</div>
      </div>
    `;
    lobbyPlayersList.appendChild(div);
    // Sync my player state
    if (myPlayer && p.socketId === myPlayer.socketId) myPlayer = p;
  });
});

// ── GAME START ─────────────────────────────────────────────────
socket.on('game_started', ({ players, currentTurnPlayer }) => {
  const me = players.find(p => p.socketId === socket.id);
  if (me) myPlayer = me;
  showScreen('game');
  updateGameHeader();
  updateStats();
  updateTurnIndicator(currentTurnPlayer);
});

function updateGameHeader() {
  if (!myPlayer) return;
  playerAvatarMini.textContent = myPlayer.career ? myPlayer.career.icon : myPlayer.character.icon;
  playerAvatarMini.style.background = myPlayer.character.color + '30';
  playerNameDisplay.textContent = myPlayer.name;
  playerCharDisplay.textContent = myPlayer.career ? myPlayer.career.name : myPlayer.character.name;
}

function updateStats() {
  if (!myPlayer) return;
  statMoney.textContent = (myPlayer.money || 0).toLocaleString() + ' €';
  if(statJahudiCoins) statJahudiCoins.textContent = (myPlayer.jahudiCoins || 0);
  statSalary.textContent = (myPlayer.salary || 0).toLocaleString() + ' €';
  statHappiness.textContent = myPlayer.happiness || 0;
  statKnowledge.textContent = myPlayer.knowledge || 0;

  // Assets
  if (assetsRow) {
    assetsRow.innerHTML = '';
    const assets = myPlayer.assets || {};
    if (assets.house) assetsRow.innerHTML += `<div class="asset-badge">🏠 ${assets.house}</div>`;
    if (assets.vehicle) assetsRow.innerHTML += `<div class="asset-badge">🚗 ${assets.vehicle}</div>`;
    
    const inv = myPlayer.investments || {};
    if (inv.stocks > 0) assetsRow.innerHTML += `<div class="asset-badge">📈 Aktien: ${inv.stocks.toLocaleString()} €</div>`;
    if (inv.crypto > 0) assetsRow.innerHTML += `<div class="asset-badge">🚀 Krypto: ${inv.crypto.toLocaleString()} €</div>`;
    if (inv.realEstate > 0) assetsRow.innerHTML += `<div class="asset-badge">🏗️ Immobilien: ${inv.realEstate.toLocaleString()} €</div>`;
  }
}

// ── INTERACTIVE SWIPE WHEEL ENGINE (Mobile & Desktop) ───────────
const CONTROLLER_WHEEL_SECTORS = [
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
let wheelAngularVelocity = 0;
let isWheelDragging = false;
let isWheelSpinning = false;
let isMyTurn = false;
let wheelLastAngle = 0;
let wheelLastTime = 0;
let wheelDragPoints = [];
let lastTickedIndex = -1;

function drawControllerWheel(angle = 0) {
  if (!wheelCanvas) return;
  const ctx = wheelCanvas.getContext('2d');
  const size = wheelCanvas.width; // 520
  const cx = size / 2;
  const cy = size / 2;
  const radius = cx - 22;
  const numSectors = CONTROLLER_WHEEL_SECTORS.length;
  const arc = (2 * Math.PI) / numSectors;

  ctx.clearRect(0, 0, size, size);

  // Outer rim shadow & gradient
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 14, 0, Math.PI * 2);
  const outerGrad = ctx.createRadialGradient(cx, cy, radius - 10, cx, cy, radius + 16);
  outerGrad.addColorStop(0, '#f59e0b');
  outerGrad.addColorStop(0.6, '#b45309');
  outerGrad.addColorStop(1, '#78350f');
  ctx.fillStyle = outerGrad;
  ctx.fill();

  // 20 golden studs
  for (let i = 0; i < 20; i++) {
    const studAngle = (i / 20) * Math.PI * 2 + angle;
    const sx = cx + Math.cos(studAngle) * (radius + 7);
    const sy = cy + Math.sin(studAngle) * (radius + 7);
    ctx.beginPath();
    ctx.arc(sx, sy, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#fef08a';
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();

  // 10 sectors
  CONTROLLER_WHEEL_SECTORS.forEach((sec, i) => {
    const start = angle + i * arc;
    const end = start + arc;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, start, end);
    ctx.closePath();

    ctx.fillStyle = sec.color;
    ctx.fill();
    ctx.strokeStyle = '#0b1329';
    ctx.lineWidth = 4;
    ctx.stroke();

    // 3D sector gradient overlay
    const grad = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius);
    grad.addColorStop(0, 'rgba(255,255,255,0.22)');
    grad.addColorStop(0.75, 'rgba(0,0,0,0.05)');
    grad.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Sector Number
    const secMid = start + arc / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(secMid);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = 8;
    ctx.font = 'bold 44px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sec.num, radius * 0.68, 0);
    ctx.restore();
  });

  // Inner ring
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.32, 0, Math.PI * 2);
  ctx.fillStyle = '#0b1329';
  ctx.fill();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 5;
  ctx.stroke();
}

function getAngleFromEvent(e) {
  if (!wheelCanvas) return 0;
  const rect = wheelCanvas.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const clientX = (e.touches && e.touches.length > 0) ? e.touches[0].clientX : e.clientX;
  const clientY = (e.touches && e.touches.length > 0) ? e.touches[0].clientY : e.clientY;
  return Math.atan2(clientY - cy, clientX - cx);
}

function normalizeAngle(a) {
  return ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
}

function getSelectedSector(angle) {
  // Top pointer is at -PI/2 (or 3*PI/2)
  const arc = (Math.PI * 2) / CONTROLLER_WHEEL_SECTORS.length;
  const pointerAngle = normalizeAngle(1.5 * Math.PI - angle);
  const index = Math.floor(pointerAngle / arc) % CONTROLLER_WHEEL_SECTORS.length;
  return CONTROLLER_WHEEL_SECTORS[index];
}

function triggerWheelTick() {
  if (wheelPointer) {
    wheelPointer.classList.add('tick');
    setTimeout(() => wheelPointer.classList.remove('tick'), 70);
  }
  if (navigator.vibrate) {
    try { navigator.vibrate(12); } catch (_) {}
  }
}

function onWheelPointerDown(e) {
  if (!isMyTurn || isWheelSpinning) return;
  if (e.touches && e.touches.length > 1) return;
  if (e.preventDefault) e.preventDefault();

  isWheelDragging = true;
  wheelAngularVelocity = 0;
  wheelLastAngle = getAngleFromEvent(e);
  wheelLastTime = performance.now();
  wheelDragPoints = [{ angle: wheelLastAngle, time: wheelLastTime }];
  if (wheelHint) {
    wheelHint.textContent = '💨 Ziehe und lasse mit Schwung los!';
  }
}

function onWheelPointerMove(e) {
  if (!isWheelDragging || !isMyTurn || isWheelSpinning) return;
  if (e.preventDefault) e.preventDefault();

  const currentTouchAngle = getAngleFromEvent(e);
  const now = performance.now();

  let delta = currentTouchAngle - wheelLastAngle;
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;

  wheelAngle += delta;
  wheelLastAngle = currentTouchAngle;

  wheelDragPoints.push({ angle: wheelAngle, time: now });
  if (wheelDragPoints.length > 6) wheelDragPoints.shift();

  drawControllerWheel(wheelAngle);

  const sector = getSelectedSector(wheelAngle);
  if (sector.num !== lastTickedIndex) {
    lastTickedIndex = sector.num;
    triggerWheelTick();
  }
}

function predictFinalSector(currentAngle, initialVelocity, friction = 0.983) {
  let simAngle = currentAngle;
  let simVel = initialVelocity;
  while (Math.abs(simVel) > 0.0015) {
    simAngle += simVel;
    simVel *= friction;
  }
  return getSelectedSector(simAngle);
}

function onWheelPointerUp() {
  if (!isWheelDragging || !isMyTurn || isWheelSpinning) return;
  isWheelDragging = false;

  const now = performance.now();
  const recent = wheelDragPoints.filter(p => now - p.time < 160);
  let computedVelocity = 0;
  if (recent.length >= 2) {
    const first = recent[0];
    const last = recent[recent.length - 1];
    const dt = (last.time - first.time) || 16;
    computedVelocity = (last.angle - first.angle) / (dt / 16.666);
  }

  const minSpeed = 0.32 + Math.random() * 0.08;
  if (Math.abs(computedVelocity) < 0.1) {
    computedVelocity = (Math.random() > 0.5 ? 1 : -1) * minSpeed;
  } else {
    // Dynamic range from soft swipe to power flick (up to 1.2 rad/frame)
    computedVelocity = Math.max(-1.25, Math.min(1.25, computedVelocity));
    if (Math.abs(computedVelocity) < 0.25) {
      computedVelocity = Math.sign(computedVelocity) * minSpeed;
    }
  }

  const predictedSector = predictFinalSector(wheelAngle, computedVelocity, 0.983);
  const spinSpeed = Math.min(6.0, Math.max(1.0, Math.abs(computedVelocity) * 4.5));

  // Immediately notify server so TV Host starts spinning concurrently
  socket.emit('player_spin_wheel', {
    roomCode: currentRoomCode,
    spinValue: predictedSector.num,
    velocity: spinSpeed
  });

  launchPhysicsSpin(computedVelocity, predictedSector);
}

function launchPhysicsSpin(initialVelocity, expectedSector = null) {
  isWheelSpinning = true;
  wheelAngularVelocity = initialVelocity;
  if (wheelContainer) wheelContainer.classList.add('disabled');
  if (wheelHint) {
    wheelHint.textContent = '🎰 Rad dreht sich...';
    wheelHint.classList.add('active');
  }

  const friction = 0.983;
  let lastFrameTime = performance.now();

  function step(now) {
    const dt = Math.min((now - lastFrameTime) / 16.666, 2.5);
    lastFrameTime = now;

    wheelAngle += wheelAngularVelocity * dt;
    wheelAngularVelocity *= Math.pow(friction, dt);

    drawControllerWheel(wheelAngle);

    const sector = getSelectedSector(wheelAngle);
    if (sector.num !== lastTickedIndex) {
      lastTickedIndex = sector.num;
      triggerWheelTick();
    }

    // Smoothly align to expected sector center during final deceleration
    if (expectedSector && Math.abs(wheelAngularVelocity) < 0.06) {
      const sectorIdx = CONTROLLER_WHEEL_SECTORS.findIndex(s => s.num === expectedSector.num);
      if (sectorIdx !== -1) {
        const twoPi = Math.PI * 2;
        const arc = twoPi / CONTROLLER_WHEEL_SECTORS.length;
        const targetAngle = ((1.5 * Math.PI - (sectorIdx * arc + arc / 2)) % twoPi + twoPi) % twoPi;
        const mod = ((wheelAngle % twoPi) + twoPi) % twoPi;
        let diff = targetAngle - mod;
        if (diff > Math.PI) diff -= twoPi;
        if (diff < -Math.PI) diff += twoPi;
        wheelAngle += diff * 0.14 * dt;
      }
    }

    if (Math.abs(wheelAngularVelocity) > 0.0015) {
      requestAnimationFrame(step);
    } else {
      wheelAngularVelocity = 0;
      isWheelSpinning = false;
      const finalSector = expectedSector || getSelectedSector(wheelAngle);

      // Lock final exact angle to sector center
      const sectorIdx = CONTROLLER_WHEEL_SECTORS.findIndex(s => s.num === finalSector.num);
      if (sectorIdx !== -1) {
        const twoPi = Math.PI * 2;
        const arc = twoPi / CONTROLLER_WHEEL_SECTORS.length;
        const targetAngle = ((1.5 * Math.PI - (sectorIdx * arc + arc / 2)) % twoPi + twoPi) % twoPi;
        const mod = ((wheelAngle % twoPi) + twoPi) % twoPi;
        let diff = targetAngle - mod;
        if (diff > Math.PI) diff -= twoPi;
        if (diff < -Math.PI) diff += twoPi;
        wheelAngle += diff;
        drawControllerWheel(wheelAngle);
      }
      
      if (navigator.vibrate) {
        try { navigator.vibrate([40, 40, 100]); } catch (_) {}
      }

      if (wheelHint) {
        wheelHint.textContent = `🎉 Du hast eine ${finalSector.num} gedreht!`;
        wheelHint.classList.remove('active');
      }
    }
  }
  requestAnimationFrame(step);
}

socket.on('wheel_spun', ({ player, spinValue, velocity = 1 }) => {
  if (myPlayer && player.socketId !== myPlayer.socketId) {
    if (wheelHint) {
      wheelHint.textContent = `🎲 ${player.name} dreht das Rad...`;
      wheelHint.classList.add('active');
    }
  } else if (!isWheelSpinning && isMyTurn) {
    // Spin triggered via Host or fallback
    const targetSector = CONTROLLER_WHEEL_SECTORS.find(s => s.num === spinValue) || CONTROLLER_WHEEL_SECTORS[0];
    const computedVel = Math.min(0.65, Math.max(0.3, velocity * 0.08));
    launchPhysicsSpin(computedVel, targetSector);
  }
});

if (wheelContainer) {
  wheelContainer.addEventListener('touchstart', onWheelPointerDown, { passive: false });
  window.addEventListener('touchmove', onWheelPointerMove, { passive: false });
  window.addEventListener('touchend', onWheelPointerUp);
  window.addEventListener('touchcancel', onWheelPointerUp);

  wheelContainer.addEventListener('mousedown', onWheelPointerDown);
  window.addEventListener('mousemove', onWheelPointerMove);
  window.addEventListener('mouseup', onWheelPointerUp);
}

drawControllerWheel(0);

function updateTurnIndicator(currentTurnPlayer) {
  if (!currentTurnPlayer || !myPlayer) return;
  const isMe = currentTurnPlayer.socketId === myPlayer.socketId;
  isMyTurn = isMe;
  
  turnIndicator.textContent = isMe ? '🎯 Du bist dran!' : `⏳ ${currentTurnPlayer.name} ist dran...`;
  turnIndicator.className = 'turn-indicator ' + (isMe ? 'my-turn' : '');
  
  if (wheelContainer) {
    if (isMe && !isWheelSpinning) {
      wheelContainer.classList.remove('disabled');
      if (wheelHint) {
        wheelHint.textContent = '👆 Swipe das Rad mit Schwung!';
        wheelHint.classList.add('active');
      }
    } else {
      wheelContainer.classList.add('disabled');
      if (wheelHint && !isWheelSpinning) {
        wheelHint.textContent = 'Warte auf deinen Zug...';
        wheelHint.classList.remove('active');
      }
    }
  }
  if (isMe && navigator.vibrate) navigator.vibrate([100, 50, 200]);
}

// ── TURN CHANGES ───────────────────────────────────────────────
socket.on('turn_changed', ({ currentTurnPlayer, players }) => {
  const me = players.find(p => p.socketId === socket.id);
  if (me) { myPlayer = me; updateStats(); }
  updateTurnIndicator(currentTurnPlayer);
  if (screens['decision'] && screens['decision'].classList.contains('active')) {
    showScreen('game');
  }
  if (screens['path-choice'] && screens['path-choice'].classList.contains('active')) {
    showScreen('game');
  }
});

// ── STATS UPDATES ──────────────────────────────────────────────
socket.on('player_stats_updated', ({ players }) => {
  const me = players.find(p => p.socketId === socket.id);
  if (me) { myPlayer = me; updateStats(); }
});

socket.on('payday_collected', ({ player, amount }) => {
  if (player.socketId === socket.id) {
    if (navigator.vibrate) navigator.vibrate(200);
    myPlayer = player;
    updateStats();
  }
});

// ── DECISION ───────────────────────────────────────────────────
socket.on('decision_required', ({ player, decisionData }) => {
  if (player.socketId !== socket.id) return;

  if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
  showScreen('decision');

  decIcon.textContent = decisionData.icon || '⚖️';
  decTitle.textContent = decisionData.title;
  decDesc.textContent = decisionData.description;
  decOptions.innerHTML = '';

  const colorClasses = ['option-a', 'option-b', 'option-c'];
  decisionData.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = `btn-option ${colorClasses[i] || ''}`;
    btn.textContent = opt.label;
    btn.addEventListener('click', () => {
      showScreen('game');
      const code = (currentRoomCode || '').toUpperCase().trim();
      socket.emit('submit_decision', { roomCode: code, optionId: opt.id });
    });
    decOptions.appendChild(btn);
  });
});

socket.on('decision_resolved', ({ players }) => {
  const me = players.find(p => p.socketId === socket.id);
  if (me) { myPlayer = me; updateStats(); }
  if (screens['decision'] && screens['decision'].classList.contains('active')) {
    showScreen('game');
  }
});

// ── PATH CHOICE ───────────────────────────────────────────────
socket.on('path_choice_required', ({ playerId, options }) => {
  if (playerId !== socket.id) return;
  if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
  showScreen('path-choice');
  pathOptions.innerHTML = '';
  options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = `btn-option ${idx === 0 ? 'option-a' : idx === 1 ? 'option-b' : 'option-c'}`;
    btn.innerHTML = `
      <div style="display:flex; align-items:center; gap:12px;">
        <span style="font-size:2.2rem;">${opt.icon}</span>
        <div>
          <div style="font-weight:900; font-size:16px;">${opt.title}</div>
          <div style="font-size:13px; color:#94a3b8; margin-top:2px;">${opt.description}</div>
        </div>
      </div>
    `;
    btn.addEventListener('click', () => {
      showScreen('game');
      socket.emit('choose_path', { roomCode: currentRoomCode, chosenNodeId: opt.id });
    });
    pathOptions.appendChild(btn);
  });
});

socket.on('path_chosen', () => {
  if (screens['path-choice'] && screens['path-choice'].classList.contains('active')) {
    showScreen('game');
  }
});

// ── SOUNDBOARD ────────────────────────────────────────────────
document.querySelectorAll('.btn-sound').forEach(btn => {
  btn.addEventListener('click', () => {
    const soundId = btn.dataset.sound;
    if (soundId) {
      if (navigator.vibrate) navigator.vibrate(40);
      socket.emit('soundboard_trigger', { roomCode: currentRoomCode, soundId });
    }
  });
});

// ── RETIREMENT ─────────────────────────────────────────────────
socket.on('player_retired', ({ player, finalScore }) => {
  if (player.socketId !== socket.id) return;
  myPlayer = player;
  showScreen('retirement');

  retireFinalScore.textContent = finalScore.toLocaleString() + ' Punkte';
  const assets = player.assets || {};
  const inv = player.investments || {};
  retireBreakdown.innerHTML = `
    💰 Geld: ${(player.money || 0).toLocaleString()} €<br>
    🏠 Haus: ${assets.houseValue ? assets.houseValue.toLocaleString() + ' €' : '–'}<br>
    🚗 Auto: ${assets.vehicleValue ? assets.vehicleValue.toLocaleString() + ' €' : '–'}<br>
    📈 Aktien: ${inv.stocks > 0 ? inv.stocks.toLocaleString() + ' €' : '–'}<br>
    🚀 Krypto: ${inv.crypto > 0 ? inv.crypto.toLocaleString() + ' €' : '–'}<br>
    🏗️ Immobilien: ${inv.realEstate > 0 ? inv.realEstate.toLocaleString() + ' €' : '–'}<br>
    ❤️ Glück: ${(player.happiness || 0)} × 1.000 €<br>
    🧠 Wissen: ${(player.knowledge || 0)} × 500 €
  `;
});


// ── JAHUDI SHOP ────────────────────────────────────────────────
if (btnShop) {
  btnShop.addEventListener('click', () => {
    shopModal.style.display = 'block';
    updateShopUI();
  });
}
if (btnRerollJob) {
  btnRerollJob.addEventListener('click', () => {
    if (confirm("Möchtest du dein Gehalt wirklich rerollen? (Max ±50k €)")) {
      socket.emit('reroll_job', { roomCode });
    }
  });
}
if (btnCloseShop) {
  btnCloseShop.addEventListener('click', () => {
    shopModal.style.display = 'none';
  });
}

function updateShopUI() {
  if (!myPlayer) return;
  shopJahudiCoins.textContent = myPlayer.jahudiCoins || 0;
  
  // Render Inventory
  inventoryList.innerHTML = '';
  const inv = myPlayer.inventory || [];
  if (inv.length === 0) {
    inventoryList.innerHTML = '<div style="color:var(--text-secondary); width:100%; text-align:center;">Leer</div>';
  } else {
    inv.forEach(item => {
      const el = document.createElement('div');
      el.style = 'background:var(--surface-light); padding:10px; border-radius:10px; flex: 1 1 calc(50% - 10px); text-align:center; border: 1px solid var(--border);';
      el.innerHTML = `
        <div style="font-size:12px; color:var(--text-secondary);">${item.rarity}</div>
        <div style="font-weight:bold; margin: 5px 0;">${item.name}</div>
        <button class="btn-primary" style="padding:6px; font-size:12px; margin-top:5px;" onclick="equipCosmetic('${item.id}')">
          ${myPlayer.activeOutfit && item.id.includes(myPlayer.activeOutfit) ? 'Ausgerüstet' : 'Ausrüsten'}
        </button>
      `;
      inventoryList.appendChild(el);
    });
  }
}

window.equipCosmetic = function(id) {
  socket.emit('equip_cosmetic', { roomCode: currentRoomCode, cosmeticId: id });
  alert('Cosmetic ausgerüstet!');
  shopModal.style.display = 'none';
};

window.buyCase = function(id) {
  socket.emit('buy_case', { roomCode: currentRoomCode, caseId: id });
};

socket.on('case_opened', ({ cosmetic, jahudiCoins }) => {
  if (myPlayer) myPlayer.jahudiCoins = jahudiCoins;
  alert('Du hast gezogen: ' + cosmetic.name + ' (' + cosmetic.rarity + ')!');
  updateShopUI();
  updateStats();
});

socket.on('case_error', ({ message }) => {
  alert('Fehler: ' + message);
});

// Mock Cases Data - could also be loaded from server, but for simplicity here it is hardcoded to render the UI
const casesDataMock = [
  { id: 'starter_case', name: 'Starter Jahudi Case', cost: 100, desc: 'Basis-Outfits und Island Skins' },
  { id: 'premium_case', name: 'Premium White Party Case', cost: 500, desc: 'Garantiert White Party Outfits' }
];

if (shopCasesList) {
  casesDataMock.forEach(c => {
    const el = document.createElement('div');
    el.style = 'background:var(--surface-light); padding:15px; border-radius:12px; display:flex; justify-content:space-between; align-items:center; border: 1px solid var(--border);';
    el.innerHTML = `
      <div>
        <div style="font-weight:bold;">${c.name}</div>
        <div style="font-size:12px; color:var(--text-secondary);">${c.desc}</div>
      </div>
      <button class="btn-primary" style="width: auto; padding: 10px 15px; background:#a855f7;" onclick="buyCase('${c.id}')">${c.cost} 💎</button>
    `;
    shopCasesList.appendChild(el);
  });
}

// ── GAME FINISHED ──────────────────────────────────────────────
socket.on('game_finished', ({ rankings, winner }) => {
  showScreen('endgame');
  const medals = ['🥇','🥈','🥉','4️⃣'];
  endgameList.innerHTML = rankings.map((p, i) => `
    <div style="background:rgba(255,255,255,0.05); border-radius:12px; padding:14px 16px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
      <span style="font-size:1.4rem;">${medals[i] || i+1}</span>
      <span style="font-weight:700; color:${p.character.color};">${p.character.icon} ${p.name}</span>
      <span style="color:#22c55e; font-weight:700;">${(p.finalScore||0).toLocaleString()}</span>
    </div>
  `).join('');
  if (winner && winner.socketId === socket.id) {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);
  }
});

socket.on('host_disconnected', () => {
  alert('Der Host hat das Spiel verlassen.');
  showScreen('join');
});


const btnOpenCasino = document.getElementById('btn-open-casino');
const casinoModal = document.getElementById('casino-modal');
const btnCloseCasino = document.getElementById('btn-close-casino');
const btnBlackjack = document.getElementById('btn-casino-blackjack');
const btnChicken = document.getElementById('btn-casino-chicken');
const casinoGameArea = document.getElementById('casino-game-area');
const casinoGameTitle = document.getElementById('casino-game-title');
const casinoCash = document.getElementById('casino-cash');
const casinoResult = document.getElementById('casino-result');
const btnBets = document.querySelectorAll('.btn-bet');

let currentCasinoGame = '';

btnOpenCasino.addEventListener('click', () => {
  casinoModal.style.display = 'block';
  casinoGameArea.style.display = 'none';
  casinoResult.innerText = '';
  if(myPlayerState) casinoCash.innerText = myPlayerState.money.toLocaleString();
});

btnCloseCasino.addEventListener('click', () => {
  casinoModal.style.display = 'none';
});

btnBlackjack.addEventListener('click', () => {
  currentCasinoGame = 'blackjack';
  casinoGameTitle.innerText = '🃏 Blackjack (50/50)';
  casinoGameArea.style.display = 'block';
  casinoResult.innerText = '';
  if(myPlayerState) casinoCash.innerText = myPlayerState.money.toLocaleString();
});

btnChicken.addEventListener('click', () => {
  currentCasinoGame = 'chicken';
  casinoGameTitle.innerText = '🐔 Chicken (60% Win, 2x)';
  casinoGameArea.style.display = 'block';
  casinoResult.innerText = '';
  if(myPlayerState) casinoCash.innerText = myPlayerState.money.toLocaleString();
});

btnBets.forEach(btn => {
  btn.addEventListener('click', () => {
    if (!currentCasinoGame) return;
    const pct = parseInt(btn.getAttribute('data-pct'));
    socket.emit('casino_bet', { roomCode: currentRoom, percentage: pct, game: currentCasinoGame });
  });
});

socket.on('casino_result', (data) => {
  if (data.success) {
    if (data.win) {
      casinoResult.style.color = '#22c55e';
      casinoResult.innerText = 'Gewonnen! +$' + data.amount.toLocaleString();
    } else {
      casinoResult.style.color = '#ef4444';
      casinoResult.innerText = 'Verloren! -$' + data.amount.toLocaleString();
    }
  } else {
    casinoResult.style.color = '#eab308';
    casinoResult.innerText = data.message || 'Fehler beim Wetten.';
  }
});

// Update cash when gamestate updates
const originalUpdateUI = updateUI;
updateUI = (room) => {
  originalUpdateUI(room);
  if (myPlayerState && casinoModal.style.display === 'block') {
    casinoCash.innerText = myPlayerState.money.toLocaleString();
  }
};
