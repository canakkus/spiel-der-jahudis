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
    this.targetCameraPos = new THREE.Vector3(0, 165, 80);
    this.targetCameraLookAt = new THREE.Vector3(0, 0, 8);
    this.currentCameraLookAt = new THREE.Vector3(0, 0, 8);
    this.cameraMode = 'overview';
    this.isTrackingCar = false;
    this.trackedCar = null;
    this.carHeading = new THREE.Vector3(0, 0, -1);
    this.waterMesh = null;
    this.animatedObjects = [];
    this.models = {};

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
    this.scene.fog = new THREE.FogExp2('#0a1128', 0.0016);

    this.camera = new THREE.PerspectiveCamera(46, width / height, 1.0, 1000);
    this.camera.position.set(0, 165, 80);
    this.camera.lookAt(0, 0, 8);

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
      this.controls.minDistance = 20;
      this.controls.maxDistance = 350;
      this.controls.enableZoom = true;
      this.controls.zoomSpeed = 1.2;

      // Manual override: user scroll/drag temporarily disables car tracking
      this._userOverride = false;
      this._overrideTimeout = null;
      const releaseOverride = () => {
        this._userOverride = true;
        if (this._overrideTimeout) clearTimeout(this._overrideTimeout);
        // Auto-resume tracking after 4 seconds of no input
        this._overrideTimeout = setTimeout(() => {
          this._userOverride = false;
        }, 4000);
      };
      this.renderer.domElement.addEventListener('wheel', releaseOverride, { passive: true });
      this.renderer.domElement.addEventListener('pointerdown', releaseOverride);
    }

    this.setupLighting();
    this.load3DAssets();
    this.buildThemedWorld();
    this.buildRoadNetwork();

    window.addEventListener('resize', () => this.onResize());
    this.animate();
  }

  // ── High-Definition Lighting Setup ────────────────────────────
  setupLighting() {
    // Warm hemisphere ambient light (sky blue + rich warm lawn bounce)
    const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x166534, 0.85);
    this.scene.add(hemiLight);

    // Warm main sun light with soft shadows (scaled for huge continent)
    const sun = new THREE.DirectionalLight(0xfffaed, 1.55);
    sun.position.set(85, 180, 95);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 420;
    sun.shadow.camera.left = -170;
    sun.shadow.camera.right = 170;
    sun.shadow.camera.top = 170;
    sun.shadow.camera.bottom = -170;
    sun.shadow.bias = 0.0001; // Positive bias completely eliminates self-shadow acne moiré
    sun.shadow.normalBias = 0.05;
    this.scene.add(sun);

    // Cyan rim light from ocean
    const cyanRim = new THREE.DirectionalLight(0x38bdf8, 0.55);
    cyanRim.position.set(-110, 75, -95);
    this.scene.add(cyanRim);

    // Warm golden accent light for Casino & City areas
    const warmRim = new THREE.DirectionalLight(0xfbbf24, 0.45);
    warmRim.position.set(40, 35, 60);
    this.scene.add(warmRim);
  }

  // ── 🎨 High-Res Procedural Terrain Canvas (2048x2048) ──────────
  createContinentTexture() {
    const size = 2048;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const cx = size / 2;
    const cy = size / 2;
    const R = size / 2 - 12;

    // 1. Base vibrant meadow lawn gradient
    const baseGrad = ctx.createRadialGradient(cx, cy, 50, cx, cy, R);
    baseGrad.addColorStop(0, '#22c55e');
    baseGrad.addColorStop(0.35, '#16a34a');
    baseGrad.addColorStop(0.75, '#15803d');
    baseGrad.addColorStop(0.94, '#166534');
    baseGrad.addColorStop(0.985, '#eab308'); // Golden shoreline transition
    baseGrad.addColorStop(1.0, '#ca8a04');
    ctx.fillStyle = baseGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();

    // 2. Concentric lawn mowed turf stripes (golf-course aesthetic)
    for (let r = 90; r < R - 40; r += 26) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.lineWidth = 13;
      ctx.strokeStyle = (Math.floor(r / 26) % 2 === 0) ? 'rgba(255, 255, 255, 0.045)' : 'rgba(0, 0, 0, 0.035)';
      ctx.stroke();
    }

    const toCanvas = (wx, wz) => ({
      px: cx + (wx / 158) * (R * 0.98),
      py: cy + (wz / 158) * (R * 0.98)
    });

    // 3. Biome District Underlays
    // Campus (North-West: -48, -48)
    const cCampus = toCanvas(-48, -48);
    const campusGrad = ctx.createRadialGradient(cCampus.px, cCampus.py, 10, cCampus.px, cCampus.py, 220);
    campusGrad.addColorStop(0, 'rgba(74, 222, 128, 0.5)');
    campusGrad.addColorStop(0.7, 'rgba(34, 197, 94, 0.25)');
    campusGrad.addColorStop(1, 'rgba(34, 197, 94, 0)');
    ctx.fillStyle = campusGrad;
    ctx.beginPath();
    ctx.arc(cCampus.px, cCampus.py, 220, 0, Math.PI * 2);
    ctx.fill();

    // Downtown Metropolis (North-East: 58, -38)
    const cCity = toCanvas(58, -38);
    const cityGrad = ctx.createRadialGradient(cCity.px, cCity.py, 20, cCity.px, cCity.py, 270);
    cityGrad.addColorStop(0, 'rgba(15, 23, 42, 0.85)');
    cityGrad.addColorStop(0.7, 'rgba(30, 41, 59, 0.6)');
    cityGrad.addColorStop(1, 'rgba(30, 41, 59, 0)');
    ctx.fillStyle = cityGrad;
    ctx.beginPath();
    ctx.arc(cCity.px, cCity.py, 270, 0, Math.PI * 2);
    ctx.fill();

    // Subtle cyan cyber grid over Downtown
    ctx.save();
    ctx.beginPath();
    ctx.arc(cCity.px, cCity.py, 230, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
    ctx.lineWidth = 2;
    for (let gx = cCity.px - 230; gx <= cCity.px + 230; gx += 26) {
      ctx.beginPath(); ctx.moveTo(gx, cCity.py - 230); ctx.lineTo(gx, cCity.py + 230); ctx.stroke();
    }
    for (let gy = cCity.py - 230; gy <= cCity.py + 230; gy += 26) {
      ctx.beginPath(); ctx.moveTo(cCity.px - 230, gy); ctx.lineTo(cCity.px + 230, gy); ctx.stroke();
    }
    ctx.restore();

    // Suburbia & Family (East: 58, 38)
    const cSub = toCanvas(58, 38);
    const subGrad = ctx.createRadialGradient(cSub.px, cSub.py, 20, cSub.px, cSub.py, 250);
    subGrad.addColorStop(0, 'rgba(34, 197, 94, 0.6)');
    subGrad.addColorStop(0.65, 'rgba(22, 163, 74, 0.35)');
    subGrad.addColorStop(1, 'rgba(22, 163, 74, 0)');
    ctx.fillStyle = subGrad;
    ctx.beginPath();
    ctx.arc(cSub.px, cSub.py, 250, 0, Math.PI * 2);
    ctx.fill();

    // Casino Dunes (South-West: -52, 36)
    const cCas = toCanvas(-52, 36);
    const casGrad = ctx.createRadialGradient(cCas.px, cCas.py, 20, cCas.px, cCas.py, 240);
    casGrad.addColorStop(0, 'rgba(234, 179, 8, 0.75)');
    casGrad.addColorStop(0.65, 'rgba(202, 138, 4, 0.45)');
    casGrad.addColorStop(1, 'rgba(202, 138, 4, 0)');
    ctx.fillStyle = casGrad;
    ctx.beginPath();
    ctx.arc(cCas.px, cCas.py, 240, 0, Math.PI * 2);
    ctx.fill();

    // Retirement Beach (South: 0, 72)
    const cBeach = toCanvas(0, 72);
    const beachGrad = ctx.createRadialGradient(cBeach.px, cBeach.py, 10, cBeach.px, cBeach.py, 210);
    beachGrad.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
    beachGrad.addColorStop(0.65, 'rgba(253, 224, 71, 0.5)');
    beachGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
    ctx.fillStyle = beachGrad;
    ctx.beginPath();
    ctx.arc(cBeach.px, cBeach.py, 210, 0, Math.PI * 2);
    ctx.fill();

    // 4. Center Grand Plaza Ring (Concentric Marble & Gold surrounding Wheel)
    const cWheel = toCanvas(0, 0);
    const wheelPlazaR = (19 / 158) * (R * 0.98);
    const wheelGrad = ctx.createRadialGradient(cWheel.px, cWheel.py, 10, cWheel.px, cWheel.py, wheelPlazaR * 1.6);
    wheelGrad.addColorStop(0, '#fef08a');
    wheelGrad.addColorStop(0.35, '#f59e0b');
    wheelGrad.addColorStop(0.7, '#d97706');
    wheelGrad.addColorStop(1, 'rgba(217, 119, 6, 0)');
    ctx.fillStyle = wheelGrad;
    ctx.beginPath();
    ctx.arc(cWheel.px, cWheel.py, wheelPlazaR * 1.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(cWheel.px, cWheel.py, wheelPlazaR * 1.1, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(254, 240, 138, 0.5)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cWheel.px, cWheel.py, wheelPlazaR * 1.35, 0, Math.PI * 2);
    ctx.stroke();

    // 5. Golden Sandy Shoreline / Coastal Rim
    ctx.beginPath();
    ctx.arc(cx, cy, R - 14, 0, Math.PI * 2);
    ctx.lineWidth = 28;
    ctx.strokeStyle = '#fef08a';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, R - 2, 0, Math.PI * 2);
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#eab308';
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 8;
    return tex;
  }

  // ── Build 5 Thematic Biomes (Spiel des Lebens World) ───────────
  buildThemedWorld() {
    // 1. Turquoise Ocean (Expanded)
    const waterGeo = new THREE.PlaneGeometry(1200, 1200, 32, 32);
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

    // 2. Main Land Platform (Warm Sandstone Beveled Continent Cliff - Open-ended so top face never Z-fights!)
    const continentGeo = new THREE.CylinderGeometry(158, 172, 4.0, 64, 1, true);
    const cliffMat = new THREE.MeshStandardMaterial({
      color: 0xc4a47c, // Warm golden-sandstone / coastal cliff rock
      roughness: 0.88,
      metalness: 0.08,
      side: THREE.DoubleSide
    });
    const continent = new THREE.Mesh(continentGeo, cliffMat);
    continent.position.y = 0;
    continent.receiveShadow = true;
    continent.castShadow = true;
    this.scene.add(continent);

    // 3. Lush Stylized Top Grass Terrain Disc (The single authoritative top surface)
    const topTerrainGeo = new THREE.CircleGeometry(158, 64);
    const terrainTex = this.createContinentTexture();
    const terrainMat = new THREE.MeshStandardMaterial({
      map: terrainTex,
      roughness: 0.75,
      metalness: 0.1
    });
    const topTerrain = new THREE.Mesh(topTerrainGeo, terrainMat);
    topTerrain.rotation.x = -Math.PI / 2;
    topTerrain.position.y = 2.0;
    topTerrain.receiveShadow = true;
    this.scene.add(topTerrain);

    // ── Biome 1: Campus & Uni (North-West) ──────────────────────
    this.buildCampusBiome(-48, 0, -48);

    // ── Biome 2: Downtown Metropolis (North-East) ───────────────
    this.buildDowntownBiome(58, 0, -38);

    // ── Biome 3: Suburbia & Family (East) ───────────────────────
    this.buildSuburbiaBiome(58, 0, 38);

    // ── Biome 4: Casino & Crypto Dunes (South-West) ─────────────
    this.buildCasinoBiome(-52, 0, 36);

    // ── Biome 5: Retirement Beach Paradise (South) ──────────────
    this.buildBeachBiome(0, 0, 72);

    // ── 🌍 World Landmarks & Forests ────────────────────────────
    this.buildWorldLandmarks();

    // ── 🎡 Iconic 3D Spinner Wheel (Centerpiece - Free & Open) ──
    this.build3DSpinnerWheel(0, 2.0, 0);
  }

  // ── 🎓 BIOME 1: Campus & Uni ──────────────────────────────────
  buildCampusBiome(cx, cy, cz) {
    // Main Academic Lecture Hall
    const hallGroup = new THREE.Group();
    hallGroup.position.set(cx - 6, 2.0, cz - 8);

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
    libGroup.position.set(cx + 10, 2.0, cz - 4);
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

    // Campus Athletic Soccer / Sports Field
    const fieldGeo = new THREE.BoxGeometry(20, 0.2, 13);
    const fieldMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85 });
    const field = new THREE.Mesh(fieldGeo, fieldMat);
    field.position.set(cx - 26, 2.02, cz - 14);
    field.receiveShadow = true;
    this.scene.add(field);

    // White goal boxes
    const goalGeo = new THREE.BoxGeometry(0.4, 1.6, 4);
    const goalMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const goal1 = new THREE.Mesh(goalGeo, goalMat);
    goal1.position.set(cx - 35, 2.8, cz - 14);
    this.scene.add(goal1);
    const goal2 = new THREE.Mesh(goalGeo, goalMat);
    goal2.position.set(cx - 17, 2.8, cz - 14);
    this.scene.add(goal2);

    // Additional Campus Dormitories & GLB Academic Buildings
    this.spawnGLBModel('bldg_a', cx - 22, 2.0, cz - 26, 3.8, 0.4);
    this.spawnGLBModel('bldg_c', cx - 34, 2.0, cz + 2, 3.6, -0.6);
    this.spawnGLBModel('bldg_b', cx - 12, 2.0, cz - 28, 3.5, 0.2);

    // Campus Trees & Real 3D GLB Vegetation
    const trees = [
      [cx - 15, cz + 6], [cx - 8, cz + 10], [cx + 4, cz + 8],
      [cx + 14, cz + 6], [cx - 18, cz - 4], [cx + 12, cz - 12]
    ];
    trees.forEach(p => this.createCampusTree(p[0], 2.0, p[1]));

    this.spawnGLBModel('tree_1', cx - 18, 2.0, cz - 14, 0.95);
    this.spawnGLBModel('tree_pine', cx + 16, 2.0, cz - 14, 1.1);
    this.spawnGLBModel('tree_1', cx - 16, 2.0, cz + 12, 1.0);
    this.spawnGLBModel('tree_pine', cx - 28, 2.0, cz + 14, 1.2);
    this.spawnGLBModel('tree_1', cx - 38, 2.0, cz - 4, 1.05);
  }

  // ── 🏙️ BIOME 2: Downtown Metropolis ──────────────────────────
  buildDowntownBiome(cx, cy, cz) {
    // Real 3D GLB City Office Buildings (cleanly clustered in the downtown district, away from track)
    this.spawnGLBModel('bldg_a', cx - 12, 2.0, cz - 14, 4.0, 0.3);
    this.spawnGLBModel('bldg_b', cx + 6, 2.0, cz - 16, 3.6, -0.4);
    this.spawnGLBModel('bldg_c', cx - 10, 2.0, cz + 12, 4.2, 0.8);
    this.spawnGLBModel('bldg_d', cx + 8, 2.0, cz + 10, 3.8, -0.6);
    this.spawnGLBModel('bldg_a', cx + 12, 2.0, cz - 22, 4.0, 0.5);
    this.spawnGLBModel('bldg_b', cx + 18, 2.0, cz - 4, 3.6, -0.7);
    this.spawnGLBModel('bldg_c', cx + 12, 2.0, cz + 18, 4.2, 0.2);
    this.spawnGLBModel('bldg_d', cx - 4, 2.0, cz - 22, 3.8, 1.1);

    // Helipad atop Downtown Plaza
    const helipad = new THREE.Mesh(
      new THREE.CylinderGeometry(3.5, 3.5, 0.4, 24),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 })
    );
    helipad.position.set(cx + 6, 2.2, cz - 16);
    this.scene.add(helipad);
    const heliH = new THREE.Mesh(
      new THREE.RingGeometry(1.2, 1.8, 24),
      new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
    );
    heliH.rotation.x = -Math.PI / 2;
    heliH.position.set(cx + 6, 2.45, cz - 16);
    this.scene.add(heliH);

    // Street lamps
    const lamps = [
      [cx - 2, cz - 4], [cx + 2, cz + 2], [cx + 12, cz - 2], [cx - 10, cz - 4]
    ];
    lamps.forEach(p => this.createStreetLamp(p[0], 2.0, p[1]));

    // Flying Cars / Drones circling above the buildings
    const droneColors = [0xef4444, 0x38bdf8, 0xfacc15];
    for (let i = 0; i < 3; i++) {
      const droneGroup = new THREE.Group();
      droneGroup.position.set(cx + (Math.random() * 16 - 8), 12 + Math.random() * 6, cz + (Math.random() * 16 - 8));
      
      const droneGeo = new THREE.BoxGeometry(1.2, 0.4, 0.6);
      const droneMat = new THREE.MeshStandardMaterial({ color: droneColors[i], metalness: 0.9, roughness: 0.1 });
      const drone = new THREE.Mesh(droneGeo, droneMat);
      droneGroup.add(drone);
      
      this.scene.add(droneGroup);
      
      this.animatedObjects.push({
        obj: droneGroup,
        type: 'bob',
        speed: 2 + Math.random(),
        amp: 1.2,
        baseY: droneGroup.position.y
      });
      this.animatedObjects.push({
        obj: droneGroup,
        type: 'rotateY',
        speed: 0.01 + Math.random() * 0.015
      });
    }
  }

  // ── 🏡 BIOME 3: Suburbia & Family ─────────────────────────────
  buildSuburbiaBiome(cx, cy, cz) {
    // Cozy Family Villas (Procedural)
    this.createSuburbanHouse(cx - 8, 2.0, cz - 8, 0xfbbf24, 0xe11d48); // Yellow villa, red roof
    this.createSuburbanHouse(cx + 8, 2.0, cz - 4, 0xffffff, 0x2563eb); // White villa, blue roof
    this.createSuburbanHouse(cx - 4, 2.0, cz + 10, 0xf3f4f6, 0xd97706); // Modern grey villa
    this.createSuburbanHouse(cx + 10, 2.0, cz + 8, 0xfce7f3, 0x9333ea); // Pink villa

    // Real 3D GLB Suburban Villas
    this.spawnGLBModel('house_a', cx - 14, 2.0, cz - 14, 2.2, 0.3);
    this.spawnGLBModel('house_b', cx + 14, 2.0, cz - 10, 2.2, -0.2);
    this.spawnGLBModel('house_a', cx - 12, 2.0, cz + 16, 2.0, 1.1);
    this.spawnGLBModel('house_b', cx + 14, 2.0, cz + 14, 2.0, -0.8);

    // Additional Suburban Villas expanding the neighborhood
    this.spawnGLBModel('house_a', cx + 20, 2.0, cz - 14, 2.2, 0.4);
    this.spawnGLBModel('house_b', cx + 26, 2.0, cz + 4, 2.2, -0.5);
    this.spawnGLBModel('house_a', cx + 32, 2.0, cz + 2, 2.3, 0.8);
    this.spawnGLBModel('house_b', cx + 18, 2.0, cz + 22, 2.1, -0.9);
    this.spawnGLBModel('house_a', cx + 26, 2.0, cz - 22, 2.2, 0.1);
    this.spawnGLBModel('house_b', cx + 36, 2.0, cz - 12, 2.3, -0.3);

    // Suburban Swimming Pools
    const poolGeo = new THREE.BoxGeometry(6.5, 0.3, 4.2);
    const poolMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.15, metalness: 0.65 });
    const pool1 = new THREE.Mesh(poolGeo, poolMat);
    pool1.position.set(cx + 22, 2.05, cz - 2);
    this.scene.add(pool1);

    const pool2 = new THREE.Mesh(poolGeo, poolMat);
    pool2.position.set(cx + 28, 2.05, cz + 16);
    this.scene.add(pool2);

    this.spawnGLBModel('tree_1', cx - 8, 2.0, cz + 6, 0.85);
    this.spawnGLBModel('tree_pine', cx + 8, 2.0, cz + 4, 0.95);
    this.spawnGLBModel('tree_1', cx + 34, 2.0, cz + 14, 0.9);
    this.spawnGLBModel('tree_pine', cx + 30, 2.0, cz - 18, 1.0);

    // Flowering Garden Trees & Shrubs
    const gardenTrees = [
      [cx - 14, cz - 4], [cx + 14, cz - 12], [cx - 12, cz + 6],
      [cx + 15, cz + 3], [cx + 3, cz - 12], [cx + 24, cz + 10]
    ];
    gardenTrees.forEach(p => this.createCampusTree(p[0], 2.0, p[1], 0xf472b6)); // Cherry blossom pink
  }

  // ── 🎰 BIOME 4: Casino & Crypto Dunes ─────────────────────────
  buildCasinoBiome(cx, cy, cz) {
    // Luxor-Style Golden Pyramid Casino
    const pyramidGeo = new THREE.ConeGeometry(13, 14, 4);
    const pyramidMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.85,
      roughness: 0.15
    });
    const pyramid = new THREE.Mesh(pyramidGeo, pyramidMat);
    pyramid.position.set(cx - 6, 9.0, cz - 4);
    pyramid.rotation.y = Math.PI / 4;
    pyramid.castShadow = true;
    this.scene.add(pyramid);

    // Apex laser light beam atop Pyramid
    const beamGeo = new THREE.CylinderGeometry(0.3, 0.8, 30, 16);
    beamGeo.translate(0, 15, 0);
    const beamMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65 });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(cx - 6, 14.5, cz - 4);
    beam.rotation.z = 0.15;
    this.scene.add(beam);
    this.animatedObjects.push({ obj: beam, type: 'rotateY', speed: -0.015 });

    // Luxury Casino Resort Wings using stylish GLB buildings (safe positions away from track)
    this.spawnGLBModel('bldg_c', cx - 16, 2.0, cz - 16, 3.8, 0.4);
    this.spawnGLBModel('bldg_d', cx + 10, 2.0, cz + 16, 3.6, -0.6);

    // Casino Fountain Pool
    const fountainPool = new THREE.Mesh(
      new THREE.CylinderGeometry(4.5, 4.5, 0.4, 24),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.8 })
    );
    fountainPool.position.set(cx - 6, 2.1, cz + 10);
    this.scene.add(fountainPool);

    // Giant Rotating 3D Bitcoin Sculpture
    const btcGroup = new THREE.Group();
    btcGroup.position.set(cx + 8, 5.5, cz + 6);
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
    this.createNeonPalm(cx - 14, 2.0, cz + 8, 0x06b6d4);
    this.createNeonPalm(cx + 6, 2.0, cz - 12, 0xec4899);
    this.createNeonPalm(cx - 4, 2.0, cz + 14, 0xa855f7);
    this.createNeonPalm(cx - 18, 2.0, cz - 18, 0x06b6d4);
    this.createNeonPalm(cx + 12, 2.0, cz - 4, 0xf59e0b);
  }

  // ── 🏝️ BIOME 5: Retirement Paradise Beach ──────────────────────
  buildBeachBiome(cx, cy, cz) {
    // Tropical Curved Palm Trees
    const palms = [
      [cx - 16, cz + 4], [cx - 8, cz + 12], [cx + 12, cz + 8],
      [cx + 18, cz - 2], [cx - 2, cz + 16]
    ];
    palms.forEach(p => this.createTropicalPalm(p[0], 2.0, p[1]));

    // Luxury Super-Yacht in the bay
    this.createSuperYacht(cx - 28, 0, cz + 24, 0.75);

    // Grand Golden Finish Arch at node 76
    const archGroup = new THREE.Group();
    archGroup.position.set(cx + 20, 2.0, cz - 2);

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

  // ── 🌍 World Landmarks, Coastal Beacons & Dense Forests ────────
  buildWorldLandmarks() {
    // 1. Coastal Lighthouse on rocky bluff (North-West coast)
    const lhGroup = new THREE.Group();
    lhGroup.position.set(-115, 2.0, 68);
    const lhBase = new THREE.Mesh(
      new THREE.CylinderGeometry(4.5, 6, 4, 16),
      new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 })
    );
    lhBase.position.y = 2;
    lhGroup.add(lhBase);

    const lhTower = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 3.8, 18, 16),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3 })
    );
    lhTower.position.y = 13;
    lhTower.castShadow = true;
    lhGroup.add(lhTower);

    // Red stripes
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
    const stripe1 = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.5, 3.2, 16), stripeMat);
    stripe1.position.y = 9;
    lhGroup.add(stripe1);
    const stripe2 = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.7, 3.2, 16), stripeMat);
    stripe2.position.y = 16;
    lhGroup.add(stripe2);

    // Lantern Room & Rotating Searchlight Beam
    const lantern = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.2, 3.5, 16),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xfacc15, emissiveIntensity: 0.6 })
    );
    lantern.position.y = 23.5;
    lhGroup.add(lantern);

    const beamCone = new THREE.Mesh(
      new THREE.ConeGeometry(8, 45, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.25, side: THREE.DoubleSide })
    );
    beamCone.rotation.x = Math.PI / 2;
    beamCone.position.set(0, 23.5, 22);
    lhGroup.add(beamCone);
    this.animatedObjects.push({ obj: beamCone, type: 'rotateY', speed: 0.02 });

    this.scene.add(lhGroup);

    // 2. Dense Pine & Deciduous Forests across open spaces
    const forestSpots = [
      // Northern woods
      [-20, -78], [0, -82], [22, -80], [-40, -76], [40, -76],
      // Eastern coastal glades
      [115, -20], [120, 5], [115, 30], [110, 55],
      // Western mountains
      [-120, -15], [-115, 10], [-118, 35],
      // South-eastern woodlands
      [75, 75], [90, 65], [60, 80],
      // Central park groves
      [-25, -20], [25, -20], [-25, 20], [25, 20]
    ];
    forestSpots.forEach(([fx, fz], idx) => {
      const key = (idx % 2 === 0) ? 'tree_pine' : 'tree_1';
      const scale = 0.85 + (idx % 5) * 0.12;
      const rot = (idx * 1.3) % (Math.PI * 2);
      this.spawnGLBModel(key, fx, 2.0, fz, scale, rot);
      // Small companion tree
      const compKey = (idx % 2 === 0) ? 'tree_1' : 'tree_pine';
      this.spawnGLBModel(compKey, fx + 3.2, 2.0, fz + 2.8, scale * 0.8, rot + 1.2);
    });

    // 3. Beach Resort Cabanas & Umbrellas
    const beachCabanas = [
      [-18, 86], [18, 86], [-35, 82], [35, 82]
    ];
    beachCabanas.forEach(([bx, bz], i) => {
      const cabana = new THREE.Mesh(
        new THREE.ConeGeometry(2.5, 2.2, 6),
        new THREE.MeshStandardMaterial({ color: (i % 2 === 0 ? 0x0284c7 : 0xf97316), roughness: 0.7 })
      );
      cabana.position.set(bx, 3.1, bz);
      this.scene.add(cabana);
    });
  }

  // ── 🎡 3D Physical Spinner Wheel (Spiel des Lebens Centerpiece) ──
  build3DSpinnerWheel(cx, cy, cz) {
    const group = new THREE.Group();
    group.position.set(cx, cy, cz);

    // 0. Grand Elevated Marble & Gold Plaza Base (Iconic Centerpiece Island)
    const plazaGeo = new THREE.CylinderGeometry(16.5, 18.2, 1.4, 48);
    const plazaMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc, // Pure gleaming Carrara marble
      roughness: 0.15,
      metalness: 0.25
    });
    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.position.y = 0.7;
    plaza.receiveShadow = true;
    group.add(plaza);

    // Plaza Golden Inlay Ring
    const goldInlayGeo = new THREE.TorusGeometry(15.2, 0.35, 16, 48);
    const goldInlayMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.1 });
    const goldInlay = new THREE.Mesh(goldInlayGeo, goldInlayMat);
    goldInlay.rotation.x = Math.PI / 2;
    goldInlay.position.y = 1.42;
    group.add(goldInlay);

    // 4 Grand Decorative Fluted Pillars with glowing crystal orbs at diagonals
    const pillarPositions = [[-12, -12], [12, -12], [-12, 12], [12, 12]];
    pillarPositions.forEach(([px, pz]) => {
      const pColGeo = new THREE.CylinderGeometry(0.7, 0.9, 4.2, 16);
      const pColMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.3, roughness: 0.2 });
      const pCol = new THREE.Mesh(pColGeo, pColMat);
      pCol.position.set(px, 2.1, pz);
      pCol.castShadow = true;
      group.add(pCol);

      const orbGeo = new THREE.SphereGeometry(0.65, 16, 16);
      const orbMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
      const orb = new THREE.Mesh(orbGeo, orbMat);
      orb.position.set(px, 4.5, pz);
      group.add(orb);
    });

    // 1. Molded plastic base (white fluted podium with gold trim)
    const baseGeo = new THREE.CylinderGeometry(8.2, 9.0, 1.8, 32);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.2,
      metalness: 0.15
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 1.4 + 0.9;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Golden rim ring
    const rimGeo = new THREE.TorusGeometry(8.4, 0.4, 16, 32);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.92, roughness: 0.15 });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 1.4 + 1.8;
    group.add(rim);

    // 2. The Rotating Wheel Rotor
    const wheelRotor = new THREE.Group();
    wheelRotor.position.y = 1.4 + 1.85;

    const sectorColorsHex = [
      '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4',
      '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#eab308'
    ];
    const numSectors = 10;
    const arc = (Math.PI * 2) / numSectors;

    // High-Definition 2048x2048 Numbered Dial Texture
    const dialCanvas = document.createElement('canvas');
    dialCanvas.width = 2048;
    dialCanvas.height = 2048;
    const ctx = dialCanvas.getContext('2d');
    const cxD = 1024, cyD = 1024, rOut = 990, rIn = 300;

    for (let i = 0; i < numSectors; i++) {
      const aStart = i * arc;
      const aEnd = (i + 1) * arc;
      const aMid = aStart + arc / 2;

      // Draw sector wedge on dial
      ctx.beginPath();
      ctx.moveTo(cxD, cyD);
      ctx.arc(cxD, cyD, rOut, -aStart, -aEnd, true);
      ctx.closePath();
      ctx.fillStyle = sectorColorsHex[i];
      ctx.fill();

      // Divider line
      ctx.beginPath();
      ctx.moveTo(cxD, cyD);
      ctx.lineTo(cxD + Math.cos(-aStart) * rOut, cyD + Math.sin(-aStart) * rOut);
      ctx.lineWidth = 12;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Outer gold rim arc
      ctx.beginPath();
      ctx.arc(cxD, cyD, rOut, -aStart, -aEnd, true);
      ctx.lineWidth = 20;
      ctx.strokeStyle = '#fef08a';
      ctx.stroke();

      // Bold white number (1 to 10)
      const num = i + 1;
      const numDist = 670;
      const nx = cxD + Math.cos(-aMid) * numDist;
      const ny = cyD + Math.sin(-aMid) * numDist;

      ctx.save();
      ctx.translate(nx, ny);
      ctx.rotate(-aMid - Math.PI / 2);

      ctx.font = '900 170px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Arial Black", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Drop shadow for 3D depth
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillText(`${num}`, 0, 10);

      // Main crisp white text
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${num}`, 0, 0);

      // Contrast outline
      ctx.lineWidth = 6;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.strokeText(`${num}`, 0, 0);

      ctx.restore();
    }

    // Inner chrome border ring
    ctx.beginPath();
    ctx.arc(cxD, cyD, rIn, 0, Math.PI * 2);
    ctx.lineWidth = 24;
    ctx.strokeStyle = '#f59e0b';
    ctx.stroke();

    const dialTex = new THREE.CanvasTexture(dialCanvas);
    dialTex.anisotropy = 8;
    const dialMat = new THREE.MeshStandardMaterial({
      map: dialTex,
      roughness: 0.22,
      metalness: 0.12
    });
    const dialGeo = new THREE.CircleGeometry(6.94, 64);
    const dialMesh = new THREE.Mesh(dialGeo, dialMat);
    dialMesh.rotation.x = -Math.PI / 2;
    dialMesh.position.y = 0.36;
    dialMesh.receiveShadow = true;
    wheelRotor.add(dialMesh);

    // Chrome Peg studs along sector edges
    for (let i = 0; i < numSectors; i++) {
      const pegGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.65, 8);
      const pegMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.9, roughness: 0.1 });
      const peg = new THREE.Mesh(pegGeo, pegMat);
      const pegAngle = i * arc;
      peg.position.set(Math.cos(pegAngle) * 6.45, 0.45, Math.sin(pegAngle) * 6.45);
      peg.castShadow = true;
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
    pointerGroup.position.set(0, 1.4 + 2.15, 7.6);
    const needleGeo = new THREE.ConeGeometry(0.65, 2.2, 4);
    const needleMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.8, roughness: 0.2 });
    const needle = new THREE.Mesh(needleGeo, needleMat);
    needle.rotation.x = Math.PI / 2;
    needle.position.z = -0.9;
    pointerGroup.add(needle);
    group.add(pointerGroup);
    this.boardWheelPointer = pointerGroup;

    this.scene.add(group);
  }

  spinBoardWheel(spinValue, velocity = 1, onComplete) {
    if (!this.boardWheelRotor) {
      if (onComplete) onComplete({ spinValue });
      return;
    }
    const numSectors = 10;
    const twoPi = Math.PI * 2;
    const arc = twoPi / numSectors;
    const sectorIndex = (spinValue - 1 + numSectors) % numSectors;
    const aMid = sectorIndex * arc + arc / 2;

    // Pointer is at (0, y, +Z), which is angle +PI/2 in the X-Z plane.
    // In dialMesh (rotation.x = -PI/2), sector aMid rotates by R in Y,
    // placing its 3D angle at -aMid - R.
    // To align with pointer: -aMid - R = PI/2 => R = 1.5 * PI - aMid.
    const targetRotorAngle = ((1.5 * Math.PI - aMid) % twoPi + twoPi) % twoPi;
    const currentAngle = this.boardWheelRotor.rotation.y;

    let delta = (targetRotorAngle - (currentAngle % twoPi)) % twoPi;
    if (delta <= 0) delta += twoPi;

    const extraSpins = Math.min(6, Math.max(3, Math.round(velocity * 1.3)));
    const totalRotation = extraSpins * twoPi + delta;
    const finalAngle = currentAngle + totalRotation;
    const duration = Math.min(3600, Math.max(2200, 2000 + velocity * 220));
    const startAngle = currentAngle;
    const startTime = performance.now();

    // 🎥 CINEMATIC CAMERA: Smoothly swoop in and frame the 3D in-game wheel
    this._userOverride = false;
    this.isTrackingCar = false;
    this.targetCameraPos.set(0, 26, 30);
    this.targetCameraLookAt.set(0, 3.2, 0);

    let lastTickAngle = startAngle;

    const anim = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Quintic ease-out deceleration
      const ease = 1 - Math.pow(1 - progress, 4);
      const curAngle = startAngle + ease * totalRotation;
      this.boardWheelRotor.rotation.y = curAngle;

      // Needle tick sound & flap when passing peg
      if (Math.abs(curAngle - lastTickAngle) >= arc) {
        lastTickAngle = curAngle;
        if (window.soundEngine) window.soundEngine.play('wheel_tick');
      }

      if (this.boardWheelPointer) {
        const speed = (1 - progress) * 0.35;
        const tickFlex = Math.sin(curAngle * 10) * speed;
        this.boardWheelPointer.rotation.x = (Math.PI / 2) + Math.max(0, tickFlex);
      }

      if (progress < 1) {
        requestAnimationFrame(anim);
      } else {
        this.boardWheelRotor.rotation.y = finalAngle;
        if (this.boardWheelPointer) this.boardWheelPointer.rotation.x = Math.PI / 2;

        // Confetti explosion on landing
        this.spawnConfetti(new THREE.Vector3(0, 5.2, 0));
        if (window.soundEngine) window.soundEngine.play('cheer');

        // Hold focus for 1.1 seconds so players see the winning number
        setTimeout(() => {
          if (onComplete) onComplete({ spinValue });
        }, 1100);
      }
    };
    requestAnimationFrame(anim);
  }



  // ── 📦 GLTF 3D Asset Pipeline & Engine ────────────────────────
  load3DAssets() {
    if (!THREE.GLTFLoader) {
      console.warn('[3D Engine] THREE.GLTFLoader not found, falling back to procedural meshes.');
      return;
    }
    const loader = new THREE.GLTFLoader();
    this.models = {};

    const assets = [
      { key: 'car_sedan', url: '/models/sedan.glb' },
      { key: 'car_sports', url: '/models/sedan-sports.glb' },
      { key: 'car_suv', url: '/models/suv.glb' },
      { key: 'car_van', url: '/models/van.glb' },
      { key: 'car_race', url: '/models/race.glb' },
      { key: 'car_hatch', url: '/models/hatchback-sports.glb' },
      { key: 'bldg_a', url: '/models/building-a.glb' },
      { key: 'bldg_b', url: '/models/building-b.glb' },
      { key: 'bldg_c', url: '/models/building-c.glb' },
      { key: 'bldg_d', url: '/models/building-d.glb' },
      { key: 'house_a', url: '/models/house-a.glb' },
      { key: 'house_b', url: '/models/house-b.glb' },
      { key: 'tree_1', url: '/models/tree-1.glb' },
      { key: 'tree_pine', url: '/models/tree-pine.glb' }
    ];

    assets.forEach(asset => {
      loader.load(
        asset.url,
        (gltf) => {
          gltf.scene.traverse(node => {
            if (node.isMesh) {
              node.castShadow = true;
              node.receiveShadow = true;
            }
          });
          this.models[asset.key] = gltf.scene;

          // If a car model just loaded, upgrade any active player cars seamlessly
          if (asset.key.startsWith('car_')) {
            this.refreshAllCarModels();
          }
        },
        undefined,
        (err) => {
          console.warn(`[3D Engine] Could not load ${asset.url}:`, err);
        }
      );
    });
  }

  attachGLBCarModel(container, player, colorHex) {
    const preferredKey = player.character && player.character.carModel;
    const carKeys = ['car_sports', 'car_suv', 'car_hatch', 'car_race', 'car_sedan', 'car_van'];
    let hash = 0;
    const keyStr = (player.socketId || player.name || '0');
    for (let i = 0; i < keyStr.length; i++) hash += keyStr.charCodeAt(i);
    const chosenKey = (preferredKey && this.models[preferredKey]) ? preferredKey : carKeys[hash % carKeys.length];

    if (!this.models || !this.models[chosenKey]) return false;

    // Clear previous model from container
    while (container.children.length > 0) container.remove(container.children[0]);

    const cloned = this.models[chosenKey].clone(true);
    // Rotate 180° so front (+Z in Kenney models) points -Z (forward direction of travel)
    cloned.rotation.y = Math.PI;
    // Scale 0.95 fits the wider 4.2 board roads
    cloned.scale.set(0.95, 0.95, 0.95);
    cloned.position.y = 0.05;

    // Recolor body parts with player theme color
    cloned.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        const name = (child.name || '').toLowerCase();
        if (name.includes('body') || name === 'sedan' || name === 'suv' || name.includes('paint')) {
          if (child.material) {
            child.material = child.material.clone();
            child.material.color.setHex(colorHex);
            child.material.metalness = 0.65;
            child.material.roughness = 0.25;
          }
        }
      }
    });

    container.add(cloned);
    return true;
  }

  refreshAllCarModels() {
    if (!this.cars) return;
    Object.values(this.cars).forEach(carGroup => {
      if (carGroup && carGroup.bodyContainer && carGroup.userData && carGroup.userData.player) {
        const p = carGroup.userData.player;
        const colorHex = parseInt((p.character.color || '#3b82f6').replace('#', '0x'), 16);
        this.attachGLBCarModel(carGroup.bodyContainer, p, colorHex);
      }
    });
  }

  spawnGLBModel(key, x, y, z, scale = 1.0, rotY = 0) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = rotY;

    const tryApply = () => {
      if (this.models && this.models[key]) {
        const cloned = this.models[key].clone(true);
        cloned.scale.set(scale, scale, scale);
        cloned.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        group.add(cloned);
      } else {
        setTimeout(tryApply, 250);
      }
    };
    tryApply();
    this.scene.add(group);
    return group;
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
      ((x - 50) / 50) * 125, // -125 .. +125 (total 250 units wide)
      2.08,                  // Elevated cleanly above grass terrain (y = 2.0)
      ((y - 50) / 50) * 95   // -95 .. +95   (total 190 units deep)
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
    const margin = 2.9;
    const adjustedLen = Math.max(0.1, len - margin * 2);

    // Strict vertical layering above terrain (terrain is at y = 2.0)
    const roadY = p1.y + 0.04; // 2.12
    const curbY = p1.y + 0.10; // 2.18
    const lineY = p1.y + 0.13; // 2.21

    // 1. Dark Road Asphalt Ribbon
    const roadWidth = 4.2;
    const roadGeo = new THREE.BoxGeometry(roadWidth, 0.16, adjustedLen);
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
    const curbWidth = 0.32;
    const curbGeo = new THREE.BoxGeometry(curbWidth, 0.24, adjustedLen);
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
    const edgeGeo = new THREE.BoxGeometry(0.16, 0.18, adjustedLen);
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });

    const leftEdge = new THREE.Mesh(edgeGeo, edgeMat);
    leftEdge.position.copy(mid);
    leftEdge.position.y = lineY;
    leftEdge.lookAt(lookTarget);
    leftEdge.translateX(-roadWidth / 2 + 0.45);
    this.scene.add(leftEdge);

    const rightEdge = new THREE.Mesh(edgeGeo, edgeMat);
    rightEdge.position.copy(mid);
    rightEdge.position.y = lineY;
    rightEdge.lookAt(lookTarget);
    rightEdge.translateX(roadWidth / 2 - 0.45);
    this.scene.add(rightEdge);

    // 4. Yellow Dashed Centerline
    const lineGeo = new THREE.BoxGeometry(0.3, 0.18, adjustedLen * 0.72);
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 });
    const line = new THREE.Mesh(lineGeo, lineMat);
    line.position.copy(mid);
    line.position.y = lineY;
    line.lookAt(lookTarget);
    this.scene.add(line);
  }

  // ── Tile Pedestals (Enlarged & Prominent Circles) ─────────────
  createTilePedestal(pos, node) {
    const group = new THREE.Group();
    group.position.copy(pos);

    const isStopTile = node.isStop;
    const isFinish = node.type === 'finish';
    const radius = isStopTile ? 4.2 : (isFinish ? 5.2 : 3.2);

    const discHeight = isStopTile ? 0.70 : 0.48;
    const discGeo = new THREE.CylinderGeometry(radius, radius + 0.25, discHeight, 32);
    const colorHex = parseInt((node.color || '#3b82f6').replace('#', '0x'), 16);
    const discMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.25,
      metalness: 0.65
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.position.y = discHeight / 2 + 0.02;
    disc.castShadow = true;
    disc.receiveShadow = true;
    group.add(disc);

    // Outer Glowing Ring for STOP & Finish
    if (isStopTile) {
      const stopRingGeo = new THREE.TorusGeometry(radius + 0.35, 0.22, 12, 32);
      const stopRingMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const stopRing = new THREE.Mesh(stopRingGeo, stopRingMat);
      stopRing.rotation.x = Math.PI / 2;
      stopRing.position.y = discHeight + 0.04;
      group.add(stopRing);
    }

    // Inner Chrome Bezel
    const ringGeo = new THREE.TorusGeometry(radius + 0.12, 0.14, 12, 32);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.9, roughness: 0.1 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = discHeight + 0.02;
    group.add(ring);

    // High-DPI Sprite for Tile Title & Icon
    const sprite = this.createTileSprite(node.icon || '📍', node.title, isStopTile, node.type);
    sprite.position.set(0, isStopTile ? 2.4 : (node.type === 'normal' ? 1.6 : 1.9), 0);
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
    canvas.width = 640;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');

    // Per-type color themes
    const themes = {
      payday:    { bg0: '#064e3b', bg1: '#14532d', border: '#4ade80', label: '#86efac', labelBg: '#052e16' },
      action:    { bg0: '#4a044e', bg1: '#701a75', border: '#d946ef', label: '#f0abfc', labelBg: '#3b0764' },
      career:    { bg0: '#1e3a5f', bg1: '#1e40af', border: '#60a5fa', label: '#bfdbfe', labelBg: '#172554' },
      family:    { bg0: '#4c0519', bg1: '#881337', border: '#fb7185', label: '#fecdd3', labelBg: '#3b0015' },
      knowledge: { bg0: '#083344', bg1: '#0e7490', border: '#22d3ee', label: '#a5f3fc', labelBg: '#052b38' },
      branch:    { bg0: '#431407', bg1: '#92400e', border: '#f59e0b', label: '#fde68a', labelBg: '#361100' },
      finish:    { bg0: '#134e4a', bg1: '#0f766e', border: '#2dd4bf', label: '#99f6e4', labelBg: '#042f2e' },
      normal:    { bg0: '#0f172a', bg1: '#1e293b', border: '#38bdf8', label: '#7dd3fc', labelBg: '#0c1322' },
      start:     { bg0: '#052e16', bg1: '#166534', border: '#4ade80', label: '#86efac', labelBg: '#052e16' },
      house:     { bg0: '#2e1065', bg1: '#5b21b6', border: '#c084fc', label: '#e9d5ff', labelBg: '#1a0040' },
    };
    const theme = themes[type] || themes.normal;
    const stopTheme = { bg0: '#450a0a', bg1: '#7f1d1d', border: '#ef4444', label: '#fca5a5', labelBg: '#3b0101' };
    const t = isStop ? stopTheme : theme;

    // Background card
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 320);
    bgGrad.addColorStop(0, t.bg0);
    bgGrad.addColorStop(1, t.bg1);

    // Card with beveled corners
    ctx.fillStyle = bgGrad;
    ctx.strokeStyle = t.border;
    ctx.lineWidth = isStop ? 8 : 5;
    ctx.beginPath();
    this.drawRoundedRect(ctx, 10, 10, 620, 300, 36);
    ctx.fill();
    ctx.stroke();

    // Inner subtle highlight
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    this.drawRoundedRect(ctx, 14, 14, 612, 120, 30);
    ctx.fill();
    ctx.restore();

    // Type label badge (top-left)
    const typeLabel = isStop ? '★ STOP' : (type || 'tile').toUpperCase();
    const badgeW = ctx.measureText(typeLabel).width + 40;
    ctx.fillStyle = t.labelBg;
    ctx.strokeStyle = t.border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    this.drawRoundedRect(ctx, 22, 22, Math.min(badgeW, 180), 36, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = t.label;
    ctx.font = `700 18px -apple-system, "SF Pro Text", "Inter", sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(typeLabel, 32, 40);

    // Large Icon
    ctx.font = `80px -apple-system, "SF Pro Text", "Inter", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, 320, 145);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${isStop ? 36 : 32}px -apple-system, "SF Pro Text", "Inter", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 8;
    ctx.fillText(title.substring(0, 16), 320, 248);
    ctx.shadowBlur = 0;

    // Bottom glow bar
    const barGrad = ctx.createLinearGradient(0, 290, 640, 290);
    barGrad.addColorStop(0, 'transparent');
    barGrad.addColorStop(0.5, t.border + '88');
    barGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = barGrad;
    ctx.fillRect(10, 290, 620, 6);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      depthTest: true,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(spriteMat);
    if (isStop) {
      sprite.scale.set(4.2, 2.1, 1);
    } else if (type === 'normal') {
      sprite.scale.set(2.4, 1.2, 1);
    } else {
      sprite.scale.set(3.2, 1.6, 1);
    }
    return sprite;
  }


  // ── 🏎️ 3D Player Vehicle (GLTF 3D Car + Peg Figurines) ────────
  create3DCar(player) {
    const carGroup = new THREE.Group();
    carGroup.userData = { player };
    const colorHex = parseInt((player.character.color || '#3b82f6').replace('#', '0x'), 16);

    // Dynamic Car Body Container (supports instant swapping to real GLB model)
    const bodyContainer = new THREE.Group();
    carGroup.bodyContainer = bodyContainer;
    carGroup.add(bodyContainer);

    const attached = this.attachGLBCarModel(bodyContainer, player, colorHex);
    if (!attached) {
      this.buildProceduralCarBody(bodyContainer, colorHex, carGroup);
    }

    // Figure Pegs (Spielfiguren!)
    carGroup.pegsGroup = new THREE.Group();
    carGroup.add(carGroup.pegsGroup);
    this.updateCarPegs(carGroup, player);

    // Floating Player Name Badge
    this.attachPlayerNameBadge(carGroup, player);

    this.scene.add(carGroup);
    return carGroup;
  }

  buildProceduralCarBody(container, colorHex, carGroup) {
    const chassisGeo = new THREE.BoxGeometry(1.7, 0.55, 3.4);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.18,
      metalness: 0.85
    });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.y = 0.55;
    chassis.castShadow = true;
    container.add(chassis);

    const tubGeo = new THREE.BoxGeometry(1.3, 0.35, 2.0);
    const tubMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const tub = new THREE.Mesh(tubGeo, tubMat);
    tub.position.set(0, 0.7, -0.1);
    container.add(tub);

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
    container.add(shield);

    const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.26, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
    const wheelPositions = [
      [-0.92, 0.34, 0.95],
      [0.92, 0.34, 0.95],
      [-0.92, 0.34, -0.95],
      [0.92, 0.34, -0.95]
    ];
    if (carGroup) carGroup.wheels = [];
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

      container.add(wheelGroup);
      if (carGroup && carGroup.wheels) carGroup.wheels.push(wheelGroup);
    });

    const lightGeo = new THREE.BoxGeometry(0.3, 0.15, 0.1);
    const headMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    [-0.55, 0.55].forEach(x => {
      const light = new THREE.Mesh(lightGeo, headMat);
      light.position.set(x, 0.55, -1.72);
      container.add(light);
    });
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    [-0.55, 0.55].forEach(x => {
      const light = new THREE.Mesh(lightGeo, tailMat);
      light.position.set(x, 0.55, 1.72);
      container.add(light);
    });
  }

  attachPlayerNameBadge(carGroup, player) {
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
    driverPeg.position.set(-0.32, 1.05, -0.2);
    carGroup.pegsGroup.add(driverPeg);

    // 2. Spouse Peg (Front-Right if married)
    if (player.assets && player.assets.spouse) {
      const spousePeg = this.createPeg(0xf43f5e, 1.0); // Pink/Red for spouse
      spousePeg.position.set(0.32, 1.05, -0.2);
      carGroup.pegsGroup.add(spousePeg);
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

        car.position.set(targetNode.pos.x + offset.x, 2.45, targetNode.pos.z + offset.z);
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
    // Road/tile surface is at y=2.08 + road ribbon 0.16 + car offset → drive at 2.45
    const DRIVE_Y = 2.45;
    const endPos = new THREE.Vector3(targetData.pos.x, DRIVE_Y, targetData.pos.z);

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
        // Smooth arc hop – peak at midpoint, always stay ABOVE road (min y = DRIVE_Y)
        car.position.y = Math.max(DRIVE_Y, DRIVE_Y + Math.sin(progress * Math.PI) * 0.6);

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

  // ── 🎥 Camera System & Views (Vogelperspektive) ───────────────
  resetCamera() {
    setTimeout(() => {
      this.isTrackingCar = false;
      if (this.cameraMode === 'chase') {
        this.targetCameraPos.set(0, 95, 110);
      } else {
        this.targetCameraPos.set(0, 165, 80);
      }
      this.targetCameraLookAt.set(0, 0, 8);
    }, 1800);
  }

  cameraOverview() {
    this.isTrackingCar = false;
    this.cameraMode = 'overview';
    this.targetCameraPos.set(0, 165, 80);
    this.targetCameraLookAt.set(0, 0, 8);
  }

  setCameraMode(mode) {
    this.cameraMode = mode;
    if (mode === 'overview') {
      this.cameraOverview();
    } else {
      this.isTrackingCar = false;
      this.targetCameraPos.set(0, 95, 110);
      this.targetCameraLookAt.set(0, 0, 8);
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
    this.targetCameraPos.set(nodeData.pos.x, nodeData.pos.y + 36, nodeData.pos.z + 32);
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

    const isUserControlling = this._userOverride && this.controls;

    // Continuous dynamic camera lerp (only when not user-overriding)
    if (!isUserControlling) {
      if (this.isTrackingCar && this.trackedCar) {
        const p = this.trackedCar.position;
        if (this.cameraMode === 'overview') {
          // In Vogelperspektive: Elevated high tracking follow (keeps whole board context)
          this.targetCameraPos.set(
            p.x,
            p.y + 65,
            p.z + 42
          );
          this.targetCameraLookAt.set(
            p.x,
            p.y + 1.2,
            p.z
          );
        } else {
          // Dynamic chase camera
          this.targetCameraPos.set(
            p.x - this.carHeading.x * 20,
            p.y + 12,
            p.z - this.carHeading.z * 20
          );
          this.targetCameraLookAt.set(
            p.x + this.carHeading.x * 5,
            p.y + 2,
            p.z + this.carHeading.z * 5
          );
        }
      }

      this.camera.position.lerp(this.targetCameraPos, 0.045);
      this.currentCameraLookAt.lerp(this.targetCameraLookAt, 0.055);
      this.camera.lookAt(this.currentCameraLookAt);
    }

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

    // OrbitControls: always update when user is controlling, otherwise sync target
    if (this.controls) {
      if (isUserControlling) {
        this.controls.update();
      } else if (!this.isTrackingCar) {
        this.controls.target.lerp(this.currentCameraLookAt, 0.05);
        this.controls.update();
      }
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
