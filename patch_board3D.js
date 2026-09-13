const fs = require('fs');

const path = 'public/js/board3D.js';
let content = fs.readFileSync(path, 'utf8');

// Add modular character builder
const newMethods = `
  // ── 🧑‍🤝‍🧑 Character & Outfit System (Phase 2/3 Preparation) ──
  buildCharacterModel(player, scale = 1.0) {
    const group = new THREE.Group();
    group.scale.set(scale, scale, scale);

    const charId = player.character && player.character.id ? player.character.id : 'default';
    const activeOutfit = player.activeOutfit || 'default'; // 'default', 'island', 'whiteParty'
    const colorHex = parseInt((player.character.color || '#3b82f6').replace('#', '0x'), 16);

    // Character Modular Assembly (Base -> Head -> Hair -> Outfit -> Shoes -> Accessories)
    const parts = [
      \`char_base_\${charId}\`,
      \`char_head_\${charId}\`,
      \`char_hair_\${charId}\`,
      \`char_outfit_\${charId}_\${activeOutfit}\`,
      \`char_shoes_\${charId}_\${activeOutfit}\`,
      \`char_acc_\${charId}_\${activeOutfit}\`
    ];

    let hasAnyGLB = false;

    parts.forEach(partKey => {
      if (this.models && this.models[partKey]) {
        hasAnyGLB = true;
        const cloned = this.models[partKey].clone(true);
        // Reset scale and position for modular pieces
        cloned.scale.set(1, 1, 1);
        cloned.position.set(0, 0, 0);
        cloned.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        group.add(cloned);
      }
    });

    // Fallback: If no modular GLB parts are loaded yet, use the Peg figurine
    if (!hasAnyGLB) {
      const peg = this.createPeg(colorHex, 1.0);
      peg.userData = { isPlaceholder: true, charId, activeOutfit };
      group.add(peg);
    }

    return group;
  }

  updateCarPegs(carGroup, player) {
    if (!carGroup.pegsGroup) return;
    // Clear old pegs
    while (carGroup.pegsGroup.children.length > 0) {
      carGroup.pegsGroup.remove(carGroup.pegsGroup.children[0]);
    }

    // 1. Driver Character (Front-Left)
    const driverGroup = this.buildCharacterModel(player, 1.0);
    driverGroup.position.set(-0.32, 1.05, -0.2);
    carGroup.pegsGroup.add(driverGroup);

    // 2. Spouse Character (Front-Right if married)
    if (player.assets && player.assets.spouse) {
      const spousePlayerMock = { character: { id: 'foid', color: '#f43f5e' }, activeOutfit: player.activeOutfit };
      const spouseGroup = this.buildCharacterModel(spousePlayerMock, 1.0);
      spouseGroup.position.set(0.32, 1.05, -0.2);
      carGroup.pegsGroup.add(spouseGroup);
    }

    // 3. Children Pegs (Back Seats)
    const numKids = (player.assets && player.assets.children) ? Math.min(player.assets.children, 2) : 0;
    if (numKids >= 1) {
      const kid1 = this.createPeg(0x38bdf8, 0.75); // Light blue mini peg
      kid1.position.set(-0.3, 1.02, 0.5);
      carGroup.pegsGroup.add(kid1);
    }
    if (numKids >= 2) {
      const kid2 = this.createPeg(0xfacc15, 0.75); // Yellow mini peg
      kid2.position.set(0.3, 1.02, 0.5);
      carGroup.pegsGroup.add(kid2);
    }
  }
`;

content = content.replace(
  /  updateCarPegs\(carGroup, player\) \{[\s\S]*?    \}\n    \}\n  \}/,
  newMethods.trim()
);

fs.writeFileSync(path, content);
console.log('board3D.js updated successfully.');
