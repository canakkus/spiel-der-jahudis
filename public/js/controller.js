// Smartphone Controller Logic
const socket = io();

let currentRoomCode = '';
let myPlayer = null;
let selectedCharacterId = 'business';
let charactersList = [];

// DOM Elements
const joinScreen = document.getElementById('join-screen');
const gameScreen = document.getElementById('game-screen');
const inputRoomCode = document.getElementById('input-room-code');
const inputPlayerName = document.getElementById('input-player-name');
const characterListEl = document.getElementById('character-list');
const btnJoinGame = document.getElementById('btn-join-game');
const qrConnectedBadge = document.getElementById('qr-connected-badge');
const qrRoomName = document.getElementById('qr-room-name');
const groupRoomCode = document.getElementById('group-room-code');

// Game Screen Elements
const playerAvatarMini = document.getElementById('player-avatar-mini');
const playerNameDisplay = document.getElementById('player-name-display');
const playerCharacterDisplay = document.getElementById('player-character-display');
const playerMoneyDisplay = document.getElementById('player-money-display');
const playerHappinessDisplay = document.getElementById('player-happiness-display');

const myTurnBox = document.getElementById('my-turn-box');
const waitingTurnBox = document.getElementById('waiting-turn-box');
const waitingStatusText = document.getElementById('waiting-status-text');
const btnSpin = document.getElementById('btn-spin');
const soundButtons = document.querySelectorAll('.btn-sound');

// 1. Auto-fill Room Code from URL query (?room=CODE)
const urlParams = new URLSearchParams(window.location.search);
const roomParam = urlParams.get('room');
if (roomParam) {
  const code = roomParam.toUpperCase().trim();
  inputRoomCode.value = code;
  qrRoomName.textContent = code;
  qrConnectedBadge.style.display = 'flex';
  groupRoomCode.style.display = 'none'; // Hide code input since it was verified by QR!

  // Auto-focus player name input
  setTimeout(() => {
    inputPlayerName.focus();
  }, 200);
}

// 2. Load Preset Characters
socket.emit('get_characters');
socket.on('characters_list', (characters) => {
  charactersList = characters;
  renderCharacters();
});

function renderCharacters() {
  characterListEl.innerHTML = '';
  charactersList.forEach(char => {
    const card = document.createElement('div');
    card.className = `character-card ${char.id === selectedCharacterId ? 'selected' : ''}`;
    card.onclick = () => {
      selectedCharacterId = char.id;
      renderCharacters();
    };
    card.innerHTML = `
      <div class="char-icon">${char.icon}</div>
      <div class="char-name">${char.name}</div>
      <div class="char-outfit">${char.outfit}</div>
    `;
    characterListEl.appendChild(card);
  });
}

// 3. Join Game Room
btnJoinGame.addEventListener('click', () => {
  const roomCode = inputRoomCode.value.trim().toUpperCase();
  const playerName = inputPlayerName.value.trim();

  if (!roomCode || roomCode.length < 4) {
    alert('Bitte gib einen gültigen 4-stelligen Raum-Code ein!');
    return;
  }

  socket.emit('player_join_room', {
    roomCode,
    playerName,
    characterId: selectedCharacterId
  });
});

socket.on('join_error', ({ message }) => {
  alert(message);
});

socket.on('join_success', ({ player, roomCode }) => {
  myPlayer = player;
  currentRoomCode = roomCode;

  // Switch to Game Screen
  joinScreen.classList.remove('active');
  gameScreen.classList.add('active');

  // Update Mini Header
  playerAvatarMini.textContent = player.character.icon;
  playerNameDisplay.textContent = player.name;
  playerCharacterDisplay.textContent = player.character.name;
  updateStatsDisplay(player);

  waitingStatusText.textContent = 'In der Lobby. Warte auf Host-Start...';
});

// 4. In-Game State & Turn Management
socket.on('game_started', ({ currentTurnPlayer }) => {
  handleTurnState(currentTurnPlayer);
});

socket.on('turn_changed', ({ currentTurnPlayer, players }) => {
  const me = players.find(p => p.socketId === socket.id);
  if (me) {
    myPlayer = me;
    updateStatsDisplay(me);
  }
  handleTurnState(currentTurnPlayer);
});

socket.on('player_stats_updated', ({ players }) => {
  const me = players.find(p => p.socketId === socket.id);
  if (me) {
    myPlayer = me;
    updateStatsDisplay(me);
  }
});

function handleTurnState(currentTurnPlayer) {
  const isMyTurn = currentTurnPlayer && currentTurnPlayer.socketId === socket.id;

  if (isMyTurn) {
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    myTurnBox.style.display = 'flex';
    waitingTurnBox.style.display = 'none';
    btnSpin.disabled = false;
  } else {
    myTurnBox.style.display = 'none';
    waitingTurnBox.style.display = 'flex';
    waitingStatusText.textContent = `${currentTurnPlayer ? currentTurnPlayer.name : 'Anderer Spieler'} ist am Zug...`;
  }
}

function updateStatsDisplay(player) {
  playerMoneyDisplay.textContent = `${Math.round((player.money || 0) / 1000)}k €`;
  playerHappinessDisplay.textContent = `${player.happiness || 0} ❤️`;
}

// 5. Spin Wheel Action
btnSpin.addEventListener('click', () => {
  btnSpin.disabled = true;
  if (navigator.vibrate) navigator.vibrate(50);
  
  socket.emit('player_spin_wheel', {
    roomCode: currentRoomCode
  });
});

// 6. Soundboard Buttons (Always Available on Smartphone)
soundButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const soundId = btn.getAttribute('data-sound');
    if (navigator.vibrate) navigator.vibrate(30);

    socket.emit('soundboard_trigger', {
      roomCode: currentRoomCode,
      soundId
    });
  });
});
