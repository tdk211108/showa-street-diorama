import * as THREE from 'three';

/**
 * Phase 4 Remodel: Miniature Diorama Terrain, Tight NW Corner Alignment,
 * Concrete Backdrop Walls (North & West), and Harmonized Sidewalk Platform
 *
 * Tightened NW Boundary:
 *   The building's rear (z = -10.50) and west (x = -10.80) walls now sit snugly
 *   against the North-West corner of the diorama bounding box (xMin = -11.06, zMin = -10.76),
 *   enclosed by two tall architectural Concrete Backdrop Walls along the North and West edges!
 *   All scene components maintain their exact relative distances.
 */

function createOrganicPuddleGeometry(centerX, centerZ, radiusX, radiusZ, angularSegments = 48, radialRings = 8) {
  const geo = new THREE.BufferGeometry();
  const positions = [];
  const uvs = [];
  const indices = [];

  function getCrownY(worldZ) {
    const dist = Math.abs(worldZ - 8.5);
    const crown = Math.max(0, 0.015 * (1.0 - Math.pow(dist / 3.5, 2)));
    return 0.005 + crown + 0.009;
  }

  function getRadiusMod(theta) {
    return (
      1.0 +
      0.14 * Math.sin(theta * 2.0 + 0.5) +
      0.09 * Math.cos(theta * 3.0 - 0.9) +
      0.06 * Math.sin(theta * 5.0 + 1.8) +
      0.03 * Math.cos(theta * 7.0 + 0.4)
    );
  }

  positions.push(centerX, getCrownY(centerZ), centerZ);
  uvs.push(0.5, 0.5);

  for (let r = 1; r <= radialRings; r++) {
    const frac = r / radialRings;
    for (let s = 0; s <= angularSegments; s++) {
      const theta = (s / angularSegments) * Math.PI * 2;
      const mod = 1.0 + (getRadiusMod(theta) - 1.0) * Math.pow(frac, 0.85);
      const lx = Math.cos(theta) * radiusX * frac * mod;
      const lz = Math.sin(theta) * radiusZ * frac * mod;
      const wx = centerX + lx;
      const wz = centerZ + lz;
      const wy = getCrownY(wz);

      positions.push(wx, wy, wz);

      const u = 0.5 + 0.44 * frac * Math.cos(theta);
      const v = 0.5 + 0.44 * frac * Math.sin(theta);
      uvs.push(u, v);
    }
  }

  const ringStride = angularSegments + 1;
  for (let s = 0; s < angularSegments; s++) {
    indices.push(0, 1 + s + 1, 1 + s);
  }
  for (let r = 1; r < radialRings; r++) {
    const innerStart = 1 + (r - 1) * ringStride;
    const outerStart = 1 + r * ringStride;
    for (let s = 0; s < angularSegments; s++) {
      const i0 = innerStart + s;
      const i1 = innerStart + s + 1;
      const o0 = outerStart + s;
      const o1 = outerStart + s + 1;

      indices.push(i0, i1, o1);
      indices.push(i0, o1, o0);
    }
  }

  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function initTerrain(scene, textures) {
  const terrainGroup = new THREE.Group();
  terrainGroup.name = 'diorama_terrain';

  // Tightened diorama outer bounds:
  // West edge at x = -11.06 (flush behind West Backdrop Wall x ∈ [-11.06, -10.82])
  // North edge at z = -10.76 (flush behind North Backdrop Wall z ∈ [-10.76, -10.52])
  // East edge at x = 12.00, South edge at z = 12.00
  const xMin = -11.06;
  const xMax = 12.00;
  const zMin = -10.76;
  const zMax = 12.00;
  const totalW = xMax - xMin; // 23.06m
  const totalD = zMax - zMin; // 22.76m
  const centerX = (xMin + xMax) / 2; // 0.47
  const centerZ = (zMin + zMax) / 2; // 0.62

  // =========================================================================
  // MATERIALS SETUP
  // =========================================================================
  const strataMat = new THREE.MeshStandardMaterial({
    map: textures.cutaway,
    roughness: 0.9,
    metalness: 0.05,
    side: THREE.DoubleSide
  });

  const baseBottomMat = new THREE.MeshStandardMaterial({
    color: 0x181716,
    roughness: 0.95,
    metalness: 0.0
  });

  const asphaltRoadMat = new THREE.MeshStandardMaterial({
    map: textures.asphalt.diffuse,
    bumpMap: textures.asphalt.bump,
    bumpScale: 0.022,
    roughness: 0.76,
    metalness: 0.06,
    envMapIntensity: 1.1,
    shadowSide: THREE.DoubleSide
  });

  const swDiff = textures.sidewalk.diffuse.clone();
  swDiff.repeat.set(8, 8);
  const swBump = textures.sidewalk.bump.clone();
  swBump.repeat.set(8, 8);

  const sidewalkMat = new THREE.MeshStandardMaterial({
    map: swDiff,
    bumpMap: swBump,
    bumpScale: 0.025,
    color: 0xf4f0e8,
    roughness: 0.72,
    metalness: 0.04
  });

  const curbMat = new THREE.MeshStandardMaterial({
    map: textures.curb,
    color: 0xd4cec2,
    roughness: 0.72,
    metalness: 0.05,
    shadowSide: THREE.DoubleSide
  });

  const wallMat = new THREE.MeshStandardMaterial({
    map: textures.retainingWall,
    roughness: 0.82,
    metalness: 0.05,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1
  });

  const backdropWallTex = textures.retainingWall.clone();
  backdropWallTex.repeat.set(3, 2);
  const backdropWallMat = new THREE.MeshStandardMaterial({
    map: backdropWallTex,
    color: 0xd8d5ce,
    roughness: 0.80,
    metalness: 0.05
  });

  // =========================================================================
  // 1. SOLID WATERTIGHT ARCHITECTURAL SUB-STRUCTURES (Inset to prevent Z-fighting)
  // =========================================================================
  const roadBaseGeo = new THREE.BoxGeometry(totalW - 0.16, 2.13, 6.84);
  const roadBaseMesh = new THREE.Mesh(roadBaseGeo, baseBottomMat);
  roadBaseMesh.position.set(centerX, -1.115, 8.5);
  roadBaseMesh.receiveShadow = true;
  terrainGroup.add(roadBaseMesh);

  const swBaseW = 4.28 - (xMin + 0.08);
  const swBaseD = 4.80 - (zMin + 0.08);
  const swBaseGeo = new THREE.BoxGeometry(swBaseW, 2.38, swBaseD);
  const swBaseMesh = new THREE.Mesh(swBaseGeo, baseBottomMat);
  swBaseMesh.position.set((xMin + 0.08 + 4.28) / 2, -0.99, (zMin + 0.08 + 4.80) / 2);
  swBaseMesh.receiveShadow = true;
  terrainGroup.add(swBaseMesh);

  const slopeSubD = 4.92 - (zMin + 0.08);
  const slopeSubBaseGeo = new THREE.BoxGeometry(5.5, 2.13, slopeSubD);
  const slopeSubBaseMesh = new THREE.Mesh(slopeSubBaseGeo, baseBottomMat);
  slopeSubBaseMesh.position.set(7.37, -1.115, (zMin + 0.08 + 4.92) / 2);
  slopeSubBaseMesh.receiveShadow = true;
  terrainGroup.add(slopeSubBaseMesh);

  const hillBaseGeo = new THREE.BoxGeometry(1.64, 4.52, slopeSubD);
  const hillBaseMesh = new THREE.Mesh(hillBaseGeo, baseBottomMat);
  hillBaseMesh.position.set(11.1, 0.08, (zMin + 0.08 + 4.92) / 2);
  hillBaseMesh.receiveShadow = true;
  terrainGroup.add(hillBaseMesh);

  const bottomPlateGeo = new THREE.PlaneGeometry(totalW, totalD);
  bottomPlateGeo.rotateX(Math.PI / 2);
  const bottomPlate = new THREE.Mesh(bottomPlateGeo, baseBottomMat);
  bottomPlate.position.set(centerX, -2.205, centerZ);
  terrainGroup.add(bottomPlate);

  // =========================================================================
  // 2. OUTER CUTAWAY STRATA WALLS & TWO CONCRETE BACKDROP WALLS (North & West)
  // =========================================================================
  // South Strata Wall (z = 12.005, x ∈ [xMin, xMax], y ∈ [-2.2, 0])
  const southStrataGeo = new THREE.PlaneGeometry(totalW, 2.2);
  const southStrata = new THREE.Mesh(southStrataGeo, strataMat);
  southStrata.position.set(centerX, -1.1, 12.005);
  southStrata.receiveShadow = true;
  terrainGroup.add(southStrata);

  // West Strata Wall (x = xMin - 0.005, z ∈ [zMin, 12], y ∈ [-2.2, 0.25])
  const westRoadStrataGeo = new THREE.PlaneGeometry(7, 2.2);
  westRoadStrataGeo.rotateY(-Math.PI / 2);
  const westRoadStrata = new THREE.Mesh(westRoadStrataGeo, strataMat);
  westRoadStrata.position.set(xMin - 0.005, -1.1, 8.5);
  westRoadStrata.receiveShadow = true;
  terrainGroup.add(westRoadStrata);

  const westSwD = 5.0 - zMin;
  const westSwStrataGeo = new THREE.PlaneGeometry(westSwD, 2.45);
  westSwStrataGeo.rotateY(-Math.PI / 2);
  const westSwStrata = new THREE.Mesh(westSwStrataGeo, strataMat);
  westSwStrata.position.set(xMin - 0.005, -0.975, (zMin + 5.0) / 2);
  westSwStrata.receiveShadow = true;
  terrainGroup.add(westSwStrata);

  // North Strata Wall (z = zMin - 0.005, x ∈ [xMin, 12])
  const northSwW = 4.5 - xMin;
  const northSwStrataGeo = new THREE.PlaneGeometry(northSwW, 2.45);
  northSwStrataGeo.rotateY(Math.PI);
  const northSwStrata = new THREE.Mesh(northSwStrataGeo, strataMat);
  northSwStrata.position.set((xMin + 4.5) / 2, -0.975, zMin - 0.005);
  northSwStrata.receiveShadow = true;
  terrainGroup.add(northSwStrata);

  const northHillStrataGeo = new THREE.PlaneGeometry(7.5, 4.8);
  northHillStrataGeo.rotateY(Math.PI);
  const northHillStrata = new THREE.Mesh(northHillStrataGeo, strataMat);
  northHillStrata.position.set(8.25, 0.2, zMin - 0.005);
  northHillStrata.receiveShadow = true;
  terrainGroup.add(northHillStrata);

  // East Strata Wall (x = 12.005)
  const eastRoadStrataGeo = new THREE.PlaneGeometry(7, 2.2);
  eastRoadStrataGeo.rotateY(Math.PI / 2);
  const eastRoadStrata = new THREE.Mesh(eastRoadStrataGeo, strataMat);
  eastRoadStrata.position.set(12.005, -1.1, 8.5);
  eastRoadStrata.receiveShadow = true;
  terrainGroup.add(eastRoadStrata);

  const eastHillStrataGeo = new THREE.PlaneGeometry(westSwD, 4.8);
  eastHillStrataGeo.rotateY(Math.PI / 2);
  const eastHillStrata = new THREE.Mesh(eastHillStrataGeo, strataMat);
  eastHillStrata.position.set(12.005, 0.2, (zMin + 5.0) / 2);
  eastHillStrata.receiveShadow = true;
  terrainGroup.add(eastHillStrata);

  // =========================================================================
  // 2B. TWO CONCRETE BACKDROP BOUNDARY WALLS ENCLOSING REAR OUTER FACES (North & West)
  // =========================================================================
  // Encloses the two rear outer faces (West x = -10.94 and North z = -10.64) neatly framing the diorama corner!
  const backdropTopY = 8.15;
  const backdropBotY = 0.0;
  const backdropH = backdropTopY - backdropBotY;
  const backdropThick = 0.24;

  // 1. West Concrete Backdrop Wall (x ∈ [-11.06, -10.82], z ∈ [zMin, 12.00])
  const westBackdropGeo = new THREE.BoxGeometry(backdropThick, backdropH, totalD);
  const westBackdropWall = new THREE.Mesh(westBackdropGeo, backdropWallMat);
  westBackdropWall.position.set(xMin + backdropThick / 2, backdropBotY + backdropH / 2, centerZ);
  westBackdropWall.castShadow = true;
  westBackdropWall.receiveShadow = true;
  terrainGroup.add(westBackdropWall);

  // Top stone coping cap on West Backdrop Wall
  const westBackdropCap = new THREE.Mesh(new THREE.BoxGeometry(backdropThick + 0.06, 0.12, totalD + 0.04), curbMat);
  westBackdropCap.position.set(xMin + backdropThick / 2, backdropTopY + 0.06, centerZ);
  westBackdropCap.castShadow = true;
  terrainGroup.add(westBackdropCap);

  // 2. North Concrete Backdrop Wall (z ∈ [-10.76, -10.52], x ∈ [xMin + backdropThick, 12.00])
  const northBackdropW = totalW - backdropThick;
  const northBackdropGeo = new THREE.BoxGeometry(northBackdropW, backdropH, backdropThick);
  const northBackdropWall = new THREE.Mesh(northBackdropGeo, backdropWallMat);
  northBackdropWall.position.set(xMin + backdropThick + northBackdropW / 2, backdropBotY + backdropH / 2, zMin + backdropThick / 2);
  northBackdropWall.castShadow = true;
  northBackdropWall.receiveShadow = true;
  terrainGroup.add(northBackdropWall);

  const northBackdropCap = new THREE.Mesh(new THREE.BoxGeometry(northBackdropW + 0.06, 0.12, backdropThick + 0.06), curbMat);
  northBackdropCap.position.set(xMin + backdropThick + northBackdropW / 2, backdropTopY + 0.06, zMin + backdropThick / 2);
  northBackdropCap.castShadow = true;
  terrainGroup.add(northBackdropCap);

  // =========================================================================
  // 3. FRONT MAIN ROAD SURFACE (x ∈ [xMin + 0.24, 12], z ∈ [5, 12], y = 0.005)
  // =========================================================================
  const roadW = 12.0 - (xMin + backdropThick);
  const roadCenterX = (xMin + backdropThick + 12.0) / 2;
  const roadLength = 7;
  const roadGeo = new THREE.PlaneGeometry(roadW, roadLength, 24, 14);
  roadGeo.rotateX(-Math.PI / 2);

  const roadPos = roadGeo.attributes.position;
  for (let i = 0; i < roadPos.count; i++) {
    const worldZ = 8.5 + roadPos.getZ(i);
    const dist = Math.abs(worldZ - 8.5);
    const crown = Math.max(0, 0.015 * (1.0 - Math.pow(dist / 3.5, 2)));
    roadPos.setY(i, crown);
  }
  roadGeo.computeVertexNormals();

  const roadMesh = new THREE.Mesh(roadGeo, asphaltRoadMat);
  roadMesh.position.set(roadCenterX, 0.005, 8.5);
  roadMesh.receiveShadow = true;
  terrainGroup.add(roadMesh);

  // Gutter channel strip along curb
  const gutterGeo = new THREE.PlaneGeometry(roadW, 0.25);
  gutterGeo.rotateX(-Math.PI / 2);
  const gutterMat = new THREE.MeshStandardMaterial({
    color: 0x6e6d68,
    roughness: 0.78,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1
  });
  const gutterMesh = new THREE.Mesh(gutterGeo, gutterMat);
  gutterMesh.position.set(roadCenterX, 0.012, 5.125);
  gutterMesh.receiveShadow = true;
  terrainGroup.add(gutterMesh);

  // Organic Road Puddle
  const puddleGeo = createOrganicPuddleGeometry(1.55, 7.25, 1.25, 0.68, 48, 8);
  const puddleMat = new THREE.MeshStandardMaterial({
    color: 0x3b5878,
    alphaMap: textures.puddle ? textures.puddle.alpha : null,
    roughness: 0.04,
    metalness: 0.25,
    envMapIntensity: 1.8,
    transparent: true,
    opacity: 0.58,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3
  });
  const puddleMesh = new THREE.Mesh(puddleGeo, puddleMat);
  puddleMesh.receiveShadow = true;
  terrainGroup.add(puddleMesh);

  // Storm Drain Grates along gutter
  const grateGeo = new THREE.PlaneGeometry(0.85, 0.35);
  grateGeo.rotateX(-Math.PI / 2);
  const grateMat = new THREE.MeshStandardMaterial({
    map: textures.drainGrate,
    roughness: 0.45,
    metalness: 0.75,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2
  });

  [-7.5, -0.8].forEach(gx => {
    const grate = new THREE.Mesh(grateGeo, grateMat);
    grate.position.set(gx, 0.016, 5.14);
    grate.receiveShadow = true;
    terrainGroup.add(grate);
  });

  // Recessed Cast-Iron Manhole
  const manholeGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.02, 32);
  const manholeMat = new THREE.MeshStandardMaterial({
    map: textures.manhole,
    roughness: 0.65,
    metalness: 0.45
  });
  const manholeRimGeo = new THREE.TorusGeometry(0.56, 0.025, 8, 32);
  manholeRimGeo.rotateX(Math.PI / 2);
  const manholeRimMat = new THREE.MeshStandardMaterial({
    color: 0x1f1e1d,
    roughness: 0.8,
    metalness: 0.4
  });

  const manholePos = { x: -4.5, z: 8.5 };
  const mh = new THREE.Mesh(manholeGeo, manholeMat);
  mh.position.set(manholePos.x, 0.018, manholePos.z);
  mh.receiveShadow = true;
  terrainGroup.add(mh);

  const rim = new THREE.Mesh(manholeRimGeo, manholeRimMat);
  rim.position.set(manholePos.x, 0.021, manholePos.z);
  rim.receiveShadow = true;
  terrainGroup.add(rim);

  // Road Markings
  const markingMat = new THREE.MeshStandardMaterial({
    color: 0xedeae4,
    roughness: 0.7,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2
  });

  // 1. Crosswalk Zebra Stripes (x ∈ [3.8, 10.2], z ∈ [5.8, 11.2])
  const stripeWidth = 0.52;
  const stripeLength = 5.4;
  const stripeCount = 8;
  const startX = 3.8;
  const stepX = (10.2 - startX) / (stripeCount - 1);

  for (let s = 0; s < stripeCount; s++) {
    const stripeGeo = new THREE.PlaneGeometry(stripeWidth, stripeLength);
    stripeGeo.rotateX(-Math.PI / 2);
    const stripe = new THREE.Mesh(stripeGeo, markingMat);
    stripe.position.set(startX + s * stepX, 0.026, 8.5);
    stripe.receiveShadow = true;
    terrainGroup.add(stripe);
  }

  // 2. Stop Line before intersection (x ∈ [4.55, 10.2], z = 5.4)
  const stopLineGeo = new THREE.PlaneGeometry(5.65, 0.35);
  stopLineGeo.rotateX(-Math.PI / 2);
  const stopLine = new THREE.Mesh(stopLineGeo, markingMat);
  stopLine.position.set(7.375, 0.026, 5.4);
  stopLine.receiveShadow = true;
  terrainGroup.add(stopLine);

  // 3. Center Dashed Line (5 dashes inside tightened west bound)
  const dashLength = 1.1;
  const dashGap = 1.4;
  const dashStartX = -8.8;
  const dashStep = dashLength + dashGap;

  for (let i = 0; i < 5; i++) {
    const lx = dashStartX + i * dashStep;
    const dashGeo = new THREE.PlaneGeometry(dashLength, 0.18);
    dashGeo.rotateX(-Math.PI / 2);
    const dash = new THREE.Mesh(dashGeo, markingMat);
    dash.position.set(lx + dashLength / 2, 0.026, 8.5);
    dash.receiveShadow = true;
    terrainGroup.add(dash);
  }

  // 4. White Curb Edge Line
  const curbLineW = 3.5 - (xMin + backdropThick);
  const curbLineGeo = new THREE.PlaneGeometry(curbLineW, 0.15);
  curbLineGeo.rotateX(-Math.PI / 2);
  const curbLine = new THREE.Mesh(curbLineGeo, markingMat);
  curbLine.position.set((xMin + backdropThick + 3.5) / 2, 0.026, 5.3);
  curbLine.receiveShadow = true;
  terrainGroup.add(curbLine);

  // 5. Far Road Edge Line
  const farEdgeGeo = new THREE.PlaneGeometry(roadW, 0.15);
  farEdgeGeo.rotateX(-Math.PI / 2);
  const farEdge = new THREE.Mesh(farEdgeGeo, markingMat);
  farEdge.position.set(roadCenterX, 0.026, 11.7);
  farEdge.receiveShadow = true;
  terrainGroup.add(farEdge);

  // =========================================================================
  // 4. MAIN CORNER SIDEWALK & HARMONIZED CORNER PLATFORM (top at y = 0.252)
  // =========================================================================
  const swInnerXMin = xMin + backdropThick; // -10.82
  const swInnerZMin = zMin + backdropThick; // -10.52
  const swWidth = 4.42 - swInnerXMin;
  const swLength = 4.85 - swInnerZMin;
  const swTopGeo = new THREE.PlaneGeometry(swWidth, swLength);
  swTopGeo.rotateX(-Math.PI / 2);

  const swTopMesh = new THREE.Mesh(swTopGeo, sidewalkMat);
  swTopMesh.position.set((swInnerXMin + 4.42) / 2, 0.252, (swInnerZMin + 4.85) / 2);
  swTopMesh.receiveShadow = true;
  terrainGroup.add(swTopMesh);

  // South Curb West Segment (along z = 4.95, from swInnerXMin to x = 3.15)
  const southCurbW = 3.15 - swInnerXMin;
  const southCurbWestGeo = new THREE.BoxGeometry(southCurbW, 0.26, 0.20);
  const southCurbWestMesh = new THREE.Mesh(southCurbWestGeo, curbMat);
  southCurbWestMesh.position.set((swInnerXMin + 3.15) / 2, 0.13, 4.95);
  southCurbWestMesh.castShadow = true;
  southCurbWestMesh.receiveShadow = true;
  terrainGroup.add(southCurbWestMesh);

  // Flush Integrated Crosswalk Curb Cut (x ∈ [3.15, 4.35], z ∈ [4.85, 5.05])
  const curbRampGeo = new THREE.BufferGeometry();
  const xL0 = 3.15, xL1 = 3.35, xR0 = 4.15, xR1 = 4.35;
  const rZ0 = 4.85, rZ1 = 5.05;
  const yBot = 0.0, yCurb = 0.26, ySw = 0.252, yFront = 0.015;

  const rampVerts = new Float32Array([
    xL1, ySw,    rZ0,   xL1, yFront, rZ1,   xR0, yFront, rZ1,
    xL1, ySw,    rZ0,   xR0, yFront, rZ1,   xR0, ySw,    rZ0,
    xL0, yCurb,  rZ0,   xL0, yCurb,  rZ1,   xL1, ySw,    rZ0,
    xL1, ySw,    rZ0,   xL0, yCurb,  rZ1,   xL1, yFront, rZ1,
    xR0, ySw,    rZ0,   xR1, yCurb,  rZ1,   xR1, yCurb,  rZ0,
    xR0, ySw,    rZ0,   xR0, yFront, rZ1,   xR1, yCurb,  rZ1,
    xL0, yBot,   rZ1,   xL1, yBot,   rZ1,   xL1, yFront, rZ1,
    xL0, yBot,   rZ1,   xL1, yFront, rZ1,   xL0, yCurb,  rZ1,
    xL1, yBot,   rZ1,   xR0, yBot,   rZ1,   xR0, yFront, rZ1,
    xL1, yBot,   rZ1,   xR0, yFront, rZ1,   xL1, yFront, rZ1,
    xR0, yBot,   rZ1,   xR1, yBot,   rZ1,   xR1, yCurb,  rZ1,
    xR0, yBot,   rZ1,   xR1, yCurb,  rZ1,   xR0, yFront, rZ1,
    xR1, yBot,   rZ0,   xL0, yBot,   rZ0,   xL0, yCurb,  rZ0,
    xR1, yBot,   rZ0,   xL0, yCurb,  rZ0,   xR1, yCurb,  rZ0
  ]);

  const rampUVs = new Float32Array([
    0.15, 0,  0.15, 1,  0.85, 1,
    0.15, 0,  0.85, 1,  0.85, 0,
    0.0,  0,  0.0,  1,  0.15, 0,
    0.15, 0,  0.0,  1,  0.15, 1,
    0.85, 0,  1.0,  1,  1.0,  0,
    0.85, 0,  0.85, 1,  1.0,  1,
    0.0,  0,  0.15, 0,  0.15, 0.1,
    0.0,  0,  0.15, 0.1, 0.0, 1.0,
    0.15, 0,  0.85, 0,  0.85, 0.1,
    0.15, 0,  0.85, 0.1, 0.15, 0.1,
    0.85, 0,  1.0,  0,  1.0,  1.0,
    0.85, 0,  1.0,  1.0, 0.85, 0.1,
    0, 0,  1, 0,  1, 1,
    0, 0,  1, 1,  0, 1
  ]);
  curbRampGeo.setAttribute('position', new THREE.BufferAttribute(rampVerts, 3));
  curbRampGeo.setAttribute('uv', new THREE.BufferAttribute(rampUVs, 2));
  curbRampGeo.computeVertexNormals();

  const rampMesh = new THREE.Mesh(curbRampGeo, curbMat);
  rampMesh.castShadow = true;
  rampMesh.receiveShadow = true;
  terrainGroup.add(rampMesh);

  const cornerCurbGeo = new THREE.CylinderGeometry(0.20, 0.20, 0.26, 24, 1, false, 0, Math.PI / 2);
  const cornerCurbMesh = new THREE.Mesh(cornerCurbGeo, curbMat);
  cornerCurbMesh.position.set(4.35, 0.13, 4.85);
  cornerCurbMesh.castShadow = true;
  cornerCurbMesh.receiveShadow = true;
  terrainGroup.add(cornerCurbMesh);

  const zKnee = 4.477;
  const eastCurbLen = 4.85 - zKnee;
  const eastCurbBox = new THREE.BoxGeometry(0.20, 0.26, eastCurbLen);
  const eastCurbMesh = new THREE.Mesh(eastCurbBox, curbMat);
  eastCurbMesh.position.set(4.45, 0.13, (4.85 + zKnee) / 2);
  eastCurbMesh.castShadow = true;
  eastCurbMesh.receiveShadow = true;
  terrainGroup.add(eastCurbMesh);

  // Section 3 Fix: Harmonized Corner Platform at x = 3.75, z = 4.35 (matches surrounding sidewalk seamlessly)
  const tactileGeo = new THREE.PlaneGeometry(0.84, 0.84);
  tactileGeo.rotateX(-Math.PI / 2);
  const tactileMat = new THREE.MeshStandardMaterial({
    map: textures.tactile,
    color: 0xf4f0e8,
    roughness: 0.72,
    metalness: 0.04,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1
  });
  const tactileMesh = new THREE.Mesh(tactileGeo, tactileMat);
  tactileMesh.position.set(3.75, 0.255, 4.35);
  tactileMesh.receiveShadow = true;
  terrainGroup.add(tactileMesh);

  // =========================================================================
  // 5. SOLID SLOPED STREET (x ∈ [4.55, 10.19], z ∈ [swInnerZMin, 5.0])
  // =========================================================================
  const zNorthSlope = swInnerZMin; // -10.52
  const yNorthSlope = ((5.0 - zNorthSlope) / 17.0) * 2.6 + 0.005;

  const slopeWedgeGeo = new THREE.BufferGeometry();
  const vertices = new Float32Array([
    4.55, 0.005, 5.0,     10.19, 0.005, 5.0,    10.19, yNorthSlope, zNorthSlope,
    4.55, 0.005, 5.0,     10.19, yNorthSlope, zNorthSlope,   4.55, yNorthSlope, zNorthSlope
  ]);

  const uvs = new Float32Array([
    0.0, 0.0,   1.5, 0.0,   1.5, 3.8,
    0.0, 0.0,   1.5, 3.8,   0.0, 3.8
  ]);

  slopeWedgeGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  slopeWedgeGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  slopeWedgeGeo.computeVertexNormals();

  const slopeWedgeMesh = new THREE.Mesh(slopeWedgeGeo, asphaltRoadMat);
  slopeWedgeMesh.castShadow = true;
  slopeWedgeMesh.receiveShadow = true;
  terrainGroup.add(slopeWedgeMesh);

  // Watertight West Slope Concrete Retaining Wall (x ∈ [4.355, 4.545], z ∈ [zNorthSlope, 4.477])
  const wX0 = 4.355, wX1 = 4.545;
  const wTopNorth = yNorthSlope + 0.095;
  const westSlopeWallGeo = new THREE.BufferGeometry();
  const wWallVerts = new Float32Array([
    wX0, 0.0,  zKnee,   wX0, 0.20, zKnee,   wX0, wTopNorth, zNorthSlope,
    wX0, 0.0,  zKnee,   wX0, wTopNorth, zNorthSlope,   wX0, 0.0,  zNorthSlope,
    wX1, 0.0,  zKnee,   wX1, 0.0,  zNorthSlope,   wX1, wTopNorth, zNorthSlope,
    wX1, 0.0,  zKnee,   wX1, wTopNorth, zNorthSlope,   wX1, 0.20, zKnee,
    wX0, 0.0,  zNorthSlope,   wX0, wTopNorth, zNorthSlope,   wX1, wTopNorth, zNorthSlope,
    wX0, 0.0,  zNorthSlope,   wX1, wTopNorth, zNorthSlope,   wX1, 0.0,  zNorthSlope,
    wX0, 0.0,  zKnee,   wX0, 0.0,  zNorthSlope,   wX1, 0.0,  zNorthSlope,
    wX0, 0.0,  zKnee,   wX1, 0.0,  zNorthSlope,   wX1, 0.0,  zKnee
  ]);
  const wWallUVs = new Float32Array([
    0.0, 0.0,   0.0, 0.08,  2.8, 1.0,
    0.0, 0.0,   2.8, 1.0,   2.8, 0.0,
    0.0, 0.0,   2.8, 0.0,   2.8, 1.0,
    0.0, 0.0,   2.8, 1.0,   0.0, 0.08,
    0.0, 0.0,   0.0, 1.0,   0.2, 1.0,
    0.0, 0.0,   0.2, 1.0,   0.2, 0.0,
    0.0, 0.0,   0.0, 2.8,   0.2, 2.8,
    0.0, 0.0,   0.2, 2.8,   0.2, 0.0
  ]);
  westSlopeWallGeo.setAttribute('position', new THREE.BufferAttribute(wWallVerts, 3));
  westSlopeWallGeo.setAttribute('uv', new THREE.BufferAttribute(wWallUVs, 2));
  westSlopeWallGeo.computeVertexNormals();

  const westSlopeWallMesh = new THREE.Mesh(westSlopeWallGeo, wallMat);
  westSlopeWallMesh.castShadow = true;
  westSlopeWallMesh.receiveShadow = true;
  terrainGroup.add(westSlopeWallMesh);

  const cX0 = 4.35, cX1 = 4.55;
  const cZ0 = zKnee, cZ1 = zNorthSlope;
  const yTop0 = 0.26, yTop1 = yNorthSlope + 0.175;
  const yBot0 = 0.08, yBot1 = yNorthSlope - 0.005;

  const wSlopeCurbGeo = new THREE.BufferGeometry();
  const wCurbVerts = new Float32Array([
    cX0, yTop0, cZ0,   cX1, yTop0, cZ0,   cX1, yTop1, cZ1,
    cX0, yTop0, cZ0,   cX1, yTop1, cZ1,   cX0, yTop1, cZ1,
    cX0, yBot0, cZ0,   cX0, yTop0, cZ0,   cX0, yTop1, cZ1,
    cX0, yBot0, cZ0,   cX0, yTop1, cZ1,   cX0, yBot1, cZ1,
    cX1, yBot0, cZ0,   cX1, yBot1, cZ1,   cX1, yTop1, cZ1,
    cX1, yBot0, cZ0,   cX1, yTop1, cZ1,   cX1, yTop0, cZ0,
    cX0, yBot1, cZ1,   cX0, yTop1, cZ1,   cX1, yTop1, cZ1,
    cX0, yBot1, cZ1,   cX1, yTop1, cZ1,   cX1, yBot1, cZ1,
    cX0, yBot0, cZ0,   cX0, yBot1, cZ1,   cX1, yBot1, cZ1,
    cX0, yBot0, cZ0,   cX1, yBot1, cZ1,   cX1, yBot0, cZ0
  ]);
  const wCurbUVs = new Float32Array([
    0, 0,  1, 0,  1, 7,
    0, 0,  1, 7,  0, 7,
    0, 0,  0, 1,  7, 1,
    0, 0,  7, 1,  7, 0,
    0, 0,  7, 0,  7, 1,
    0, 0,  7, 1,  0, 1,
    0, 0,  0, 1,  1, 1,
    0, 0,  1, 1,  1, 0,
    0, 0,  0, 7,  1, 7,
    0, 0,  1, 7,  1, 0
  ]);
  wSlopeCurbGeo.setAttribute('position', new THREE.BufferAttribute(wCurbVerts, 3));
  wSlopeCurbGeo.setAttribute('uv', new THREE.BufferAttribute(wCurbUVs, 2));
  wSlopeCurbGeo.computeVertexNormals();

  const wSlopeCurb = new THREE.Mesh(wSlopeCurbGeo, curbMat);
  wSlopeCurb.castShadow = true;
  wSlopeCurb.receiveShadow = true;
  terrainGroup.add(wSlopeCurb);

  // East Slope Gutter Curb
  const slopeAngle = Math.atan2(2.6, 17.0);
  const eCurbZLen = 4.90 - zNorthSlope;
  const eCurbYRise = (eCurbZLen / 17.0) * 2.6;
  const eSlopeHypot = Math.sqrt(eCurbZLen * eCurbZLen + eCurbYRise * eCurbYRise);
  const eSlopeCurbGeo = new THREE.BoxGeometry(0.18, 0.22, eSlopeHypot);
  eSlopeCurbGeo.rotateX(slopeAngle);
  const eSlopeCurb = new THREE.Mesh(eSlopeCurbGeo, curbMat);
  eSlopeCurb.position.set(10.10, eCurbYRise / 2 + 0.11, (4.90 + zNorthSlope) / 2);
  eSlopeCurb.castShadow = true;
  eSlopeCurb.receiveShadow = true;
  terrainGroup.add(eSlopeCurb);

  const trenchGrateGeo = new THREE.PlaneGeometry(5.46, 0.25);
  trenchGrateGeo.rotateX(-Math.PI / 2);
  const trenchTex = textures.drainGrate.clone();
  trenchTex.repeat.set(7, 1);
  const trenchMat = new THREE.MeshStandardMaterial({
    map: trenchTex,
    roughness: 0.45,
    metalness: 0.75,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2
  });
  const trenchGrate = new THREE.Mesh(trenchGrateGeo, trenchMat);
  trenchGrate.position.set(7.28, 0.018, 5.125);
  trenchGrate.receiveShadow = true;
  terrainGroup.add(trenchGrate);

  // =========================================================================
  // 6. UPHILL RETAINING WALL & UPPER LEDGE (x ∈ [10.2, 12], z ∈ [zNorthSlope, 5])
  // =========================================================================
  const ledgeSpanZ = 5.0 - zNorthSlope;
  const ledgeCenterZ = (5.0 + zNorthSlope) / 2;

  const retWallGeo = new THREE.PlaneGeometry(ledgeSpanZ, 2.65);
  retWallGeo.rotateY(-Math.PI / 2);
  const retWallMesh = new THREE.Mesh(retWallGeo, wallMat);
  retWallMesh.name = 'retWallMesh';
  retWallMesh.position.set(10.20, 1.325, ledgeCenterZ);
  retWallMesh.castShadow = true;
  retWallMesh.receiveShadow = true;
  terrainGroup.add(retWallMesh);

  const frontWallGeo = new THREE.PlaneGeometry(1.8, 2.65);
  const frontWallMesh = new THREE.Mesh(frontWallGeo, wallMat);
  frontWallMesh.position.set(11.1, 1.325, 5.005);
  frontWallMesh.castShadow = true;
  frontWallMesh.receiveShadow = true;
  terrainGroup.add(frontWallMesh);

  const copingGeo = new THREE.BoxGeometry(0.28, 0.15, ledgeSpanZ - 0.14);
  const copingMesh = new THREE.Mesh(copingGeo, curbMat);
  copingMesh.position.set(10.2, 2.68, ledgeCenterZ - 0.07);
  copingMesh.castShadow = true;
  copingMesh.receiveShadow = true;
  terrainGroup.add(copingMesh);

  const frontCopingGeo = new THREE.BoxGeometry(1.94, 0.15, 0.28);
  const frontCopingMesh = new THREE.Mesh(frontCopingGeo, curbMat);
  frontCopingMesh.position.set(11.03, 2.68, 5.0);
  frontCopingMesh.castShadow = true;
  frontCopingMesh.receiveShadow = true;
  terrainGroup.add(frontCopingMesh);

  const weepGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.06, 12);
  weepGeo.rotateZ(Math.PI / 2);
  const weepMat = new THREE.MeshStandardMaterial({
    color: 0x0f0e0d,
    roughness: 0.9
  });

  for (let wz = 3.0; wz >= zNorthSlope + 0.6; wz -= 2.6) {
    const wy = ((5.0 - wz) / 17.0) * 2.6 + 0.28;
    const weep = new THREE.Mesh(weepGeo, weepMat);
    weep.position.set(10.18, wy, wz);
    terrainGroup.add(weep);
  }

  const upperLedgeGeo = new THREE.PlaneGeometry(1.8, ledgeSpanZ);
  upperLedgeGeo.rotateX(-Math.PI / 2);
  const upperLedgeDiff = textures.sidewalk.diffuse.clone();
  upperLedgeDiff.repeat.set(2, 15);
  const upperLedgeBump = textures.sidewalk.bump.clone();
  upperLedgeBump.repeat.set(2, 15);
  const upperLedgeMat = new THREE.MeshStandardMaterial({
    map: upperLedgeDiff,
    bumpMap: upperLedgeBump,
    bumpScale: 0.02,
    roughness: 0.85
  });
  const upperLedgeMesh = new THREE.Mesh(upperLedgeGeo, upperLedgeMat);
  upperLedgeMesh.position.set(11.1, 2.605, ledgeCenterZ);
  upperLedgeMesh.castShadow = true;
  upperLedgeMesh.receiveShadow = true;
  terrainGroup.add(upperLedgeMesh);

  const upperCurbGeo = new THREE.BoxGeometry(0.12, 0.15, ledgeSpanZ - 0.14);
  const upperCurbMesh = new THREE.Mesh(upperCurbGeo, curbMat);
  upperCurbMesh.position.set(11.94, 2.68, ledgeCenterZ - 0.07);
  upperCurbMesh.castShadow = true;
  upperCurbMesh.receiveShadow = true;
  terrainGroup.add(upperCurbMesh);

  scene.add(terrainGroup);

  return {
    terrainGroup,
    retWallMesh,
    upperLedgeMesh,
    puddleMesh,
    westBackdropWall,
    northBackdropWall,
    bounds: { xMin, xMax, zMin, zMax },
    elevations: {
      road: 0.0,
      sidewalk: 0.25,
      upperLedge: 2.6,
      getSlopeHeightAtZ: (z) => {
        if (z >= 5.0) return 0.0;
        if (z <= -12.0) return 2.6;
        return ((5.0 - z) / 17.0) * 2.6;
      }
    }
  };
}
