class MiniGameManager {
  constructor() {
    this.activeGames = {}; // map of playerId to game state
  }

  startCasinoSession(player) {
    this.activeGames[player.socketId] = {
      type: 'casino_hub'
    };
  }

  processBet(player, percentage, gameType, gameState) {
    // 1%, 10%, 30%, 100%
    if (![1, 10, 30, 100].includes(percentage)) return null;
    
    // Percentage is based on current money. If money is negative, they can't bet, or what? 
    // Wait, if they are in debt (money <= 0), maybe they can't bet?
    if (player.money <= 0) {
      return { success: false, message: "Du bist pleite oder verschuldet!" };
    }

    const betAmount = Math.floor(player.money * (percentage / 100));
    
    if (gameType === 'blackjack') {
      // simple 50/50 win/loss for now
      const win = Math.random() > 0.5;
      if (win) {
        player.money += betAmount;
      } else {
        player.money -= betAmount;
      }
      this.enforceLoans(player);
      return { success: true, win, amount: betAmount };
    } else if (gameType === 'chicken') {
      // simple chicken game logic
      const win = Math.random() > 0.6; // lower win chance for higher payout?
      if (win) {
        player.money += betAmount * 2; // e.g. 2x payout
      } else {
        player.money -= betAmount;
      }
      this.enforceLoans(player);
      return { success: true, win, amount: betAmount };
    }
    return { success: false, message: "Unknown game" };
  }

  enforceLoans(player) {
    if (player.money < 0) {
      if (!player.loans) player.loans = 0;
      while (player.money < 0) {
        player.loans += 1;
        player.money += 50000;
      }
    }
  }
}

module.exports = new MiniGameManager();
