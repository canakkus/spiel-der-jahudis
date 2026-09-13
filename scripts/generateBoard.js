const fs = require('fs');

const nodes = [];
let idCounter = 0;

function createNode(x, y, type, title, icon, color, description, effect = null, decisionId = null) {
  const node = { id: idCounter++, x, y, type, title, icon, color, next: [], description };
  if (effect) node.effect = effect;
  if (decisionId) node.decisionId = decisionId;
  nodes.push(node);
  return node;
}

// Generate a snake path from (10,10) to (90,90)
// 5 rows: Y=10, 30, 50, 70, 90
// Each row has 9 nodes (X=10, 20, ..., 90)

const rows = 5;
const cols = 9;

const pathNodes = [];

for (let r = 0; r < rows; r++) {
  const y = 10 + r * 20;
  // alternate direction
  const isLeftToRight = r % 2 === 0;
  
  for (let c = 0; c < cols; c++) {
    const x = isLeftToRight ? 10 + c * 10 : 90 - c * 10;
    let type = 'action';
    let title = 'AKTION';
    let icon = '⚡';
    let color = '#ec4899';
    let desc = 'Ein zufälliges Ereignis!';
    let effect = null;
    let decisionId = null;

    if (r === 0 && c === 0) {
      type = 'start'; title = 'START'; icon = '🏁'; color = '#10b981'; desc = 'Los gehts!';
    } else if (r === rows - 1 && c === cols - 1) {
      type = 'finish'; title = 'RUHESTAND'; icon = '🏝️'; color = '#f59e0b'; desc = 'Du hast es geschafft!';
    } else if (c % 4 === 0) {
      type = 'payday'; title = 'ZAHLTAG'; icon = '💰'; color = '#22c55e'; desc = 'Gehaltseingang!';
    } else if (c % 3 === 0) {
      type = 'decision'; title = 'ENTSCHEIDUNG'; icon = '⚖️'; color = '#eab308'; desc = 'Triff eine Wahl!';
      // cycle through decisions
      const d = ['buy_house', 'marriage', 'startup_pitch'];
      decisionId = d[(r * cols + c) % d.length];
    } else if (c % 5 === 0) {
      type = 'knowledge'; title = 'BILDUNG'; icon = '📚'; color = '#3b82f6'; desc = 'Weiterbildung!';
      effect = { knowledge: 20 };
    }

    const n = createNode(x, y, type, title, icon, color, desc, effect, decisionId);
    pathNodes.push(n);
  }
}

// Link them sequentially
for (let i = 0; i < pathNodes.length - 1; i++) {
  pathNodes[i].next.push(pathNodes[i+1].id);
}

// Write to public/js/boardData.js
const fileContent = "// Auto-generated Board Data\n\nconst BOARD_NODES = " + JSON.stringify(nodes, null, 2) + ";\n\nif (typeof module !== 'undefined') {\n  module.exports = { BOARD_NODES, ACTION_CARDS: [] };\n}\n";

fs.writeFileSync(__dirname + '/../public/js/boardData.js', fileContent);
console.log('boardData.js generated successfully with ' + nodes.length + ' nodes.');
