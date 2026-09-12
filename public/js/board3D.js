// 3D Dubai LARP Board Game Engine (Three.js)
class DubaiBoard3D {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.cars = {}; // playerId -> 3D Object
    this.tileMeshes = [];
    this.targetCameraPos = new THREE.Vector3(0, 45, 60);
    this.targetCameraLookAt = new THREE.Vector3(0, 0, 0);
    this.currentCameraLookAt = new THREE.Vector3(0, 0, 0);
    this.isTrackingCar = false;
    this.trackedCar = null;

    // Node 3D positions mapped from 2D coordinates
    this.node3DPositions = [];
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || (window.innerHeight - 140);

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0b1329');
    this.scene.fog = new THREE.FogExp2('#0b1329', 0.008);

    // 2. Camera setup
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 50, 70);

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.container.appendChild(this.renderer.domElement);

    // 4. Orbit Controls (for optional manual rotation)
    if (THREE.OrbitControls) {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2.1;
      this.controls.minDistance = 15;
      this.controls.maxDistance = 120;
    }

    // 5. Lighting
    this.setupLighting();

    // 6. Build Dubai World & Environment
    this.buildDubaiEnvironment();

    // 7. Build 3D Road Network & Tiles
    this.buildRoadNetwork();

    // 8. Handle Resize
    window.addEventListener('resize', () => this.onResize());

    // 9. Start Animation Loop
    this.animate();
  }

  setupLighting() {
    // Ambient Warm Light
    const ambientLight = new THREE.AmbientLight(0xffeedd, 0.7);
    this.scene.add(ambientLight);

    // Golden Sun Directional Light
    const sunLight = new THREE.DirectionalLight(0xfff3d0, 1.2);
    sunLight.position.set(40, 80, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 250;
    sunLight.shadow.camera.left = -60;
    sunLight.shadow.camera.right = 60;
    sunLight.shadow.camera.top = 60;
    sunLight.shadow.camera.bottom = -60;
    this.scene.add(sunLight);

    // Blue/Cyan Rim Accent Light
    const rimLight = new THREE.DirectionalLight(0x06b6d4, 0.4);
    rimLight.position.set(-40, 30, -50);
    this.scene.add(rimLight);
  }

  buildDubaiEnvironment() {
    // 1. Water Ocean Plane (Turquoise Lagoon)
    const waterGeo = new THREE.PlaneGeometry(300, 300);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0891b2,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.5;
    water.receiveShadow = true;
    this.scene.add(water);

    // 2. Dubai Island Terrain (Golden Sand Island)
    const islandGeo = new THREE.CylinderGeometry(55, 58, 2, 64);
    const islandMat = new THREE.MeshStandardMaterial({
      color: 0xfde047,
      roughness: 0.85,
      metalness: 0.05
    });
    const island = new THREE.Mesh(islandGeo, islandMat);
    island.position.y = 0;
    island.receiveShadow = true;
    this.scene.add(island);

    // 3. Dubai Landmarks & Skyscrapers

    // Burj Khalifa Style Needle Tower
    this.createSkyscraper(0, 15, -28, 5, 45, 0x38bdf8, 0xf59e0b);

    // Burj Al Arab Style Sail Hotel
    this.createSailHotel(-32, 0, -18);

    // Luxury Towers Skyline
    this.createSkyscraper(-20, 0, -26, 6, 28, 0x0284c7);
    this.createSkyscraper(20, 0, -25, 7, 32, 0xf59e0b);
    this.createSkyscraper(34, 0, -15, 5, 22, 0x818cf8);
    this.createSkyscraper(-40, 0, 5, 6, 18, 0x06b6d4);
    this.createSkyscraper(42, 0, 8, 7, 24, 0xec4899);

    // 4. Palm Trees 🌴
    const palmPositions = [
      [-15, 10], [-8, -12], [8, -14], [18, 12],
      [-25, -5], [26, -6], [-35, 15], [35, -2],
      [-5, 22], [12, 24], [-22, 20], [28, 20]
    ];
    palmPositions.forEach(p => this.createPalmTree(p[0], 1, p[1]));

    // 5. Luxury Yachts in the Water 🛥️
    this.createYacht(-45, -0.2, 28, 0.4);
    this.createYacht(45, -0.2, -35, -0.8);
    this.createYacht(50, -0.2, 22, 1.2);
  }

  createSkyscraper(x, y, z, width, height, color, glowColor) {
    const group = new THREE.Group();
    group.position.set(x, 1, z);

    // Main Tower Body
    const geo = new THREE.BoxGeometry(width, height, width);
    const mat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.2,
      metalness: 0.85
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = height / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    // Spire
    const spireGeo = new THREE.ConeGeometry(width * 0.4, height * 0.25, 8);
    const spireMat = new THREE.MeshStandardMaterial({ color: glowColor || 0xffffff, metalness: 0.9, roughness: 0.1 });
    const spire = new THREE.Mesh(spireGeo, spireMat);
    spire.position.y = height + (height * 0.125);
    group.add(spire);

    this.scene.add(group);
  }

  createSailHotel(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, 1, z);

    // Sail shape
    const sailGeo = new THREE.CylinderGeometry(0.5, 7, 26, 16, 1, false, 0, Math.PI);
    const sailMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.3 });
    const sail = new THREE.Mesh(sailGeo, sailMat);
    sail.position.y = 13;
    sail.rotation.y = Math.PI / 4;
    sail.castShadow = true;
    group.add(sail);

    // Helipad
    const heliGeo = new THREE.CylinderGeometry(3, 3, 0.6, 16);
    const heliMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.5 });
    const heli = new THREE.Mesh(heliGeo, heliMat);
    heli.position.set(2, 20, 2);
    group.add(heli);

    this.scene.add(group);
  }

  createPalmTree(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 4, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 2;
    trunk.rotation.z = (Math.random() - 0.5) * 0.2;
    trunk.castShadow = true;
    group.add(trunk);

    // Leaves
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const leafGeo = new THREE.ConeGeometry(1.2, 3, 4);
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(Math.cos(angle) * 1.2, 3.8, Math.sin(angle) * 1.2);
      leaf.rotation.x = Math.PI / 3;
      leaf.rotation.y = angle;
      group.add(leaf);
    }

    this.scene.add(group);
  }

  createYacht(x, y, z, rot) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = rot;

    // Hull
    const hullGeo = new THREE.BoxGeometry(4, 1.4, 10);
    const hullMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.5 });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = 0.7;
    group.add(hull);

    // Cabin
    const cabinGeo = new THREE.BoxGeometry(3, 1.2, 5);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.8 });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 1.8, -1);
    group.add(cabin);

    this.scene.add(group);
  }

  // 3D Road Network & Interactive Tiles
  buildRoadNetwork() {
    this.node3DPositions = BOARD_NODES.map(node => {
      // Map 2D (0..100) to 3D world coordinates (-42..42 on X, -22..22 on Z)
      const x3D = ((node.x - 50) / 50) * 42;
      const z3D = ((node.y - 50) / 50) * 22;
      const y3D = 1.2; // Elevation above sand island
      return { id: node.id, pos: new THREE.Vector3(x3D, y3D, z3D), raw: node };
    });

    // 1. Draw 3D Road Connections
    BOARD_NODES.forEach(node => {
      const from = this.node3DPositions.find(n => n.id === node.id).pos;
      node.next.forEach(targetId => {
        const to = this.node3DPositions.find(n => n.id === targetId).pos;
        this.createRoadSegment(from, to);
      });
    });

    // 2. Draw 3D Tiles / Pedestals
    this.node3DPositions.forEach(n => {
      this.createTilePedestal(n.pos, n.raw);
    });
  }

  createRoadSegment(p1, p2) {
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);

    const roadGeo = new THREE.BoxGeometry(2.4, 0.2, len);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
      metalness: 0.2
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.position.copy(mid);
    road.position.y = p1.y - 0.05;
    road.lookAt(p2);
    road.receiveShadow = true;
    this.scene.add(road);

    // Center Golden Dash Line
    const lineGeo = new THREE.BoxGeometry(0.3, 0.22, len * 0.85);
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

    // Pedestal Disc
    const discGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.5, 24);
    const colorHex = parseInt((node.color || '#3b82f6').replace('#', '0x'), 16);
    const discMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.3,
      metalness: 0.5
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.position.y = 0.25;
    disc.castShadow = true;
    disc.receiveShadow = true;
    group.add(disc);

    // Glowing Outer Ring
    const ringGeo = new THREE.TorusGeometry(1.7, 0.12, 12, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.52;
    group.add(ring);

    // Floating Tile Label / Icon (Canvas Sprite)
    const sprite = this.createTileSprite(node.icon || '📍', node.title);
    sprite.position.set(0, 2.2, 0);
    group.add(sprite);

    this.scene.add(group);
    this.tileMeshes.push(group);
  }

  createTileSprite(icon, title) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Draw Rounded Badge
    ctx.fillStyle = 'rgba(11, 19, 41, 0.85)';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(10, 10, 236, 108, 24);
    ctx.fill();
    ctx.stroke();

    // Icon
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(icon, 128, 55);

    // Title
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 22px Plus Jakarta Sans, sans-serif';
    ctx.fillText(title, 128, 95);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(3.2, 1.6, 1);
    return sprite;
  }

  // 3D Low-Poly Sports Car Builder
  create3DCar(player) {
    const carGroup = new THREE.Group();
    const colorHex = parseInt((player.character.color || '#3b82f6').replace('#', '0x'), 16);

    // 1. Lower Chassis
    const chassisGeo = new THREE.BoxGeometry(1.6, 0.5, 3.2);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.2,
      metalness: 0.8
    });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.y = 0.5;
    chassis.castShadow = true;
    carGroup.add(chassis);

    // 2. Cabin / Windshield
    const cabinGeo = new THREE.BoxGeometry(1.2, 0.55, 1.6);
    const cabinMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.8
    });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 0.95, -0.2);
    carGroup.add(cabin);

    // 3. Spoiler
    const spoilerGeo = new THREE.BoxGeometry(1.5, 0.1, 0.4);
    const spoiler = new THREE.Mesh(spoilerGeo, chassisMat);
    spoiler.position.set(0, 0.95, 1.3);
    carGroup.add(spoiler);

    // 4. Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.25, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    const wheelPositions = [
      [-0.85, 0.32, 0.9],
      [0.85, 0.32, 0.9],
      [-0.85, 0.32, -0.9],
      [0.85, 0.32, -0.9]
    ];
    carGroup.wheels = [];
    wheelPositions.forEach(wp => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wp[0], wp[1], wp[2]);
      wheel.castShadow = true;
      carGroup.add(wheel);
      carGroup.wheels.push(wheel);
    });

    // 5. Headlights
    const lightGeo = new THREE.BoxGeometry(0.3, 0.15, 0.1);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const leftLight = new THREE.Mesh(lightGeo, lightMat);
    leftLight.position.set(-0.5, 0.5, -1.62);
    const rightLight = new THREE.Mesh(lightGeo, lightMat);
    rightLight.position.set(0.5, 0.5, -1.62);
    carGroup.add(leftLight);
    carGroup.add(rightLight);

    // 6. Floating Name & Avatar Badge Overhead
    const nameCanvas = document.createElement('canvas');
    nameCanvas.width = 256;
    nameCanvas.height = 80;
    const nCtx = nameCanvas.getContext('2d');
    nCtx.fillStyle = player.character.color;
    nCtx.beginPath();
    nCtx.roundRect(10, 10, 236, 60, 16);
    nCtx.fill();
    nCtx.fillStyle = '#ffffff';
    nCtx.font = 'bold 28px Plus Jakarta Sans, sans-serif';
    nCtx.textAlign = 'center';
    nCtx.fillText(`${player.character.icon} ${player.name}`, 128, 50);

    const nameTex = new THREE.CanvasTexture(nameCanvas);
    const nameSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: nameTex }));
    nameSprite.scale.set(2.8, 0.9, 1);
    nameSprite.position.set(0, 2.6, 0);
    carGroup.add(nameSprite);

    this.scene.add(carGroup);
    return carGroup;
  }

  // Update All Players on Board
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

  // Move a Car smoothly along path step by step with Dynamic Camera Tracking
  async animateCarMove(player, steps, onStepCallback) {
    const car = this.cars[player.socketId];
    if (!car) return;

    car.isMoving = true;
    this.trackedCar = car;
    this.isTrackingCar = true;

    let currentNodeId = player.position;

    for (let s = 0; s < steps; s++) {
      const currentNode = BOARD_NODES.find(n => n.id === currentNodeId);
      if (!currentNode || currentNode.next.length === 0) break;

      const nextNodeId = currentNode.next[0];
      const targetNode3D = this.node3DPositions.find(n => n.id === nextNodeId);

      // Interpolate from current pos to target pos
      const startPos = car.position.clone();
      const endPos = new THREE.Vector3(targetNode3D.pos.x, targetNode3D.pos.y + 0.3, targetNode3D.pos.z);

      // Rotate Car towards destination
      const lookTarget = endPos.clone();
      lookTarget.y = car.position.y;
      car.lookAt(lookTarget);

      const duration = 480; // ms
      const startTime = performance.now();

      await new Promise(resolve => {
        const stepAnim = (now) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Ease in-out quad
          const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

          car.position.lerpVectors(startPos, endPos, ease);
          // Little hop
          car.position.y = startPos.y + Math.sin(progress * Math.PI) * 0.45;

          // Rotate wheels
          if (car.wheels) {
            car.wheels.forEach(w => w.rotation.x += 0.25);
          }

          if (progress < 1) {
            requestAnimationFrame(stepAnim);
          } else {
            resolve();
          }
        };
        requestAnimationFrame(stepAnim);
      });

      currentNodeId = nextNodeId;
      player.position = currentNodeId;
      if (onStepCallback) onStepCallback(player, currentNodeId);
    }

    car.isMoving = false;

    // Reset camera smoothly after movement completes
    setTimeout(() => {
      this.isTrackingCar = false;
      this.targetCameraPos.set(0, 48, 65);
      this.targetCameraLookAt.set(0, 0, 0);
    }, 1200);
  }

  // Animation Loop
  animate() {
    requestAnimationFrame(() => this.animate());

    // Dynamic Camera Tracking (Cinematic Follow Cam)
    if (this.isTrackingCar && this.trackedCar) {
      // Position camera behind and above car
      const carPos = this.trackedCar.position;
      this.targetCameraPos.set(carPos.x, carPos.y + 14, carPos.z + 18);
      this.targetCameraLookAt.copy(carPos);
    }

    // Smooth Camera Lerp
    this.camera.position.lerp(this.targetCameraPos, 0.04);
    this.currentCameraLookAt.lerp(this.targetCameraLookAt, 0.05);
    this.camera.lookAt(this.currentCameraLookAt);

    if (this.controls && !this.isTrackingCar) {
      this.controls.update();
    }

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
