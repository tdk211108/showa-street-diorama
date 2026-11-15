import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

/**
 * Phase 7 Remodel (`src/props.js`):
 *  1. Corner Neon Sign (`japan_neon_sign_pack.glb`) rotated 90° counter-clockwise (`rotY: -Math.PI / 2`)
 *     so its mounting brackets attach into the building's front facade wall (`-Z`).
 *  2. Oden Stand (`oden_stand_-_lowpoly_game_asset.glb`) relocated right next to the sloped-street corner
 *     (`x = 2.68, z = 2.65, rotY = Math.PI / 2`) with stools at `x = 3.55, z = 2.32 & 2.98` facing `-X`
 *     (inward toward the Oden Stand / building, opposite to the sloped street).
 *  3. Replaced utility pole with newly uploaded `japanese_electric_pole.glb` keeping its built-in `Cables_1_0`
 *     wires visible and extending every cable tip continuously to the West (`x = -10.82`) and North (`z = -10.52`)
 *     diorama boundary walls.
 *  4. Level Bicycle Wheels (`bikeGroup.rotation.z = 0, rotation.x = 0`) so both front and rear tires rest squarely on the ground.
 *  5. Unanimated Cat & Dog (`cat_2.glb`, `dog_2.glb`) kept 100% stationary on the ground (zero synthetic bob/sway).
 */

function createDeterministicRng(seed = 2026) {
  let s = seed;
  return function() {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function createCatenaryCableMesh(pStart, pEnd, sag = 0.28, radius = 0.015, material, lateralSway = 0.0) {
  const pts = [];
  const segments = 10;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = THREE.MathUtils.lerp(pStart.x, pEnd.x, t) + Math.sin(t * Math.PI) * lateralSway;
    const z = THREE.MathUtils.lerp(pStart.z, pEnd.z, t);
    const y = THREE.MathUtils.lerp(pStart.y, pEnd.y, t) - 4.0 * sag * t * (1.0 - t);
    pts.push(new THREE.Vector3(x, y, z));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const tubeGeo = new THREE.TubeGeometry(curve, 32, radius, 6, false);
  const mesh = new THREE.Mesh(tubeGeo, material);
  mesh.castShadow = true;
  return mesh;
}

function createExpressiveFaceTexture({
  eyeColor = '#2b5b84',
  hairColor = '#241c18',
  skinHex = '#ffe3c8',
  expression = 'happy'
} = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = skinHex;
  ctx.fillRect(0, 0, 256, 256);

  [78, 178].forEach((cx) => {
    const grad = ctx.createRadialGradient(cx, 152, 2, cx, 152, 24);
    grad.addColorStop(0, 'rgba(255, 115, 125, 0.48)');
    grad.addColorStop(1, 'rgba(255, 115, 125, 0.0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, 152, 24, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.strokeStyle = hairColor;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  [
    [62, 92, 82, 88, 98, 92],
    [158, 92, 174, 88, 194, 92]
  ].forEach(([x0, y0, cx, cy, x1, y1]) => {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(cx, cy, x1, y1);
    ctx.stroke();
  });

  [82, 174].forEach((ex) => {
    const ey = 122;
    if (expression === 'happy') {
      ctx.strokeStyle = '#1e1614';
      ctx.lineWidth = 6.5;
      ctx.beginPath();
      ctx.arc(ex, ey + 6, 17, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(ex, ey, 17, 19, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = eyeColor;
      ctx.beginPath();
      ctx.ellipse(ex, ey + 1, 12, 15, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#141218';
      ctx.beginPath();
      ctx.arc(ex, ey + 2, 6.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#181210';
      ctx.lineWidth = 5.5;
      ctx.beginPath();
      ctx.arc(ex, ey + 2, 17, Math.PI * 1.08, Math.PI * 1.92);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex - 5, ey - 5, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ex + 5, ey + 5, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  ctx.fillStyle = 'rgba(180, 120, 95, 0.55)';
  ctx.beginPath();
  ctx.arc(128, 148, 2.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#9e3b33';
  ctx.fillStyle = '#d9534f';
  ctx.lineWidth = 4.2;
  if (expression === 'talking' || expression === 'excited') {
    ctx.beginPath();
    ctx.arc(128, 172, 10, 0, Math.PI);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(128, 168, 12, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createHighDetailNPC({
  jacketColor = 0xd94f45,
  shirtColor = 0xfff8ee,
  bottomColor = 0x24344d,
  accentColor = 0xf4b942,
  hairColor = 0x261c18,
  eyeColor = '#2b5b84',
  hairStyle = 'ponytail',
  expression = 'smile',
  skirt = true,
  hasScarf = false,
  hasBag = false,
  hasHat = false,
  seated = false,
  scale = 1.0
} = {}) {
  const root = new THREE.Group();
  root.scale.setScalar(scale);

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffe3c8, roughness: 0.62 });
  const jacketMat = new THREE.MeshStandardMaterial({ color: jacketColor, roughness: 0.65 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.68 });
  const bottomMat = new THREE.MeshStandardMaterial({ color: bottomColor, roughness: 0.72 });
  const accentMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.55 });
  const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.52 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x2b211c, roughness: 0.50 });
  const sockMat = new THREE.MeshStandardMaterial({ color: 0xf7f4ef, roughness: 0.75 });

  const hips = new THREE.Group();
  hips.position.y = seated ? 0.56 : 0.80;
  root.add(hips);

  const torso = new THREE.Group();
  hips.add(torso);

  const innerChest = new THREE.Mesh(new THREE.CapsuleGeometry(0.122, 0.28, 10, 16), shirtMat);
  innerChest.position.y = 0.22;
  innerChest.castShadow = true;
  torso.add(innerChest);

  const outerJacket = new THREE.Mesh(
    new THREE.CylinderGeometry(0.136, 0.152, 0.34, 16, 1, false, -Math.PI * 0.82, Math.PI * 1.64),
    jacketMat
  );
  outerJacket.position.set(0, 0.21, -0.005);
  outerJacket.castShadow = true;
  torso.add(outerJacket);

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.024, 8, 18), accentMat);
  collar.rotation.x = Math.PI / 2 + 0.15;
  collar.position.set(0, 0.37, 0.01);
  torso.add(collar);

  const bowTie = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.045, 0.03), accentMat);
  bowTie.position.set(0, 0.32, 0.135);
  torso.add(bowTie);

  if (hasScarf) {
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.128, 0.038, 10, 20), accentMat);
    scarf.rotation.x = Math.PI / 2;
    scarf.position.set(0, 0.39, 0.01);
    scarf.castShadow = true;
    torso.add(scarf);

    const scarfTail = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.24, 0.025), accentMat);
    scarfTail.position.set(0.055, 0.26, 0.145);
    scarfTail.rotation.z = -0.12;
    torso.add(scarfTail);
  }

  if (hasBag) {
    const strap = new THREE.Mesh(new THREE.CylinderGeometry(0.142, 0.148, 0.34, 14, 1, true, 0, Math.PI * 2), shoeMat);
    strap.scale.set(1.02, 1.0, 0.22);
    strap.rotation.z = 0.65;
    strap.position.set(0, 0.21, 0);
    torso.add(strap);

    const satchel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.20), shoeMat);
    satchel.position.set(-0.155, 0.02, -0.02);
    satchel.castShadow = true;
    torso.add(satchel);
  }

  if (skirt) {
    const skirtBase = new THREE.Mesh(new THREE.CylinderGeometry(0.128, 0.205, 0.25, 18), bottomMat);
    skirtBase.position.y = 0.02;
    skirtBase.castShadow = true;
    hips.add(skirtBase);

    const hemStripe = new THREE.Mesh(new THREE.TorusGeometry(0.198, 0.008, 6, 20), accentMat);
    hemStripe.rotation.x = Math.PI / 2;
    hemStripe.position.y = -0.09;
    hips.add(hemStripe);
  } else {
    const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.134, 0.128, 0.18, 14), bottomMat);
    pelvis.position.y = 0.02;
    pelvis.castShadow = true;
    hips.add(pelvis);
  }

  const headGroup = new THREE.Group();
  headGroup.position.y = 0.45;
  torso.add(headGroup);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.054, 0.09, 10), skinMat);
  neck.position.y = 0.01;
  headGroup.add(neck);

  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.132, 20, 20), skinMat);
  headMesh.position.y = 0.11;
  headMesh.scale.set(0.96, 1.02, 0.96);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  const faceTex = createExpressiveFaceTexture({
    eyeColor,
    hairColor: '#' + new THREE.Color(hairColor).getHexString(),
    expression
  });
  const faceMat = new THREE.MeshStandardMaterial({
    map: faceTex,
    roughness: 0.58,
    metalness: 0.02,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1
  });
  const faceGeo = new THREE.SphereGeometry(0.1335, 16, 16, Math.PI * 0.25, Math.PI * 0.50, Math.PI * 0.30, Math.PI * 0.45);
  const faceMesh = new THREE.Mesh(faceGeo, faceMat);
  faceMesh.position.y = 0.11;
  faceMesh.scale.set(0.96, 1.02, 0.96);
  headGroup.add(faceMesh);

  const hairCrown = new THREE.Mesh(
    new THREE.SphereGeometry(0.142, 18, 18, 0, Math.PI * 2, 0, Math.PI * 0.65),
    hairMat
  );
  hairCrown.position.set(0, 0.12, -0.008);
  hairCrown.rotation.x = -0.22;
  hairCrown.castShadow = true;
  headGroup.add(hairCrown);

  [-0.065, -0.022, 0.022, 0.065].forEach((bx, idx) => {
    const bang = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.11, 6), hairMat);
    bang.position.set(bx, 0.17, 0.118 - Math.abs(bx) * 0.25);
    bang.rotation.x = Math.PI + 0.22;
    bang.rotation.z = (idx - 1.5) * 0.08;
    headGroup.add(bang);
  });

  [-0.122, 0.122].forEach((sx) => {
    const lock = new THREE.Mesh(new THREE.CapsuleGeometry(0.024, 0.13, 6, 8), hairMat);
    lock.position.set(sx, 0.06, 0.045);
    lock.rotation.z = sx > 0 ? 0.12 : -0.12;
    headGroup.add(lock);
  });

  if (hairStyle === 'ponytail') {
    const tie = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.012, 6, 12), accentMat);
    tie.position.set(0, 0.15, -0.135);
    headGroup.add(tie);

    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.24, 10), hairMat);
    tail.position.set(0, 0.06, -0.19);
    tail.rotation.x = -Math.PI * 0.72;
    tail.castShadow = true;
    headGroup.add(tail);
  } else if (hairStyle === 'twintails') {
    [-0.13, 0.13].forEach((tx) => {
      const tie = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 8), accentMat);
      tie.position.set(tx, 0.14, -0.06);
      headGroup.add(tie);

      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.24, 10), hairMat);
      tail.position.set(tx * 1.25, 0.03, -0.08);
      tail.rotation.z = tx > 0 ? -0.35 : 0.35;
      tail.rotation.x = Math.PI;
      headGroup.add(tail);
    });
  } else if (hairStyle === 'bun') {
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 12), hairMat);
    bun.position.set(0, 0.22, -0.09);
    headGroup.add(bun);

    const kanzashi = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.18, 6), accentMat);
    kanzashi.rotation.z = Math.PI / 3;
    kanzashi.position.set(0, 0.22, -0.09);
    headGroup.add(kanzashi);
  }

  if (hasHat) {
    const beret = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.145, 0.055, 16), accentMat);
    beret.position.set(0.015, 0.24, -0.01);
    beret.rotation.z = -0.18;
    beret.castShadow = true;
    headGroup.add(beret);
  }

  function createArm(side) {
    const shoulderPivot = new THREE.Group();
    shoulderPivot.position.set(side * 0.175, 0.35, 0);
    shoulderPivot.rotation.z = -side * 0.14;

    const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.038, 0.13, 8, 10), jacketMat);
    upperArm.position.y = -0.08;
    upperArm.castShadow = true;
    shoulderPivot.add(upperArm);

    const elbowPivot = new THREE.Group();
    elbowPivot.position.y = -0.16;
    shoulderPivot.add(elbowPivot);

    const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.032, 0.13, 8, 10), shirtMat);
    forearm.position.y = -0.08;
    forearm.castShadow = true;
    elbowPivot.add(forearm);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 10), skinMat);
    hand.position.y = -0.17;
    elbowPivot.add(hand);

    torso.add(shoulderPivot);
    return { shoulderPivot, elbowPivot, hand };
  }

  const leftArm = createArm(1);
  const rightArm = createArm(-1);

  function createLeg(side) {
    const hipPivot = new THREE.Group();
    hipPivot.position.set(side * 0.072, 0, 0);

    const thighMat = skirt ? skinMat : bottomMat;
    const thighLen = seated ? 0.30 : 0.34;
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.046, thighLen - 0.08, 8, 10), thighMat);
    thigh.position.y = -thighLen / 2;
    thigh.castShadow = true;
    hipPivot.add(thigh);

    const kneePivot = new THREE.Group();
    kneePivot.position.y = -thighLen;
    hipPivot.add(kneePivot);

    const calfMat = skirt ? sockMat : bottomMat;
    const calfLen = 0.32;
    const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.032, calfLen, 10), calfMat);
    calf.position.y = -calfLen / 2;
    calf.castShadow = true;
    kneePivot.add(calf);

    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.078, 0.056, 0.145), shoeMat);
    shoe.position.set(0, -calfLen - 0.02, 0.028);
    shoe.castShadow = true;
    kneePivot.add(shoe);

    if (seated) {
      hipPivot.rotation.x = -Math.PI * 0.44;
      kneePivot.rotation.x = Math.PI * 0.42;
    }

    hips.add(hipPivot);
    return { hipPivot, kneePivot };
  }

  const leftLeg = createLeg(1);
  const rightLeg = createLeg(-1);

  return {
    root,
    hips,
    torso,
    headGroup,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg
  };
}

function computeAccurateBox(rootObj) {
  rootObj.updateMatrixWorld(true);
  const box = new THREE.Box3();
  const v = new THREE.Vector3();
  let hasPoints = false;

  rootObj.traverse((o) => {
    if (o.visible === false) return;
    if (o.isMesh && o.geometry && o.geometry.attributes && o.geometry.attributes.position) {
      const pos = o.geometry.attributes.position;
      const step = Math.max(1, Math.floor(pos.count / 600));
      for (let i = 0; i < pos.count; i += step) {
        if (o.isSkinnedMesh && typeof o.applyBoneTransform === 'function') {
          if (o.skeleton && i === 0) o.skeleton.update();
          v.fromBufferAttribute(pos, i);
          o.applyBoneTransform(i, v);
          v.applyMatrix4(o.matrixWorld);
        } else {
          v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
        }
        if (Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z)) {
          box.expandByPoint(v);
          hasPoints = true;
        }
      }
    }
  });

  if (!hasPoints) {
    box.setFromObject(rootObj);
  }
  return box;
}

function computeTrunkBaseCenterXZ(rootObj, box, bottomFraction = 0.06) {
  const minY = box.min.y;
  const maxY = box.max.y;
  const thresholdY = minY + (maxY - minY) * bottomFraction;
  const v = new THREE.Vector3();
  let sumX = 0, sumZ = 0, count = 0;

  rootObj.traverse((o) => {
    if (o.visible === false) return;
    if (o.isMesh && o.geometry && o.geometry.attributes && o.geometry.attributes.position) {
      const pos = o.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
        if (v.y <= thresholdY) {
          sumX += v.x;
          sumZ += v.z;
          count++;
        }
      }
    }
  });

  if (count > 0) {
    return { x: sumX / count, z: sumZ / count };
  }
  const c = box.getCenter(new THREE.Vector3());
  return { x: c.x, z: c.z };
}

function createNormalizedAssetWrapper(sourceObj, {
  targetHeight = null,
  targetSize = null,
  rotX = 0,
  rotY = 0,
  rotZ = 0,
  alignToTrunkBase = false,
  emissiveBoost = 0,
  emissiveColor = null,
  tintColor = null,
  castShadow = true,
  receiveShadow = true
} = {}) {
  const wrapper = new THREE.Group();
  const inner = new THREE.Group();
  inner.add(sourceObj);

  if (rotX) sourceObj.rotation.x += rotX;
  if (rotY) sourceObj.rotation.y += rotY;
  if (rotZ) sourceObj.rotation.z += rotZ;

  sourceObj.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = castShadow;
      child.receiveShadow = receiveShadow;
      child.frustumCulled = false;
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        const clonedMats = mats.map((m) => {
          const cm = m.clone();
          if (cm.map) {
            cm.map.colorSpace = THREE.SRGBColorSpace;
          }
          if (tintColor !== null && cm.color) {
            cm.color.lerp(new THREE.Color(tintColor), 0.38);
          }
          if (emissiveBoost > 0 && cm.emissive) {
            if (emissiveColor !== null) {
              cm.emissive.setHex(emissiveColor);
            } else if (cm.map && !cm.emissiveMap) {
              cm.emissiveMap = cm.map;
              cm.emissive.setHex(0xffffff);
            }
            cm.emissiveIntensity = Math.max(cm.emissiveIntensity || 0, emissiveBoost);
          }
          return cm;
        });
        child.material = Array.isArray(child.material) ? clonedMats : clonedMats[0];
      }
    }
  });

  const box = computeAccurateBox(inner);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const anchorXZ = alignToTrunkBase
    ? computeTrunkBaseCenterXZ(inner, box, 0.06)
    : { x: center.x, z: center.z };

  let sx = 1, sy = 1, sz = 1;
  if (Array.isArray(targetSize) && targetSize.length === 3) {
    sx = size.x > 1e-5 ? targetSize[0] / size.x : 1;
    sy = size.y > 1e-5 ? targetSize[1] / size.y : 1;
    sz = size.z > 1e-5 ? targetSize[2] / size.z : 1;
  } else if (targetHeight !== null && size.y > 1e-5) {
    const s = targetHeight / size.y;
    sx = s;
    sy = s;
    sz = s;
  }

  inner.scale.set(sx, sy, sz);
  inner.position.set(-anchorXZ.x * sx, -box.min.y * sy, -anchorXZ.z * sz);
  wrapper.add(inner);
  wrapper.userData.normScale = { sx, sy, sz, anchorXZ, minY: box.min.y };
  return wrapper;
}

function prepareCherryTreeMaterials(treeRoot) {
  treeRoot.traverse((child) => {
    if (!child.isMesh || !child.material) return;
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    const fixedMats = mats.map((m) => {
      const mat = m.clone();
      if (mat.map) {
        mat.map.colorSpace = THREE.SRGBColorSpace;
      }
      const matName = (mat.name || '').toLowerCase();

      if (matName.includes('blossoms')) {
        mat.transparent = false;
        mat.alphaTest = 0.32;
        mat.depthWrite = true;
        mat.side = THREE.DoubleSide;
        mat.color.setHex(0xffd8e4);
        mat.emissive.setHex(0xffacc2);
        mat.emissiveIntensity = 0.14;
        mat.roughness = 0.75;
      }

      if (matName === 'material.002' && mat.map && mat.map.image) {
        const img = mat.map.image;
        if (img.width && img.height && !mat.userData.alphaProcessed) {
          const cnv = document.createElement('canvas');
          cnv.width = Math.min(img.width, 1024);
          cnv.height = Math.min(img.height, 1024);
          const ctx = cnv.getContext('2d');
          ctx.drawImage(img, 0, 0, cnv.width, cnv.height);
          const imgData = ctx.getImageData(0, 0, cnv.width, cnv.height);
          const d = imgData.data;
          const w = cnv.width;
          for (let p = 0; p < d.length; p += 4) {
            const r = d[p], g = d[p + 1], b = d[p + 2];
            const pxIdx = p >> 2;
            const u = (pxIdx % w) / w;
            if (u > 0.46) {
              if ((r > 236 && g > 232 && b > 235) || (r < 20 && g < 20 && b < 20)) {
                d[p + 3] = 0;
              }
            } else {
              const distBg = Math.abs(r - 90) + Math.abs(g - 97) + Math.abs(b - 54);
              if (distBg < 26 || (r < 18 && g < 18 && b < 18)) {
                d[p + 3] = 0;
              }
            }
          }
          ctx.putImageData(imgData, 0, 0);
          const newTex = new THREE.CanvasTexture(cnv);
          newTex.colorSpace = THREE.SRGBColorSpace;
          newTex.flipY = mat.map.flipY;
          mat.map = newTex;
          mat.userData.alphaProcessed = true;
        }
        mat.transparent = false;
        mat.alphaTest = 0.35;
        mat.depthWrite = true;
        mat.side = THREE.DoubleSide;
        mat.emissive.setHex(0xffb5c8);
        mat.emissiveIntensity = 0.12;
      }

      mat.needsUpdate = true;
      return mat;
    });
    child.material = Array.isArray(child.material) ? fixedMats : fixedMats[0];
  });
}

function prepareOdenStandMaterials(odenRoot) {
  odenRoot.traverse((child) => {
    if (!child.isMesh || !child.material) return;
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    const fixedMats = mats.map((m) => {
      const stdMat = new THREE.MeshStandardMaterial({
        name: m.name,
        map: m.map || null,
        normalMap: m.normalMap || null,
        roughnessMap: m.roughnessMap || null,
        metalnessMap: m.metalnessMap || null,
        color: m.color ? m.color.clone() : new THREE.Color(0xffffff),
        roughness: 0.65,
        metalness: 0.08,
        side: THREE.DoubleSide,
        transparent: false,
        alphaTest: 0.25,
        depthWrite: true
      });
      if (stdMat.map) {
        stdMat.map.colorSpace = THREE.SRGBColorSpace;
      }
      return stdMat;
    });
    child.material = Array.isArray(child.material) ? fixedMats : fixedMats[0];
  });
}

export function initProps(scene, textures, terrainData = null, buildingData = null, onAssetProgress = null) {
  const propsGroup = new THREE.Group();
  propsGroup.name = 'showa_street_props';
  const rand = createDeterministicRng(1984);

  const swY = terrainData?.elevations?.sidewalk ?? 0.25;
  const upperY = terrainData?.elevations?.upperLedge ?? 2.605;
  const getSlopeY = terrainData?.elevations?.getSlopeHeightAtZ ?? ((z) => {
    if (z >= 5.0) return 0.0;
    if (z <= -12.0) return 2.6;
    return ((5.0 - z) / 17.0) * 2.6;
  });

  const mixers = [];
  const propLights = [];

  // =========================================================================
  // SHARED MATERIALS
  // =========================================================================
  const castIronDarkMat = new THREE.MeshStandardMaterial({
    color: 0x232528,
    roughness: 0.78,
    metalness: 0.45
  });

  const postalRedMat = new THREE.MeshStandardMaterial({
    color: 0xcc2e2b,
    roughness: 0.32,
    metalness: 0.25
  });

  const postalBodyTexturedMat = new THREE.MeshStandardMaterial({
    map: textures.postbox,
    roughness: 0.34,
    metalness: 0.22
  });

  const cableBlackMat = new THREE.MeshStandardMaterial({
    color: 0x181a1d,
    roughness: 0.60,
    metalness: 0.25
  });

  const porcelainWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xeef2f5,
    roughness: 0.15,
    metalness: 0.10
  });

  const porcelainBrownMat = new THREE.MeshStandardMaterial({
    color: 0x5c3828,
    roughness: 0.20,
    metalness: 0.15
  });

  const planterStoneMat = new THREE.MeshStandardMaterial({
    map: textures.curb,
    color: 0xc8c1b4,
    roughness: 0.78
  });
  const soilMat = new THREE.MeshStandardMaterial({ color: 0x2c221b, roughness: 0.95 });

  // =========================================================================
  // 1. JAPANESE RED POSTBOX (Marugata Post #1) at x = -10.25, z = 4.25
  // =========================================================================
  const postboxGroup = new THREE.Group();
  postboxGroup.name = 'japanese_red_postbox';
  postboxGroup.position.set(-10.25, swY, 4.25);

  const pbBase1 = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.28, 0.10, 20), castIronDarkMat);
  pbBase1.position.y = 0.05;
  pbBase1.castShadow = true;
  postboxGroup.add(pbBase1);

  const pbBase2 = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.25, 0.12, 20), castIronDarkMat);
  pbBase2.position.y = 0.16;
  pbBase2.castShadow = true;
  postboxGroup.add(pbBase2);

  const pbBodyGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.88, 24);
  pbBodyGeo.rotateY(-Math.PI / 2);
  const pbBody = new THREE.Mesh(pbBodyGeo, postalBodyTexturedMat);
  pbBody.position.y = 0.66;
  pbBody.castShadow = true;
  pbBody.receiveShadow = true;
  postboxGroup.add(pbBody);

  [0.24, 0.76, 1.08].forEach(ry => {
    const ringGeo = new THREE.TorusGeometry(0.228, 0.015, 10, 24);
    ringGeo.rotateX(Math.PI / 2);
    const ring = new THREE.Mesh(ringGeo, postalRedMat);
    ring.position.y = ry;
    postboxGroup.add(ring);
  });

  const slotVisor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.025, 0.08), postalRedMat);
  slotVisor.position.set(0, 0.96, 0.22);
  slotVisor.rotation.x = 0.22;
  postboxGroup.add(slotVisor);

  const pbDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.23, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.52),
    postalRedMat
  );
  pbDome.position.y = 1.08;
  pbDome.castShadow = true;
  postboxGroup.add(pbDome);

  const pbFinial = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.042, 0.05, 12), postalRedMat);
  pbFinial.position.y = 1.32;
  postboxGroup.add(pbFinial);

  propsGroup.add(postboxGroup);

  // =========================================================================
  // 2. RECESSED VENDING MACHINE NOOK: 3 DISTINCT VENDING MACHINES (x ∈ [-9.92, -6.12])
  // =========================================================================
  const vendingGroup = new THREE.Group();
  vendingGroup.name = 'recessed_vending_machine_nook_bank';

  const recycleBinMat = new THREE.MeshStandardMaterial({ color: 0x2c5e8a, roughness: 0.48, metalness: 0.25 });
  const recycleBin = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.82, 0.40), recycleBinMat);
  recycleBin.position.set(-10.18, swY + 0.41, 1.98);
  recycleBin.castShadow = true;
  vendingGroup.add(recycleBin);

  const recycleTop = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.42), porcelainWhiteMat);
  recycleTop.position.set(-10.18, swY + 0.89, 1.98);
  vendingGroup.add(recycleTop);

  const nookLight = new THREE.PointLight(0xffe4b5, 1.0, 4.0, 2.0);
  nookLight.position.set(-8.02, 1.65, 2.15);
  nookLight.castShadow = false;
  vendingGroup.add(nookLight);
  propLights.push({ light: nookLight, baseIntensity: 1.0, nightBoost: 1.9 });

  propsGroup.add(vendingGroup);

  // =========================================================================
  // 3. OPEN COUNTER & ODEN STAND NATURAL WOODEN STOOLS (`stool.glb`) & CUPS
  // =========================================================================
  const stoolsGroup = new THREE.Group();
  stoolsGroup.name = 'open_counter_wooden_stools';
  // Stools 1..4 along the Open Serving Counter;
  // Stools 5..6 at the Sloped-Street Corner Oden Stand (`x = 3.55, z = 2.32 & 2.98`), placed on the slope-edge side
  // so customers seated on them face `-X` (inward toward the Oden Stand & building, AWAY from the sloped street)!
  const stoolPlacements = [
    { x: -5.15, z: 2.22, rotY: 0.15 },
    { x: -4.15, z: 2.30, rotY: -0.22 },
    { x: -3.15, z: 2.24, rotY: 0.08 },
    { x: -2.18, z: 2.19, rotY: -0.35 },
    { x:  2.72, z: 2.94, rotY: Math.PI / 2 },
    { x:  2.72, z: 3.56, rotY: Math.PI / 2 }
  ];
  propsGroup.add(stoolsGroup);

  const cupsGroup = new THREE.Group();
  cupsGroup.name = 'table_and_counter_cups';
  propsGroup.add(cupsGroup);

  // =========================================================================
  // 4. RELOCATED ODEN STAND (`oden_stand_-_lowpoly_game_asset.glb`)
  //    Moved right next to the sloped-street corner (`x = 2.68, z = 2.65, rotY = Math.PI / 2`)
  //    so its serving counter faces `+X` and the stools at `x = 3.55` face `-X` (inward, away from the slope)!
  // =========================================================================
  const odenStandGroup = new THREE.Group();
  odenStandGroup.name = 'street_corner_oden_stand';
  odenStandGroup.position.set(3.48, swY, 3.25);

  const odenWarmLight = new THREE.PointLight(0xffa448, 1.8, 9.5, 1.5);
  odenWarmLight.position.set(-0.25, 1.65, 0);
  odenWarmLight.castShadow = false;
  odenStandGroup.add(odenWarmLight);
  propLights.push({ light: odenWarmLight, baseIntensity: 1.8, nightBoost: 2.6 });

  propsGroup.add(odenStandGroup);

  // =========================================================================
  // 5. BICYCLE LEVEL ON THE GROUND (`bike.glb`, x = 2.48, z = -0.65, BOTH WHEELS FLAT!)
  // =========================================================================
  const bikeGroup = new THREE.Group();
  bikeGroup.name = 'relocated_mamachari_bicycle';
  // Parked along the front green-tiled wall right next to menuBoard (x = 1.26, z = 2.02), both wheels flat on the ground!
  bikeGroup.position.set(1.26, swY, 2.02);
  bikeGroup.rotation.set(0, 0, 0);
  propsGroup.add(bikeGroup);

  // =========================================================================
  // 6. NEW UTILITY POLE (`japanese_electric_pole.glb`) AT (x = 3.75, z = 4.35)
  //    WITH BUILT-IN WIRES VISIBLE & EXTENDED TO THE MODEL BOUNDARIES!
  // =========================================================================
  const poleGroup = new THREE.Group();
  poleGroup.name = 'corner_utility_pole_denchu';
  const poleX = 3.75;
  const poleZ = 4.35;
  poleGroup.position.set(poleX, swY, poleZ);

  const poleStreetLight = new THREE.PointLight(0xffc270, 1.8, 15.0, 1.4);
  poleStreetLight.position.set(-0.45, 4.85, -0.22);
  poleStreetLight.castShadow = false;
  poleGroup.add(poleStreetLight);
  propLights.push({ light: poleStreetLight, baseIntensity: 1.8, nightBoost: 2.8 });

  propsGroup.add(poleGroup);

  const powerLinesGroup = new THREE.Group();
  powerLinesGroup.name = 'orthogonal_overhead_power_lines';
  propsGroup.add(powerLinesGroup);

  // =========================================================================
  // 7. TRAFFIC LIGHT (`traffic_light.glb`) WITH REAL INTERNAL LENS SWITCHING!
  //    - Vehicle 3-lens heads sits at x = [1.384, 1.678, 1.973], y = 4.431, z = ±0.325 (r = 0.132)
  //    - Pedestrian Box 1 (Object_32, +Z face) at x = -0.718, y = 2.815 & 2.535, z = +0.093
  //    - Pedestrian Box 2 (Object_40, +X face) at x = +0.102, y = 2.865 & 2.585, z = -0.558
  // =========================================================================
  const trafficLightGroup = new THREE.Group();
  trafficLightGroup.name = 'interactive_japanese_traffic_light';
  trafficLightGroup.position.set(4.18, swY, 4.58);
  trafficLightGroup.rotation.y = -Math.PI / 2;

  function createPedestrianLensTexture(type, isLit) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = isLit ? (type === 'red' ? '#3a0808' : '#063828') : '#141619';
    ctx.fillRect(0, 0, 128, 128);
    // Subtle LED matrix grid
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 128; i += 8) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 128); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(128, i); ctx.stroke();
    }
    ctx.fillStyle = isLit ? (type === 'red' ? '#ff3b30' : '#28ffbf') : (type === 'red' ? '#2a1212' : '#10241e');
    // Head
    ctx.beginPath();
    ctx.arc(64, 28, 12, 0, Math.PI * 2);
    ctx.fill();
    if (type === 'red') {
      // Standing figure
      ctx.fillRect(50, 44, 28, 38);
      ctx.fillRect(42, 46, 8, 30);
      ctx.fillRect(78, 46, 8, 30);
      ctx.fillRect(52, 82, 10, 32);
      ctx.fillRect(66, 82, 10, 32);
    } else {
      // Walking figure
      ctx.fillRect(52, 44, 24, 36);
      ctx.beginPath();
      ctx.moveTo(52, 48); ctx.lineTo(36, 70); ctx.lineTo(44, 74); ctx.lineTo(56, 54); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(74, 48); ctx.lineTo(90, 68); ctx.lineTo(82, 73); ctx.lineTo(70, 54); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(56, 78); ctx.lineTo(40, 112); ctx.lineTo(51, 114); ctx.lineTo(64, 82); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(68, 78); ctx.lineTo(86, 112); ctx.lineTo(75, 114); ctx.lineTo(62, 82); ctx.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  const lensOffsetsX = [1.384, 1.678, 1.973];
  const lensColors = [
    { off: 0x091713, on: 0x18ffa2 }, // 0: Green/Cyan (Go)
    { off: 0x1a1408, on: 0xffb800 }, // 1: Yellow (Caution)
    { off: 0x1a0909, on: 0xff2828 }  // 2: Red (Stop)
  ];

  const signalLensMats = [];
  const clickableTrafficMeshes = [];

  lensOffsetsX.forEach((lx, idx) => {
    const isInitActive = idx === 0;
    const lMat = new THREE.MeshStandardMaterial({
      color: isInitActive ? lensColors[idx].on : lensColors[idx].off,
      emissive: isInitActive ? lensColors[idx].on : 0x000000,
      emissiveIntensity: isInitActive ? 3.2 : 0.0,
      roughness: 0.18,
      metalness: 0.10
    });
    signalLensMats.push(lMat);

    // Place flush over BOTH +Z (0.325) and -Z (-0.325) faces of Object_4 (housing z = ±0.322)
    // plus an inner-hood glow ring inside Object_6 (z = ±0.39) so the hood interior glows with the active signal color!
    [1, -1].forEach((dirZ) => {
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.134, 0.134, 0.020, 28), lMat);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(lx, 4.431, dirZ * 0.325);
      trafficLightGroup.add(lens);
      clickableTrafficMeshes.push(lens);


    });
  });

  const pedRedTexOn = createPedestrianLensTexture('red', true);
  const pedRedTexOff = createPedestrianLensTexture('red', false);
  const pedGreenTexOn = createPedestrianLensTexture('green', true);
  const pedGreenTexOff = createPedestrianLensTexture('green', false);

  const pedRedMat = new THREE.MeshStandardMaterial({
    map: pedRedTexOff,
    emissiveMap: pedRedTexOff,
    emissive: 0x000000,
    emissiveIntensity: 0.0,
    roughness: 0.22
  });
  const pedGreenMat = new THREE.MeshStandardMaterial({
    map: pedGreenTexOn,
    emissiveMap: pedGreenTexOn,
    emissive: 0x18ffa2,
    emissiveIntensity: 2.6,
    roughness: 0.22
  });

  // Pedestrian Box 1 (Object_32, facing +Z in trafficLightGroup space)
  const ped1Top = new THREE.Mesh(new THREE.BoxGeometry(0.215, 0.205, 0.016), pedRedMat);
  ped1Top.position.set(-0.718, 2.815, 0.094);
  trafficLightGroup.add(ped1Top);
  clickableTrafficMeshes.push(ped1Top);

  const ped1Bot = new THREE.Mesh(new THREE.BoxGeometry(0.215, 0.205, 0.016), pedGreenMat);
  ped1Bot.position.set(-0.718, 2.535, 0.094);
  trafficLightGroup.add(ped1Bot);
  clickableTrafficMeshes.push(ped1Bot);

  // Pedestrian Box 2 (Object_40, facing +X in trafficLightGroup space -> faces crosswalk in world!)
  const ped2Top = new THREE.Mesh(new THREE.BoxGeometry(0.215, 0.205, 0.016), pedRedMat);
  ped2Top.rotation.y = Math.PI / 2;
  ped2Top.position.set(0.103, 2.865, -0.558);
  trafficLightGroup.add(ped2Top);
  clickableTrafficMeshes.push(ped2Top);

  const ped2Bot = new THREE.Mesh(new THREE.BoxGeometry(0.215, 0.205, 0.016), pedGreenMat);
  ped2Bot.rotation.y = Math.PI / 2;
  ped2Bot.position.set(0.103, 2.585, -0.558);
  trafficLightGroup.add(ped2Bot);
  clickableTrafficMeshes.push(ped2Bot);

  const trafficPointLight = new THREE.PointLight(0x18ffa2, 1.8, 6.5, 1.8);
  trafficPointLight.position.set(lensOffsetsX[0], 4.431, 0.45);
  trafficPointLight.castShadow = false;
  trafficLightGroup.add(trafficPointLight);

  propsGroup.add(trafficLightGroup);

  const trafficLightController = {
    phase: 0,
    autoMode: true,
    timer: 0,
    durations: [7.0, 4.0, 7.0],
    phaseNames: ['GREEN (GO)', 'YELLOW (CAUTION)', 'RED (STOP)'],
    clickableMeshes: clickableTrafficMeshes,
    onPhaseChange: null,

    setPhase(newPhase) {
      this.phase = ((newPhase % 3) + 3) % 3;
      this.timer = 0;

      signalLensMats.forEach((mat, idx) => {
        const active = idx === this.phase;
        mat.color.setHex(active ? lensColors[idx].on : lensColors[idx].off);
        mat.emissive.setHex(active ? lensColors[idx].on : 0x000000);
        mat.emissiveIntensity = active ? 3.2 : 0.0;
      });

      const pedWalk = this.phase === 0;
      pedGreenMat.map = pedWalk ? pedGreenTexOn : pedGreenTexOff;
      pedGreenMat.emissiveMap = pedWalk ? pedGreenTexOn : pedGreenTexOff;
      pedGreenMat.emissive.setHex(pedWalk ? 0x18ffa2 : 0x000000);
      pedGreenMat.emissiveIntensity = pedWalk ? 2.6 : 0.0;
      pedGreenMat.needsUpdate = true;

      pedRedMat.map = pedWalk ? pedRedTexOff : pedRedTexOn;
      pedRedMat.emissiveMap = pedWalk ? pedRedTexOff : pedRedTexOn;
      pedRedMat.emissive.setHex(pedWalk ? 0x000000 : 0xff2828);
      pedRedMat.emissiveIntensity = pedWalk ? 0.0 : 2.6;
      pedRedMat.needsUpdate = true;

      trafficPointLight.color.setHex(lensColors[this.phase].on);
      trafficPointLight.position.x = lensOffsetsX[this.phase];

      if (typeof this.onPhaseChange === 'function') {
        this.onPhaseChange(this.phase, this.phaseNames[this.phase], this.autoMode);
      }
    },

    cyclePhase() {
      this.setPhase((this.phase + 1) % 3);
    },

    toggleAuto() {
      this.autoMode = !this.autoMode;
      this.timer = 0;
      if (typeof this.onPhaseChange === 'function') {
        this.onPhaseChange(this.phase, this.phaseNames[this.phase], this.autoMode);
      }
      return this.autoMode;
    },

    update(dt, elapsed) {
      if (this.autoMode) {
        this.timer += dt;
        if (this.timer >= this.durations[this.phase]) {
          this.setPhase((this.phase + 1) % 3);
        }
      }
      const pulse = 2.8 + 0.45 * Math.sin(elapsed * 5.0);
      signalLensMats[this.phase].emissiveIntensity = pulse;
    }
  };

  // =========================================================================
  // 8. TRASH AREA (`trash.glb`) AT (x = 3.25, z = -7.65) + ROOFTOP & PHOENIX GROUPS
  // =========================================================================
  const trashGroup = new THREE.Group();
  trashGroup.name = 'residential_trash_bins';
  trashGroup.position.set(3.25, swY, -7.65);

  const trashFireLight = new THREE.PointLight(0xff7722, 1.4, 5.5, 1.8);
  trashFireLight.position.set(0.0, 0.95, 0.0);
  trashFireLight.castShadow = false;
  trashGroup.add(trashFireLight);
  propLights.push({ light: trashFireLight, baseIntensity: 1.4, nightBoost: 2.2 });

  propsGroup.add(trashGroup);

  const rooftopDecorGroup = new THREE.Group();
  rooftopDecorGroup.name = 'rooftop_smol_ame_terrarium';
  rooftopDecorGroup.position.set(0, 7.17, 0);
  propsGroup.add(rooftopDecorGroup);

  const phoenixFlightGroup = new THREE.Group();
  phoenixFlightGroup.name = 'soaring_phoenix_bird';
  phoenixFlightGroup.rotation.order = 'YXZ';
  phoenixFlightGroup.position.set(0.0, 11.5, 0.0);
  propsGroup.add(phoenixFlightGroup);

  // =========================================================================
  // 9. CLIMBING IVY & CENTERED CHERRY BLOSSOM TREES
  // =========================================================================
  const ivyGroup = new THREE.Group();
  ivyGroup.name = 'retaining_wall_climbing_ivy';

  const ivyClusterGeo = new THREE.DodecahedronGeometry(0.11, 1);
  ivyClusterGeo.scale(0.55, 1.05, 1.25);

  const ivyMaterials = [
    new THREE.MeshStandardMaterial({ color: 0x265432, roughness: 0.72 }),
    new THREE.MeshStandardMaterial({ color: 0x3f753e, roughness: 0.68 }),
    new THREE.MeshStandardMaterial({ color: 0x7b8c3a, roughness: 0.65 })
  ];

  const ivyBuckets = [[], [], []];
  const vineZPositions = [-9.6, -8.0, -6.4, -4.8, -3.2, -1.6, 0.0, 1.6, 3.2];

  for (let i = 0; i < 260; i++) {
    const anchorZ = vineZPositions[i % vineZPositions.length];
    const lz = THREE.MathUtils.clamp(anchorZ + (rand() - 0.5) * 1.5, -10.1, 4.4);
    const roadYAtZ = getSlopeY(lz);
    const verticalSpan = Math.max(0.35, 2.65 - (roadYAtZ + 0.26));
    const dropFrac = Math.pow(rand(), 1.35);
    const ly = 2.65 - dropFrac * verticalSpan;
    const lx = 10.16 - rand() * 0.04;

    const bucketIdx = dropFrac < 0.28 ? 2 : (rand() > 0.45 ? 1 : 0);
    ivyBuckets[bucketIdx].push({
      pos: new THREE.Vector3(lx, ly, lz),
      rot: new THREE.Euler(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI),
      scale: new THREE.Vector3(0.8 + rand() * 0.6, 0.8 + rand() * 0.7, 0.8 + rand() * 0.7)
    });
  }

  const dummy = new THREE.Object3D();
  ivyBuckets.forEach((items, bIdx) => {
    const instMesh = new THREE.InstancedMesh(ivyClusterGeo, ivyMaterials[bIdx], items.length);
    instMesh.castShadow = true;
    instMesh.receiveShadow = true;
    items.forEach((item, idx) => {
      dummy.position.copy(item.pos);
      dummy.rotation.copy(item.rot);
      dummy.scale.copy(item.scale);
      dummy.updateMatrix();
      instMesh.setMatrixAt(idx, dummy.matrix);
    });
    instMesh.instanceMatrix.needsUpdate = true;
    ivyGroup.add(instMesh);
  });
  propsGroup.add(ivyGroup);

  const treePlanterGroup = new THREE.Group();
  treePlanterGroup.name = 'cherry_blossom_trees_group';
  const treeCrowns = [];

  const treeSlots = [
    { x: 11.1, y: upperY, z: -1.8, scale: 0.96, height: 4.5, modelType: 'medium', rotY: 0.3 },
    { x: 11.1, y: upperY, z: -7.2, scale: 0.90, height: 4.2, modelType: 'full',   rotY: -1.1 },
    { x: 11.1, y: upperY, z:  2.6, scale: 0.82, height: 3.9, modelType: 'medium', rotY: 1.8 },
    { x:  1.45, y: swY,   z:  3.88, scale: 0.72, height: 3.3, modelType: 'medium', rotY: -0.5 }
  ];

  const treeAnchorGroups = treeSlots.map((slot) => {
    const tGroup = new THREE.Group();
    tGroup.position.set(slot.x, slot.y, slot.z);

    const pOuter = new THREE.Mesh(new THREE.BoxGeometry(1.06 * slot.scale, 0.22, 1.32 * slot.scale), planterStoneMat);
    pOuter.position.y = 0.11;
    pOuter.castShadow = true;
    pOuter.receiveShadow = true;
    tGroup.add(pOuter);

    const pSoil = new THREE.Mesh(new THREE.BoxGeometry(0.88 * slot.scale, 0.04, 1.14 * slot.scale), soilMat);
    pSoil.position.y = 0.21;
    tGroup.add(pSoil);

    const crownAnchor = new THREE.Group();
    crownAnchor.position.y = 0.20;
    tGroup.add(crownAnchor);
    treeCrowns.push(crownAnchor);

    treePlanterGroup.add(tGroup);
    return { tGroup, crownAnchor, slot };
  });

  propsGroup.add(treePlanterGroup);

  // =========================================================================
  // 10. DYNAMIC WEATHER & SEASON PARTICLE SYSTEM
  // =========================================================================
  const particleCount = 180;
  const petalGeo = new THREE.PlaneGeometry(0.08, 0.055);
  const petalMat = new THREE.MeshStandardMaterial({
    color: 0xffb7c5,
    emissive: 0xff9eb2,
    emissiveIntensity: 0.25,
    roughness: 0.6,
    side: THREE.DoubleSide
  });

  const fallingLeavesMesh = new THREE.InstancedMesh(petalGeo, petalMat, particleCount);
  fallingLeavesMesh.name = 'falling_leaves_particles';
  const leafParticles = [];

  for (let i = 0; i < particleCount; i++) {
    leafParticles.push({
      x: -10.5 + rand() * 22.0,
      y: 0.5 + rand() * 9.0,
      z: -9.5 + rand() * 20.0,
      vy: 0.42 + rand() * 0.45,
      vx: -0.22 - rand() * 0.25,
      vz: 0.15 + (rand() - 0.5) * 0.30,
      phase: rand() * Math.PI * 2,
      rotSpeedX: (rand() - 0.5) * 3.2,
      rotSpeedY: (rand() - 0.5) * 3.2,
      scale: 0.7 + rand() * 0.75
    });
  }
  propsGroup.add(fallingLeavesMesh);

  let currentWeatherMode = 'sakura';
  function setWeatherMode(mode) {
    currentWeatherMode = mode;
    fallingLeavesMesh.visible = mode !== 'clear';
    if (mode === 'sakura') {
      petalMat.color.setHex(0xffb7c5);
      petalMat.emissive.setHex(0xff9eb2);
      petalMat.emissiveIntensity = 0.25;
    } else if (mode === 'autumn') {
      petalMat.color.setHex(0xe86f2c);
      petalMat.emissive.setHex(0xc84b1c);
      petalMat.emissiveIntensity = 0.22;
    } else if (mode === 'rain') {
      petalMat.color.setHex(0x9ec8ff);
      petalMat.emissive.setHex(0x6ea8ff);
      petalMat.emissiveIntensity = 0.35;
    } else if (mode === 'snow') {
      petalMat.color.setHex(0xffffff);
      petalMat.emissive.setHex(0xdbeafe);
      petalMat.emissiveIntensity = 0.45;
    }
  }

  // =========================================================================
  // 11. HIGH-DETAIL, VIBRANT, EXPRESSIVE NPCS AROUND THE BUILDING
  // =========================================================================
  const npcGroup = new THREE.Group();
  npcGroup.name = 'animated_npcs_and_animals';
  propsGroup.add(npcGroup);

  const neonSignsGroup = new THREE.Group();
  neonSignsGroup.name = 'japan_neon_signs_and_lamps';
  propsGroup.add(neonSignsGroup);

  const animatedWalkers = [];
  const articulatedNPCs = [];

  // 1. Seated Counter Customer A (Stool 1 at x = -5.15, z = 2.28)
  const counterGirl = createHighDetailNPC({
    jacketColor: 0x1f3a60,
    shirtColor: 0xffffff,
    bottomColor: 0x1f3a60,
    accentColor: 0xd9383a,
    hairColor: 0x2b1d18,
    eyeColor: '#3a6ea5',
    hairStyle: 'twintails',
    expression: 'happy',
    skirt: true,
    seated: true,
    scale: 0.96
  });
  counterGirl.root.position.set(-5.15, swY + 0.02, 2.28);
  counterGirl.root.rotation.y = Math.PI - 0.08;
  npcGroup.add(counterGirl.root);
  articulatedNPCs.push({ npc: counterGirl, role: 'counter_sip', phase: 0.0 });

  // 2. Seated Counter Customer B (Stool 3 at x = -3.15, z = 2.28)
  const counterBoy = createHighDetailNPC({
    jacketColor: 0x2e6b56,
    shirtColor: 0xf7f1e5,
    bottomColor: 0x262930,
    accentColor: 0xe69f38,
    hairColor: 0x1c1817,
    eyeColor: '#4a7c59',
    hairStyle: 'short_spiky',
    expression: 'talking',
    skirt: false,
    hasScarf: true,
    seated: true,
    scale: 0.98
  });
  counterBoy.root.position.set(-3.15, swY + 0.02, 2.28);
  counterBoy.root.rotation.y = Math.PI + 0.10;
  npcGroup.add(counterBoy.root);
  articulatedNPCs.push({ npc: counterBoy, role: 'counter_chat', phase: 1.4 });

  // 3. Seated Oden Stand Customer A (Oden Stool 1 at x = 2.72, z = 2.94, facing +X into the rotated Oden Stand!)
  const odenCustomer = createHighDetailNPC({
    jacketColor: 0xc84b31,
    shirtColor: 0xfff5e4,
    bottomColor: 0x3d2c2e,
    accentColor: 0xf3c663,
    hairColor: 0x3b231a,
    eyeColor: '#8c4a27',
    hairStyle: 'bun',
    expression: 'happy',
    skirt: true,
    seated: true,
    scale: 0.96
  });
  odenCustomer.root.position.set(2.72, swY + 0.02, 2.94);
  odenCustomer.root.rotation.y = Math.PI / 2;
  npcGroup.add(odenCustomer.root);
  articulatedNPCs.push({ npc: odenCustomer, role: 'oden_eat', phase: 2.2 });

  // 3B. Seated Oden Stand Customer B (Oden Stool 2 at x = 2.72, z = 3.56, facing +X into the rotated Oden Stand!)
  const odenCustomer2 = createHighDetailNPC({
    jacketColor: 0x2b4c7e,
    shirtColor: 0xf8f9fa,
    bottomColor: 0x1e242b,
    accentColor: 0xe07a5f,
    hairColor: 0x1a1615,
    eyeColor: '#2b4c7e',
    hairStyle: 'short_spiky',
    expression: 'talking',
    skirt: false,
    hasScarf: true,
    seated: true,
    scale: 0.97
  });
  odenCustomer2.root.position.set(2.72, swY + 0.02, 3.56);
  odenCustomer2.root.rotation.y = Math.PI / 2 - 0.12;
  npcGroup.add(odenCustomer2.root);
  articulatedNPCs.push({ npc: odenCustomer2, role: 'counter_chat', phase: 0.9 });

  // 3C. Standing Street Lookout NPC 1 (Front Curb at x = 0.42, z = 4.45, facing +Z looking out across the main road!)
  const streetLookout1 = createHighDetailNPC({
    jacketColor: 0xd97736,
    shirtColor: 0xfff8eb,
    bottomColor: 0x2b303a,
    accentColor: 0x457b9d,
    hairColor: 0x3b241c,
    eyeColor: '#457b9d',
    hairStyle: 'ponytail',
    expression: 'smile',
    skirt: true,
    hasBag: true,
    seated: false,
    scale: 0.96
  });
  streetLookout1.root.position.set(0.42, swY, 4.45);
  streetLookout1.root.rotation.y = 0.08;
  npcGroup.add(streetLookout1.root);
  articulatedNPCs.push({ npc: streetLookout1, role: 'street_lookout', baseRotY: 0.08, phase: 0.4 });

  // 3D. Standing Corner Crosswalk Watcher NPC (Near intersection corner at x = 2.58, z = 4.52, facing +Z toward crosswalk)
  const cornerCrosswalkWatcher = createHighDetailNPC({
    jacketColor: 0x3d5a80,
    shirtColor: 0xffffff,
    bottomColor: 0x293241,
    accentColor: 0xee6c4d,
    hairColor: 0x221c1a,
    eyeColor: '#3d5a80',
    hairStyle: 'short_spiky',
    expression: 'excited',
    skirt: false,
    hasHat: true,
    hasBag: true,
    seated: false,
    scale: 0.98
  });
  cornerCrosswalkWatcher.root.position.set(2.58, swY, 4.52);
  cornerCrosswalkWatcher.root.rotation.y = 0.22;
  npcGroup.add(cornerCrosswalkWatcher.root);
  articulatedNPCs.push({ npc: cornerCrosswalkWatcher, role: 'street_lookout', baseRotY: 0.22, phase: 2.1 });

  // 3E. Standing Slope Street Watcher NPC (East Sidewalk Curb at x = 3.95, z = 0.45, facing +X looking out at sloped street & sakura)
  const slopeLookout = createHighDetailNPC({
    jacketColor: 0x81b29a,
    shirtColor: 0xfffdf7,
    bottomColor: 0x3d405b,
    accentColor: 0xf2cc8f,
    hairColor: 0x4a2e22,
    eyeColor: '#52796f',
    hairStyle: 'twintails',
    expression: 'happy',
    skirt: true,
    hasScarf: true,
    seated: false,
    scale: 0.96
  });
  slopeLookout.root.position.set(3.95, swY, 0.45);
  slopeLookout.root.rotation.y = Math.PI / 2;
  npcGroup.add(slopeLookout.root);
  articulatedNPCs.push({ npc: slopeLookout, role: 'street_lookout', baseRotY: Math.PI / 2, phase: 3.5 });

  // 3F. Menu Board Reader NPC (Standing at x = -0.15, z = 2.45 facing the flush menuBoard & Noren entrance)
  const menuReaderNpc = createHighDetailNPC({
    jacketColor: 0x9b4d5f,
    shirtColor: 0xfff5f5,
    bottomColor: 0x2b2d42,
    accentColor: 0xf7b267,
    hairColor: 0x2c1b18,
    eyeColor: '#8d3b4d',
    hairStyle: 'bun',
    expression: 'talking',
    skirt: true,
    hasBag: true,
    seated: false,
    scale: 0.95
  });
  menuReaderNpc.root.position.set(-0.15, swY, 2.45);
  menuReaderNpc.root.rotation.y = Math.PI - 0.25;
  npcGroup.add(menuReaderNpc.root);
  articulatedNPCs.push({ npc: menuReaderNpc, role: 'counter_chat', phase: 1.9 });

  // 4. Vending Machine Customer (x = -8.02, z = 2.38)
  const vendingPatron = createHighDetailNPC({
    jacketColor: 0x6b4c7a,
    shirtColor: 0xfff8f0,
    bottomColor: 0x2c3545,
    accentColor: 0xf4a261,
    hairColor: 0x4a2c20,
    eyeColor: '#6b4c7a',
    hairStyle: 'ponytail',
    expression: 'excited',
    skirt: true,
    hasHat: true,
    hasBag: true,
    seated: false,
    scale: 0.96
  });
  vendingPatron.root.position.set(-8.02, swY, 2.38);
  vendingPatron.root.rotation.y = Math.PI + 0.05;
  npcGroup.add(vendingPatron.root);
  articulatedNPCs.push({ npc: vendingPatron, role: 'vending_choose', phase: 0.8 });

  // 5. Walking Pedestrian 1 along Front Building Sidewalk (x ∈ [-9.5, -1.2], z = 3.55)
  const frontWalker = createHighDetailNPC({
    jacketColor: 0x3b6e8c,
    shirtColor: 0xffffff,
    bottomColor: 0x1f242d,
    accentColor: 0xe76f51,
    hairColor: 0x1f1916,
    eyeColor: '#2b5b84',
    hairStyle: 'short_spiky',
    expression: 'smile',
    skirt: false,
    hasBag: true,
    seated: false,
    scale: 0.98
  });
  frontWalker.root.position.set(-5.5, swY, 3.55);
  npcGroup.add(frontWalker.root);
  articulatedNPCs.push({
    npc: frontWalker,
    role: 'walker',
    startPos: new THREE.Vector3(-9.5, swY, 3.55),
    endPos: new THREE.Vector3(-1.2, swY, 3.55),
    speed: 0.14,
    phase: 0.0,
    rotForward: Math.PI / 2,
    rotBackward: -Math.PI / 2
  });

  // 6. Walking Pedestrian 2 along East Sidewalk beside Building Staircase (x = 3.32, z ∈ [-7.2, 0.8])
  const sideWalker = createHighDetailNPC({
    jacketColor: 0xe07a5f,
    shirtColor: 0xf4f1de,
    bottomColor: 0x3d405b,
    accentColor: 0xf2cc8f,
    hairColor: 0x2f1e18,
    eyeColor: '#3d405b',
    hairStyle: 'ponytail',
    expression: 'smile',
    skirt: true,
    hasScarf: true,
    seated: false,
    scale: 0.96
  });
  sideWalker.root.position.set(3.32, swY, -3.5);
  npcGroup.add(sideWalker.root);
  articulatedNPCs.push({
    npc: sideWalker,
    role: 'walker',
    startPos: new THREE.Vector3(3.32, swY, -7.2),
    endPos: new THREE.Vector3(3.32, swY, 0.8),
    speed: 0.13,
    phase: 0.45,
    rotForward: 0,
    rotBackward: Math.PI
  });

  // 7. Rooftop Seated Couple on Right-Front Garden Bench (x = -1.75, z = 0.58, sitting side-by-side facing +Z)
  const rooftopCoupleBoy = createHighDetailNPC({
    jacketColor: 0x2b4c7e,
    shirtColor: 0xffffff,
    bottomColor: 0x1f242d,
    accentColor: 0xe69f38,
    hairColor: 0x1c1817,
    eyeColor: '#2b5b84',
    hairStyle: 'short_spiky',
    expression: 'talking',
    skirt: false,
    hasScarf: true,
    seated: true,
    scale: 0.94
  });
  rooftopCoupleBoy.root.position.set(-2.06, -0.10, 0.66);
  rooftopCoupleBoy.root.rotation.y = 0.16;
  rooftopDecorGroup.add(rooftopCoupleBoy.root);
  articulatedNPCs.push({ npc: rooftopCoupleBoy, role: 'counter_chat', phase: 0.6 });

  const rooftopCoupleGirl = createHighDetailNPC({
    jacketColor: 0xd95f69,
    shirtColor: 0xfff8f6,
    bottomColor: 0x283044,
    accentColor: 0xf4c065,
    hairColor: 0x3b231a,
    eyeColor: '#8d3b4d',
    hairStyle: 'twintails',
    expression: 'happy',
    skirt: true,
    seated: true,
    scale: 0.92
  });
  rooftopCoupleGirl.root.position.set(-1.46, -0.10, 0.66);
  rooftopCoupleGirl.root.rotation.y = -0.18;
  rooftopDecorGroup.add(rooftopCoupleGirl.root);
  articulatedNPCs.push({ npc: rooftopCoupleGirl, role: 'counter_sip', phase: 1.8 });

  // 8. Rooftop Left-Bench Seated Patron (Sitting on Left-Front Bench at x = -7.45, z = 0.66, facing +Z)
  const rooftopBenchGirl = createHighDetailNPC({
    jacketColor: 0x457b9d,
    shirtColor: 0xf1faee,
    bottomColor: 0x1d3557,
    accentColor: 0xe63946,
    hairColor: 0x261c1a,
    eyeColor: '#457b9d',
    hairStyle: 'ponytail',
    expression: 'smile',
    skirt: true,
    hasBag: true,
    seated: true,
    scale: 0.93
  });
  rooftopBenchGirl.root.position.set(-7.45, -0.10, 0.66);
  rooftopBenchGirl.root.rotation.y = 0.06;
  rooftopDecorGroup.add(rooftopBenchGirl.root);
  articulatedNPCs.push({ npc: rooftopBenchGirl, role: 'counter_sip', phase: 2.7 });

  // 9. Rooftop East Balcony Lookout NPC (Standing near East railing at x = 1.15, z = -0.85, looking out at intersection)
  const rooftopBalconyWatcher = createHighDetailNPC({
    jacketColor: 0x52796f,
    shirtColor: 0xfffdf9,
    bottomColor: 0x2f3e46,
    accentColor: 0xe9c46a,
    hairColor: 0x2b1e19,
    eyeColor: '#354f52',
    hairStyle: 'bun',
    expression: 'excited',
    skirt: true,
    hasScarf: true,
    seated: false,
    scale: 0.95
  });
  rooftopBalconyWatcher.root.position.set(1.15, 0, -0.85);
  rooftopBalconyWatcher.root.rotation.y = Math.PI * 0.28;
  rooftopDecorGroup.add(rooftopBalconyWatcher.root);
  articulatedNPCs.push({ npc: rooftopBalconyWatcher, role: 'street_lookout', baseRotY: Math.PI * 0.28, phase: 1.2 });

  // 10. Rooftop Strolling NPC (Walking calmly across the central rooftop terrace x ∈ [-7.8, -3.2], z = -2.15)
  const rooftopStroller = createHighDetailNPC({
    jacketColor: 0xb56576,
    shirtColor: 0xfff9f5,
    bottomColor: 0x355070,
    accentColor: 0xeacdc2,
    hairColor: 0x2d1e1b,
    eyeColor: '#6d597a',
    hairStyle: 'ponytail',
    expression: 'smile',
    skirt: true,
    hasHat: true,
    seated: false,
    scale: 0.94
  });
  rooftopStroller.root.position.set(-5.5, 0, -2.15);
  rooftopDecorGroup.add(rooftopStroller.root);
  articulatedNPCs.push({
    npc: rooftopStroller,
    role: 'walker',
    startPos: new THREE.Vector3(-7.8, 0, -2.15),
    endPos: new THREE.Vector3(-3.2, 0, -2.15),
    speed: 0.11,
    phase: 0.3,
    rotForward: Math.PI / 2,
    rotBackward: -Math.PI / 2
  });

  // =========================================================================
  // 12. ASYNCHRONOUSLY LOAD & INTEGRATE ALL `.glb` ASSETS
  // =========================================================================
  const loader = new GLTFLoader();
  let totalGlbFiles = 0;
  let loadedGlbFiles = 0;

  function loadGlb(filename) {
    totalGlbFiles++;
    return new Promise((resolve) => {
      loader.load(
        `./assets/${filename}`,
        (gltf) => {
          loadedGlbFiles++;
          if (typeof onAssetProgress === 'function') {
            onAssetProgress({
              loaded: loadedGlbFiles,
              total: totalGlbFiles,
              filename,
              stage: 'loading'
            });
          }
          resolve(gltf);
        },
        undefined,
        (err) => {
          console.warn(`[GLB Loader] Could not load ${filename}:`, err);
          loadedGlbFiles++;
          if (typeof onAssetProgress === 'function') {
            onAssetProgress({
              loaded: loadedGlbFiles,
              total: totalGlbFiles,
              filename,
              stage: 'loading'
            });
          }
          resolve(null);
        }
      );
    });
  }

  const allAssetsLoadedPromise = (async () => {
    const [
      cherryTreeMedGltf,
      cherryTreeFullGltf,
      acUnitGltf,
      bikeGltf,
      cat1Gltf,
      cat2Gltf,
      cat3Gltf,
      dog1Gltf,
      dog2Gltf,
      dog3Gltf,
      newElectricPoleGltf,
      frierenGltf,
      japanLampGltf,
      neonSignPackGltf,
      elainaGltf,
      stoolGltf,
      trafficLightGltf,
      vm1Gltf,
      vm2Gltf,
      vmSoftDrinkGltf,
      teaCup1Gltf,
      teaCup2Gltf,
      cupSaucerGltf,
      odenStandGltf,
      smolAmeGltf,
      phoenixGltf,
      trashGltf,
      rooftopVentUnitGltf,
      barFenceGltf,
      roofTopVentGltf,
      gardenBenchGltf,
      industrialLadderGltf,
      lainGltf,
      pantagruelGltf,
      cyberstyleGltf,
      wallVineGltf,
      hvacUnitGltf,
      grapeVinesGltf,
      sweetPotatoVineGltf
    ] = await Promise.all([
      loadGlb('japanese_cherry_tree_medium-poly.glb'),
      loadGlb('japanese_cherry_tree.glb'),
      loadGlb('Outdoor_air_conditioner_unit.glb'),
      loadGlb('bike.glb'),
      loadGlb('cat_1.glb'),
      loadGlb('cat_2.glb'),
      loadGlb('cat_3.glb'),
      loadGlb('dog_1.glb'),
      loadGlb('dog_2.glb'),
      loadGlb('dog_3.glb'),
      loadGlb('japanese_electric_pole.glb'),
      loadGlb('frieren_plushie_decorator.glb'),
      loadGlb('japan_lamp.glb'),
      loadGlb('japan_neon_sign_pack.glb'),
      loadGlb('npc4.glb'),
      loadGlb('stool.glb'),
      loadGlb('traffic_light.glb'),
      loadGlb('vending_machine_1.glb'),
      loadGlb('vending_machine_2.glb'),
      loadGlb('japan_vending_machine_soft_drink.glb'),
      loadGlb('japanese_tea_cup.glb'),
      loadGlb('japanese_tea_cup_2.glb'),
      loadGlb('cup_and_saucer.glb'),
      loadGlb('oden_stand_-_lowpoly_game_asset.glb'),
      loadGlb('smol_ame_in_an_upcycled_terrarium_hololiveen.glb'),
      loadGlb('phoenix_bird.glb'),
      loadGlb('trash.glb'),
      loadGlb('rooftop_ventilation_unit.glb'),
      loadGlb('bar_fence.glb'),
      loadGlb('roof_top_vent.glb'),
      loadGlb('japanese_garden_bench.glb'),
      loadGlb('vintage_industrial_ladder.glb'),
      loadGlb('lain.glb'),
      loadGlb('pantagruel__anime_chibi_model.glb'),
      loadGlb('lowpoly_anime_character_cyberstyle.glb'),
      loadGlb('low_poly_wall_vine.glb'),
      loadGlb('hvac_unit.glb'),
      loadGlb('grape_vines.glb'),
      loadGlb('ornamental_sweet_potato_-_ipomea_batatas.glb')
    ]);

    // -----------------------------------------------------------------------
    // A. `japanese_cherry_tree_medium-poly.glb` & `japanese_cherry_tree.glb`
    // -----------------------------------------------------------------------
    if (cherryTreeMedGltf && cherryTreeMedGltf.scene) {
      prepareCherryTreeMaterials(cherryTreeMedGltf.scene);
    }
    if (cherryTreeFullGltf && cherryTreeFullGltf.scene) {
      prepareCherryTreeMaterials(cherryTreeFullGltf.scene);
    }

    treeAnchorGroups.forEach(({ crownAnchor, slot }) => {
      const sourceGltf = (slot.modelType === 'full' && cherryTreeFullGltf)
        ? cherryTreeFullGltf
        : (cherryTreeMedGltf || cherryTreeFullGltf);
      if (sourceGltf && sourceGltf.scene) {
        const treeClone = sourceGltf.scene.clone(true);
        const treeWrap = createNormalizedAssetWrapper(treeClone, {
          targetHeight: slot.height,
          rotY: slot.rotY,
          alignToTrunkBase: true
        });
        crownAnchor.add(treeWrap);
      }
    });

    // -----------------------------------------------------------------------
    // B. `Outdoor_air_conditioner_unit.glb`
    // -----------------------------------------------------------------------
    if (acUnitGltf && acUnitGltf.scene) {
      if (buildingData?.fallbackAcGroup) {
        buildingData.fallbackAcGroup.visible = false;
      }
      const acWall = createNormalizedAssetWrapper(acUnitGltf.scene.clone(true), {
        targetHeight: 0.72,
        rotY: Math.PI / 2
      });
      acWall.position.set(2.45, 4.17, -7.80);
      propsGroup.add(acWall);

// Removed rooftop AC unit per user rooftop remodel specification
    }

    // -----------------------------------------------------------------------
    // C. Recessed Vending Machine Nook
    // -----------------------------------------------------------------------
    if (vm1Gltf && vm1Gltf.scene) {
      const vmLeft = createNormalizedAssetWrapper(vm1Gltf.scene.clone(true), {
        targetSize: [1.12, 1.84, 0.68],
        rotY: 0,
        emissiveBoost: 0.14
      });
      vmLeft.position.set(-9.24, 0.45, 1.38);
      vendingGroup.add(vmLeft);
    }

    if (vm2Gltf && vm2Gltf.scene) {
      const vmCenter = createNormalizedAssetWrapper(vm2Gltf.scene.clone(true), {
        targetSize: [1.12, 1.84, 0.68],
        rotY: -Math.PI / 2,
        emissiveBoost: 0.14
      });
      vmCenter.position.set(-8.02, 0.45, 1.38);
      vendingGroup.add(vmCenter);
    }

    if (vmSoftDrinkGltf && vmSoftDrinkGltf.scene) {
      const vmRight = createNormalizedAssetWrapper(vmSoftDrinkGltf.scene.clone(true), {
        targetSize: [1.12, 1.84, 0.66],
        rotY: 0,
        emissiveBoost: 0.16
      });
      vmRight.position.set(-6.80, 0.45, 1.38);
      vendingGroup.add(vmRight);
    }

    // -----------------------------------------------------------------------
    // D. `stool.glb` -> 4 Counter Stools + 2 Oden Stand Stools
    // -----------------------------------------------------------------------
    if (stoolGltf && stoolGltf.scene) {
      stoolPlacements.forEach(({ x, z, rotY }) => {
        const stoolWrap = createNormalizedAssetWrapper(stoolGltf.scene.clone(true), {
          targetSize: [0.36, 0.56, 0.36],
          rotY
        });
        stoolWrap.position.set(x, swY, z);
        stoolsGroup.add(stoolWrap);
      });
    }

    // -----------------------------------------------------------------------
    // E. Table & Counter Cups: `japanese_tea_cup.glb`, `japanese_tea_cup_2.glb`, `cup_and_saucer.glb`
    // -----------------------------------------------------------------------
    const cupModels = [
      teaCup1Gltf ? { gltf: teaCup1Gltf, h: 0.11 } : null,
      teaCup2Gltf ? { gltf: teaCup2Gltf, h: 0.10 } : null,
      cupSaucerGltf ? { gltf: cupSaucerGltf, h: 0.09 } : null
    ].filter(Boolean);

    if (cupModels.length > 0) {
      const cupSpots = [
        // Open Serving Counter bartop (shifted inward onto the middle of the wooden counter at z = 1.54)
        { x: -5.15, y: 1.22, z: 1.54, variant: 0, rotY: 0.4 },
        { x: -4.15, y: 1.22, z: 1.52, variant: 2, rotY: -0.6 },
        { x: -3.15, y: 1.22, z: 1.54, variant: 1, rotY: 1.1 },
        { x: -2.20, y: 1.22, z: 1.53, variant: 2, rotY: 0.2 },
        // Relocated Oden Stand counter table (shifted inward along +X to x = 3.31 so both cups sit squarely on the wooden plank!)
        { x:  3.36, y: swY + 0.86, z: 2.98, variant: 0, rotY: 0.8 },
        { x:  3.36, y: swY + 0.86, z: 3.46, variant: 1, rotY: -0.3 }
      ];

      cupSpots.forEach((spot) => {
        const entry = cupModels[spot.variant % cupModels.length];
        const cupWrap = createNormalizedAssetWrapper(entry.gltf.scene.clone(true), {
          targetHeight: entry.h,
          rotY: spot.rotY
        });
        cupWrap.position.set(spot.x, spot.y, spot.z);
        cupsGroup.add(cupWrap);
      });
    }

    // -----------------------------------------------------------------------
    // F. `oden_stand_-_lowpoly_game_asset.glb` -> Relocated to Sloped-Street Corner (`x = 2.68, z = 2.65`)
    //    Rotated by `Math.PI / 2` so its serving counter faces `+X` and the stools at `x = 3.55` face `-X` (inward)!
    // -----------------------------------------------------------------------
    if (odenStandGltf && odenStandGltf.scene) {
      const odenClone = odenStandGltf.scene.clone(true);
      const g7 = odenClone.getObjectByName('group7');
      if (g7) g7.visible = false;
      prepareOdenStandMaterials(odenClone);

      const odenWrap = createNormalizedAssetWrapper(odenClone, {
        targetHeight: 2.15,
        rotY: -Math.PI / 2
      });
      odenStandGroup.add(odenWrap);
    }

    // -----------------------------------------------------------------------
    // G. `bike.glb` -> Both Wheels Resting Flat & Level on the Sidewalk!
    // -----------------------------------------------------------------------
    if (bikeGltf && bikeGltf.scene) {
      const bikeWrap = createNormalizedAssetWrapper(bikeGltf.scene.clone(true), {
        targetHeight: 0.96,
        rotX: 0,
        rotY: 0,
        rotZ: 0
      });
      bikeGroup.add(bikeWrap);
    }

    // -----------------------------------------------------------------------
    // H. `japanese_electric_pole.glb` -> Keep Built-In Wires Visible & Extend to Diorama Ends!
    // -----------------------------------------------------------------------
    if (newElectricPoleGltf && newElectricPoleGltf.scene) {
      const poleClone = newElectricPoleGltf.scene.clone(true);
      poleClone.updateMatrixWorld(true);

      // First scale & normalize the pole BEFORE stretching the wires so the pole height (7.75m)
      // and trunk base center are computed purely from the pole itself!
      const poleWrap = createNormalizedAssetWrapper(poleClone, {
        targetHeight: 7.75,
        rotY: 0,
        alignToTrunkBase: true
      });
      poleGroup.add(poleWrap);
      propsGroup.updateMatrixWorld(true);

      // Now remove the stray front/right cut-off cable stubs (compMaxZ > 1.45 || compMaxX > 1.25)
      // AND directly stretch the built-in West-going (-X) wires of `Cables_1_0` all the way to the
      // West Backdrop Wall (`x = -10.82`) as one 100% continuous unbroken mesh!
      const westEndPointsWorld = [];
      poleClone.traverse((child) => {
        if (child.isMesh && child.name === "Cables_1_0" && child.geometry && child.geometry.index) {
          const geom = child.geometry.clone();
          const pos = geom.attributes.position;
          const idx = geom.index;
          const parent = new Int32Array(pos.count).fill(-1);
          function find(i) {
            let root = i;
            while (parent[root] >= 0) root = parent[root];
            let curr = i;
            while (curr !== root) {
              const nxt = parent[curr];
              parent[curr] = root;
              curr = nxt;
            }
            return root;
          }
          function union(a, b) {
            a = find(a);
            b = find(b);
            if (a !== b) parent[b] = a;
          }
          for (let i = 0; i < idx.count; i += 3) {
            const a = idx.getX(i), b = idx.getX(i + 1), c = idx.getX(i + 2);
            union(a, b);
            union(b, c);
          }

          // Use child local coordinates: in Cables_1_0 mesh space, X is West-East, Y is North-South (-Z_world), Z is Up (Y_world)
          const badComp = new Set();
          for (let i = 0; i < pos.count; i++) {
            const mx = pos.getX(i);
            const my = pos.getY(i); // -Z_world
            const mz = pos.getZ(i); // +Y_world
            if (-my > 1.45 || mx > 1.25) {
              badComp.add(find(i));
            }
          }
          const keepIndices = [];
          for (let i = 0; i < idx.count; i += 3) {
            const a = idx.getX(i), b = idx.getX(i + 1), c = idx.getX(i + 2);
            if (!badComp.has(find(a))) {
              keepIndices.push(a, b, c);
            }
          }
          geom.setIndex(keepIndices);

          // Stretch built-in West-going (-X) wires directly to x_world = -10.82 (x_mesh = -15.01)
          const targetMeshMinX = -15.01;
          for (let i = 0; i < pos.count; i++) {
            if (badComp.has(find(i))) continue;
            const mx = pos.getX(i);
            const mz = pos.getZ(i);
            if (mx < -0.60 && mz > 7.40) {
              // Top 3 West-going wires: stretch [-0.60, -4.00] -> [-0.60, -15.01]
              const t = (mx - (-0.60)) / (-4.00 - (-0.60));
              pos.setX(i, -0.60 + t * (targetMeshMinX - (-0.60)));
            } else if (mx < -0.32 && mz > 5.50 && mz < 6.00) {
              // Lower 2 West-going wires: stretch [-0.32, -1.82] -> [-0.32, -15.01]
              const t = (mx - (-0.32)) / (-1.82 - (-0.32));
              pos.setX(i, -0.32 + t * (targetMeshMinX - (-0.32)));
            }
          }
          pos.needsUpdate = true;
          geom.computeBoundingSphere();
          child.geometry = geom;

          // Place white porcelain insulators on the West Backdrop Wall (x = -10.82) at the exact world Y/Z of the stretched wires
          const { sx: s, anchorXZ, minY } = poleWrap.userData.normScale;
          [
            [7.67, -0.45],
            [7.67,  0.25],
            [7.67,  0.90],
            [5.70,  0.07]
          ].forEach(([ly, lz]) => {
            const endWorld = new THREE.Vector3(
              -10.82,
              swY + (ly - minY) * s,
              poleZ + (lz - anchorXZ.z) * s
            );
            westEndPointsWorld.push(endWorld);
          });

          // Extend 3 upper cross-arm insulators & 2 lower cross-arm cables straight North (-Z_world) to the North Backdrop Wall (z = -10.52):
          [
            [-0.58, 7.67, -0.45],
            [ 0.00, 7.67, -0.45],
            [ 0.58, 7.67, -0.45],
            [-0.41, 6.42, -0.38],
            [ 0.41, 6.42, -0.38]
          ].forEach(([lx, ly, lz]) => {
            const startWorld = new THREE.Vector3(
              poleX + (lx - anchorXZ.x) * s,
              swY + (ly - minY) * s,
              poleZ + (lz - anchorXZ.z) * s
            );
            const endWorld = new THREE.Vector3(startWorld.x, startWorld.y, -10.52);
            powerLinesGroup.add(createCatenaryCableMesh(startWorld, endWorld, 0.04, 0.013, cableBlackMat, 0.0));

            const wallIns = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.12, 10), porcelainBrownMat);
            wallIns.rotation.x = Math.PI / 2;
            wallIns.position.copy(endWorld);
            powerLinesGroup.add(wallIns);
          });
        }
      });

      westEndPointsWorld.forEach((endWorld) => {
        const wallIns = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.12, 10), porcelainWhiteMat);
        wallIns.rotation.z = Math.PI / 2;
        wallIns.position.copy(endWorld);
        powerLinesGroup.add(wallIns);
      });
    }

    // -----------------------------------------------------------------------
    // I. `traffic_light.glb` (Neutralize static baked cyan/red & emissiveMap so lenses truly switch color!)
    // -----------------------------------------------------------------------
    if (trafficLightGltf && trafficLightGltf.scene) {
      const tlClone = trafficLightGltf.scene.clone(true);
      const tlWrap = createNormalizedAssetWrapper(tlClone, {
        targetHeight: 5.60,
        rotY: 0,
        alignToTrunkBase: true,
        emissiveBoost: 0.0
      });
      tlWrap.traverse((o) => {
        if (o.isMesh) {
          clickableTrafficMeshes.push(o);
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => {
            if (!m) return;
            m.emissive = new THREE.Color(0x000000);
            m.emissiveIntensity = 0.0;
            m.emissiveMap = null;
            if (m.map && m.map.image && !m.userData.cyanNeutralized) {
              try {
                const img = m.map.image;
                const c = document.createElement("canvas");
                c.width = img.width || 512;
                c.height = img.height || 512;
                const ctx = c.getContext("2d");
                ctx.drawImage(img, 0, 0, c.width, c.height);
                const imgData = ctx.getImageData(0, 0, c.width, c.height);
                const d = imgData.data;
                for (let i = 0; i < d.length; i += 4) {
                  const r = d[i], g = d[i + 1], b = d[i + 2];
                  if ((g > 135 && b > 115 && (g - r) > 30) || (r > 165 && (r - g) > 55 && (r - b) > 55)) {
                    d[i] = 26;
                    d[i + 1] = 30;
                    d[i + 2] = 32;
                  }
                }
                ctx.putImageData(imgData, 0, 0);
                const newTex = new THREE.CanvasTexture(c);
                newTex.colorSpace = THREE.SRGBColorSpace;
                newTex.flipY = m.map.flipY;
                m.map = newTex;
                m.userData.cyanNeutralized = true;
                m.needsUpdate = true;
              } catch (e) {}
            }
          });
        }
      });
      trafficLightGroup.add(tlWrap);
    }

    // -----------------------------------------------------------------------
    // I2. `trash.glb` -> Replaces the Procedural Trash Area at (x = 3.25, z = -7.65)
    // -----------------------------------------------------------------------
    if (trashGltf && trashGltf.scene) {
      const trashClone = trashGltf.scene.clone(true);
      const trashWrap = createNormalizedAssetWrapper(trashClone, {
        targetHeight: 0.95,
        rotY: -Math.PI / 2
      });
      trashWrap.traverse((o) => {
        if (o.isMesh && o.material && (o.material.name || "").toLowerCase().includes("fire")) {
          o.material.emissive = new THREE.Color(0xff6a00);
          o.material.emissiveIntensity = 2.4;
        }
      });
      trashGroup.add(trashWrap);
    }

    // -----------------------------------------------------------------------
    // I3. PHASE 11 ROOFTOP REMODEL & WALL VINES:
    //   1. `japanese_garden_bench.glb`: Fixed upright orientation (`rotX: 0, rotY: 0`) so seats face +Z (main road),
    //      scaled proportionally (`targetSize: [1.56, 0.78, 0.56]`) at `x = -7.45` and `x = -1.75, z = +0.58`.
    //   2. `smol_ame_in_an_upcycled_terrarium_hololiveen.glb`: Moved to Top-Right (North-East) corner (`x = +0.55, z = -8.65`),
    //      rotated diagonally (`rotY = -Math.PI / 4`) so CRT monitor faces South-West across the rooftop square.
    //   3. `rooftop_ventilation_unit.glb`: Rotated 90° CCW (`rotY = +Math.PI / 2`) and shifted into Top-Left (North-West)
    //      corner (`x = -9.18, z = -8.85`), scaled proportionally (`targetHeight: 1.40`).
    //   4. Removed 1 exhaust vent; kept 1 `roof_top_vent.glb` scaled up (`targetHeight: 1.74`) at `(x = -5.10, z = -8.65)`,
    //      plus integrated `hvac_unit.glb` (`targetHeight: 1.18`) in the West mechanical zone (`x = -9.25, z = -5.45`).
    //   5. `vintage_industrial_ladder.glb`: Scaled down to realistic human proportions (`targetSize: [0.46, 7.36, 0.50]`)
    //      at `(x = 2.18, y = swY, z = -3.52)` with a matching narrow gap in the East `bar_fence.glb`.
    //   6. `pantagruel__anime_chibi_model.glb`: Standing front-center right by the front balcony railing (`x = -4.55, z = +1.18`),
    //      facing outward toward the main road (`+Z`).
    //   7. `lain.glb`: Rooftop NPC (`x = -5.65, z = -4.10`) with flat shadow plane hidden and `'HoodDown'` animation.
    //   8. `lowpoly_anime_character_cyberstyle.glb`: Standing at a comfortable distance (`x = -1.25, z = -6.85`)
    //      facing North-East (`rotY = Math.PI * 0.75`) directly toward Smol Ame's diagonal screen.
    //   9. Wall Vines (`low_poly_wall_vine.glb`, `grape_vines.glb`, `ornamental_sweet_potato_-_ipomea_batatas.glb`)
    //      distributed across building walls and rooftop edges for lush greenery.
    // -----------------------------------------------------------------------
    if (barFenceGltf && barFenceGltf.scene) {
      // Front edge (z = +1.74) & Rear North edge (z = -10.40): 6 panels each along X (calibrated height = 0.78m)
      [-9.64, -7.51, -5.38, -3.25, -1.12, 1.01].forEach((fx) => {
        [1.74, -10.40].forEach((fz) => {
          const fWrap = createNormalizedAssetWrapper(barFenceGltf.scene.clone(true), {
            targetSize: [2.12, 0.78, 0.07],
            rotY: 0
          });
          fWrap.position.set(fx, 0, fz);
          rooftopDecorGroup.add(fWrap);
        });
      });

      // West Left edge (x = -10.74): 6 panels along Z
      [-9.36, -7.35, -5.34, -3.33, -1.32, 0.69].forEach((fz) => {
        const fWrap = createNormalizedAssetWrapper(barFenceGltf.scene.clone(true), {
          targetSize: [2.00, 0.78, 0.07],
          rotY: 0
        });
        fWrap.rotation.y = Math.PI / 2;
        fWrap.position.set(-10.74, 0, fz);
        rooftopDecorGroup.add(fWrap);
      });

      // East Right edge (x = +2.14): Narrow human-scale entry gap at z ∈ [-3.95, -3.08] for the 0.50m-wide ladder!
      // Front-East segment (z ∈ [-3.08, +1.72] -> 2 panels of length 2.38m centered at z = -1.89 and z = +0.51)
      [-1.89, 0.51].forEach((fz) => {
        const fWrap = createNormalizedAssetWrapper(barFenceGltf.scene.clone(true), {
          targetSize: [2.38, 0.78, 0.07],
          rotY: 0
        });
        fWrap.rotation.y = Math.PI / 2;
        fWrap.position.set(2.14, 0, fz);
        rooftopDecorGroup.add(fWrap);
      });
      // Rear-East segment (z ∈ [-10.36, -3.95] -> 3 panels of length 2.13m centered at z = -9.29, -7.15, -5.01)
      [-9.29, -7.15, -5.01].forEach((fz) => {
        const fWrap = createNormalizedAssetWrapper(barFenceGltf.scene.clone(true), {
          targetSize: [2.13, 0.78, 0.07],
          rotY: 0
        });
        fWrap.rotation.y = Math.PI / 2;
        fWrap.position.set(2.14, 0, fz);
        rooftopDecorGroup.add(fWrap);
      });
    }

    if (industrialLadderGltf && industrialLadderGltf.scene) {
      // Calibrated to human proportions: 0.50m rung width, 0.46m depth, 7.36m height (from sidewalk swY=0.25 to rooftop 7.17 + 0.44m top rail)
      const ladderWrap = createNormalizedAssetWrapper(industrialLadderGltf.scene.clone(true), {
        targetSize: [0.46, 7.36, 0.50],
        rotY: 0
      });
      ladderWrap.position.set(2.18, swY, -3.52);
      propsGroup.add(ladderWrap);
    }

    if (gardenBenchGltf && gardenBenchGltf.scene) {
      // Upright on all 4 legs (rotX: 0, rotY: 0 -> backrest at -Z, seat facing +Z toward the main road!)
      [-7.45, -1.75].forEach((bx) => {
        const benchWrap = createNormalizedAssetWrapper(gardenBenchGltf.scene.clone(true), {
          targetSize: [1.56, 0.78, 0.56],
          rotX: 0,
          rotY: 0
        });
        benchWrap.position.set(bx, 0, 0.58);
        rooftopDecorGroup.add(benchWrap);
      });
    }

    if (rooftopVentUnitGltf && rooftopVentUnitGltf.scene) {
      // Rotated 90° counter-clockwise (rotY = +Math.PI / 2) and shifted into the Top-Left (North-West) corner
      const ventUnitWrap = createNormalizedAssetWrapper(rooftopVentUnitGltf.scene.clone(true), {
        targetHeight: 1.40,
        rotY: Math.PI / 2
      });
      ventUnitWrap.position.set(-9.18, 0, -8.85);
      rooftopDecorGroup.add(ventUnitWrap);
    }

    if (roofTopVentGltf && roofTopVentGltf.scene) {
      // Kept only 1 exhaust vent and scaled it larger (targetHeight: 1.74)
      const bigVentWrap = createNormalizedAssetWrapper(roofTopVentGltf.scene.clone(true), {
        targetHeight: 1.74,
        rotY: 0
      });
      bigVentWrap.position.set(-5.10, 0, -8.65);
      rooftopDecorGroup.add(bigVentWrap);
    }

    if (hvacUnitGltf && hvacUnitGltf.scene) {
      const hvacScene = hvacUnitGltf.scene;
      const hvacWrap = createNormalizedAssetWrapper(hvacScene, {
        targetHeight: 1.18,
        rotY: Math.PI / 2
      });
      hvacWrap.position.set(-9.25, 0, -5.45);
      rooftopDecorGroup.add(hvacWrap);

      if (hvacUnitGltf.animations && hvacUnitGltf.animations.length > 0) {
        const hvacMixer = new THREE.AnimationMixer(hvacScene);
        hvacMixer.clipAction(hvacUnitGltf.animations[0]).play();
        mixers.push(hvacMixer);
      }
    }

    if (smolAmeGltf && smolAmeGltf.scene) {
      const ameScene = smolAmeGltf.scene;
      // Placed in Top-Right (North-East) corner (x = +0.55, z = -8.65), rotated by -Math.PI / 4
      // so the CRT monitor screen faces diagonally South-West (-X, +Z) across the rooftop square!
      const ameWrap = createNormalizedAssetWrapper(ameScene, {
        targetHeight: 1.38,
        rotY: -Math.PI / 4
      });
      ameWrap.traverse((o) => {
        if (o.isMesh && o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => {
            const mName = (m.name || "").toLowerCase();
            if (!mName.includes("outline") && m.map && m.color) {
              m.color.setHex(0xe8e4dc);
              m.roughness = 0.78;
              m.metalness = 0.04;
            }
          });
        }
      });
      ameWrap.position.set(0.55, 0, -8.65);
      rooftopDecorGroup.add(ameWrap);

      if (smolAmeGltf.animations && smolAmeGltf.animations.length > 0) {
        const ameMixer = new THREE.AnimationMixer(ameScene);
        ameMixer.clipAction(smolAmeGltf.animations[0]).play();
        mixers.push(ameMixer);
      }
    }

    // `pantagruel__anime_chibi_model.glb`: Standing front-center right by the front balcony railing (x = -4.55, z = +1.18), facing +Z (main road)
    if (pantagruelGltf && pantagruelGltf.scene) {
      const pantaScene = pantagruelGltf.scene;
      const pantaWrap = createNormalizedAssetWrapper(pantaScene, {
        targetHeight: 1.24,
        rotY: 0
      });
      pantaWrap.position.set(-4.55, 0, 1.18);
      rooftopDecorGroup.add(pantaWrap);

      if (pantagruelGltf.animations && pantagruelGltf.animations.length > 0) {
        const pantaMixer = new THREE.AnimationMixer(pantaScene);
        const mainClip = pantagruelGltf.animations.find(a => a.name === 'Main') || pantagruelGltf.animations[0];
        pantaMixer.clipAction(mainClip).play();
        mixers.push(pantaMixer);
      }
    }

    // `lain.glb`: Rooftop NPC hanging out in the terrace lounge (x = -5.65, z = -4.10)
    if (lainGltf && lainGltf.scene) {
      const lainScene = lainGltf.scene;
      lainScene.traverse((o) => {
        if (o.name && o.name.toLowerCase().includes('shadow')) {
          o.visible = false;
        }
      });
      const lainWrap = createNormalizedAssetWrapper(lainScene, {
        targetHeight: 1.44,
        rotY: 0.35
      });
      lainWrap.position.set(-5.65, 0, -4.10);
      rooftopDecorGroup.add(lainWrap);

      if (lainGltf.animations && lainGltf.animations.length > 0) {
        const lainMixer = new THREE.AnimationMixer(lainScene);
        const hoodDownClip = lainGltf.animations.find(a => a.name === 'HoodDown') || lainGltf.animations[0];
        lainMixer.clipAction(hoodDownClip).play();
        mixers.push(lainMixer);
      }
    }

    // `lowpoly_anime_character_cyberstyle.glb`: Standing at a comfortable distance (x = -1.25, z = -6.85)
    // looking diagonally North-East (rotY = Math.PI * 0.75) directly at Smol Ame (at x = +0.55, z = -8.65)!
    if (cyberstyleGltf && cyberstyleGltf.scene) {
      const cyberScene = cyberstyleGltf.scene;
      const cyberWrap = createNormalizedAssetWrapper(cyberScene, {
        targetHeight: 1.50,
        rotY: Math.PI * 0.75
      });
      cyberWrap.position.set(-1.25, 0, -6.85);
      rooftopDecorGroup.add(cyberWrap);

      if (cyberstyleGltf.animations && cyberstyleGltf.animations.length > 0) {
        const cyberMixer = new THREE.AnimationMixer(cyberScene);
        const idleClip = cyberstyleGltf.animations.find(a => a.name.toLowerCase().includes('idle')) || cyberstyleGltf.animations[0];
        cyberMixer.clipAction(idleClip).play();
        mixers.push(cyberMixer);
      }
    }

    // Wall Vines (`low_poly_wall_vine.glb`, `grape_vines.glb`, `ornamental_sweet_potato_-_ipomea_batatas.glb`)
    if (wallVineGltf && wallVineGltf.scene) {
      // Hide the flat gray background wall mesh (`Back` / `Back__0`) before computing bounding box once
      wallVineGltf.scene.traverse((o) => {
        if (o.name && o.name.toLowerCase().includes('back')) {
          o.visible = false;
        }
      });
      const baseWallVine = createNormalizedAssetWrapper(wallVineGltf.scene, {
        targetSize: [0.26, 3.85, 2.55],
        rotY: 0,
        castShadow: false,
        receiveShadow: false
      });

      [
        // East Side Wall clusters hanging down from upper cornice/rooftop edge (x = 2.24, facing +X with ry = 0)
        { x: 2.24, y: 3.35, z: -1.15, sx: 0.85, sy: 0.98, sz: 1.05, ry: 0 },
        { x: 2.24, y: 3.30, z: -6.05, sx: 0.85, sy: 1.00, sz: 1.10, ry: 0 },
        // Front Building Facade clusters hanging down from rooftop cornice (z = 1.84, facing +Z with ry = -Math.PI / 2)
        { x: -9.65, y: 3.55, z: 1.84, sx: 0.85, sy: 0.90, sz: 0.82, ry: -Math.PI / 2 },
        { x:  0.95, y: 3.55, z: 1.84, sx: 0.85, sy: 0.90, sz: 0.80, ry: -Math.PI / 2 }
      ].forEach(({ x, y, z, sx, sy, sz, ry }, idx) => {
        const inst = idx === 0 ? baseWallVine : baseWallVine.clone();
        inst.scale.set(sx, sy, sz);
        inst.rotation.y = ry;
        inst.position.set(x, y, z);
        propsGroup.add(inst);
      });
    }

    if (grapeVinesGltf && grapeVinesGltf.scene) {
      const baseGrapeVine = createNormalizedAssetWrapper(grapeVinesGltf.scene, {
        targetSize: [2.25, 1.45, 0.48],
        rotY: 0,
        castShadow: false,
        receiveShadow: false
      });
      [
        { x: -9.45, y: 6.25, z: 1.84, ry: 0 },
        { x: -3.10, y: 6.28, z: 1.84, ry: 0 },
        { x:  2.24, y: 6.25, z: -0.95, ry: Math.PI / 2 },
        { x:  2.24, y: 6.22, z: -6.20, ry: Math.PI / 2 }
      ].forEach(({ x, y, z, ry }, idx) => {
        const inst = idx === 0 ? baseGrapeVine : baseGrapeVine.clone();
        inst.rotation.y = ry;
        inst.position.set(x, y, z);
        propsGroup.add(inst);
      });
    }

    if (sweetPotatoVineGltf && sweetPotatoVineGltf.scene) {
      const baseSweetPotato = createNormalizedAssetWrapper(sweetPotatoVineGltf.scene, {
        targetHeight: 0.64,
        rotY: 0,
        castShadow: false,
        receiveShadow: false
      });
      [
        { x: -8.55, y: 0, z: 0.72, ry: 0.4 },
        { x: -0.52, y: 0, z: 0.72, ry: -0.5 }
      ].forEach(({ x, y, z, ry }, idx) => {
        const inst = idx === 0 ? baseSweetPotato : baseSweetPotato.clone();
        inst.rotation.y = ry;
        inst.position.set(x, y, z);
        rooftopDecorGroup.add(inst);
      });
    }

    // -----------------------------------------------------------------------
    // I4. `phoenix_bird.glb` -> Soaring in the Sky Above the Rooftop (y ∈ [10.5, 12.8])
    // -----------------------------------------------------------------------
    if (phoenixGltf && phoenixGltf.scene) {
      const phoenixScene = phoenixGltf.scene;
      // In phoenix_bird.glb, the head/beak points along +X; rotY = -Math.PI / 2 aligns the beak along +Z!
      const phoenixWrap = createNormalizedAssetWrapper(phoenixScene, {
        targetHeight: 1.65,
        rotY: -Math.PI / 2,
        emissiveBoost: 0.35
      });
      phoenixFlightGroup.add(phoenixWrap);

      if (phoenixGltf.animations && phoenixGltf.animations.length > 0) {
        const phoenixMixer = new THREE.AnimationMixer(phoenixScene);
        const flyAction = phoenixMixer.clipAction(phoenixGltf.animations[0]);
        flyAction.timeScale = 1.25;
        flyAction.play();
        mixers.push(phoenixMixer);
      }
    }

    // -----------------------------------------------------------------------
    // J. `japan_lamp.glb`
    // -----------------------------------------------------------------------
    if (japanLampGltf && japanLampGltf.scene) {
      if (buildingData?.lanternAttachments) {
        buildingData.lanternAttachments.visible = false;
      }
      [-5.75, -3.75, -1.52, -0.12].forEach((lx) => {
        const lampWrap = createNormalizedAssetWrapper(japanLampGltf.scene.clone(true), {
          targetHeight: 0.46,
          emissiveBoost: 0.75,
          emissiveColor: 0xff9d3b
        });
        lampWrap.position.set(lx, 2.38, 2.10);
        propsGroup.add(lampWrap);
      });
    }

    // -----------------------------------------------------------------------
    // K. `japan_neon_sign_pack.glb` -> Rotated 90° Counter-Clockwise (`rotY: -Math.PI / 2`)
    //    so its mounting brackets attach into the building's front facade wall (`-Z`)!
    // -----------------------------------------------------------------------
    if (neonSignPackGltf && neonSignPackGltf.scene) {
      const rootNode = neonSignPackGltf.scene.getObjectByName('RootNode') || neonSignPackGltf.scene;

      const verticalSignNames = [
        'takoyaki-ya', 'takoyaky-ta', 'takoyaki-ko', 'takoyaki-ki',
        '2-takoyaki-ya', '2-takoyaki-ta', '2-takoyaki-ko', '2-takoyaki-ki',
        'cube-letter', 'cube-letter001', 'cube-letter002', 'cube-letter003'
      ];
      const vSignGroup = new THREE.Group();
      verticalSignNames.forEach((n) => {
        const found = rootNode.getObjectByName(n);
        if (found) vSignGroup.add(found.clone(true));
      });
      if (vSignGroup.children.length > 0) {
        // Rotating by -Math.PI / 2 (90° counter-clockwise from Math.PI) points the local -X mounting brackets
        // into -Z (directly into the front facade wall at z = 1.80) while the sign faces +X and -X!
        const neonBlade = createNormalizedAssetWrapper(vSignGroup, {
          targetHeight: 1.85,
          rotY: -Math.PI / 2,
          emissiveBoost: 0.65
        });
        neonBlade.position.set(-10.38, 4.20, 2.02);
        neonSignsGroup.add(neonBlade);
      }

      const hSignGroup = new THREE.Group();
      ['cube-letter005', 'crock-pot'].forEach((n) => {
        const found = rootNode.getObjectByName(n);
        if (found) hSignGroup.add(found.clone(true));
      });
      if (hSignGroup.children.length > 0) {
        const neonBanner = createNormalizedAssetWrapper(hSignGroup, {
          targetHeight: 0.42,
          rotY: 0,
          emissiveBoost: 0.55
        });
        neonBanner.position.set(-8.02, 3.12, 1.86);
        neonSignsGroup.add(neonBanner);
      }

      const shibuyaObj = rootNode.getObjectByName('text-shibuya002');
      if (shibuyaObj) {
        const shibuyaWrap = createNormalizedAssetWrapper(shibuyaObj.clone(true), {
          targetHeight: 0.34,
          rotY: 0,
          emissiveBoost: 0.85,
          emissiveColor: 0xff6b4a
        });
        shibuyaWrap.position.set(-3.75, 2.55, 0.05);
        neonSignsGroup.add(shibuyaWrap);
      }
    }

    // -----------------------------------------------------------------------
    // L. `frieren_plushie_decorator.glb`
    // -----------------------------------------------------------------------
    if (frierenGltf && frierenGltf.scene) {
      const frierenCounter = createNormalizedAssetWrapper(frierenGltf.scene.clone(true), {
        targetHeight: 0.36,
        rotY: -0.25
      });
      frierenCounter.position.set(-5.58, 1.22, 1.66);
      propsGroup.add(frierenCounter);

      const frierenBalcony = createNormalizedAssetWrapper(frierenGltf.scene.clone(true), {
        targetHeight: 0.42,
        rotY: 0.15
      });
      frierenBalcony.position.set(-6.10, 4.05, 2.22);
      propsGroup.add(frierenBalcony);
    }

    // -----------------------------------------------------------------------
    // M. **ELAINA** (`npc4.glb`) AS SHOPKEEPER BEHIND THE COUNTER
    // -----------------------------------------------------------------------
    if (elainaGltf && elainaGltf.scene) {
      const elainaClone = SkeletonUtils.clone(elainaGltf.scene);
      const elainaWrap = createNormalizedAssetWrapper(elainaClone, {
        targetHeight: 1.56,
        rotY: 0
      });
      elainaWrap.position.set(-3.75, 0.46, 0.95);
      npcGroup.add(elainaWrap);

      if (elainaGltf.animations && elainaGltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(elainaClone);
        const action = mixer.clipAction(elainaGltf.animations[0]);
        action.play();
        mixers.push(mixer);
      }
    }

    // -----------------------------------------------------------------------
    // N. Cats & Dogs Around the Building:
    //    - Models WITH embedded GLB animations (`cat_1`, `cat_3`, `dog_1`, `dog_3`) play their clips.
    //    - Models WITHOUT embedded GLB animations (`cat_2`, `dog_2`) stand 100% still on the ground!
    // -----------------------------------------------------------------------
    if (cat1Gltf && cat1Gltf.scene) {
      const cat1Clone = cat1Gltf.scene.clone(true);
      const cat1Wrap = createNormalizedAssetWrapper(cat1Clone, {
        targetHeight: 0.28,
        rotY: -0.65
      });
      cat1Wrap.position.set(-1.65, swY, 2.25);
      npcGroup.add(cat1Wrap);

      if (cat1Gltf.animations && cat1Gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(cat1Clone);
        mixer.clipAction(cat1Gltf.animations[0]).play();
        mixers.push(mixer);
      }
    }

    // `cat_2.glb` has NO animations -> Placed stationary on the sidewalk near the Sakura tree (`x = 0.85, z = 3.65`)
    if (cat2Gltf && cat2Gltf.scene) {
      const cat2Clone = SkeletonUtils.clone(cat2Gltf.scene);
      const cat2Wrap = createNormalizedAssetWrapper(cat2Clone, {
        targetHeight: 0.28,
        rotY: 0.4
      });
      cat2Wrap.position.set(0.85, swY, 3.65);
      npcGroup.add(cat2Wrap);
    }

    if (cat3Gltf && cat3Gltf.scene) {
      const cat3Clone = SkeletonUtils.clone(cat3Gltf.scene);
      const cat3Wrap = createNormalizedAssetWrapper(cat3Clone, {
        targetHeight: 0.27,
        rotY: 0.45
      });
      cat3Wrap.position.set(-6.25, swY, 2.65);
      npcGroup.add(cat3Wrap);

      if (cat3Gltf.animations && cat3Gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(cat3Clone);
        mixer.clipAction(cat3Gltf.animations[0]).play();
        mixers.push(mixer);
      }
    }

    if (dog1Gltf && dog1Gltf.scene) {
      const dog1Clone = SkeletonUtils.clone(dog1Gltf.scene);
      const dog1Wrap = createNormalizedAssetWrapper(dog1Clone, {
        targetHeight: 0.44,
        rotY: -0.45
      });
      dog1Wrap.position.set(-1.35, swY, 2.32);
      npcGroup.add(dog1Wrap);

      if (dog1Gltf.animations && dog1Gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(dog1Clone);
        const sitClip = dog1Gltf.animations.find(a => a.name.includes('sitting')) || dog1Gltf.animations[0];
        mixer.clipAction(sitClip).play();
        mixers.push(mixer);
      }
    }

    // `dog_2.glb` has NO animations -> Placed 100% stationary on the sidewalk near the bicycle (`x = 2.85, z = 0.65`)
    if (dog2Gltf && dog2Gltf.scene) {
      const dog2Wrap = createNormalizedAssetWrapper(dog2Gltf.scene.clone(true), {
        targetHeight: 0.42,
        rotY: 0.35
      });
      dog2Wrap.position.set(2.85, swY, 0.65);
      npcGroup.add(dog2Wrap);
    }

    if (dog3Gltf && dog3Gltf.scene) {
      const dog3Clone = SkeletonUtils.clone(dog3Gltf.scene);
      const dog3Wrap = createNormalizedAssetWrapper(dog3Clone, {
        targetHeight: 0.42,
        rotY: Math.PI
      });
      dog3Wrap.position.set(3.68, swY, -2.5);
      npcGroup.add(dog3Wrap);

      if (dog3Gltf.animations && dog3Gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(dog3Clone);
        const runClip = dog3Gltf.animations.find(a => a.name === 'run' || a.name === 'walk') || dog3Gltf.animations[0];
        mixer.clipAction(runClip).play();
        mixers.push(mixer);
      }

      animatedWalkers.push({
        wrapper: dog3Wrap,
        startPos: new THREE.Vector3(3.68, swY, -6.8),
        endPos: new THREE.Vector3(3.68, swY, 1.2),
        speed: 0.24,
        phaseOffset: 0.2,
        rotForward: 0,
        rotBackward: Math.PI,
        bobBaseY: swY,
        bobAmp: 0.012
      });
    }

    if (typeof onAssetProgress === 'function') {
      onAssetProgress({
        loaded: totalGlbFiles,
        total: totalGlbFiles,
        filename: 'scene_ready',
        stage: 'ready'
      });
    }
    return true;
  })();

  scene.add(propsGroup);

  // =========================================================================
  // MASTER ANIMATION UPDATE HOOK
  // =========================================================================
  function updateProps(elapsed, dt) {
    for (let i = 0; i < mixers.length; i++) {
      mixers[i].update(dt);
    }

    if (buildingData && Array.isArray(buildingData.norenPanels)) {
      buildingData.norenPanels.forEach((panel, idx) => {
        panel.rotation.x = 0.08 + 0.07 * Math.sin(elapsed * 2.4 + idx * 1.1) + 0.03 * Math.cos(elapsed * 4.1 + idx);
        panel.rotation.z = 0.025 * Math.sin(elapsed * 1.9 + idx * 1.7);
      });
    }

    trafficLightController.update(dt, elapsed);

    // Smooth, organic multi-harmonic 3D flight path for Phoenix Bird above the rooftop (y ∈ [10.5, 12.7])
    if (phoenixFlightGroup.children.length > 0) {
      const evalPhoenixPos = (tVal) => {
        const s = tVal * 0.55;
        const px = -0.8 + 5.8 * Math.sin(s * 1.0) + 2.5 * Math.cos(s * 2.15 + 0.7);
        const pz = -0.6 + 4.8 * Math.cos(s * 0.78) + 2.2 * Math.sin(s * 1.85 + 1.4);
        const py = 11.45 + 0.85 * Math.sin(s * 1.45 + 0.3) + 0.35 * Math.cos(s * 2.65);
        return new THREE.Vector3(px, py, pz);
      };
      const eps = 0.04;
      const pPrev = evalPhoenixPos(elapsed - eps);
      const pCurr = evalPhoenixPos(elapsed);
      const pNext = evalPhoenixPos(elapsed + eps);

      phoenixFlightGroup.position.copy(pCurr);

      const vx1 = (pCurr.x - pPrev.x) / eps;
      const vz1 = (pCurr.z - pPrev.z) / eps;
      const vx2 = (pNext.x - pCurr.x) / eps;
      const vy2 = (pNext.y - pCurr.y) / eps;
      const vz2 = (pNext.z - pCurr.z) / eps;

      const yaw1 = Math.atan2(vx1, vz1);
      const yaw2 = Math.atan2(vx2, vz2);
      let dYaw = yaw2 - yaw1;
      while (dYaw > Math.PI) dYaw -= Math.PI * 2;
      while (dYaw < -Math.PI) dYaw += Math.PI * 2;
      const yawRate = dYaw / eps;

      const horizSpeed = Math.max(0.001, Math.hypot(vx2, vz2));
      const pitch = -Math.atan2(vy2, horizSpeed) * 0.75;
      const bank = THREE.MathUtils.clamp(-yawRate * 0.38, -0.52, 0.52);

      phoenixFlightGroup.rotation.set(pitch, yaw2, bank);
    }

    treeCrowns.forEach((crown, idx) => {
      crown.rotation.z = 0.014 * Math.sin(elapsed * 1.4 + idx * 1.3);
      crown.rotation.x = 0.010 * Math.cos(elapsed * 1.1 + idx * 0.9);
    });

    const isRain = currentWeatherMode === 'rain';
    const isSnow = currentWeatherMode === 'snow';
    const speedMult = isRain ? 6.5 : (isSnow ? 0.85 : 1.0);

    for (let i = 0; i < particleCount; i++) {
      const p = leafParticles[i];
      p.y -= p.vy * speedMult * dt;
      p.x += (isRain ? -0.35 : (p.vx + 0.18 * Math.sin(elapsed * 1.5 + p.phase))) * dt;
      p.z += (isRain ? 0.10 : (p.vz + 0.14 * Math.cos(elapsed * 1.2 + p.phase))) * dt;

      if (p.y < 0.05) {
        p.y = 8.0 + (i % 5) * 0.5;
        p.x = -10.0 + ((i * 1.37) % 21.5);
        p.z = -9.0 + ((i * 2.13) % 19.0);
      }

      dummy.position.set(p.x, p.y, p.z);
      if (isRain) {
        dummy.rotation.set(0, 0, 0.08);
        dummy.scale.set(0.18, 2.8, 0.18);
      } else {
        dummy.rotation.set(
          elapsed * p.rotSpeedX + p.phase,
          elapsed * p.rotSpeedY,
          Math.sin(elapsed * 2.0 + p.phase) * 0.6
        );
        dummy.scale.setScalar(isSnow ? p.scale * 0.65 : p.scale);
      }
      dummy.updateMatrix();
      fallingLeavesMesh.setMatrixAt(i, dummy.matrix);
    }
    fallingLeavesMesh.instanceMatrix.needsUpdate = true;

    animatedWalkers.forEach((w) => {
      const cycle = ((elapsed * w.speed) + w.phaseOffset) % 2.0;
      const forward = cycle < 1.0;
      const t = forward ? cycle : (2.0 - cycle);
      w.wrapper.position.lerpVectors(w.startPos, w.endPos, t);
      w.wrapper.position.y = w.bobBaseY + Math.abs(Math.sin(elapsed * 7.5)) * (w.bobAmp || 0.01);
      w.wrapper.rotation.y = forward ? w.rotForward : w.rotBackward;
    });

    articulatedNPCs.forEach((item) => {
      const { npc, role, phase } = item;
      const t = elapsed + phase;

      if (role === 'walker') {
        const cycle = ((elapsed * item.speed) + phase) % 2.0;
        const forward = cycle < 1.0;
        const u = forward ? cycle : (2.0 - cycle);
        npc.root.position.lerpVectors(item.startPos, item.endPos, u);
        npc.root.rotation.y = forward ? item.rotForward : item.rotBackward;

        const stride = Math.sin(t * 6.5);
        npc.leftLeg.hipPivot.rotation.x = 0.46 * stride;
        npc.rightLeg.hipPivot.rotation.x = -0.46 * stride;
        npc.leftLeg.kneePivot.rotation.x = Math.max(0, -stride * 0.45);
        npc.rightLeg.kneePivot.rotation.x = Math.max(0, stride * 0.45);

        npc.leftArm.shoulderPivot.rotation.x = -0.35 * stride;
        npc.rightArm.shoulderPivot.rotation.x = 0.35 * stride;
        npc.leftArm.elbowPivot.rotation.x = -0.25;
        npc.rightArm.elbowPivot.rotation.x = -0.25;

        npc.hips.position.y = 0.80 + 0.022 * Math.abs(Math.cos(t * 6.5));
        npc.headGroup.rotation.y = 0.14 * Math.sin(t * 1.8);
      } else if (role === 'counter_sip' || role === 'oden_eat') {
        const sipWave = Math.max(0, Math.sin(t * 1.4));
        npc.rightArm.shoulderPivot.rotation.x = -0.55 - 0.45 * sipWave;
        npc.rightArm.elbowPivot.rotation.x = -0.65 - 0.50 * sipWave;
        npc.leftArm.shoulderPivot.rotation.x = -0.35;
        npc.leftArm.elbowPivot.rotation.x = -0.45;
        npc.headGroup.rotation.x = 0.12 * sipWave;
        npc.headGroup.rotation.y = 0.18 * Math.sin(t * 1.1);
        npc.torso.rotation.z = 0.03 * Math.sin(t * 1.6);
      } else if (role === 'counter_chat') {
        npc.headGroup.rotation.y = 0.24 * Math.sin(t * 1.5);
        npc.headGroup.rotation.x = 0.08 * Math.cos(t * 2.4);
        npc.leftArm.shoulderPivot.rotation.x = -0.45 + 0.25 * Math.sin(t * 2.8);
        npc.leftArm.elbowPivot.rotation.x = -0.55 + 0.20 * Math.sin(t * 2.8);
        npc.rightArm.shoulderPivot.rotation.x = -0.35;
        npc.rightArm.elbowPivot.rotation.x = -0.40;
      } else if (role === 'street_lookout') {
        const lookWave = Math.sin(t * 1.15);
        npc.headGroup.rotation.y = 0.42 * lookWave;
        npc.headGroup.rotation.x = -0.06 + 0.08 * Math.cos(t * 1.7);
        npc.torso.rotation.y = 0.14 * lookWave;
        npc.torso.rotation.z = 0.03 * Math.sin(t * 0.9);
        const waveGesture = Math.max(0, Math.sin(t * 0.95));
        npc.rightArm.shoulderPivot.rotation.x = -0.25 - 0.55 * waveGesture;
        npc.rightArm.elbowPivot.rotation.x = -0.40 - 0.45 * waveGesture;
        npc.leftArm.shoulderPivot.rotation.x = -0.15 + 0.10 * Math.cos(t * 1.3);
        npc.leftArm.elbowPivot.rotation.x = -0.28;
        npc.hips.position.y = 0.80 + 0.012 * Math.sin(t * 2.2);
      } else if (role === 'vending_choose') {
        npc.headGroup.rotation.y = 0.28 * Math.sin(t * 1.2);
        const reach = Math.pow(Math.max(0, Math.sin(t * 1.3)), 2);
        npc.rightArm.shoulderPivot.rotation.x = -0.25 - 0.85 * reach;
        npc.rightArm.elbowPivot.rotation.x = -0.35 - 0.35 * reach;
        npc.leftArm.shoulderPivot.rotation.x = -0.15;
        npc.leftArm.elbowPivot.rotation.x = -0.30;
        npc.hips.position.y = 0.80 + 0.012 * Math.sin(t * 2.6);
      }
    });
  }

  return {
    propsGroup,
    postboxGroup,
    vendingGroup,
    stoolsGroup,
    cupsGroup,
    odenStandGroup,
    bikeGroup,
    poleGroup,
    powerLinesGroup,
    trafficLightGroup,
    trafficLightController,
    trashGroup,
    ivyGroup,
    treePlanterGroup,
    fallingLeavesMesh,
    npcGroup,
    neonSignsGroup,
    propLights,
    setWeatherMode,
    allAssetsLoadedPromise,
    updateProps
  };
}
