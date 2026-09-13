// ============================================================
// SPIEL DER JAHUDIS – 3D Board Engine 2.0 (Three.js)
// "Spiel des Lebens" Edition with 5 Themed Biomes,
// Peg-Figurine Convertibles & Cinematic Chase Camera
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
    this.targetCameraPos = new THREE.Vector3(0, 52, 68);
    this.targetCameraLookAt = new THREE.Vector3(0, 0, 0);
    this.currentCameraLookAt = new THREE.Vector3(0, 0, 0);
    this.isTrackingCar = false;
    this.trackedCar = null;
    this.carHeading = new THREE.Vector3(0, 0, -1);
    this.waterMesh = null;
    this.animatedObjects = [];

    // Callbacks from host.js
    this.onPassPayday = null;
    this.onReachBranch = null;
    this.onLandStop = null;
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || (window.innerHeight - 140);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0a1128');
    this.scene.fog = new THREE.FogExp2('#0a1128', 0.005);

    this.camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 1500);
    this.camera.position.set(0, 55, 75);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.container.appendChild(this.renderer.domElement);

    if (THREE.OrbitControls) {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2.05;
      this.controls.minDistance = 15;
      this.controls.maxDistance = 180;
    }

    this.setupLighting();
    this.buildThemedWorld();
    this.buildRoadNetwork();

    window.addEventListener('resize', () => this.onResize());
    this.animate();
  }

  // ── High-Definition Lighting Setup ────────────────────────────
  setupLighting() {
    // Warm hemisphere ambient light (sky blue + warm ground bounce)
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x1e293b, 0.65);
    this.scene.add(hemiLight);

    // Warm main sun light with soft shadows
    const sun = new THREE.DirectionalLight(0xfff5db, 1.35);
    sun.position.set(55, 110, 65);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 350;
    sun.shadow.camera.left = -95;
    sun.shadow.camera.right = 95;
    sun.shadow.camera.top = 95;
    sun.shadow.camera.bottom = -95;
    sun.shadow.bias = -0.001;
    sun.shadow.normalBias = 0.02;
    this.scene.add(sun);

    // Cyan rim light from ocean
    const cyanRim = new THREE.DirectionalLight(0x06b6d4, 0.45);
    cyanRim.position.set(-65, 45, -55);
    this.scene.add(cyanRim);

    // Magenta accent light for Casino & City areas
    const pinkRim = new THREE.DirectionalLight(0xec4899, 0.35);
    pinkRim.position.set(40, 25, 60);
    this.scene.add(pinkRim);
  }

  // ── Build 5 Thematic Biomes (Spiel des Lebens World) ───────────
  buildThemedWorld() {
    // 1. Turquoise Ocean
    const waterGeo = new THREE.PlaneGeometry(600, 600, 32, 32);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.12,
      metalness: 0.75,
      transparent: true,
      opacity: 0.88
    });
    this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.y = -0.6;
    this.waterMesh.receiveShadow = true;
    this.scene.add(this.waterMesh);

    // 2. Main Land Platform (Beveled Continent)
    const continentGeo = new THREE.CylinderGeometry(78, 84, 2.4, 64);
    const continentMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.9,
      metalness: 0.1
    });
    const continent = new THREE.Mesh(continentGeo, continentMat);
    continent.position.y = 0;
    continent.receiveShadow = true;
    this.scene.add(continent);

    // ── Biome 1: Campus & Uni (North-West) ──────────────────────
    this.buildCampusBiome(-18, 0, -28);

    // ── Biome 2: Downtown Metropolis (North-East) ───────────────
    this.buildDowntownBiome(45, 0, -10);

    // ── Biome 3: Suburbia & Family (Center-East to Center) ──────
    this.buildSuburbiaBiome(10, 0, 10);

    // ── Biome 4: Casino & Crypto Dunes (South-West) ─────────────
    this.buildCasinoBiome(-35, 0, 20);

    // ── Biome 5: Retirement Beach Paradise (South / South-East) ─
    this.buildBeachBiome(6, 0, 32);

    // ── 🎡 Iconic 3D Spinner Wheel (Hasbro Style Centerpiece) ───
    this.build3DSpinnerWheel(0, 1.2, -4);
  }

  // ── 🎓 BIOME 1: Campus & Uni ──────────────────────────────────
  buildCampusBiome(cx, cy, cz) {
    // Green Campus lawn plate
    const lawnGeo = new THREE.CylinderGeometry(28, 30, 0.4, 32);
    const lawnMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.85 });
    const lawn = new THREE.Mesh(lawnGeo, lawnMat);
    lawn.position.set(cx, 1.200, cz);
    lawn.receiveShadow = true;
    this.scene.add(lawn);

    // Main Academic Lecture Hall
    const hallGroup = new THREE.Group();
    hallGroup.position.set(cx - 6, 1.4, cz - 8);

    // Hall base & roof
    const bldgGeo = new THREE.BoxGeometry(14, 7, 10);
    const bldgMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3, metalness: 0.1 });
    const bldg = new THREE.Mesh(bldgGeo, bldgMat);
    bldg.position.y = 3.5;
    bldg.castShadow = true;
    hallGroup.add(bldg);

    // Classical Pediment / Gable roof
    const roofGeo = new THREE.ConeGeometry(9.5, 4.5, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.4 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 9.25;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    hallGroup.add(roof);

    // Columns
    for (let c = -4.5; c <= 4.5; c += 3) {
      const colGeo = new THREE.CylinderGeometry(0.35, 0.35, 6, 12);
      const colMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
      const col = new THREE.Mesh(colGeo, colMat);
      col.position.set(c, 3, 5.2);
      col.castShadow = true;
      hallGroup.add(col);
    }
    this.scene.add(hallGroup);

    // Library Tower with Clock
    const libGroup = new THREE.Group();
    libGroup.position.set(cx + 10, 1.4, cz - 4);
    const towerGeo = new THREE.BoxGeometry(5, 14, 5);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.y = 7;
    tower.castShadow = true;
    libGroup.add(tower);

    const spireGeo = new THREE.ConeGeometry(3.5, 5, 4);
    const spireMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 });
    const spire = new THREE.Mesh(spireGeo, spireMat);
    spire.position.y = 16.5;
    spire.rotation.y = Math.PI / 4;
    libGroup.add(spire);
    this.animatedObjects.push({ obj: spire, type: 'rotateY', speed: 0.005 });
    this.scene.add(libGroup);

    // Campus Trees
    const trees = [
      [cx - 15, cz + 6], [cx - 8, cz + 10], [cx + 4, cz + 8],
      [cx + 14, cz + 6], [cx - 18, cz - 4], [cx + 12, cz - 12]
    ];
    trees.forEach(p => this.createCampusTree(p[0], 1.4, p[1]));
  }

  // ── 🏙️ BIOME 2: Downtown Metropolis ──────────────────────────
  buildDowntownBiome(cx, cy, cz) {
    // Dark Asphalt Plaza
    const plazaGeo = new THREE.CylinderGeometry(32, 34, 0.4, 32);
    const plazaMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7, metalness: 0.3 });
    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.position.set(cx, 1.204, cz);
    plaza.receiveShadow = true;
    this.scene.add(plaza);

    // Modern Luxury Skyscrapers
    this.createSkyscraper(cx - 8, 1.4, cz - 10, 8, 48, 0x0284c7, 0x38bdf8);
    this.createSkyscraper(cx + 8, 1.4, cz - 12, 7, 56, 0xf59e0b, 0xfef08a);
    this.createSkyscraper(cx + 16, 1.4, cz + 4, 9, 42, 0x6366f1, 0xa5b4fc);
    this.createSkyscraper(cx - 14, 1.4, cz + 2, 7, 36, 0x06b6d4, 0x67e8f9);
    this.createSkyscraper(cx + 4, 1.4, cz + 10, 6, 28, 0xec4899, 0xf472b6);

    // Street lamps
    const lamps = [
      [cx - 2, cz - 4], [cx + 2, cz + 2], [cx + 12, cz - 2], [cx - 10, cz - 4]
    ];
    lamps.forEach(p => this.createStreetLamp(p[0], 1.4, p[1]));

    // Flying Cars / Drones circling the skyscrapers
    const droneColors = [0xef4444, 0x38bdf8, 0xfacc15];
    for (let i = 0; i < 3; i++) {
      const droneGroup = new THREE.Group();
      droneGroup.position.set(cx + (Math.random() * 20 - 10), 15 + Math.random() * 10, cz + (Math.random() * 20 - 10));
      
      const droneGeo = new THREE.BoxGeometry(1.2, 0.4, 0.6);
      const droneMat = new THREE.MeshStandardMaterial({ color: droneColors[i], metalness: 0.9, roughness: 0.1 });
      const drone = new THREE.Mesh(droneGeo, droneMat);
      droneGroup.add(drone);
      
      this.scene.add(droneGroup);
      
      // Animate drone bobbing
      this.animatedObjects.push({
        obj: droneGroup,
        type: 'bob',
        speed: 2 + Math.random(),
        amp: 1.5,
        baseY: droneGroup.position.y
      });
      // Also slowly rotate it
      this.animatedObjects.push({
        obj: droneGroup,
        type: 'rotateY',
        speed: 0.01 + Math.random() * 0.015
      });
    }
  }

  // ── 🏡 BIOME 3: Suburbia & Family ─────────────────────────────
  buildSuburbiaBiome(cx, cy, cz) {
    // Suburban Green lawn plate
    const subLawnGeo = new THREE.CylinderGeometry(30, 32, 0.4, 32);
    const subLawnMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.9 });
    const subLawn = new THREE.Mesh(subLawnGeo, subLawnMat);
    subLawn.position.set(cx, 1.208, cz);
    subLawn.receiveShadow = true;
    this.scene.add(subLawn);

    // Cozy Family Villas
    this.createSuburbanHouse(cx - 8, 1.4, cz - 8, 0xfbbf24, 0xe11d48); // Yellow villa, red roof
    this.createSuburbanHouse(cx + 8, 1.4, cz - 4, 0xffffff, 0x2563eb); // White villa, blue roof
    this.createSuburbanHouse(cx - 4, 1.4, cz + 10, 0xf3f4f6, 0xd97706); // Modern grey villa
    this.createSuburbanHouse(cx + 10, 1.4, cz + 8, 0xfce7f3, 0x9333ea); // Pink villa

    // Flowering Garden Trees & Shrubs
    const gardenTrees = [
      [cx - 14, cz - 4], [cx + 14, cz - 12], [cx - 12, cz + 6],
      [cx + 15, cz + 3], [cx + 3, cz - 12]
    ];
    gardenTrees.forEach(p => this.createCampusTree(p[0], 1.4, p[1], 0xf472b6)); // Cherry blossom pink
  }

  // ── 🎰 BIOME 4: Casino & Crypto Dunes ─────────────────────────
  buildCasinoBiome(cx, cy, cz) {
    // Golden Sand / Casino Plaza
    const casinoPlazaGeo = new THREE.CylinderGeometry(28, 30, 0.4, 32);
    const casinoPlazaMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.5, metalness: 0.4 });
    const casinoPlaza = new THREE.Mesh(casinoPlazaGeo, casinoPlazaMat);
    casinoPlaza.position.set(cx, 1.212, cz);
    casinoPlaza.receiveShadow = true;
    this.scene.add(casinoPlaza);

    // Luxor-Style Golden Pyramid Casino
    const pyramidGeo = new THREE.ConeGeometry(13, 14, 4);
    const pyramidMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.85,
      roughness: 0.15
    });
    const pyramid = new THREE.Mesh(pyramidGeo, pyramidMat);
    pyramid.position.set(cx - 6, 8.4, cz - 4);
    pyramid.rotation.y = Math.PI / 4;
    pyramid.castShadow = true;
    this.scene.add(pyramid);

    // Apex laser light beam atop Pyramid
    const beamGeo = new THREE.CylinderGeometry(0.3, 0.8, 30, 16);
    beamGeo.translate(0, 15, 0); // Shift origin to the base
    const beamMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65 });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(cx - 6, 14, cz - 4);
    beam.rotation.z = 0.15; // Tilt slightly to sweep around
    this.scene.add(beam);
    this.animatedObjects.push({ obj: beam, type: 'rotateY', speed: -0.015 });

    // Giant Rotating 3D Bitcoin Sculpture
    const btcGroup = new THREE.Group();
    btcGroup.position.set(cx + 8, 5, cz + 6);
    const coinGeo = new THREE.CylinderGeometry(3.5, 3.5, 0.7, 32);
    const coinMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.1 });
    const coin = new THREE.Mesh(coinGeo, coinMat);
    coin.rotation.x = Math.PI / 2;
    coin.castShadow = true;
    btcGroup.add(coin);

    const btcPillarGeo = new THREE.CylinderGeometry(1.2, 1.6, 4, 16);
    const btcPillarMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
    const btcPillar = new THREE.Mesh(btcPillarGeo, btcPillarMat);
    btcPillar.position.y = -2.5;
    btcGroup.add(btcPillar);

    this.scene.add(btcGroup);
    this.animatedObjects.push({ obj: coin, type: 'rotateY', speed: 0.025 });

    // Neon Palms (Hot Pink & Cyan glowing palms)
    this.createNeonPalm(cx - 14, 1.4, cz + 8, 0x06b6d4);
    this.createNeonPalm(cx + 6, 1.4, cz - 12, 0xec4899);
    this.createNeonPalm(cx - 4, 1.4, cz + 14, 0xa855f7);
  }

  // ── 🏝️ BIOME 5: Retirement Paradise Beach ──────────────────────
  buildBeachBiome(cx, cy, cz) {
    // Warm Sand Shore
    const beachGeo = new THREE.CylinderGeometry(32, 34, 0.4, 32);
    const beachMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.9 });
    const beach = new THREE.Mesh(beachGeo, beachMat);
    beach.position.set(cx, 1.216, cz);
    beach.receiveShadow = true;
    this.scene.add(beach);

    // Tropical Curved Palm Trees
    const palms = [
      [cx - 16, cz + 4], [cx - 8, cz + 12], [cx + 12, cz + 8],
      [cx + 18, cz - 2], [cx - 2, cz + 16]
    ];
    palms.forEach(p => this.createTropicalPalm(p[0], 1.4, p[1]));

    // Luxury Super-Yacht in the bay
    this.createSuperYacht(cx - 28, 0, cz + 24, 0.75);

    // Grand Golden Finish Arch at node 76
    const archGroup = new THREE.Group();
    archGroup.position.set(cx + 20, 1.4, cz - 2);

    const archGeo = new THREE.TorusGeometry(4.5, 0.6, 16, 32, Math.PI);
    const archMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.1 });
    const arch = new THREE.Mesh(archGeo, archMat);
    arch.position.y = 4.5;
    arch.castShadow = true;
    archGroup.add(arch);

    // Victory Podium
    const podGeo = new THREE.CylinderGeometry(3, 3.5, 1.2, 16);
    const podMat = new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.6, roughness: 0.3 });
    const pod = new THREE.Mesh(podGeo, podMat);
    pod.position.y = 0.6;
    archGroup.add(pod);

    this.scene.add(archGroup);
  }

  // ── 🎡 3D Physical Spinner Wheel (Spiel des Lebens Centerpiece) ──
  build3DSpinnerWheel(cx, cy, cz) {
    const group = new THREE.Group();
    group.position.set(cx, cy, cz);

    // 1. Molded plastic base (white fluted podium with gold trim)
    const baseGeo = new THREE.CylinderGeometry(7.2, 8.0, 1.6, 32);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.2,
      metalness: 0.15
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.8;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Golden rim ring
    const rimGeo = new THREE.TorusGeometry(7.4, 0.35, 16, 32);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.92, roughness: 0.15 });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 1.6;
    group.add(rim);

    // 2. The Rotating Wheel Rotor
    const wheelRotor = new THREE.Group();
    wheelRotor.position.y = 1.65;

    const sectorColors = [
      0xef4444, 0xf97316, 0xf59e0b, 0x10b981, 0x06b6d4,
      0x3b82f6, 0x6366f1, 0xa855f7, 0xec4899, 0xeab308
    ];
    const numSectors = 10;
    const arc = (Math.PI * 2) / numSectors;

    for (let i = 0; i < numSectors; i++) {
      const wedgeGeo = new THREE.CylinderGeometry(7.0, 7.0, 0.35, 16, 1, false, i * arc, arc);
      const wedgeMat = new THREE.MeshStandardMaterial({
        color: sectorColors[i],
        roughness: 0.35,
        metalness: 0.25
      });
      const wedge = new THREE.Mesh(wedgeGeo, wedgeMat);
      wedge.castShadow = true;
      wheelRotor.add(wedge);

      // White Peg studs along sector edges
      const pegGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.6, 8);
      const pegMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.85, roughness: 0.1 });
      const peg = new THREE.Mesh(pegGeo, pegMat);
      const pegAngle = i * arc;
      peg.position.set(Math.cos(pegAngle) * 6.4, 0.35, Math.sin(pegAngle) * 6.4);
      wheelRotor.add(peg);
    }

    // Center Chrome Dome
    const domeGeo = new THREE.SphereGeometry(2.2, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.2
    });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = 0.2;
    wheelRotor.add(dome);

    // Center Gold Coin emblem
    const emblemGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.3, 24);
    const emblemMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.1 });
    const emblem = new THREE.Mesh(emblemGeo, emblemMat);
    emblem.position.y = 2.25;
    wheelRotor.add(emblem);

    group.add(wheelRotor);
    this.boardWheelRotor = wheelRotor;

    // 3. Pointer Needle (Flexes dynamically when spinning)
    const pointerGroup = new THREE.Group();
    pointerGroup.position.set(0, 2.1, 6.7);
    const needleGeo = new THREE.ConeGeometry(0.55, 1.9, 4);
    const needleMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.7, roughness: 0.2 });
    const needle = new THREE.Mesh(needleGeo, needleMat);
    needle.rotation.x = Math.PI / 2;
    needle.position.z = -0.75;
    pointerGroup.add(needle);
    group.add(pointerGroup);
    this.boardWheelPointer = pointerGroup;

    this.scene.add(group);
  }

  spinBoardWheel(spinValue, velocity = 1) {
    if (!this.boardWheelRotor) return;
    const numSectors = 10;
    const arc = (Math.PI * 2) / numSectors;
    const sectorIndex = (spinValue - 1 + numSectors) % numSectors;
    const targetAngle = -sectorIndex * arc;
    const rotations = Math.min(6, Math.max(3, Math.round(velocity * 1.3)));
    const finalAngle = this.boardWheelRotor.rotation.y + rotations * Math.PI * 2 + targetAngle;
    const duration = Math.min(3200, Math.max(1800, 1600 + velocity * 200));
    const startAngle = this.boardWheelRotor.rotation.y;
    const startTime = performance.now();

    const anim = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      this.boardWheelRotor.rotation.y = startAngle + ease * (finalAngle - startAngle);

      // Realistic needle flap / tick
      if (this.boardWheelPointer) {
        const tickVal = Math.sin(this.boardWheelRotor.rotation.y * 10);
        this.boardWheelPointer.rotation.x = (Math.PI / 2) + Math.max(0, tickVal) * 0.28;
      }

      if (progress < 1) {
        requestAnimationFrame(anim);
      } else {
        if (this.boardWheelPointer) this.boardWheelPointer.rotation.x = Math.PI / 2;
        this.spawnConfetti(new THREE.Vector3(0, 4, -4));
      }
    };
    requestAnimationFrame(anim);
  }

  // ── 3D Asset Helpers ──────────────────────────────────────────
  createSkyscraper(x, y, z, width, height, color, glowColor) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const geo = new THREE.BoxGeometry(width, height, width);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.25, metalness: 0.8 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = height / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    // Spire
    const spireGeo = new THREE.ConeGeometry(width * 0.35, height * 0.25, 8);
    const spireMat = new THREE.MeshStandardMaterial({ color: glowColor || 0xffffff, metalness: 0.9, roughness: 0.1 });
    const spire = new THREE.Mesh(spireGeo, spireMat);
    spire.position.y = height + height * 0.125;
    group.add(spire);

    this.scene.add(group);
  }

  createSuburbanHouse(x, y, z, wallColor, roofColor) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const wallGeo = new THREE.BoxGeometry(6, 4.2, 7);
    const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.5 });
    const walls = new THREE.Mesh(wallGeo, wallMat);
    walls.position.y = 2.1;
    walls.castShadow = true;
    group.add(walls);

    // Pitched Roof
    const roofGeo = new THREE.ConeGeometry(5.8, 3.2, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.4 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 5.8;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    group.add(roof);

    // Chimney
    const chimGeo = new THREE.BoxGeometry(0.8, 2, 0.8);
    const chimMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
    const chim = new THREE.Mesh(chimGeo, chimMat);
    chim.position.set(1.5, 6.2, 1);
    group.add(chim);

    this.scene.add(group);
  }

  createCampusTree(x, y, z, leafColor = 0x16a34a) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.45, 3.5, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.75;
    trunk.castShadow = true;
    group.add(trunk);

    const crownGeo = new THREE.DodecahedronGeometry(2.4, 1);
    const crownMat = new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.7 });
    const crown = new THREE.Mesh(crownGeo, crownMat);
    crown.position.y = 4.2;
    crown.castShadow = true;
    group.add(crown);

    this.scene.add(group);
    
    // Wind sway animation
    this.animatedObjects.push({
      obj: group,
      type: 'swayXY',
      speed: 1.2 + Math.random() * 0.8,
      amp: 0.02 + Math.random() * 0.01,
      baseRotX: group.rotation.x,
      baseRotZ: group.rotation.z
    });
  }

  createTropicalPalm(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.6, 6, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 3;
    const initialRotZ = (Math.random() - 0.5) * 0.35;
    trunk.rotation.z = initialRotZ;
    trunk.castShadow = true;
    group.add(trunk);

    const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      const leafGeo = new THREE.ConeGeometry(1.4, 4.2, 4);
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(Math.cos(angle) * 1.5, 6, Math.sin(angle) * 1.5);
      leaf.rotation.x = Math.PI / 2.7;
      leaf.rotation.y = angle;
      group.add(leaf);
    }
    
    // Add swaying animation to the whole palm tree
    this.animatedObjects.push({
      obj: group,
      type: 'swayXY',
      speed: 1.5 + Math.random() * 1.0,
      amp: 0.03 + Math.random() * 0.02,
      baseRotX: group.rotation.x,
      baseRotZ: group.rotation.z
    });
    
    this.scene.add(group);
  }

  createNeonPalm(x, y, z, glowHex) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const trunkGeo = new THREE.CylinderGeometry(0.25, 0.45, 5, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.8 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 2.5;
    group.add(trunk);

    const leafMat = new THREE.MeshBasicMaterial({ color: glowHex });
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const leafGeo = new THREE.ConeGeometry(1.2, 3.5, 4);
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(Math.cos(angle) * 1.4, 5, Math.sin(angle) * 1.4);
      leaf.rotation.x = Math.PI / 2.8;
      leaf.rotation.y = angle;
      group.add(leaf);
    }
    this.scene.add(group);
    
    // Wind sway animation
    this.animatedObjects.push({
      obj: group,
      type: 'swayXY',
      speed: 1.5 + Math.random() * 0.5,
      amp: 0.025 + Math.random() * 0.015,
      baseRotX: group.rotation.x,
      baseRotZ: group.rotation.z
    });
  }

  createStreetLamp(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.18, 4.5, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 2.25;
    group.add(pole);

    const headGeo = new THREE.BoxGeometry(0.8, 0.25, 0.5);
    const headMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0.4, 4.5, 0);
    group.add(head);

    this.scene.add(group);
  }

  createSuperYacht(x, y, z, rot) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = rot;

    const hullGeo = new THREE.BoxGeometry(5.5, 2, 16);
    const hullMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15, metalness: 0.6 });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = 1;
    group.add(hull);

    const deckGeo = new THREE.BoxGeometry(4.2, 1.8, 8);
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.set(0, 2.7, -1);
    group.add(deck);

    this.animatedObjects.push({
      obj: group,
      type: 'bobRotX',
      speed: 1.2,
      amp: 0.2,
      baseY: group.position.y,
      baseRotX: group.rotation.x
    });

    this.scene.add(group);
  }

  // ── 🛣️ 3D Coordinates & Road Network ─────────────────────────
  mapTo3D(x, y) {
    return new THREE.Vector3(
      ((x - 50) / 50) * 64, // -64 .. +64
      1.45,
      ((y - 50) / 50) * 44  // -44 .. +44
    );
  }

  buildRoadNetwork() {
    this.node3DPositions = BOARD_NODES.map(node => ({
      id: node.id,
      pos: this.mapTo3D(node.x, node.y),
      raw: node
    }));

    // Generate asphalt road ribbons
    BOARD_NODES.forEach(node => {
      const fromNode = this.node3DPositions.find(n => n.id === node.id);
      if (!fromNode) return;
      node.next.forEach(targetId => {
        const toNode = this.node3DPositions.find(n => n.id === targetId);
        if (toNode) this.createRoadSegment(fromNode.pos, toNode.pos);
      });
    });

    // Generate tile pedestals
    this.node3DPositions.forEach(n => this.createTilePedestal(n.pos, n.raw));
  }

  createRoadSegment(p1, p2) {
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);

    // Shorten road segment slightly so they don't overlap inside the node pedestals
    const margin = 1.8;
    const adjustedLen = Math.max(0.1, len - margin * 2);

    // Strict vertical layering to prevent Z-fighting
    const roadY = p1.y - 0.05;
    const lineY = p1.y - 0.03;
    const curbY = p1.y - 0.01;

    // 1. Dark Road Asphalt Ribbon
    const roadWidth = 3.2;
    const roadGeo = new THREE.BoxGeometry(roadWidth, 0.22, adjustedLen);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.65,
      metalness: 0.25
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.position.copy(mid);
    road.position.y = roadY;
    const lookTarget = p2.clone();
    lookTarget.y = road.position.y;
    road.lookAt(lookTarget);
    road.receiveShadow = true;
    this.scene.add(road);

    // 2. Beveled Sidewalk Curbs (Left & Right)
    const curbWidth = 0.26;
    const curbGeo = new THREE.BoxGeometry(curbWidth, 0.32, adjustedLen);
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.5, metalness: 0.3 });

    const leftCurb = new THREE.Mesh(curbGeo, curbMat);
    leftCurb.position.copy(mid);
    leftCurb.position.y = curbY;
    leftCurb.lookAt(lookTarget);
    leftCurb.translateX(-roadWidth / 2);
    leftCurb.castShadow = true;
    this.scene.add(leftCurb);

    const rightCurb = new THREE.Mesh(curbGeo, curbMat);
    rightCurb.position.copy(mid);
    rightCurb.position.y = curbY;
    rightCurb.lookAt(lookTarget);
    rightCurb.translateX(roadWidth / 2);
    rightCurb.castShadow = true;
    this.scene.add(rightCurb);

    // 3. Crisp White Edge Markings
    const edgeGeo = new THREE.BoxGeometry(0.12, 0.24, adjustedLen);
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });

    const leftEdge = new THREE.Mesh(edgeGeo, edgeMat);
    leftEdge.position.copy(mid);
    leftEdge.position.y = lineY;
    leftEdge.lookAt(lookTarget);
    leftEdge.translateX(-roadWidth / 2 + 0.34);
    this.scene.add(leftEdge);

    const rightEdge = new THREE.Mesh(edgeGeo, edgeMat);
    rightEdge.position.copy(mid);
    rightEdge.position.y = lineY;
    rightEdge.lookAt(lookTarget);
    rightEdge.translateX(roadWidth / 2 - 0.34);
    this.scene.add(rightEdge);

    // 4. Yellow Dashed Centerline
    const lineGeo = new THREE.BoxGeometry(0.24, 0.24, adjustedLen * 0.72);
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 });
    const line = new THREE.Mesh(lineGeo, lineMat);
    line.position.copy(mid);
    line.position.y = lineY;
    line.lookAt(lookTarget);
    this.scene.add(line);
  }

  // ── Tile Pedestals ────────────────────────────────────────────
  createTilePedestal(pos, node) {
    const group = new THREE.Group();
    group.position.copy(pos);

    const isStopTile = node.isStop;
    const isFinish = node.type === 'finish';
    const radius = isStopTile ? 2.1 : (isFinish ? 2.5 : 1.65);

    const discGeo = new THREE.CylinderGeometry(radius, radius + 0.25, isStopTile ? 0.9 : 0.55, 24);
    const colorHex = parseInt((node.color || '#3b82f6').replace('#', '0x'), 16);
    const discMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.25,
      metalness: 0.65
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.position.y = 0.28;
    disc.castShadow = true;
    disc.receiveShadow = true;
    group.add(disc);

    // Outer Glowing Ring for STOP & Finish
    if (isStopTile) {
      const stopRingGeo = new THREE.TorusGeometry(radius + 0.35, 0.22, 12, 32);
      const stopRingMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const stopRing = new THREE.Mesh(stopRingGeo, stopRingMat);
      stopRing.rotation.x = Math.PI / 2;
      stopRing.position.y = 1.0;
      group.add(stopRing);
    }

    // Inner Chrome Bezel
    const ringGeo = new THREE.TorusGeometry(radius + 0.12, 0.12, 12, 24);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.9, roughness: 0.1 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.58;
    group.add(ring);

    // High-DPI Sprite for Tile Title & Icon
    const sprite = this.createTileSprite(node.icon || '📍', node.title, isStopTile, node.type);
    sprite.position.set(0, isStopTile ? 3.0 : 2.4, 0);
    group.add(sprite);

    this.scene.add(group);
    this.tileMeshes.push(group);
  }

  drawRoundedRect(ctx, x, y, width, height, radius) {
    if (ctx.roundRect) {
      ctx.roundRect(x, y, width, height, radius);
    } else {
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
    }
  }

  createTileSprite(icon, title, isStop, type) {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');

    // Background Badge with vibrant 3D gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 300);
    if (isStop) {
      bgGrad.addColorStop(0, 'rgba(220, 38, 38, 0.95)');
      bgGrad.addColorStop(1, 'rgba(127, 29, 29, 0.95)');
    } else if (type === 'payday') {
      bgGrad.addColorStop(0, 'rgba(22, 163, 74, 0.95)');
      bgGrad.addColorStop(1, 'rgba(20, 83, 45, 0.95)');
    } else {
      bgGrad.addColorStop(0, 'rgba(30, 41, 59, 0.92)');
      bgGrad.addColorStop(1, 'rgba(15, 23, 42, 0.96)');
    }
    ctx.fillStyle = bgGrad;
    ctx.strokeStyle = isStop ? '#fca5a5' : (type === 'payday' ? '#4ade80' : '#38bdf8');
    ctx.lineWidth = 10;
    ctx.beginPath();
    this.drawRoundedRect(ctx, 16, 16, 568, 268, 40);
    ctx.fill();
    ctx.stroke();

    // Large Crisp Icon
    ctx.font = '86px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, 300, 105);

    // Bold Title
    ctx.fillStyle = '#ffffff';
    ctx.font = `800 ${isStop ? 40 : 36}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif`;
    ctx.fillText(title.substring(0, 14), 300, 195);

    if (isStop) {
      ctx.fillStyle = '#ef4444';
      ctx.font = '800 24px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif';
      ctx.fillText('★ STOP DECISION ★', 300, 246);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(isStop ? 4.8 : 3.8, isStop ? 2.4 : 1.9, 1);
    return sprite;
  }

  // ── 🏎️ Classic "Spiel des Lebens" Convertible Peg-Car ─────────
  create3DCar(player) {
    const carGroup = new THREE.Group();
    const colorHex = parseInt((player.character.color || '#3b82f6').replace('#', '0x'), 16);

    // 1. Sleek Convertible Chassis
    const chassisGeo = new THREE.BoxGeometry(1.7, 0.55, 3.4);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.18,
      metalness: 0.85
    });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.y = 0.55;
    chassis.castShadow = true;
    carGroup.add(chassis);

    // 2. Interior Cockpit Tub
    const tubGeo = new THREE.BoxGeometry(1.3, 0.35, 2.0);
    const tubMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const tub = new THREE.Mesh(tubGeo, tubMat);
    tub.position.set(0, 0.7, -0.1);
    carGroup.add(tub);

    // 3. Transparent Windshield
    const shieldGeo = new THREE.BoxGeometry(1.35, 0.45, 0.08);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      roughness: 0.05,
      metalness: 0.9,
      transparent: true,
      opacity: 0.65
    });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.position.set(0, 1.05, -0.9);
    shield.rotation.x = -Math.PI / 7;
    carGroup.add(shield);

    // 4. Wheels with Silver Rims
    const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.26, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
    const wheelPositions = [
      [-0.92, 0.34, 0.95],
      [0.92, 0.34, 0.95],
      [-0.92, 0.34, -0.95],
      [0.92, 0.34, -0.95]
    ];
    carGroup.wheels = [];
    wheelPositions.forEach(wp => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(...wp);

      const tire = new THREE.Mesh(wheelGeo, wheelMat);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      wheelGroup.add(tire);

      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.28, 12), rimMat);
      rim.rotation.z = Math.PI / 2;
      wheelGroup.add(rim);

      carGroup.add(wheelGroup);
      carGroup.wheels.push(wheelGroup);
    });

    // 5. LED Headlights & Taillights
    const lightGeo = new THREE.BoxGeometry(0.3, 0.15, 0.1);
    const headMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    [-0.55, 0.55].forEach(x => {
      const light = new THREE.Mesh(lightGeo, headMat);
      light.position.set(x, 0.55, -1.72);
      carGroup.add(light);
    });
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    [-0.55, 0.55].forEach(x => {
      const light = new THREE.Mesh(lightGeo, tailMat);
      light.position.set(x, 0.55, 1.72);
      carGroup.add(light);
    });

    // 6. Figure Pegs (Spielfiguren!)
    carGroup.pegsGroup = new THREE.Group();
    carGroup.add(carGroup.pegsGroup);
    this.updateCarPegs(carGroup, player);

    // 7. Player Name Badge
    const nc = document.createElement('canvas');
    nc.width = 256; nc.height = 70;
    const nCtx = nc.getContext('2d');
    nCtx.fillStyle = player.character.color;
    nCtx.beginPath();
    this.drawRoundedRect(nCtx, 10, 8, 236, 54, 18);
    nCtx.fill();
    nCtx.strokeStyle = '#fff';
    nCtx.lineWidth = 3;
    nCtx.stroke();
    nCtx.fillStyle = '#fff';
    nCtx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif';
    nCtx.textAlign = 'center';
    nCtx.fillText(`${player.character.icon} ${player.name}`, 128, 44);

    const nameTex = new THREE.CanvasTexture(nc);
    const nameSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: nameTex, depthTest: false }));
    nameSprite.scale.set(3.2, 0.9, 1);
    nameSprite.position.set(0, 2.7, 0);
    carGroup.add(nameSprite);

    this.scene.add(carGroup);
    return carGroup;
  }

  // Helper to create a cute Spiel des Lebens Peg figurine
  createPeg(colorHex, scale = 1.0) {
    const peg = new THREE.Group();
    peg.scale.set(scale, scale, scale);

    // Body
    const bodyGeo = new THREE.CylinderGeometry(0.18, 0.26, 0.7, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.15, metalness: 0.1 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.35;
    body.castShadow = true;
    peg.add(body);

    // Head
    const headGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.15, metalness: 0.1 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 0.85;
    head.castShadow = true;
    peg.add(head);

    return peg;
  }

  updateCarPegs(carGroup, player) {
    if (!carGroup.pegsGroup) return;
    // Clear old pegs
    while (carGroup.pegsGroup.children.length > 0) {
      carGroup.pegsGroup.remove(carGroup.pegsGroup.children[0]);
    }

    const pColor = parseInt((player.character.color || '#3b82f6').replace('#', '0x'), 16);
    // 1. Driver Peg (Front-Left)
    const driverPeg = this.createPeg(pColor, 1.0);
    driverPeg.position.set(-0.32, 0.75, -0.2);
    carGroup.pegsGroup.add(driverPeg);

    // 2. Spouse Peg (Front-Right if married)
    if (player.assets && player.assets.spouse) {
      const spousePeg = this.createPeg(0xf43f5e, 1.0); // Pink/Red for spouse
      spousePeg.position.set(0.32, 0.75, -0.2);
      carGroup.pegsGroup.add(spousePeg);
    }

    // 3. Children Pegs (Back Seats)
    const numKids = (player.assets && player.assets.children) ? Math.min(player.assets.children, 2) : 0;
    if (numKids >= 1) {
      const kid1 = this.createPeg(0x38bdf8, 0.75); // Light blue mini peg
      kid1.position.set(-0.3, 0.75, 0.5);
      carGroup.pegsGroup.add(kid1);
    }
    if (numKids >= 2) {
      const kid2 = this.createPeg(0xfacc15, 0.75); // Yellow mini peg
      kid2.position.set(0.3, 0.75, 0.5);
      carGroup.pegsGroup.add(kid2);
    }
  }

  updatePlayers(players) {
    const playersByNode = {};
    players.forEach(p => {
      const pos = p.position !== undefined ? p.position : 0;
      if (!playersByNode[pos]) playersByNode[pos] = [];
      playersByNode[pos].push(p);
    });

    const nodeOffsets = [
      { x: 0, z: 0 },
      { x: -1.15, z: 0.55 },
      { x: 1.15, z: 0.55 },
      { x: 0, z: -1.15 }
    ];

    players.forEach(player => {
      if (!this.cars[player.socketId]) {
        this.cars[player.socketId] = this.create3DCar(player);
      }
      const car = this.cars[player.socketId];
      this.updateCarPegs(car, player);

      const targetNode = this.node3DPositions.find(n => n.id === player.position) || this.node3DPositions[0];
      if (!car.isMoving && targetNode) {
        const listOnNode = playersByNode[player.position !== undefined ? player.position : 0] || [player];
        const idxOnNode = listOnNode.findIndex(p => p.socketId === player.socketId);
        const offset = listOnNode.length > 1 ? (nodeOffsets[idxOnNode] || { x: 0, z: 0 }) : { x: 0, z: 0 };

        car.position.set(targetNode.pos.x + offset.x, targetNode.pos.y + 0.32, targetNode.pos.z + offset.z);
      }
    });
  }

  // ── 🎬 Animated Car Movement with Cinematic Chase-Cam ──────────
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

      // STOP tile check: if we're not at step 0 and tile is a STOP, halt here!
      if (s > 0 && currentNode.isStop) {
        if (stepCallback) stepCallback(player, currentNodeId, 'stop');
        stepsLeft = 0;
        break;
      }

      // Finish reached
      if (!currentNode.next || currentNode.next.length === 0) {
        if (stepCallback) stepCallback(player, currentNodeId, 'finish');
        this.spawnConfetti(car.position);
        break;
      }

      // Branch: multiple paths ahead
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
          car.isMoving = true;
          currentNodeId = chosenNextId;
          player.position = currentNodeId;
          await this.moveCarTo(car, currentNodeId);

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

      // Move car along path
      await this.moveCarTo(car, nextNodeId);
      currentNodeId = nextNodeId;
      player.position = currentNodeId;

      // Payday while passing over tile
      if (nextNode && nextNode.type === 'payday' && s < steps - 1) {
        if (stepCallback) stepCallback(player, currentNodeId, 'payday');
        await this.delay(380);
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
    const endPos = new THREE.Vector3(targetData.pos.x, targetData.pos.y + 0.32, targetData.pos.z);

    // Calculate heading direction
    const travelDir = new THREE.Vector3().subVectors(endPos, startPos).normalize();
    if (travelDir.lengthSq() > 0.001) {
      this.carHeading.copy(travelDir);
      const lookTarget = endPos.clone();
      lookTarget.y = car.position.y;
      car.lookAt(lookTarget);
    }

    // Dynamic 45° Smooth Isometric Chase Cam behind the car!
    this.targetCameraPos.set(
      endPos.x - this.carHeading.x * 16,
      endPos.y + 12.5,
      endPos.z - this.carHeading.z * 16
    );
    this.targetCameraLookAt.set(
      endPos.x + this.carHeading.x * 6,
      endPos.y + 1.2,
      endPos.z + this.carHeading.z * 6
    );

    const duration = 480;
    const startTime = performance.now();

    await new Promise(resolve => {
      const anim = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        car.position.lerpVectors(startPos, endPos, ease);
        // Playful bounce during driving
        car.position.y = startPos.y + Math.sin(progress * Math.PI) * 0.55;

        // Spin wheels
        if (car.wheels) {
          car.wheels.forEach(w => {
            w.children[0].rotation.x += 0.32;
          });
        }

        // Slight bank into curves
        car.rotation.z = Math.sin(progress * Math.PI * 2) * 0.05;

        if (progress < 1) requestAnimationFrame(anim);
        else resolve();
      };
      requestAnimationFrame(anim);
    });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ── 🎥 Camera System & Views ──────────────────────────────────
  resetCamera() {
    setTimeout(() => {
      this.isTrackingCar = false;
      if (this.cameraMode === 'overview') {
        this.targetCameraPos.set(0, 68, 86);
      } else {
        this.targetCameraPos.set(0, 52, 68);
      }
      this.targetCameraLookAt.set(0, 0, 0);
    }, 1800);
  }

  cameraOverview() {
    this.isTrackingCar = false;
    this.cameraMode = 'overview';
    this.targetCameraPos.set(0, 68, 86);
    this.targetCameraLookAt.set(0, 0, 0);
  }

  setCameraMode(mode) {
    this.cameraMode = mode;
    if (mode === 'overview') {
      this.cameraOverview();
    } else {
      this.isTrackingCar = false;
      this.targetCameraPos.set(0, 52, 68);
      this.targetCameraLookAt.set(0, 0, 0);
    }
  }

  toggleCameraMode() {
    this.cameraMode = (this.cameraMode === 'overview') ? 'chase' : 'overview';
    this.setCameraMode(this.cameraMode);
    return this.cameraMode;
  }

  cameraFollowCar(car) {
    this.isTrackingCar = true;
    this.trackedCar = car;
  }

  cameraFocusNode(nodeId) {
    const nodeData = this.node3DPositions.find(n => n.id === nodeId);
    if (!nodeData) return;
    this.isTrackingCar = false;
    this.targetCameraPos.set(nodeData.pos.x, nodeData.pos.y + 20, nodeData.pos.z + 26);
    this.targetCameraLookAt.copy(nodeData.pos);
  }

  // ── 🎊 Celebration Confetti ───────────────────────────────────
  spawnConfetti(position) {
    const colors = [0xf59e0b, 0xec4899, 0x22c55e, 0x3b82f6, 0xa855f7, 0xef4444, 0x06b6d4];
    for (let i = 0; i < 90; i++) {
      const geo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
      const mat = new THREE.MeshBasicMaterial({ color: colors[Math.floor(Math.random() * colors.length)] });
      const piece = new THREE.Mesh(geo, mat);
      piece.position.set(
        position.x + (Math.random() - 0.5) * 5,
        position.y + Math.random() * 7 + 1,
        position.z + (Math.random() - 0.5) * 5
      );
      piece.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.12,
        Math.random() * 0.18 + 0.08,
        (Math.random() - 0.5) * 0.12
      );
      piece.userData.isConfetti = true;
      this.scene.add(piece);

      setTimeout(() => this.scene.remove(piece), 3200);
    }
  }

  // ── 🔄 Render Loop ────────────────────────────────────────────
  animate() {
    requestAnimationFrame(() => this.animate());

    // Continuous dynamic camera lerp
    if (this.isTrackingCar && this.trackedCar) {
      const p = this.trackedCar.position;
      this.targetCameraPos.set(
        p.x - this.carHeading.x * 15,
        p.y + 9.5,
        p.z - this.carHeading.z * 15
      );
      this.targetCameraLookAt.set(
        p.x + this.carHeading.x * 5,
        p.y + 1.2,
        p.z + this.carHeading.z * 5
      );
    }

    this.camera.position.lerp(this.targetCameraPos, 0.045);
    this.currentCameraLookAt.lerp(this.targetCameraLookAt, 0.055);
    this.camera.lookAt(this.currentCameraLookAt);

    // Subtle water shimmer
    if (this.waterMesh) {
      this.waterMesh.rotation.z += 0.0003;
    }

    // Animated objects (e.g. rotating Bitcoin coin, bobbing yacht, swaying palms)
    const time = performance.now() * 0.001;
    this.animatedObjects.forEach(item => {
      if (item.type === 'rotateY') {
        item.obj.rotation.y += item.speed;
      } else if (item.type === 'bob') {
        item.obj.position.y = item.baseY + Math.sin(time * item.speed) * item.amp;
      } else if (item.type === 'bobRotX') {
        item.obj.position.y = item.baseY + Math.sin(time * item.speed) * item.amp;
        item.obj.rotation.x = item.baseRotX + Math.cos(time * item.speed * 0.8) * (item.amp * 0.1);
      } else if (item.type === 'sway') {
        item.obj.rotation.z = item.baseRotZ + Math.sin(time * item.speed) * item.amp;
      } else if (item.type === 'swayXY') {
        item.obj.rotation.x = item.baseRotX + Math.sin(time * item.speed) * item.amp;
        item.obj.rotation.z = item.baseRotZ + Math.cos(time * item.speed * 1.1) * item.amp;
      }
    });

    // Update confetti particles
    this.scene.children.forEach(obj => {
      if (obj.userData && obj.userData.isConfetti && obj.velocity) {
        obj.position.add(obj.velocity);
        obj.velocity.y -= 0.005;
        obj.rotation.x += 0.06;
        obj.rotation.z += 0.04;
      }
    });

    if (this.controls && !this.isTrackingCar) {
      this.controls.target.lerp(this.currentCameraLookAt, 0.05);
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
