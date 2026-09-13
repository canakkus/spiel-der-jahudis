const fs = require('fs');

// Patch index.html
let indexContent = fs.readFileSync('public/index.html', 'utf8');

const casinoUI = `
  <!-- Casino Modal -->
  <div id="casino-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 1000; padding: 20px; overflow-y: auto;">
    <div style="background: var(--surface); border-radius: 20px; padding: 24px; max-width: 500px; margin: 40px auto; border: 1px solid var(--border);">
      <h2 style="margin-top: 0; text-align: center;">🎰 Casino & Investments</h2>
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <button id="btn-casino-blackjack" class="btn-primary" style="flex: 1; margin-right: 5px;">🃏 Blackjack</button>
        <button id="btn-casino-chicken" class="btn-primary" style="flex: 1; margin-left: 5px;">🐔 Chicken</button>
      </div>
      
      <div id="casino-game-area" style="text-align: center; display: none;">
        <h3 id="casino-game-title">Game</h3>
        <div style="margin-bottom: 10px;">Dein Cash: $<span id="casino-cash">0</span></div>
        <div style="display:flex; justify-content:space-between; gap: 5px; margin-bottom: 20px;">
          <button class="btn-primary btn-bet" data-pct="1">1%</button>
          <button class="btn-primary btn-bet" data-pct="10">10%</button>
          <button class="btn-primary btn-bet" data-pct="30">30%</button>
          <button class="btn-primary btn-bet" data-pct="100" style="background:#ea580c;">100%</button>
        </div>
        <div id="casino-result" style="font-weight: bold; margin-bottom: 15px;"></div>
      </div>
      <button id="btn-close-casino" class="btn-primary" style="background: var(--surface-light);">Schließen</button>
    </div>
  </div>
`;

if (!indexContent.includes('casino-modal')) {
  indexContent = indexContent.replace('</body>', casinoUI + '\n</body>');
  
  // Add a button to open Casino
  const shopButtonLine = '<button id="btn-shop" class="btn-primary" style="background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%); margin: 15px 0;">🛍️ Jahudi Shop & Inventory</button>';
  const casinoButtonLine = '<button id="btn-open-casino" class="btn-primary" style="background: linear-gradient(135deg, #eab308 0%, #d97706 100%); margin-bottom: 15px;">🎰 Casino & Investments</button>\n';
  indexContent = indexContent.replace(shopButtonLine, shopButtonLine + '\n  ' + casinoButtonLine);
  
  fs.writeFileSync('public/index.html', indexContent);
  console.log('index.html patched with Casino');
}

// Patch controller.js
let controllerContent = fs.readFileSync('public/js/controller.js', 'utf8');

if (!controllerContent.includes('casino-modal')) {
  const newControllerLogic = `
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
`;
  
  controllerContent = controllerContent + '\n' + newControllerLogic;
  fs.writeFileSync('public/js/controller.js', controllerContent);
  console.log('controller.js patched with Casino logic');
}
