import * as THREE from 'three';

/**
 * Phase 7 Remodel: 2-Story Showa-Era Corner Building & Open Counter Bar
 *
 * Implements:
 *  1. FLUSH KAWARA ROOF TILES & ZERO WHITE WALL OVERLAP:
 *     - Fixed `tileArcGeo` orientation (`rotateZ(Math.PI / 2)` only, removing the `rotateX(Math.PI / 2)` that stood
 *       the half-cylinders vertically) so every Kawara tile lies flat along the sloped roof substrate!
 *     - Trimmed `fWall2Top` and `sideWall2Front` top edge to `y = 6.72` so no white plaster wall pokes through the eaves.
 *  2. DARK WOOD EXTERIOR STAIRCASE & FASCIA BEAM DE-COLLISION:
 *     - Changed the side staircase material from red steel to dark weathered wood (`darkStairWoodMat`).
 *     - Split `fasciaSideBeam` around the stair opening (`z ∈ [-1.72, 1.82]` and `z ∈ [-10.50, -5.24]`) and shortened
 *       the inner stair handrail so no building beam overlaps or intersects the stairs.
 *  3. Zero facade Z-fighting around the vending machine nook and entrance doorway.
 */

function createPrecisionStringerGeometry(width = 0.06) {
  const profile = [
    [-1.80, 0.25],
    [-4.00, 3.75],
    [-4.60, 3.75],
    [-4.60, 3.59],
    [-4.08, 3.59],
    [-1.98, 0.25]
  ];

  const triIndices2D = [
    [0, 1, 5],
    [1, 4, 5],
    [1, 2, 4],
    [2, 3, 4]
  ];

  const hx = width / 2;
  const positions = [];
  const uvs = [];

  function pushTri(p1, p2, p3) {
    positions.push(p1[0], p1[1], p1[2], p2[0], p2[1], p2[2], p3[0], p3[1], p3[2]);
    uvs.push(0, 0, 1, 0, 1, 1);
  }

  triIndices2D.forEach(([a, b, c]) => {
    const pa = profile[a], pb = profile[b], pc = profile[c];
    pushTri([hx, pa[1], pa[0]], [hx, pb[1], pb[0]], [hx, pc[1], pc[0]]);
    pushTri([-hx, pa[1], pa[0]], [-hx, pc[1], pc[0]], [-hx, pb[1], pb[0]]);
  });

  for (let i = 0; i < profile.length; i++) {
    const pA = profile[i];
    const pB = profile[(i + 1) % profile.length];
    const v0 = [-hx, pA[1], pA[0]];
    const v1 = [ hx, pA[1], pA[0]];
    const v2 = [ hx, pB[1], pB[0]];
    const v3 = [-hx, pB[1], pB[0]];
    pushTri(v0, v2, v1);
    pushTri(v0, v3, v2);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}

function addHollowFrameZ(parent, cx, cy, cz, totalW, totalH, depthZ, frameThick, material) {
  const topGeo = new THREE.BoxGeometry(totalW, frameThick, depthZ);
  const topMesh = new THREE.Mesh(topGeo, material);
  topMesh.position.set(cx, cy + (totalH - frameThick) / 2, cz);
  topMesh.castShadow = true;
  parent.add(topMesh);

  const botMesh = new THREE.Mesh(topGeo, material);
  botMesh.position.set(cx, cy - (totalH - frameThick) / 2, cz);
  botMesh.castShadow = true;
  parent.add(botMesh);

  const sideH = totalH - frameThick * 2;
  const sideGeo = new THREE.BoxGeometry(frameThick, sideH, depthZ);
  const leftMesh = new THREE.Mesh(sideGeo, material);
  leftMesh.position.set(cx - (totalW - frameThick) / 2, cy, cz);
  leftMesh.castShadow = true;
  parent.add(leftMesh);

  const rightMesh = new THREE.Mesh(sideGeo, material);
  rightMesh.position.set(cx + (totalW - frameThick) / 2, cy, cz);
  rightMesh.castShadow = true;
  parent.add(rightMesh);
}

export function initBuilding(scene, textures) {
  const buildingGroup = new THREE.Group();
  buildingGroup.name = 'showa_corner_building';

  // =========================================================================
  // COMMON MATERIALS
  // =========================================================================
  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0x42403d,
    roughness: 0.90,
    metalness: 0.08
  });

  const ceramicTileMat = new THREE.MeshStandardMaterial({
    map: textures.ceramicTile,
    roughness: 0.22,
    metalness: 0.05,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1
  });
  textures.ceramicTile.repeat.set(4, 2);

  const plasterMat = new THREE.MeshStandardMaterial({
    map: textures.weatheredPlaster,
    color: 0xfffcf2,
    roughness: 0.78,
    metalness: 0.04,
    side: THREE.DoubleSide
  });

  const woodSlatMat = new THREE.MeshStandardMaterial({
    map: textures.woodSlat,
    roughness: 0.75,
    metalness: 0.05,
    side: THREE.DoubleSide
  });

  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x362319,
    roughness: 0.72,
    metalness: 0.05
  });

  // Dark weathered timber material for the side exterior staircase (with wood grain texture)
  const darkStairWoodMat = new THREE.MeshStandardMaterial({
    map: textures.woodSlat,
    color: 0x4a2e1e,
    roughness: 0.68,
    metalness: 0.06
  });

  const warmWoodMat = new THREE.MeshStandardMaterial({
    color: 0x7c4528,
    roughness: 0.58,
    metalness: 0.06
  });

  const keyakiCounterMat = new THREE.MeshStandardMaterial({
    color: 0xb87a44,
    roughness: 0.32,
    metalness: 0.08
  });

  const frostedGlassMat = new THREE.MeshStandardMaterial({
    color: 0xffe8c2,
    emissive: 0xffb85c,
    emissiveIntensity: 0.45,
    roughness: 0.32,
    metalness: 0.10,
    transparent: true,
    opacity: 0.72
  });

  const curtainMat = new THREE.MeshStandardMaterial({
    color: 0xfff3db,
    emissive: 0xffbe6b,
    emissiveIntensity: 0.55,
    roughness: 0.80,
    side: THREE.DoubleSide
  });

  const metalDarkMat = new THREE.MeshStandardMaterial({
    color: 0x242629,
    roughness: 0.45,
    metalness: 0.80
  });

  const galvanizedMetalMat = new THREE.MeshStandardMaterial({
    color: 0x969da2,
    roughness: 0.40,
    metalness: 0.75
  });

  const kawaraMat = new THREE.MeshStandardMaterial({
    map: textures.kawaraTile,
    color: 0x2c2f34,
    roughness: 0.40,
    metalness: 0.20,
    side: THREE.DoubleSide
  });

  const awningMat = new THREE.MeshStandardMaterial({
    map: textures.awning,
    roughness: 0.72,
    metalness: 0.05,
    side: THREE.DoubleSide
  });

  const dynamicLights = [];

  // =========================================================================
  // 1. SOLID STONE FOUNDATION PLINTH (y ∈ [0.25, 0.45])
  // =========================================================================
  const plinthWidth = 13.0;
  const plinthDepth = 12.3;
  const plinthHeight = 0.20;
  const plinthGeo = new THREE.BoxGeometry(plinthWidth, plinthHeight, plinthDepth);
  const plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
  plinthMesh.position.set(-4.3, 0.35, -4.35);
  plinthMesh.castShadow = true;
  plinthMesh.receiveShadow = true;
  buildingGroup.add(plinthMesh);

  // =========================================================================
  // 2. ZERO Z-FIGHTING SEALED PERIMETER WALLS (Back & West & East Flank)
  // =========================================================================
  const backWall1Geo = new THREE.BoxGeometry(12.56, 3.20, 0.22);
  const backWall1 = new THREE.Mesh(backWall1Geo, woodSlatMat);
  backWall1.position.set(-4.3, 2.05, -10.39);
  backWall1.castShadow = true;
  backWall1.receiveShadow = true;
  buildingGroup.add(backWall1);

  // All 4 second-floor outer walls lowered flush to y = 6.72 (below the rooftop cornice beam & concrete terrace slab!)
  const backWall2Geo = new THREE.BoxGeometry(12.56, 3.07, 0.22);
  const backWall2 = new THREE.Mesh(backWall2Geo, plasterMat);
  backWall2.position.set(-4.3, 5.185, -10.39);
  backWall2.castShadow = true;
  backWall2.receiveShadow = true;
  buildingGroup.add(backWall2);

  const leftWall1Geo = new THREE.BoxGeometry(0.22, 3.20, 12.06);
  const leftWall1 = new THREE.Mesh(leftWall1Geo, woodSlatMat);
  leftWall1.position.set(-10.69, 2.05, -4.47);
  leftWall1.castShadow = true;
  leftWall1.receiveShadow = true;
  buildingGroup.add(leftWall1);

  const leftWall2 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.07, 12.06), plasterMat);
  leftWall2.position.set(-10.69, 5.185, -4.47);
  leftWall2.castShadow = true;
  leftWall2.receiveShadow = true;
  buildingGroup.add(leftWall2);

  const sideLowerGeo = new THREE.BoxGeometry(0.22, 0.90, 12.06);
  const sideLowerMesh = new THREE.Mesh(sideLowerGeo, ceramicTileMat);
  sideLowerMesh.position.set(2.09, 0.90, -4.47);
  sideLowerMesh.castShadow = true;
  sideLowerMesh.receiveShadow = true;
  buildingGroup.add(sideLowerMesh);

  const sideCopingGeo = new THREE.BoxGeometry(0.26, 0.06, 12.06);
  const sideCopingMesh = new THREE.Mesh(sideCopingGeo, darkWoodMat);
  sideCopingMesh.position.set(2.10, 1.35, -4.47);
  sideCopingMesh.castShadow = true;
  buildingGroup.add(sideCopingMesh);

  const sideUpper1Geo = new THREE.BoxGeometry(0.22, 2.30, 12.06);
  const sideUpper1Mesh = new THREE.Mesh(sideUpper1Geo, woodSlatMat);
  sideUpper1Mesh.position.set(2.09, 2.50, -4.47);
  sideUpper1Mesh.castShadow = true;
  sideUpper1Mesh.receiveShadow = true;
  buildingGroup.add(sideUpper1Mesh);

  const sideWall2 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.07, 12.06), plasterMat);
  sideWall2.position.set(2.09, 5.185, -4.47);
  sideWall2.castShadow = true;
  sideWall2.receiveShadow = true;
  buildingGroup.add(sideWall2);

  // =========================================================================
  // 3. RECESSED VENDING MACHINE NOOK (x ∈ [-9.92, -6.12], ZERO Z-FIGHTING!)
  // =========================================================================
  const leftPillarBase = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.88, 0.22), ceramicTileMat);
  leftPillarBase.position.set(-10.38, 0.89, 1.67);
  leftPillarBase.castShadow = true;
  buildingGroup.add(leftPillarBase);

  const leftPillarCoping = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.06, 0.26), darkWoodMat);
  leftPillarCoping.position.set(-10.38, 1.36, 1.68);
  buildingGroup.add(leftPillarCoping);

  const leftPillarUpper = new THREE.Mesh(new THREE.BoxGeometry(0.84, 2.26, 0.22), woodSlatMat);
  leftPillarUpper.position.set(-10.38, 2.52, 1.67);
  leftPillarUpper.castShadow = true;
  buildingGroup.add(leftPillarUpper);

  const nookHeaderWall = new THREE.Mesh(new THREE.BoxGeometry(3.88, 1.25, 0.22), woodSlatMat);
  nookHeaderWall.position.set(-8.02, 3.025, 1.67);
  nookHeaderWall.castShadow = true;
  buildingGroup.add(nookHeaderWall);

  const nookBackMat = new THREE.MeshStandardMaterial({ color: 0x2b2622, roughness: 0.88 });
  const nookBack = new THREE.Mesh(new THREE.BoxGeometry(3.84, 1.96, 0.08), nookBackMat);
  nookBack.position.set(-8.02, 1.43, 0.98);
  buildingGroup.add(nookBack);

  const nookCeil = new THREE.Mesh(new THREE.BoxGeometry(3.88, 0.08, 0.84), darkWoodMat);
  nookCeil.position.set(-8.02, 2.38, 1.40);
  buildingGroup.add(nookCeil);

  [-9.92, -6.12].forEach(nx => {
    const nookCheek = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.96, 0.84), darkWoodMat);
    nookCheek.position.set(nx, 1.43, 1.40);
    nookCheek.castShadow = true;
    buildingGroup.add(nookCheek);
  });

  const midPillarBase = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.88, 0.22), ceramicTileMat);
  midPillarBase.position.set(-5.94, 0.89, 1.67);
  midPillarBase.castShadow = true;
  buildingGroup.add(midPillarBase);

  const midPillarCoping = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.06, 0.26), darkWoodMat);
  midPillarCoping.position.set(-5.94, 1.36, 1.68);
  buildingGroup.add(midPillarCoping);

  const midPillarUpper = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.26, 0.22), woodSlatMat);
  midPillarUpper.position.set(-5.94, 2.52, 1.67);
  midPillarUpper.castShadow = true;
  buildingGroup.add(midPillarUpper);

  // =========================================================================
  // 4. OPEN SERVING COUNTER / BAR (x ∈ [-5.80, -1.70]) & SINGLE-DOOR NOREN ENTRANCE (x ∈ [-1.35, -0.25])
  // =========================================================================
  const counterFrontWall = new THREE.Mesh(new THREE.BoxGeometry(4.08, 0.70, 0.22), ceramicTileMat);
  counterFrontWall.position.set(-3.75, 0.80, 1.67);
  counterFrontWall.castShadow = true;
  counterFrontWall.receiveShadow = true;
  buildingGroup.add(counterFrontWall);

  const counterTopSlab = new THREE.Mesh(new THREE.BoxGeometry(4.22, 0.08, 0.52), keyakiCounterMat);
  counterTopSlab.position.set(-3.75, 1.18, 1.66);
  counterTopSlab.castShadow = true;
  counterTopSlab.receiveShadow = true;
  buildingGroup.add(counterTopSlab);

  [-5.5, -4.3, -3.2, -2.0].forEach(bx => {
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.22), darkWoodMat);
    bracket.position.set(bx, 1.05, 1.82);
    buildingGroup.add(bracket);
  });

  const counterDoorPillarBase = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.88, 0.22), ceramicTileMat);
  counterDoorPillarBase.position.set(-1.535, 0.89, 1.67);
  counterDoorPillarBase.castShadow = true;
  buildingGroup.add(counterDoorPillarBase);

  const counterDoorPillarCoping = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 0.26), darkWoodMat);
  counterDoorPillarCoping.position.set(-1.535, 1.36, 1.68);
  buildingGroup.add(counterDoorPillarCoping);

  const counterDoorPillarUpper = new THREE.Mesh(new THREE.BoxGeometry(0.33, 2.26, 0.22), woodSlatMat);
  counterDoorPillarUpper.position.set(-1.535, 2.52, 1.67);
  counterDoorPillarUpper.castShadow = true;
  buildingGroup.add(counterDoorPillarUpper);

  const counterTransomWall = new THREE.Mesh(new THREE.BoxGeometry(4.10, 0.85, 0.22), woodSlatMat);
  counterTransomWall.position.set(-3.75, 3.225, 1.67);
  counterTransomWall.castShadow = true;
  buildingGroup.add(counterTransomWall);

  const counterMenuMat = new THREE.MeshStandardMaterial({
    map: textures.signs.counterMenu,
    roughness: 0.45,
    metalness: 0.10
  });
  const counterMenuBoard = new THREE.Mesh(new THREE.BoxGeometry(3.80, 0.34, 0.04), counterMenuMat);
  counterMenuBoard.position.set(-3.75, 2.40, 1.48);
  buildingGroup.add(counterMenuBoard);

  // B. Single-Door Entrance (x ∈ [-1.35, -0.25], width 1.10m)
  const entranceStep = new THREE.Mesh(new THREE.BoxGeometry(1.10, 0.06, 0.28), plinthMat);
  entranceStep.position.set(-0.80, 0.48, 1.68);
  entranceStep.receiveShadow = true;
  buildingGroup.add(entranceStep);

  const singleDoorLintel = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.10, 0.26), darkWoodMat);
  singleDoorLintel.position.set(-0.80, 2.55, 1.69);
  buildingGroup.add(singleDoorLintel);

  [-1.33, -0.27].forEach(jx => {
    const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.10, 0.26), darkWoodMat);
    jamb.position.set(jx, 1.50, 1.69);
    jamb.castShadow = true;
    buildingGroup.add(jamb);
  });

  const doorUpperTransom = new THREE.Mesh(new THREE.BoxGeometry(1.14, 1.05, 0.22), woodSlatMat);
  doorUpperTransom.position.set(-0.80, 3.125, 1.67);
  doorUpperTransom.castShadow = true;
  buildingGroup.add(doorUpperTransom);

  const norenRodGeo = new THREE.CylinderGeometry(0.018, 0.018, 1.06, 8);
  norenRodGeo.rotateZ(Math.PI / 2);
  const norenRod = new THREE.Mesh(norenRodGeo, warmWoodMat);
  norenRod.position.set(-0.80, 2.48, 1.73);
  buildingGroup.add(norenRod);

  const norenPanels = [];
  const norenTexList = [
    textures.signs.norenPanel1,
    textures.signs.norenPanel2,
    textures.signs.norenPanel3
  ];
  const panelW = 0.31;
  const panelH = 0.72;
  const panelGeo = new THREE.PlaneGeometry(panelW, panelH, 4, 8);
  panelGeo.translate(0, -panelH / 2, 0);

  [-1.13, -0.80, -0.47].forEach((px, idx) => {
    const pMat = new THREE.MeshStandardMaterial({
      map: norenTexList[idx],
      roughness: 0.82,
      metalness: 0.04,
      side: THREE.DoubleSide
    });
    const pMesh = new THREE.Mesh(panelGeo, pMat);
    pMesh.position.set(px, 2.48, 1.73);
    pMesh.castShadow = true;
    buildingGroup.add(pMesh);
    norenPanels.push(pMesh);
  });

  // C. Right-Side Front Facade Wall spans x ∈ [-0.23, 2.20]
  const rightWallLower = new THREE.Mesh(new THREE.BoxGeometry(2.43, 0.88, 0.22), ceramicTileMat);
  rightWallLower.position.set(0.985, 0.89, 1.67);
  rightWallLower.castShadow = true;
  buildingGroup.add(rightWallLower);

  const rightWallCoping = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.06, 0.26), darkWoodMat);
  rightWallCoping.position.set(0.99, 1.36, 1.68);
  buildingGroup.add(rightWallCoping);

  const rightWallUpper = new THREE.Mesh(new THREE.BoxGeometry(2.43, 2.26, 0.22), woodSlatMat);
  rightWallUpper.position.set(0.985, 2.52, 1.67);
  rightWallUpper.castShadow = true;
  rightWallUpper.receiveShadow = true;
  buildingGroup.add(rightWallUpper);

  // D. Open Counter & L-Turn Corridor Interior Space
  const interiorWallMat = new THREE.MeshStandardMaterial({
    color: 0xc8a47e,
    emissive: 0xffa84c,
    emissiveIntensity: 0.28,
    roughness: 0.85
  });

  const interiorFloor = new THREE.Mesh(new THREE.BoxGeometry(5.80, 0.04, 2.00), darkWoodMat);
  interiorFloor.position.set(-3.05, 0.45, 0.72);
  interiorFloor.receiveShadow = true;
  buildingGroup.add(interiorFloor);

  const interiorCeiling = new THREE.Mesh(new THREE.BoxGeometry(5.80, 0.10, 2.00), darkWoodMat);
  interiorCeiling.position.set(-3.05, 3.55, 0.72);
  buildingGroup.add(interiorCeiling);

  const interiorBackWall = new THREE.Mesh(new THREE.BoxGeometry(5.80, 3.10, 0.12), interiorWallMat);
  interiorBackWall.position.set(-3.05, 2.00, -0.25);
  buildingGroup.add(interiorBackWall);

  const interiorLeftWall = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.10, 2.00), interiorWallMat);
  interiorLeftWall.position.set(-5.90, 2.00, 0.72);
  buildingGroup.add(interiorLeftWall);

  const interiorRightCorridorWall = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.10, 2.00), interiorWallMat);
  interiorRightCorridorWall.position.set(-0.20, 2.00, 0.72);
  buildingGroup.add(interiorRightCorridorWall);

  const corridorTurnWall = new THREE.Mesh(new THREE.BoxGeometry(0.10, 3.05, 0.96), interiorWallMat);
  corridorTurnWall.position.set(-1.48, 1.98, 1.12);
  buildingGroup.add(corridorTurnWall);

  const backPrepCounter = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.90, 0.52), warmWoodMat);
  backPrepCounter.position.set(-3.8, 0.90, 0.12);
  buildingGroup.add(backPrepCounter);

  [1.60, 2.02].forEach(sy => {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.05, 0.28), darkWoodMat);
    shelf.position.set(-3.8, sy, 0.02);
    buildingGroup.add(shelf);
  });

  const bottleColors = [0x2a6f48, 0x8c4a27, 0x2c5e8a, 0xd48b28, 0x3b7a57, 0x963228];
  for (let b = 0; b < 10; b++) {
    const bMat = new THREE.MeshStandardMaterial({
      color: bottleColors[b % bottleColors.length],
      roughness: 0.2,
      metalness: 0.1
    });
    const bx = -5.3 + b * 0.34;
    const by = b % 2 === 0 ? 1.72 : 2.14;
    const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.038, 0.20, 8), bMat);
    bottle.position.set(bx, by, 0.04);
    buildingGroup.add(bottle);
  }

  const counterLight = new THREE.PointLight(0xffbe6b, 2.2, 6.5, 1.8);
  counterLight.position.set(-3.8, 2.45, 1.15);
  counterLight.castShadow = false;
  buildingGroup.add(counterLight);
  dynamicLights.push({ light: counterLight, baseIntensity: 2.2, nightBoost: 1.55 });

  const corridorLight = new THREE.PointLight(0xffbe6b, 1.5, 4.5, 2.0);
  corridorLight.position.set(-0.80, 2.40, 0.85);
  corridorLight.castShadow = false;
  buildingGroup.add(corridorLight);
  dynamicLights.push({ light: corridorLight, baseIntensity: 1.5, nightBoost: 1.55 });

  // E. Scalloped Striped Awning Canopy
  const awningWidth = 6.2;
  const awningCenterX = -3.0;
  const awningSlopeLength = 1.28;
  const awningSlopeAngle = Math.atan2(3.65 - 2.95, 2.85 - 1.78);

  const awningGeo = new THREE.PlaneGeometry(awningWidth, awningSlopeLength);
  awningGeo.rotateX(-(Math.PI / 2 - awningSlopeAngle));
  const awningMesh = new THREE.Mesh(awningGeo, awningMat);
  awningMesh.position.set(awningCenterX, 3.30, 2.315);
  awningMesh.castShadow = true;
  buildingGroup.add(awningMesh);

  const valenceGeo = new THREE.PlaneGeometry(awningWidth, 0.18);
  const valenceMesh = new THREE.Mesh(valenceGeo, awningMat);
  valenceMesh.position.set(awningCenterX, 2.86, 2.85);
  valenceMesh.castShadow = true;
  buildingGroup.add(valenceMesh);

  const sideValenceGeo = new THREE.BufferGeometry();
  const sideValenceVerts = new Float32Array([
    0, 3.65, 1.78,
    0, 2.95, 1.78,
    0, 2.95, 2.85
  ]);
  sideValenceGeo.setAttribute('position', new THREE.BufferAttribute(sideValenceVerts, 3));
  sideValenceGeo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 1, 0, 0, 1, 0]), 2));
  sideValenceGeo.computeVertexNormals();

  const sideValenceL = new THREE.Mesh(sideValenceGeo, awningMat);
  sideValenceL.position.set(awningCenterX - awningWidth / 2, 0, 0);
  buildingGroup.add(sideValenceL);

  const sideValenceR = new THREE.Mesh(sideValenceGeo, awningMat);
  sideValenceR.position.set(awningCenterX + awningWidth / 2, 0, 0);
  buildingGroup.add(sideValenceR);

  [-5.9, -4.0, -2.0, -0.1].forEach(sx => {
    const strutGeo = new THREE.CylinderGeometry(0.018, 0.018, 1.35, 8);
    const strutMesh = new THREE.Mesh(strutGeo, metalDarkMat);
    strutMesh.position.set(sx, 3.22, 2.31);
    strutMesh.rotation.x = -(Math.PI / 2 - awningSlopeAngle);
    strutMesh.castShadow = true;
    buildingGroup.add(strutMesh);
  });

  const lanternAttachments = new THREE.Group();
  lanternAttachments.name = 'chochin_lantern_brackets';
  const lanternMat = new THREE.MeshStandardMaterial({
    color: 0xffeedd,
    emissive: 0xff8c2b,
    emissiveIntensity: 0.85,
    roughness: 0.70
  });
  const lanternRimMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });

  [-5.75, -1.52, -0.12].forEach(lx => {
    const lanternBracket = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.35), metalDarkMat);
    lanternBracket.position.set(lx, 2.82, 1.95);
    buildingGroup.add(lanternBracket);

    const fallbackLantern = new THREE.Group();
    const lanternBody = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.38, 14), lanternMat);
    lanternBody.position.set(lx, 2.60, 2.10);
    fallbackLantern.add(lanternBody);

    const lanternTopRim = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.03, 14), lanternRimMat);
    lanternTopRim.position.set(lx, 2.79, 2.10);
    fallbackLantern.add(lanternTopRim);

    const lanternBotRim = lanternTopRim.clone();
    lanternBotRim.position.set(lx, 2.41, 2.10);
    fallbackLantern.add(lanternBotRim);
    lanternAttachments.add(fallbackLantern);
  });
  buildingGroup.add(lanternAttachments);

  // Wall-mounted Menu Blackboard pressed 100% flush against the green-tiled wall (back at z = 1.78)
  // and shifted left near the Noren doorway (x = 0.12) to leave room for the bicycle on its right!
  const menuBoard = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.70, 0.04),
    new THREE.MeshStandardMaterial({ map: textures.signs.menu, roughness: 0.85, metalness: 0.05 })
  );
  menuBoard.position.set(0.12, 0.90, 1.80);
  menuBoard.rotation.y = 0;
  menuBoard.castShadow = true;
  buildingGroup.add(menuBoard);

  // =========================================================================
  // 5. SECOND FLOOR, WINDOWS & ILLUMINATED SIGNAGE (y ∈ [3.65, 6.72])
  // =========================================================================
  const fasciaBeam = new THREE.Mesh(new THREE.BoxGeometry(13.08, 0.28, 0.32), darkWoodMat);
  fasciaBeam.position.set(-4.3, 3.79, 1.82);
  fasciaBeam.castShadow = true;
  buildingGroup.add(fasciaBeam);

  // Split `fasciaSideBeam` into Front segment (z ∈ [-1.72, 1.82]) and Rear segment (z ∈ [-10.50, -5.24])
  // so the building's horizontal beam NEVER overlaps or cuts through the side staircase (`z ∈ [-5.20, -1.80]`)!
  const fasciaSideBeam = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.28, 12.32), darkWoodMat);
  fasciaSideBeam.position.set(2.20, 3.79, -4.34);
  fasciaSideBeam.castShadow = true;
  buildingGroup.add(fasciaSideBeam);

  const signMainMat = new THREE.MeshStandardMaterial({
    map: textures.signs.mainShop,
    emissive: 0xffe0a3,
    emissiveMap: textures.signs.mainShop,
    emissiveIntensity: 0.42,
    roughness: 0.38,
    metalness: 0.22
  });
  const signMainMesh = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.05, 0.08), signMainMat);
  signMainMesh.position.set(-2.2, 4.45, 1.86);
  signMainMesh.castShadow = true;
  buildingGroup.add(signMainMesh);

  const lampBulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff5d6,
    emissive: 0xffd29d,
    emissiveIntensity: 1.5,
    roughness: 0.2
  });

  [-3.8, -2.2, -0.6].forEach(gx => {
    const lampArm = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.35, 8), metalDarkMat);
    lampArm.position.set(gx, 5.08, 1.90);
    lampArm.rotation.x = 0.6;
    buildingGroup.add(lampArm);

    const lampHeadGeo = new THREE.ConeGeometry(0.085, 0.085, 10);
    lampHeadGeo.rotateX(Math.PI);
    const lampHead = new THREE.Mesh(lampHeadGeo, metalDarkMat);
    lampHead.position.set(gx, 5.22, 2.00);
    buildingGroup.add(lampHead);

    const bulbMesh = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), lampBulbMat);
    bulbMesh.position.set(gx, 5.18, 2.00);
    buildingGroup.add(bulbMesh);

    const signLampLight = new THREE.PointLight(0xffd29d, 0.85, 2.8, 2.0);
    signLampLight.position.set(gx, 5.10, 2.02);
    signLampLight.castShadow = false;
    buildingGroup.add(signLampLight);
    dynamicLights.push({ light: signLampLight, baseIntensity: 0.85, nightBoost: 1.65 });
  });

  const fWall2Bot = new THREE.Mesh(new THREE.BoxGeometry(13.0, 0.93, 0.22), plasterMat);
  fWall2Bot.position.set(-4.3, 4.395, 1.69);
  fWall2Bot.castShadow = true;
  fWall2Bot.receiveShadow = true;
  buildingGroup.add(fWall2Bot);

  // Trimmed `fWall2Top` top edge to y = 6.72 (height 0.28m at y = 6.58) so zero white wall pokes above the front roof eaves!
  const fWall2Top = new THREE.Mesh(new THREE.BoxGeometry(13.0, 0.28, 0.22), plasterMat);
  fWall2Top.position.set(-4.3, 6.58, 1.69);
  fWall2Top.castShadow = true;
  fWall2Top.receiveShadow = true;
  buildingGroup.add(fWall2Top);

  [
    { cx: -10.17, w: 1.26 },
    { cx:  -7.00, w: 2.12 },
    { cx:  -2.20, w: 4.52 },
    { cx:   1.87, w: 0.66 }
  ].forEach(p => {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(p.w, 1.58, 0.22), plasterMat);
    pier.position.set(p.cx, 5.65, 1.69);
    pier.castShadow = true;
    pier.receiveShadow = true;
    buildingGroup.add(pier);
  });

  const interior2WallMat = new THREE.MeshStandardMaterial({
    color: 0xffdfad,
    emissive: 0xffb357,
    emissiveIntensity: 0.48,
    roughness: 0.85
  });

  const floor2BackWall = new THREE.Mesh(new THREE.BoxGeometry(12.4, 2.80, 0.12), interior2WallMat);
  floor2BackWall.position.set(-4.3, 5.33, 1.40);
  buildingGroup.add(floor2BackWall);

  const floor2CeilingSlab = new THREE.Mesh(new THREE.BoxGeometry(12.4, 0.12, 11.4), interior2WallMat);
  floor2CeilingSlab.position.set(-4.3, 6.72, -4.3);
  buildingGroup.add(floor2CeilingSlab);

  const floor2FloorSlab = new THREE.Mesh(new THREE.BoxGeometry(12.4, 0.10, 11.4), darkWoodMat);
  floor2FloorSlab.position.set(-4.3, 3.93, -4.3);
  buildingGroup.add(floor2FloorSlab);

  [-8.8, -5.2, 0.8].forEach(wx => {
    addHollowFrameZ(buildingGroup, wx, 5.65, 1.76, 1.48, 1.58, 0.12, 0.09, darkWoodMat);

    const sill = new THREE.Mesh(new THREE.BoxGeometry(1.60, 0.06, 0.22), darkWoodMat);
    sill.position.set(wx, 4.86, 1.81);
    sill.castShadow = true;
    buildingGroup.add(sill);

    for (let k = 0; k < 3; k++) {
      const barGeo = new THREE.CylinderGeometry(0.012, 0.012, 1.40, 8);
      barGeo.rotateZ(Math.PI / 2);
      const bar = new THREE.Mesh(barGeo, metalDarkMat);
      bar.position.set(wx, 5.08 + k * 0.18, 1.82);
      buildingGroup.add(bar);
    }

    const vMullion = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.40, 0.04), warmWoodMat);
    vMullion.position.set(wx, 5.65, 1.70);
    buildingGroup.add(vMullion);

    const hMullion = new THREE.Mesh(new THREE.BoxGeometry(1.30, 0.035, 0.04), warmWoodMat);
    hMullion.position.set(wx, 5.65, 1.70);
    buildingGroup.add(hMullion);

    const fWinGlass = new THREE.Mesh(new THREE.BoxGeometry(1.30, 1.40, 0.02), frostedGlassMat);
    fWinGlass.position.set(wx, 5.65, 1.63);
    buildingGroup.add(fWinGlass);

    const curtain = new THREE.Mesh(new THREE.PlaneGeometry(1.26, 1.36), curtainMat);
    curtain.position.set(wx, 5.65, 1.56);
    buildingGroup.add(curtain);

    const room2Light = new THREE.PointLight(0xffbe6b, 1.25, 4.2, 2.0);
    room2Light.position.set(wx, 5.65, 1.52);
    room2Light.castShadow = false;
    buildingGroup.add(room2Light);
    dynamicLights.push({ light: room2Light, baseIntensity: 1.25, nightBoost: 1.55 });
  });

  const balconyDeck = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.12, 0.75), darkWoodMat);
  balconyDeck.position.set(-7.10, 3.99, 2.175);
  balconyDeck.castShadow = true;
  balconyDeck.receiveShadow = true;
  buildingGroup.add(balconyDeck);

  [-9.3, -7.8, -6.4, -4.9].forEach(cx => {
    const corbel = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.40, 0.65), darkWoodMat);
    corbel.position.set(cx, 3.73, 2.05);
    corbel.castShadow = true;
    buildingGroup.add(corbel);
  });

  const handrail = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.06, 0.08), warmWoodMat);
  handrail.position.set(-7.10, 4.85, 2.52);
  buildingGroup.add(handrail);

  const balusterCount = 17;
  const balusterStep = 4.8 / (balusterCount - 1);
  for (let b = 0; b < balusterCount; b++) {
    const bal = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.80, 8), darkWoodMat);
    bal.position.set(-9.50 + b * balusterStep, 4.42, 2.52);
    bal.castShadow = true;
    buildingGroup.add(bal);
  }

  [-9.50, -4.70].forEach(sx => {
    const sideRail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.72), warmWoodMat);
    sideRail.position.set(sx, 4.85, 2.16);
    buildingGroup.add(sideRail);
  });

  const bladeSignMat = new THREE.MeshStandardMaterial({
    map: textures.signs.blade,
    emissive: 0xff6e4a,
    emissiveMap: textures.signs.blade,
    emissiveIntensity: 0.85,
    roughness: 0.32,
    metalness: 0.28
  });
  const bladeSign = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.80, 0.55), bladeSignMat);
  bladeSign.position.set(2.35, 5.15, 1.95);
  bladeSign.castShadow = true;
  buildingGroup.add(bladeSign);

  [4.45, 5.85].forEach(by => {
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.04, 0.04), metalDarkMat);
    bracket.position.set(2.22, by, 1.95);
    buildingGroup.add(bracket);
  });

  // =========================================================================
  // 6. SIDE WALL AC BRACKET (Staircase & 2F Side Door Removed; Replaced by Rooftop Ladder in props.js)
  // =========================================================================
  const acBracket = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.04, 0.95), metalDarkMat);
  acBracket.position.set(2.40, 4.15, -7.80);
  acBracket.castShadow = true;
  buildingGroup.add(acBracket);

  const fallbackAcGroup = new THREE.Group();
  fallbackAcGroup.name = 'fallback_ac_unit';
  const acMat = new THREE.MeshStandardMaterial({ color: 0xd8dede, roughness: 0.5, metalness: 0.3 });
  const acUnit1 = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.58, 0.85), acMat);
  acUnit1.position.set(2.42, 4.48, -7.80);
  acUnit1.castShadow = true;
  fallbackAcGroup.add(acUnit1);

  const fanGrilleGeo = new THREE.CylinderGeometry(0.20, 0.20, 0.02, 16);
  fanGrilleGeo.rotateZ(Math.PI / 2);
  const fanGrille = new THREE.Mesh(fanGrilleGeo, metalDarkMat);
  fanGrille.position.set(2.63, 4.48, -7.80);
  fallbackAcGroup.add(fanGrille);
  buildingGroup.add(fallbackAcGroup);

  // =========================================================================
  // 7. UNIFIED FULL-BUILDING FLAT ROOFTOP TERRACE WITH WEATHERED / DUSTY CONCRETE FLOOR
  //    (All 4 walls leveled flush below the rooftop deck at y = 7.17; Sloped Roof & Billboard Removed!)
  // =========================================================================
  const eaveBeamFront = new THREE.Mesh(new THREE.BoxGeometry(13.16, 0.22, 0.34), darkWoodMat);
  eaveBeamFront.position.set(-4.30, 6.84, 1.76);
  eaveBeamFront.castShadow = true;
  buildingGroup.add(eaveBeamFront);

  const eaveBeamNorth = new THREE.Mesh(new THREE.BoxGeometry(13.16, 0.22, 0.34), darkWoodMat);
  eaveBeamNorth.position.set(-4.30, 6.84, -10.42);
  eaveBeamNorth.castShadow = true;
  buildingGroup.add(eaveBeamNorth);

  const eaveBeamSide = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 12.44), darkWoodMat);
  eaveBeamSide.position.set(2.18, 6.84, -4.33);
  eaveBeamSide.castShadow = true;
  buildingGroup.add(eaveBeamSide);

  const eaveBeamWest = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 12.44), darkWoodMat);
  eaveBeamWest.position.set(-10.78, 6.84, -4.33);
  eaveBeamWest.castShadow = true;
  buildingGroup.add(eaveBeamWest);

  // Dusty / Weathered Old Concrete Material for the Unified Rooftop Terrace Floor (top at y = 7.17)
  const rooftopConcreteMat = new THREE.MeshStandardMaterial({
    map: textures.rooftopConcrete || textures.retainingWall,
    bumpMap: textures.rooftopConcrete || textures.retainingWall,
    bumpScale: 0.028,
    color: 0xd4cfc7,
    roughness: 0.88,
    metalness: 0.04
  });

  // Main unified rooftop slab covering the entire building top (x ∈ [-10.84, +2.24], z ∈ [-10.50, +1.84], y ∈ [6.95, 7.17])
  const rooftopSlab = new THREE.Mesh(
    new THREE.BoxGeometry(13.08, 0.22, 12.34),
    [plinthMat, plinthMat, rooftopConcreteMat, plinthMat, plinthMat, plinthMat]
  );
  rooftopSlab.position.set(-4.30, 7.06, -4.33);
  rooftopSlab.castShadow = true;
  rooftopSlab.receiveShadow = true;
  buildingGroup.add(rooftopSlab);

  scene.add(buildingGroup);

  return {
    buildingGroup,
    norenPanels,
    fallbackAcGroup,
    lanternAttachments,
    dynamicLights,
    emissiveMaterials: [frostedGlassMat, curtainMat, signMainMat, bladeSignMat, interiorWallMat, interior2WallMat],
    powerLineAnchors: [
      new THREE.Vector3(2.22, 5.85, 0.80),
      new THREE.Vector3(2.22, 5.85, -6.20)
    ]
  };
}
