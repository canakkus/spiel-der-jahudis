const fs = require('fs');

const path = 'public/js/controller.js';
let content = fs.readFileSync(path, 'utf8');

// Add statJahudiCoins
const statMoneyLine = "const statMoney       = document.getElementById('stat-money');";
content = content.replace(statMoneyLine, "const statMoney       = document.getElementById('stat-money');\nconst statJahudiCoins = document.getElementById('stat-jahudi-coins');");

// Add btn-shop and modal refs
const refsLine = "const playerNameDisplay = document.getElementById('player-name-display');";
content = content.replace(refsLine, refsLine + `
const btnShop         = document.getElementById('btn-shop');
const shopModal       = document.getElementById('shop-modal');
const btnCloseShop    = document.getElementById('btn-close-shop');
const shopCasesList   = document.getElementById('shop-cases-list');
const inventoryList   = document.getElementById('inventory-list');
const shopJahudiCoins = document.getElementById('shop-jahudi-coins');
`);

// Update updateStats to set Jahudi Coins
const statMoneyUpdate = "statMoney.textContent = (myPlayer.money || 0).toLocaleString() + ' €';";
content = content.replace(statMoneyUpdate, statMoneyUpdate + "\n  if(statJahudiCoins) statJahudiCoins.textContent = (myPlayer.jahudiCoins || 0);");

// Add Shop logic
const gameFinishedLine = "// ── GAME FINISHED ──────────────────────────────────────────────";
const shopLogic = `
// ── JAHUDI SHOP ────────────────────────────────────────────────
if (btnShop) {
  btnShop.addEventListener('click', () => {
    shopModal.style.display = 'block';
    updateShopUI();
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
      el.innerHTML = \`
        <div style="font-size:12px; color:var(--text-secondary);">\${item.rarity}</div>
        <div style="font-weight:bold; margin: 5px 0;">\${item.name}</div>
        <button class="btn-primary" style="padding:6px; font-size:12px; margin-top:5px;" onclick="equipCosmetic('\${item.id}')">
          \${myPlayer.activeOutfit && item.id.includes(myPlayer.activeOutfit) ? 'Ausgerüstet' : 'Ausrüsten'}
        </button>
      \`;
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
    el.innerHTML = \`
      <div>
        <div style="font-weight:bold;">\${c.name}</div>
        <div style="font-size:12px; color:var(--text-secondary);">\${c.desc}</div>
      </div>
      <button class="btn-primary" style="width: auto; padding: 10px 15px; background:#a855f7;" onclick="buyCase('\${c.id}')">\${c.cost} 💎</button>
    \`;
    shopCasesList.appendChild(el);
  });
}

`;
content = content.replace(gameFinishedLine, shopLogic + gameFinishedLine);

fs.writeFileSync(path, content);
console.log('controller.js patched');
