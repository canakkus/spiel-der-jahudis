// ============================================================
// SPIEL DER JAHUDIS – 3D Dubai Board Engine (Three.js)
// Full movement: STOP tiles, payday-while-passing, branches
// ============================================================
class DubaiBoard3D {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.cars = {};
    this.tileMeshes = [];
    this.node3DPositions = [];
    this.targetCameraPos = new THREE.Vector3(0, 55, 75);
    this.targetCameraLookAt = new THREE.Vector3(0, 0, 0);
    this.currentCameraLookAt = new THREE.Vector3(0, 0, 0);
    this.isTrackingCar = false;
    this.trackedCar = null;
    // Callback set by host.js for movement events
    this.onPassPayday = null;    // (player, nodeId) => void
    this.onReachBranch = null;   // (player, nodeId, remainingSteps, next) => Promise<chosenNextId>
    this.onLandStop = null;      // (player, nodeId) => void
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || (window.innerHeight - 140);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0b1329');
    this.scene.fog = new THREE.FogExp2('#0b1329', 0.006);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1200);
    this.camera.position.set(0, 55, 75);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.container.appendChild(this.renderer.domElement);

    if (THREE.OrbitControls) {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2.1;
      this.controls.minDistance = 20;
      this.controls.maxDistance = 160;
    }

    this.setupLighting();
    this.buildDubaiEnvironment();
    this.buildRoadNetwork();

    window.addEventListener('resize', () => this.onResize());
    this.animate();
  }

  setupLighting() {
    this.scene.add(new THREE.AmbientLight(0xffeedd, 0.7));

    const sun = new THREE.DirectionalLight(0xfff3d0, 1.2);
    sun.position.set(40, 80, 50);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 300;
    sun.shadow.camera.left = -80;
    sun.shadow.camera.right = 80;
    sun.shadow.camera.top = 80;
    sun.shadow.camera.bottom = -80;
    this.scene.add(sun);

    const rim = new THREE.DirectionalLight(0x06b6d4, 0.4);
    rim.position.set(-40, 30, -50);
    this.scene.add(rim);
  }

  buildDubaiEnvironment() {
    // Ocean
    const waterGeo = new THREE.PlaneGeometry(500, 500);
    const waterMat = new THREE.MeshStandardMaterial({ color: 0x0891b2, roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0.85 });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.5;
    water.receiveShadow = true;
    this.scene.add(water);

    // Large Island
    const islandGeo = new THREE.CylinderGeometry(72, 76, 2, 64);
    const islandMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.85, metalness: 0.05 });
    const island = new THREE.Mesh(islandGeo, islandMat);
    island.position.y = 0;
    island.receiveShadow = true;
    this.scene.add(island);

    // Skyscrapers
    this.createSkyscraper(0, 15, -45, 5, 50, 0x38bdf8, 0xf59e0b);
    this.createSkyscraper(-30, 0, -35, 6, 32, 0x0284c7);
    this.createSkyscraper(30, 0, -34, 7, 38, 0xf59e0b);
    this.createSkyscraper(48, 0, -18, 5, 26, 0x818cf8);
    this.createSkyscraper(-52, 0, 5, 6, 22, 0x06b6d4);
    this.createSkyscraper(56, 0, 10, 7, 28, 0xec4899);
    this.createSkyscraper(-40, 0, 30, 5, 18, 0x22c55e);
    this.createSkyscraper(44, 0, 38, 4, 15, 0xa855f7);
    this.createSailHotel(-45, 0, -24);

    // Palm trees
    const palms = [[-20,12],[-10,-18],[10,-16],[22,14],[-32,-8],[30,-8],[-46,18],[46,-4],[-8,28],[16,30],[-28,26],[32,26],[-15,22],[15,22]];
    palms.forEach(p => this.createPalmTree(p[0], 1, p[1]));

    // Yachts
    this.createYacht(-60, -0.2, 35, 0.4);
    this.createYacht(60, -0.2, -48, -0.8);
    this.createYacht(65, -0.2, 30, 1.2);
    this.createYacht(-55, -0.2, -40, 0.9);
  }

  createSkyscraper(x, y, z, width, height, color, glowColor) {
    const group = new THREE.Group();
    group.position.set(x, 1, z);
    const geo = new THREE.BoxGeometry(width, height, width);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.2, metalness: 0.85 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = height / 2;
    mesh.castShadow = true;
    group.add(mesh);
    const spireGeo = new THREE.ConeGeometry(width * 0.4, height * 0.25, 8);
    const spireMat = new THREE.MeshStandardMaterial({ color: glowColor || 0xffffff, metalness: 0.9, roughness: 0.1 });
    const spire = new THREE.Mesh(spireGeo, spireMat);
    spire.position.y = height + height * 0.125;
    group.add(spire);
    this.scene.add(group);
  }

  createSailHotel(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, 1, z);
    const sailGeo = new THREE.CylinderGeometry(0.5, 7, 30, 16, 1, false, 0, Math.PI);
    const sailMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.3 });
    const sail = new THREE.Mesh(sailGeo, sailMat);
    sail.position.y = 15;
    sail.rotation.y = Math.PI / 4;
    sail.castShadow = true;
    group.add(sail);
    const heliGeo = new THREE.CylinderGeometry(3, 3, 0.6, 16);
    const heliMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.5 });
    const heli = new THREE.Mesh(heliGeo, heliMat);
    heli.position.set(2, 24, 2);
    group.add(heli);
    this.scene.add(group);
  }

  createPalmTree(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 4.5, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 2.25;
    trunk.rotation.z = (Math.random() - 0.5) * 0.25;
    trunk.castShadow = true;
    group.add(trunk);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      const leafGeo = new THREE.ConeGeometry(1.3, 3.2, 4);
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(Math.cos(angle) * 1.3, 4.5, Math.sin(angle) * 1.3);
      leaf.rotation.x = Math.PI / 2.8;
      leaf.rotation.y = angle;
      group.add(leaf);
    }
    this.scene.add(group);
  }

  createYacht(x, y, z, rot) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = rot;
    const hullGeo = new THREE.BoxGeometry(4, 1.4, 12);
    const hullMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.5 });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = 0.7;
    group.add(hull);
    const cabinGeo = new THREE.BoxGeometry(3, 1.4, 6);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.8 });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 2.1, -1);
    group.add(cabin);
    this.scene.add(group);
  }

  // ── Map 2D board coords (0-100) to 3D world ──────────────
  mapTo3D(x, y) {
    return new THREE.Vector3(
      ((x - 50) / 50) * 62,   // -62 .. +62
      1.2,
      ((y - 50) / 50) * 42    // -42 .. +42
    );
  }

  buildRoadNetwork() {
    this.node3DPositions = BOARD_NODES.map(node => ({
      id: node.id,
      pos: this.mapTo3D(node.x, node.y),
      raw: node
    }));

    // Roads
    BOARD_NODES.forEach(node => {
      const from = this.node3DPositions.find(n => n.id === node.id).pos;
      node.next.forEach(targetId => {
        const toData = this.node3DPositions.find(n => n.id === targetId);
        if (toData) this.createRoadSegment(from, toData.pos);
      });
    });

    // Tile pedestals
    this.node3DPositions.forEach(n => this.createTilePedestal(n.pos, n.raw));
  }

  createRoadSegment(p1, p2) {
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);

    const roadGeo = new THREE.BoxGeometry(2.6, 0.2, len);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7, metalness: 0.2 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.position.copy(mid);
    road.position.y = p1.y - 0.05;
    road.lookAt(p2);
    road.receiveShadow = true;
    this.scene.add(road);

    const lineGeo = new THREE.BoxGeometry(0.3, 0.22, len * 0.82);
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 });
    const line = new THREE.Mesh(lineGeo, lineMat);
    line.position.copy(mid);
    line.position.y = p1.y - 0.04;
    line.lookAt(p2);
    this.scene.add(line);
  }

  createTilePedestal(pos, node) {
    const group = new THREE.Group();
    group.position.copy(pos);

    const isStopTile = node.isStop;
    const radius = isStopTile ? 2.0 : 1.6;
    const discGeo = new THREE.CylinderGeometry(radius, radius + 0.2, isStopTile ? 0.8 : 0.5, 24);
    const colorHex = parseInt((node.color || '#3b82f6').replace('#', '0x'), 16);
    const discMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.3, metalness: 0.5 });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.position.y = 0.25;
    disc.castShadow = true;
    disc.receiveShadow = true;
    group.add(disc);

    // STOP ring (red outer ring for stop tiles)
    if (isStopTile) {
      const stopRingGeo = new THREE.TorusGeometry(radius + 0.3, 0.2, 12, 32);
      const stopRingMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const stopRing = new THREE.Mesh(stopRingGeo, stopRingMat);
      stopRing.rotation.x = Math.PI / 2;
      stopRing.position.y = 0.9;
      group.add(stopRing);
    }

    const ringGeo = new THREE.TorusGeometry(radius + 0.1, 0.12, 12, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.52;
    group.add(ring);

    const sprite = this.createTileSprite(node.icon || '📍', node.title, isStopTile);
    sprite.position.set(0, isStopTile ? 2.8 : 2.2, 0);
    group.add(sprite);

    this.scene.add(group);
    this.tileMeshes.push(group);
  }

  createTileSprite(icon, title, isStop) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = isStop ? 'rgba(180, 10, 10, 0.9)' : 'rgba(11, 19, 41, 0.88)';
    ctx.strokeStyle = isStop ? '#ff4444' : '#ffffff';
    ctx.lineWidth = isStop ? 8 : 5;
    ctx.beginPath();
    ctx.roundRect(8, 8, 240, 112, 22);
    ctx.fill();
    ctx.stroke();

    ctx.font = '38px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(icon, 128, 55);

    ctx.fillStyle = '#f8fafc';
    ctx.font = `bold ${isStop ? 20 : 18}px sans-serif`;
    ctx.fillText(title.substring(0, 12), 128, 95);

    if (isStop) {
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('● STOP', 128, 118);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(isStop ? 3.8 : 3.2, isStop ? 1.9 : 1.6, 1);
    return sprite;
  }

  // ── Car creation ──────────────────────────────────────────
  create3DCar(player) {
    const carGroup = new THREE.Group();
    const colorHex = parseInt((player.character.color || '#3b82f6').replace('#', '0x'), 16);

    const chassisGeo = new THREE.BoxGeometry(1.6, 0.5, 3.2);
    const chassisMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.2, metalness: 0.8 });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.y = 0.5;
    chassis.castShadow = true;
    carGroup.add(chassis);

    const cabinGeo = new THREE.BoxGeometry(1.2, 0.55, 1.6);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.8 });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 0.95, -0.2);
    carGroup.add(cabin);

    const spoilerGeo = new THREE.BoxGeometry(1.5, 0.1, 0.4);
    const spoiler = new THREE.Mesh(spoilerGeo, chassisMat);
    spoiler.position.set(0, 0.95, 1.3);
    carGroup.add(spoiler);

    const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.25, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    const wheelPositions = [[-0.85,0.32,0.9],[0.85,0.32,0.9],[-0.85,0.32,-0.9],[0.85,0.32,-0.9]];
    carGroup.wheels = [];
    wheelPositions.forEach(wp => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(...wp);
      wheel.castShadow = true;
      carGroup.add(wheel);
      carGroup.wheels.push(wheel);
    });

    const lightGeo = new THREE.BoxGeometry(0.3, 0.15, 0.1);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    [-0.5, 0.5].forEach(xOff => {
      const light = new THREE.Mesh(lightGeo, lightMat);
      light.position.set(xOff, 0.5, -1.62);
      carGroup.add(light);
    });

    // Name badge
    const nc = document.createElement('canvas');
    nc.width = 256; nc.height = 80;
    const nCtx = nc.getContext('2d');
    nCtx.fillStyle = player.character.color;
    nCtx.beginPath();
    nCtx.roundRect(10, 10, 236, 60, 16);
    nCtx.fill();
    nCtx.fillStyle = '#fff';
    nCtx.font = 'bold 26px sans-serif';
    nCtx.textAlign = 'center';
    nCtx.fillText(`${player.character.icon} ${player.name}`, 128, 48);
    const nameTex = new THREE.CanvasTexture(nc);
    const nameSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: nameTex }));
    nameSprite.scale.set(2.8, 0.9, 1);
    nameSprite.position.set(0, 2.6, 0);
    carGroup.add(nameSprite);

    this.scene.add(carGroup);
    return carGroup;
  }

  updatePlayers(players) {
    players.forEach(player => {
      if (!this.cars[player.socketId]) {
        this.cars[player.socketId] = this.create3DCar(player);
      }
      const car = this.cars[player.socketId];
      const targetNode = this.node3DPositions.find(n => n.id === player.position) || this.node3DPositions[0];
      if (!car.isMoving) {
        car.position.set(targetNode.pos.x, targetNode.pos.y + 0.3, targetNode.pos.z);
      }
    });
  }

  // ── KEY: Full movement with STOP tiles, payday-on-pass, branch detection ──
  async animateCarMove(player, steps, stepCallback) {
    const car = this.cars[player.socketId];
    if (!car) return { done: true };

    car.isMoving = true;
    this.trackedCar = car;
    this.isTrackingCar = true;

    let currentNodeId = player.position;
    let stepsLeft = steps;

    for (let s = 0; s < steps; s++) {
      const currentNode = BOARD_NODES.find(n => n.id === currentNodeId);
      if (!currentNode) break;

      // STOP tile check: if we're NOT at the start and this tile is a STOP, stop here
      if (s > 0 && currentNode.isStop) {
        // We just landed on a stop tile, break and trigger its action
        if (stepCallback) stepCallback(player, currentNodeId, 'stop');
        stepsLeft = 0;
        break;
      }

      // No more next nodes = end of board (finish)
      if (!currentNode.next || currentNode.next.length === 0) {
        if (stepCallback) stepCallback(player, currentNodeId, 'finish');
        break;
      }

      // BRANCH: multiple next nodes → ask player to choose or use pre-selected decision path
      if (currentNode.next.length > 1) {
        let chosenNextId = null;
        stepsLeft = steps - s - 1;
        if (player._chosenPath !== undefined && currentNode.next[player._chosenPath] !== undefined) {
          chosenNextId = currentNode.next[player._chosenPath];
          delete player._chosenPath;
        } else if (this.onReachBranch) {
          car.isMoving = false;
          chosenNextId = await this.onReachBranch(player, currentNodeId, stepsLeft, currentNode.next);
        }

        if (chosenNextId !== null && chosenNextId !== undefined) {
          // Continue movement on chosen path
          car.isMoving = true;
          currentNodeId = chosenNextId;
          player.position = currentNodeId;
          await this.moveCarTo(car, currentNodeId);
          // Now continue movement from here
          if (stepsLeft > 0) {
            const subResult = await this.animateCarMove(player, stepsLeft, stepCallback);
            player.position = subResult.finalNodeId;
            car.isMoving = false;
            this.resetCamera();
            return subResult;
          }
        }
        break;
      }

      const nextNodeId = currentNode.next[0];
      const nextNode = BOARD_NODES.find(n => n.id === nextNodeId);

      // Move car to next node
      await this.moveCarTo(car, nextNodeId);
      currentNodeId = nextNodeId;
      player.position = currentNodeId;

      // Payday while passing (only if NOT the final step)
      if (nextNode && nextNode.type === 'payday' && s < steps - 1) {
        if (stepCallback) stepCallback(player, currentNodeId, 'payday');
        // Brief pause
        await this.delay(400);
      } else if (stepCallback) {
        stepCallback(player, currentNodeId, 'step');
      }

      stepsLeft = steps - s - 1;
    }

    car.isMoving = false;
    this.resetCamera();

    return { done: true, finalNodeId: currentNodeId };
  }

  async moveCarTo(car, targetNodeId) {
    const targetData = this.node3DPositions.find(n => n.id === targetNodeId);
    if (!targetData) return;

    const startPos = car.position.clone();
    const endPos = new THREE.Vector3(targetData.pos.x, targetData.pos.y + 0.3, targetData.pos.z);

    const lookTarget = endPos.clone();
    lookTarget.y = car.position.y;
    car.lookAt(lookTarget);

    // Update camera target
    this.targetCameraPos.set(endPos.x, endPos.y + 16, endPos.z + 20);
    this.targetCameraLookAt.copy(endPos);

    const duration = 500;
    const startTime = performance.now();

    await new Promise(resolve => {
      const anim = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        car.position.lerpVectors(startPos, endPos, ease);
        car.position.y = startPos.y + Math.sin(progress * Math.PI) * 0.6;
        if (car.wheels) car.wheels.forEach(w => w.rotation.x += 0.28);
        if (progress < 1) requestAnimationFrame(anim);
        else resolve();
      };
      requestAnimationFrame(anim);
    });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  resetCamera() {
    setTimeout(() => {
      this.isTrackingCar = false;
      this.targetCameraPos.set(0, 55, 75);
      this.targetCameraLookAt.set(0, 0, 0);
    }, 2000);
  }

  // ── Celebration confetti ────────────────────────────────────
  spawnConfetti(position) {
    const colors = [0xec4899, 0xf59e0b, 0x22c55e, 0x3b82f6, 0xa855f7, 0xef4444];
    for (let i = 0; i < 80; i++) {
      const geo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
      const mat = new THREE.MeshBasicMaterial({ color: colors[Math.floor(Math.random() * colors.length)] });
      const piece = new THREE.Mesh(geo, mat);
      piece.position.set(
        position.x + (Math.random() - 0.5) * 4,
        position.y + Math.random() * 6,
        position.z + (Math.random() - 0.5) * 4
      );
      piece.velocity = new THREE.Vector3((Math.random() - 0.5) * 0.1, Math.random() * 0.15 + 0.05, (Math.random() - 0.5) * 0.1);
      piece.userData.isConfetti = true;
      this.scene.add(piece);

      // Remove after 3 seconds
      setTimeout(() => this.scene.remove(piece), 3000);
    }
  }

  // ── Camera modes ────────────────────────────────────────────
  cameraOverview() {
    this.isTrackingCar = false;
    this.targetCameraPos.set(0, 70, 90);
    this.targetCameraLookAt.set(0, 0, 0);
  }

  cameraFollowCar(car) {
    this.isTrackingCar = true;
    this.trackedCar = car;
  }

  cameraFocusNode(nodeId) {
    const nodeData = this.node3DPositions.find(n => n.id === nodeId);
    if (!nodeData) return;
    this.isTrackingCar = false;
    this.targetCameraPos.set(nodeData.pos.x, nodeData.pos.y + 18, nodeData.pos.z + 22);
    this.targetCameraLookAt.copy(nodeData.pos);
  }

  // ── Animation loop ──────────────────────────────────────────
  animate() {
    requestAnimationFrame(() => this.animate());

    if (this.isTrackingCar && this.trackedCar) {
      const p = this.trackedCar.position;
      this.targetCameraPos.set(p.x, p.y + 16, p.z + 20);
      this.targetCameraLookAt.copy(p);
    }

    this.camera.position.lerp(this.targetCameraPos, 0.04);
    this.currentCameraLookAt.lerp(this.targetCameraLookAt, 0.05);
    this.camera.lookAt(this.currentCameraLookAt);

    // Update confetti
    this.scene.children.forEach(obj => {
      if (obj.userData && obj.userData.isConfetti && obj.velocity) {
        obj.position.add(obj.velocity);
        obj.velocity.y -= 0.004;
        obj.rotation.x += 0.05;
        obj.rotation.z += 0.03;
      }
    });

    if (this.controls && !this.isTrackingCar) this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight || (window.innerHeight - 140);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}

window.DubaiBoard3D = DubaiBoard3D;
