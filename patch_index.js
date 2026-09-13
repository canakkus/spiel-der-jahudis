const fs = require('fs');

const path = 'public/index.html';
let content = fs.readFileSync(path, 'utf8');

// Update stats-grid to hold 5 items
content = content.replace('grid-template-columns: 1fr 1fr;', 'grid-template-columns: repeat(2, 1fr);');

const moneyLine = '<div class="stat-box"><div class="stat-label">💰 Geld</div><div class="stat-value stat-money" id="stat-money">0</div></div>';
const coinsLine = '<div class="stat-box"><div class="stat-label">💎 Jahudi Coins</div><div class="stat-value" style="color:#a855f7;" id="stat-jahudi-coins">0</div></div>';
content = content.replace(moneyLine, coinsLine + '\n    ' + moneyLine);

// Add Shop Button below stats grid
const assetsRowLine = '<div class="assets-row" id="assets-row"></div>';
const shopButtonLine = '<button id="btn-shop" class="btn-primary" style="background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%); margin: 15px 0;">🛍️ Jahudi Shop & Inventory</button>\n';
content = content.replace(assetsRowLine, assetsRowLine + '\n  ' + shopButtonLine);

// Add Shop Modal
const shopModal = `
  <!-- Jahudi Shop Modal -->
  <div id="shop-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 1000; padding: 20px; overflow-y: auto;">
    <div style="background: var(--surface); border-radius: 20px; padding: 24px; max-width: 500px; margin: 40px auto; border: 1px solid var(--border);">
      <h2 style="margin-top: 0; text-align: center;">Jahudi Shop</h2>
      <div style="text-align: center; margin-bottom: 20px; font-weight: bold;">
        💎 Deine Coins: <span id="shop-jahudi-coins" style="color:#a855f7;">0</span>
      </div>
      
      <h3>Cases</h3>
      <div id="shop-cases-list" style="display:flex; flex-direction:column; gap:10px; margin-bottom: 20px;"></div>
      
      <h3>Dein Inventar</h3>
      <div id="inventory-list" style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom: 20px;"></div>
      
      <button id="btn-close-shop" class="btn-primary" style="background: var(--surface-light);">Schließen</button>
    </div>
  </div>
`;
content = content.replace('</body>', shopModal + '\n</body>');

fs.writeFileSync(path, content);
console.log('index.html patched');
