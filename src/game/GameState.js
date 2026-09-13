class GameState {
  constructor(roomCode, hostSocketId) {
    this.roomCode = roomCode;
    this.hostSocketId = hostSocketId;
    this.players = [];
    this.state = 'LOBBY';
    this.currentTurnIndex = 0;
    this.pendingDecision = null;
    this.pendingPathChoice = null;
    this.turnNumber = 0;
  }

  addPlayer(player) {
    if (this.state !== 'LOBBY') return false;
    if (this.players.length >= 4) return false;
    this.players.push(player);
    return true;
  }

  removePlayer(socketId) {
    const idx = this.players.findIndex(p => p.socketId === socketId);
    if (idx !== -1) return this.players.splice(idx, 1)[0];
    return null;
  }

  startGame() {
    if (this.players.length === 0) return false;
    this.state = 'PLAYING';
    this.currentTurnIndex = 0;
    this.players.forEach((p, i) => {
      p.isTurn = (i === 0);
      p.isRetired = false;
      p.finalScore = 0;
      if (!p.assets) p.assets = { house: null, houseValue: 0, vehicle: null, vehicleValue: 0, spouse: false, children: 0 };
      if (!p.decisions) p.decisions = [];
      if (!p.achievements) p.achievements = [];
    });
    return true;
  }

  getCurrentPlayer() {
    return this.players[this.currentTurnIndex] || null;
  }

  nextTurn() {
    if (this.players.length === 0) return null;
    this.state = 'PLAYING';
    this.pendingDecision = null;
    this.pendingPathChoice = null;

    const activePlayers = this.players.filter(p => !p.isRetired);
    if (activePlayers.length === 0) return null;

    // Find next non-retired player
    let attempts = 0;
    do {
      this.currentTurnIndex = (this.currentTurnIndex + 1) % this.players.length;
      attempts++;
    } while (this.players[this.currentTurnIndex].isRetired && attempts <= this.players.length);

    this.turnNumber++;
    this.players.forEach((p, idx) => { p.isTurn = (idx === this.currentTurnIndex); });
    return this.players[this.currentTurnIndex];
  }

  applyPayday(playerId) {
    const player = this.players.find(p => p.socketId === playerId);
    if (!player) return null;
    const earned = player.salary || 0;
    player.money += earned;
    // Deduct child costs
    if (player.assets && player.assets.children > 0) {
      const childCost = player.assets.children * 10000;
      player.money -= childCost;
    }
    return { earned, player };
  }

  applyEvent(playerId, event) {
    const player = this.players.find(p => p.socketId === playerId);
    if (!player) return null;
    player.money += (event.moneyEffect || 0);
    player.happiness = Math.max(0, (player.happiness || 0) + (event.happinessEffect || 0));
    player.knowledge = Math.max(0, (player.knowledge || 0) + (event.knowledgeEffect || 0));
    return player;
  }

  setWaitingForDecision(playerId, decisionId) {
    this.state = 'WAITING_FOR_DECISION';
    this.pendingDecision = { playerId, decisionId };
  }

  setWaitingForPathChoice(playerId, nodeId, remainingSteps) {
    this.state = 'WAITING_FOR_PATH_CHOICE';
    this.pendingPathChoice = { playerId, nodeId, remainingSteps };
  }

  resolveDecision(playerId, decisionData, optionId) {
    if (this.state !== 'WAITING_FOR_DECISION') return null;
    if (!this.pendingDecision || this.pendingDecision.playerId !== playerId) return null;
    const option = decisionData.options.find(o => o.id === optionId);
    if (!option) return null;

    const player = this.players.find(p => p.socketId === playerId);
    if (!player) return null;
    if (!player.assets) player.assets = { house: null, houseValue: 0, vehicle: null, vehicleValue: 0, spouse: false, children: 0 };

    const fx = option.effects || {};
    if (fx.money) player.money += fx.money;
    if (fx.happiness) player.happiness = Math.max(0, (player.happiness || 0) + fx.happiness);
    if (fx.knowledge) player.knowledge = Math.max(0, (player.knowledge || 0) + fx.knowledge);
    if (fx.salary) player.salary = fx.salary;
    if (fx.salaryBonus) player.salary = (player.salary || 0) + fx.salaryBonus;
    if (fx.salaryReduction) player.salary = Math.max(0, (player.salary || 0) - fx.salaryReduction);
    if (fx.spouse) player.assets.spouse = true;
    if (fx.children) player.assets.children = (player.assets.children || 0) + fx.children;
    if (fx.house) { player.assets.house = fx.house; player.assets.houseValue = fx.houseValue || 0; }
    if (fx.vehicle) { player.assets.vehicle = fx.vehicle; player.assets.vehicleValue = fx.vehicleValue || 0; }
    if (fx.earlyRetire) { this.retirePlayer(playerId); }
    if (fx.cryptoGamble) {
      // 50% chance
      if (Math.random() > 0.5) { player.money += 400000; }
    }
    if (fx.investReturn) { player.money += fx.investReturn; }
    if (fx.startupRisk) {
      if (Math.random() > 0.5) { player.salary = 500000; }
    }
    if (fx.pathIndex !== undefined) {
      // Path choice built-in
      player._chosenPath = fx.pathIndex;
    }

    player.decisions.push({ decisionId: decisionData.id, optionId, timestamp: Date.now() });
    this.state = 'PLAYING';
    this.pendingDecision = null;
    return { player, option };
  }

  retirePlayer(playerId) {
    const player = this.players.find(p => p.socketId === playerId);
    if (!player) return null;
    player.isRetired = true;
    player.isTurn = false;
    player.finalScore = this.calculatePlayerScore(player);
    return player;
  }

  calculatePlayerScore(player) {
    let score = player.money || 0;
    if (player.assets) {
      score += player.assets.houseValue || 0;
      score += player.assets.vehicleValue || 0;
      score += (player.assets.children || 0) * 50000;
      if (player.assets.spouse) score += 100000;
    }
    score += (player.knowledge || 0) * 500;
    score += (player.happiness || 0) * 1000;
    return Math.max(0, score);
  }

  calculateFinalScores() {
    this.players.forEach(p => {
      p.finalScore = this.calculatePlayerScore(p);
    });
    this.state = 'GAME_FINISHED';
    return this.players.sort((a, b) => b.finalScore - a.finalScore);
  }

  getWinner() {
    const sorted = [...this.players].sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
    return sorted[0];
  }

  allRetired() {
    return this.players.length > 0 && this.players.every(p => p.isRetired);
  }
}

module.exports = GameState;
