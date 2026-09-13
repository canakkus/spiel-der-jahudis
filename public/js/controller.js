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
const playerCharDisplay = document.getElementById('player-character-display');
const statMoney       = document.getElementById('stat-money');
const statSalary      = document.getElementById('stat-salary');
const statHappiness   = document.getElementById('stat-happiness');
const statKnowledge   = document.getElementById('stat-knowledge');
const assetsRow       = document.getElementById('assets-row');
const turnIndicator   = document.getElementById('turn-indicator');
const btnSpin         = document.getElementById('btn-spin');
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
    card.style.borderColor = c.color + '60';
    card.innerHTML = `
      <span class="char-icon" style="filter:drop-shadow(0 0 8px ${c.color})">${c.icon}</span>
      <div class="char-name">${c.name}</div>
    `;
    card.addEventListener('click', () => {
      document.querySelectorAll('.char-card').forEach(cc => {
        cc.classList.remove('selected');
        cc.style.borderColor = chars.find(ch => ch.id === cc.dataset.id)?.color + '60' || '';
        cc.style.background = '';
      });
      card.classList.add('selected');
      card.style.borderColor = c.color;
      card.style.background = c.color + '18';
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
  statSalary.textContent = (myPlayer.salary || 0).toLocaleString() + ' €';
  statHappiness.textContent = myPlayer.happiness || 0;
  statKnowledge.textContent = myPlayer.knowledge || 0;

  // Assets
  if (assetsRow) {
    assetsRow.innerHTML = '';
    const assets = myPlayer.assets || {};
    if (assets.house) assetsRow.innerHTML += `<div class="asset-badge">🏠 ${assets.house}</div>`;
    if (assets.vehicle) assetsRow.innerHTML += `<div class="asset-badge">🚗 ${assets.vehicle}</div>`;
    if (assets.spouse) assetsRow.innerHTML += `<div class="asset-badge">💍 Verheiratet</div>`;
    if (assets.children > 0) assetsRow.innerHTML += `<div class="asset-badge">👶 ${assets.children} Kinder</div>`;
  }
}

function updateTurnIndicator(currentTurnPlayer) {
  if (!currentTurnPlayer || !myPlayer) return;
  const isMe = currentTurnPlayer.socketId === myPlayer.socketId;
  turnIndicator.textContent = isMe ? '🎯 Du bist dran! Drück SPIN!' : `⏳ ${currentTurnPlayer.name} ist dran...`;
  turnIndicator.className = 'turn-indicator ' + (isMe ? 'my-turn' : '');
  btnSpin.disabled = !isMe;
  if (isMe && navigator.vibrate) navigator.vibrate([100, 50, 200]);
}

// ── SPIN ───────────────────────────────────────────────────────
btnSpin && btnSpin.addEventListener('click', () => {
  if (!btnSpin.disabled) {
    btnSpin.disabled = true;
    socket.emit('player_spin_wheel', { roomCode: currentRoomCode });
  }
});

// ── TURN CHANGES ───────────────────────────────────────────────
socket.on('turn_changed', ({ currentTurnPlayer, players }) => {
  const me = players.find(p => p.socketId === socket.id);
  if (me) { myPlayer = me; updateStats(); }
  updateTurnIndicator(currentTurnPlayer);
  if (screens['game'].classList.contains('active')) {
    // stay on game screen
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
      socket.emit('submit_decision', { roomCode: currentRoomCode, optionId: opt.id });
    });
    decOptions.appendChild(btn);
  });
});

socket.on('decision_resolved', ({ players }) => {
  const me = players.find(p => p.socketId === socket.id);
  if (me) { myPlayer = me; updateStats(); }
  if (!screens['game'].classList.contains('active')) showScreen('game');
});

// ── RETIREMENT ─────────────────────────────────────────────────
socket.on('player_retired', ({ player, finalScore }) => {
  if (player.socketId !== socket.id) return;
  myPlayer = player;
  showScreen('retirement');

  retireFinalScore.textContent = finalScore.toLocaleString() + ' Punkte';
  const assets = player.assets || {};
  retireBreakdown.innerHTML = `
    💰 Geld: ${(player.money || 0).toLocaleString()} €<br>
    🏠 Haus: ${assets.houseValue ? assets.houseValue.toLocaleString() + ' €' : '–'}<br>
    🚗 Auto: ${assets.vehicleValue ? assets.vehicleValue.toLocaleString() + ' €' : '–'}<br>
    💍 Ehepartner: ${assets.spouse ? '+100.000 €' : '–'}<br>
    👶 Kinder: ${assets.children > 0 ? `${assets.children} × 50.000 €` : '–'}<br>
    ❤️ Glück: ${(player.happiness || 0)} × 1.000 €<br>
    🧠 Wissen: ${(player.knowledge || 0)} × 500 €
  `;
});

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
