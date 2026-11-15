import * as THREE from 'three';

/**
 * Procedural HTML5 Canvas Texture Generators (100% Offline & Deterministic)
 */

function createNoiseHelper(seed = 12345) {
  let s = seed;
  return function() {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * 1. Asphalt Textures (Diffuse + Bump/Roughness)
 */
export function createAsphaltTextures() {
  const size = 1024;
  const rand = createNoiseHelper(42);

  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = size;
  diffCanvas.height = size;
  const ctx = diffCanvas.getContext('2d');

  // Sunny Shinkai warm slate-blue asphalt
  ctx.fillStyle = '#555b73';
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const n = (rand() - 0.5) * 28;
    const speckle = rand() > 0.94 ? (rand() * 36) : (rand() < 0.06 ? -22 : 0);
    data[i] = Math.min(255, Math.max(30, 85 + n + speckle));
    data[i + 1] = Math.min(255, Math.max(32, 91 + n + speckle));
    data[i + 2] = Math.min(255, Math.max(42, 115 + n + speckle));
    data[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);

  const grad = ctx.createLinearGradient(0, 0, size, 0);
  grad.addColorStop(0.0, 'rgba(0,0,0,0.0)');
  grad.addColorStop(0.2, 'rgba(24,28,42,0.22)');
  grad.addColorStop(0.35, 'rgba(0,0,0,0.0)');
  grad.addColorStop(0.65, 'rgba(0,0,0,0.0)');
  grad.addColorStop(0.8, 'rgba(24,28,42,0.24)');
  grad.addColorStop(1.0, 'rgba(0,0,0,0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(20, 22, 28, 0.35)';
  ctx.lineWidth = 1.2;
  for (let c = 0; c < 10; c++) {
    ctx.beginPath();
    let cx = rand() * size;
    let cy = rand() * size;
    ctx.moveTo(cx, cy);
    const steps = 15 + Math.floor(rand() * 20);
    for (let s = 0; s < steps; s++) {
      cx += (rand() - 0.5) * 16;
      cy += (rand() - 0.5) * 16;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d');
  const bImgData = bCtx.createImageData(size, size);
  const bData = bImgData.data;

  for (let i = 0; i < bData.length; i += 4) {
    const roughness = 120 + Math.floor((rand() - 0.5) * 75);
    bData[i] = roughness;
    bData[i + 1] = roughness;
    bData[i + 2] = roughness;
    bData[i + 3] = 255;
  }
  bCtx.putImageData(bImgData, 0, 0);

  const diffTex = new THREE.CanvasTexture(diffCanvas);
  diffTex.wrapS = THREE.RepeatWrapping;
  diffTex.wrapT = THREE.RepeatWrapping;
  diffTex.colorSpace = THREE.SRGBColorSpace;
  diffTex.anisotropy = 16;

  const bumpTex = new THREE.CanvasTexture(bumpCanvas);
  bumpTex.wrapS = THREE.RepeatWrapping;
  bumpTex.wrapT = THREE.RepeatWrapping;
  bumpTex.anisotropy = 16;

  return { diffuse: diffTex, bump: bumpTex };
}

/**
 * 2. Sidewalk Concrete Paver Textures
 */
export function createSidewalkTextures() {
  const size = 1024;
  const rand = createNoiseHelper(999);

  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = size;
  diffCanvas.height = size;
  const ctx = diffCanvas.getContext('2d');

  ctx.fillStyle = '#c4c0b6';
  ctx.fillRect(0, 0, size, size);

  const tiles = 4;
  const tileSize = size / tiles;
  const jointWidth = 6;

  for (let y = 0; y < tiles; y++) {
    for (let x = 0; x < tiles; x++) {
      const rx = x * tileSize;
      const ry = y * tileSize;

      const toneVariation = (rand() - 0.5) * 16;
      const baseVal = 194 + toneVariation;
      ctx.fillStyle = `rgb(${baseVal + 4}, ${baseVal + 2}, ${baseVal - 3})`;
      ctx.fillRect(rx + jointWidth / 2, ry + jointWidth / 2, tileSize - jointWidth, tileSize - jointWidth);

      const edgeGrad = ctx.createRadialGradient(
        rx + tileSize / 2, ry + tileSize / 2, tileSize * 0.25,
        rx + tileSize / 2, ry + tileSize / 2, tileSize * 0.65
      );
      edgeGrad.addColorStop(0, 'rgba(0,0,0,0)');
      edgeGrad.addColorStop(1, 'rgba(50, 48, 42, 0.10)');
      ctx.fillStyle = edgeGrad;
      ctx.fillRect(rx + jointWidth / 2, ry + jointWidth / 2, tileSize - jointWidth, tileSize - jointWidth);
    }
  }

  ctx.fillStyle = '#5c5953';
  for (let i = 0; i <= tiles; i++) {
    ctx.fillRect(i * tileSize - jointWidth / 2, 0, jointWidth, size);
    ctx.fillRect(0, i * tileSize - jointWidth / 2, size, jointWidth);
  }

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    if (rand() > 0.88) {
      const d = (rand() - 0.5) * 24;
      data[i] = Math.min(255, Math.max(0, data[i] + d));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + d));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + d));
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d');

  bCtx.fillStyle = '#a0a0a0';
  bCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#181818';
  for (let i = 0; i <= tiles; i++) {
    bCtx.fillRect(i * tileSize - jointWidth / 2, 0, jointWidth, size);
    bCtx.fillRect(0, i * tileSize - jointWidth / 2, size, jointWidth);
  }

  const diffTex = new THREE.CanvasTexture(diffCanvas);
  diffTex.wrapS = THREE.RepeatWrapping;
  diffTex.wrapT = THREE.RepeatWrapping;
  diffTex.colorSpace = THREE.SRGBColorSpace;
  diffTex.anisotropy = 16;

  const bumpTex = new THREE.CanvasTexture(bumpCanvas);
  bumpTex.wrapS = THREE.RepeatWrapping;
  bumpTex.wrapT = THREE.RepeatWrapping;
  bumpTex.anisotropy = 16;

  return { diffuse: diffTex, bump: bumpTex };
}

/**
 * 3. Harmonized Concrete Corner Platform Texture (Matches Sidewalk Seamlessly)
 */
export function createHarmonizedPlatformTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Harmonized warm concrete grey matching the surrounding sidewalk pavers
  ctx.fillStyle = '#c8c3b8';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = '#6e6b64';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, size - 6, size - 6);

  // Subtle recessed concrete tactile dots in matching stone-grey tone
  const grid = 4;
  const spacing = size / grid;
  const radius = spacing * 0.24;

  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      const cx = (x + 0.5) * spacing;
      const cy = (y + 0.5) * spacing;

      ctx.beginPath();
      ctx.arc(cx + 2, cy + 2, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(70, 68, 62, 0.25)';
      ctx.fill();

      const dotGrad = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, radius * 0.1, cx, cy, radius);
      dotGrad.addColorStop(0, '#dad5ca');
      dotGrad.addColorStop(0.7, '#c6c1b6');
      dotGrad.addColorStop(1, '#a6a196');
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = dotGrad;
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  return tex;
}

/**
 * 4. Cutaway Strata Texture
 */
export function createCutawayStrataTexture() {
  const width = 1024;
  const height = 512;
  const rand = createNoiseHelper(777);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#2d241d';
  ctx.fillRect(0, 0, width, height);

  const concreteGrad = ctx.createLinearGradient(0, 0, 0, 60);
  concreteGrad.addColorStop(0, '#85878a');
  concreteGrad.addColorStop(1, '#66686b');
  ctx.fillStyle = concreteGrad;
  ctx.fillRect(0, 0, width, 60);

  for (let i = 0; i < 1500; i++) {
    ctx.fillStyle = rand() > 0.5 ? '#b0b2b5' : '#45474a';
    ctx.fillRect(rand() * width, rand() * 58, 2, 2);
  }

  const gravelGrad = ctx.createLinearGradient(0, 60, 0, 140);
  gravelGrad.addColorStop(0, '#5a544c');
  gravelGrad.addColorStop(1, '#4a443d');
  ctx.fillStyle = gravelGrad;
  ctx.fillRect(0, 60, width, 80);

  for (let i = 0; i < 1200; i++) {
    const rx = rand() * width;
    const ry = 62 + rand() * 74;
    const rSize = 3 + rand() * 4;
    ctx.fillStyle = rand() > 0.4 ? '#7c7469' : '#38332c';
    ctx.beginPath();
    ctx.arc(rx, ry, rSize, 0, Math.PI * 2);
    ctx.fill();
  }

  const strataBands = [
    { y: 140, h: 50, color: '#4a3b30' },
    { y: 190, h: 40, color: '#5a4638' },
    { y: 230, h: 65, color: '#3d2e24' },
    { y: 295, h: 45, color: '#4d3b2e' },
    { y: 340, h: 70, color: '#33261e' },
    { y: 410, h: 102, color: '#261c16' }
  ];

  strataBands.forEach(band => {
    ctx.fillStyle = band.color;
    ctx.beginPath();
    ctx.moveTo(0, band.y);
    for (let x = 0; x <= width; x += 32) {
      const wave = Math.sin(x * 0.015 + band.y) * 4 + (rand() - 0.5) * 3;
      ctx.lineTo(x, band.y + wave);
    }
    ctx.lineTo(width, band.y + band.h);
    ctx.lineTo(0, band.y + band.h);
    ctx.closePath();
    ctx.fill();
  });

  for (let i = 0; i < 400; i++) {
    const sx = rand() * width;
    const sy = 145 + rand() * 360;
    const sw = 4 + rand() * 8;
    const sh = 3 + rand() * 5;
    ctx.fillStyle = rand() > 0.6 ? '#6e5a4a' : '#221913';
    ctx.beginPath();
    ctx.ellipse(sx, sy, sw, sh, rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  return tex;
}

/**
 * 5. Japanese Cast-Iron Manhole Cover Texture
 */
export function createManholeTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.46;

  ctx.fillStyle = '#242322';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = 10;
  ctx.strokeStyle = '#3e3d3b';
  ctx.stroke();

  ctx.strokeStyle = '#181716';
  ctx.lineWidth = 4;
  [0.85, 0.70, 0.52, 0.35].forEach(fraction => {
    ctx.beginPath();
    ctx.arc(cx, cy, r * fraction, 0, Math.PI * 2);
    ctx.stroke();
  });

  ctx.strokeStyle = '#383634';
  ctx.lineWidth = 3;
  const innerR = r * 0.85;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.clip();

  for (let i = -innerR; i < innerR; i += 24) {
    ctx.beginPath();
    ctx.moveTo(cx + i, cy - innerR);
    ctx.lineTo(cx + i + innerR, cy + innerR);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + i, cy + innerR);
    ctx.lineTo(cx + i + innerR, cy - innerR);
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = '#161514';
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#4a4845';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(cx - 5, cy - 14, 10, 28);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  return tex;
}

/**
 * 6. Galvanized Steel Storm Drain Grate Texture
 */
export function createDrainGrateTexture() {
  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#3a3d40';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#0a0b0d';
  const margin = 14;
  ctx.fillRect(margin, margin, width - margin * 2, height - margin * 2);

  const barCount = 18;
  const slotWidth = (width - margin * 2) / barCount;
  const barThickness = slotWidth * 0.45;

  for (let i = 0; i < barCount; i++) {
    const x = margin + i * slotWidth;
    const grad = ctx.createLinearGradient(x, 0, x + barThickness, 0);
    grad.addColorStop(0, '#5a5d61');
    grad.addColorStop(0.5, '#7b7f85');
    grad.addColorStop(1, '#3a3d40');
    ctx.fillStyle = grad;
    ctx.fillRect(x, margin, barThickness, height - margin * 2);
  }

  ctx.fillStyle = '#4a4c50';
  ctx.fillRect(margin, height * 0.33, width - margin * 2, 8);
  ctx.fillRect(margin, height * 0.66, width - margin * 2, 8);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  return tex;
}

/**
 * 7. Tiered Concrete Retaining Wall & Backdrop Wall Texture
 */
export function createRetainingWallTexture() {
  const width = 1024;
  const height = 512;
  const rand = createNoiseHelper(555);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#9c9991';
  ctx.fillRect(0, 0, width, height);

  const panelH = 64;
  for (let y = 0; y < height; y += panelH) {
    ctx.fillStyle = 'rgba(50, 48, 45, 0.28)';
    ctx.fillRect(0, y, width, 3);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.fillRect(0, y + 3, width, 1.5);

    for (let x = 60; x < width; x += 120) {
      ctx.fillStyle = '#3b3936';
      ctx.beginPath();
      ctx.arc(x, y + panelH / 2, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#b8b5ad';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const streak = ctx.createLinearGradient(x - 6, y + panelH / 2, x + 6, y + panelH * 1.4);
      streak.addColorStop(0, 'rgba(45, 42, 38, 0.22)');
      streak.addColorStop(1, 'rgba(45, 42, 38, 0.0)');
      ctx.fillStyle = streak;
      ctx.fillRect(x - 4, y + panelH / 2, 8, panelH);
    }
  }

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (rand() - 0.5) * 18;
    data[i] = Math.min(255, Math.max(0, data[i] + n));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n));
  }
  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  return tex;
}

/**
 * 8. Curb Stone Texture
 */
export function createCurbTexture() {
  const size = 512;
  const rand = createNoiseHelper(333);

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#a8a59e';
  ctx.fillRect(0, 0, size, size);

  for (let x = 0; x <= size; x += 128) {
    ctx.fillStyle = '#4a4843';
    ctx.fillRect(x - 2, 0, 4, size);
    ctx.fillStyle = '#c2bfb8';
    ctx.fillRect(x + 2, 0, 2, size);
  }

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const v = (rand() - 0.5) * 20;
    data[i] = Math.min(255, Math.max(0, data[i] + v));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + v));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + v));
  }
  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  return tex;
}

/**
 * 9. Vintage Showa Ceramic Mosaic Tile Texture
 */
export function createCeramicTileTexture() {
  const size = 512;
  const rand = createNoiseHelper(101);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#dfdad0';
  ctx.fillRect(0, 0, size, size);

  const tileSize = 32;
  const gap = 3;
  const innerSize = tileSize - gap;

  for (let y = 0; y < size; y += tileSize) {
    for (let x = 0; x < size; x += tileSize) {
      const hueVar = (rand() - 0.5) * 16;
      const lightVar = (rand() - 0.5) * 18;
      const r = Math.min(255, Math.max(20, Math.floor(40 + lightVar)));
      const g = Math.min(255, Math.max(90, Math.floor(146 + hueVar + lightVar)));
      const b = Math.min(255, Math.max(80, Math.floor(136 + hueVar + lightVar)));

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x + gap, y + gap, innerSize, innerSize);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
      ctx.fillRect(x + gap, y + gap, innerSize, 2);
      ctx.fillRect(x + gap, y + gap, 2, innerSize);

      ctx.fillStyle = 'rgba(15, 60, 55, 0.35)';
      ctx.fillRect(x + gap, y + gap + innerSize - 2, innerSize, 2);
      ctx.fillRect(x + gap + innerSize - 2, y + gap, 2, innerSize);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  return tex;
}

/**
 * 10. Weathered Stucco / Plaster Texture (2nd Floor Facade)
 */
export function createWeatheredPlasterTexture() {
  const size = 1024;
  const rand = createNoiseHelper(202);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#f8ead0';
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const v = (rand() - 0.5) * 14;
    data[i] = Math.min(255, Math.max(0, data[i] + v + 3));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + v));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + v - 4));
  }
  ctx.putImageData(imgData, 0, 0);

  for (let i = 0; i < 18; i++) {
    const sx = rand() * size;
    const sw = 4 + rand() * 14;
    const sh = 100 + rand() * 280;
    const sy = rand() * (size - sh);
    const grad = ctx.createLinearGradient(sx, sy, sx, sy + sh);
    grad.addColorStop(0, 'rgba(160, 120, 80, 0.12)');
    grad.addColorStop(0.3, 'rgba(150, 110, 75, 0.05)');
    grad.addColorStop(1, 'rgba(150, 110, 75, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(sx, sy, sw, sh);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  return tex;
}

/**
 * 11. Dark Cedar Clapboard Siding (Shitami-Ita)
 */
export function createWoodSlatTexture() {
  const size = 512;
  const rand = createNoiseHelper(303);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#3d2d20';
  ctx.fillRect(0, 0, size, size);

  const plankHeight = 32;
  for (let y = 0; y < size; y += plankHeight) {
    const pVar = (rand() - 0.5) * 14;
    ctx.fillStyle = `rgb(${61 + pVar}, ${45 + pVar}, ${32 + pVar})`;
    ctx.fillRect(0, y, size, plankHeight);

    ctx.fillStyle = 'rgba(20, 12, 6, 0.22)';
    for (let g = 0; g < 6; g++) {
      const gy = y + rand() * plankHeight;
      const gh = 1 + rand() * 2;
      ctx.fillRect(0, gy, size, gh);
    }

    ctx.fillStyle = 'rgba(10, 6, 3, 0.65)';
    ctx.fillRect(0, y + plankHeight - 3, size, 3);

    ctx.fillStyle = 'rgba(140, 105, 75, 0.25)';
    ctx.fillRect(0, y, size, 1.5);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  return tex;
}

/**
 * 12. Traditional Japanese Kawara Roof Tile Texture
 */
export function createKawaraTileTexture() {
  const size = 256;
  const rand = createNoiseHelper(404);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#3a3e44');
  grad.addColorStop(0.5, '#2b2e33');
  grad.addColorStop(1, '#202226');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const v = (rand() - 0.5) * 14;
    data[i] = Math.min(255, Math.max(0, data[i] + v));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + v));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + v + 2));
  }
  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  return tex;
}

/**
 * 13. High-Quality Japanese Sign Generator
 */
export function createJapaneseSignTexture({
  width = 512,
  height = 256,
  text = '喫茶 富士',
  subtext = 'FUJI COFFEE',
  bg = '#1a232e',
  fg = '#f5eedb',
  accent = '#c29a58',
  vertical = false,
  weathered = true
}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.lineWidth = Math.max(4, Math.floor(height * 0.03));
  ctx.strokeStyle = accent;
  ctx.strokeRect(ctx.lineWidth, ctx.lineWidth, width - ctx.lineWidth * 2, height - ctx.lineWidth * 2);

  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  const inset = ctx.lineWidth * 6;
  ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2);

  const fontStack = '"Yu Gothic", "Meiryo", "MS Gothic", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (vertical) {
    const chars = text.split('');
    const charSpacing = height / (chars.length + 1.2);
    const mainFontSize = Math.min(width * 0.55, charSpacing * 0.85);
    ctx.font = `bold ${Math.floor(mainFontSize)}px ${fontStack}`;
    ctx.fillStyle = fg;
    chars.forEach((c, idx) => {
      ctx.fillText(c, width / 2, charSpacing * (idx + 1));
    });

    if (subtext) {
      ctx.font = `bold ${Math.floor(mainFontSize * 0.35)}px ${fontStack}`;
      ctx.fillStyle = accent;
      ctx.fillText(subtext, width / 2, height - inset * 1.5);
    }
  } else {
    const mainFontSize = Math.floor(height * (subtext ? 0.42 : 0.55));
    ctx.font = `bold ${mainFontSize}px ${fontStack}`;
    ctx.fillStyle = fg;
    const textY = subtext ? height * 0.44 : height * 0.50;
    ctx.fillText(text, width / 2, textY);

    if (subtext) {
      const subFontSize = Math.floor(height * 0.18);
      ctx.font = `600 ${subFontSize}px ${fontStack}`;
      ctx.fillStyle = accent;
      ctx.fillText(subtext, width / 2, height * 0.74);
    }
  }

  if (weathered) {
    ctx.fillStyle = 'rgba(30, 20, 10, 0.08)';
    ctx.fillRect(0, 0, width, height);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  return tex;
}

/**
 * 14. Classic Japanese Indigo Noren Curtain Texture with Seigaiha Wave Pattern
 */
export function createNorenPatternTexture(charText = '暖') {
  const width = 256;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Deep traditional Japanese Ai-zome indigo fabric
  ctx.fillStyle = '#1b2d48';
  ctx.fillRect(0, 0, width, height);

  // Subtle Seigaiha (traditional concentric wave arcs) pattern along lower third
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.lineWidth = 2;
  for (let row = 0; row < 6; row++) {
    const wy = height * 0.68 + row * 28;
    const offset = (row % 2) * 32;
    for (let wx = -32 + offset; wx <= width + 32; wx += 64) {
      [26, 18, 10].forEach(r => {
        ctx.beginPath();
        ctx.arc(wx, wy, r, Math.PI, Math.PI * 2);
        ctx.stroke();
      });
    }
  }

  // White Japanese crest circle (Maru-mon) in center
  const cx = width / 2;
  const cy = height * 0.38;
  ctx.strokeStyle = '#f7f3e8';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, 76, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 68, 0, Math.PI * 2);
  ctx.stroke();

  const fontStack = '"Yu Gothic", "Meiryo", "MS Gothic", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 86px ${fontStack}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(charText, cx, cy + 4);

  // Bottom decorative white geometric fret band
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.fillRect(12, height - 24, width - 24, 4);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  return tex;
}

/**
 * 15. Scalloped Striped Awning Fabric Texture
 */
export function createAwningTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const stripeW = 32;
  for (let x = 0; x < size; x += stripeW * 2) {
    ctx.fillStyle = '#b82e24';
    ctx.fillRect(x, 0, stripeW, size);
    ctx.fillStyle = '#faf4e4';
    ctx.fillRect(x + stripeW, 0, stripeW, size);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  return tex;
}

/**
 * 16. Organic Road Puddle Alpha Map
 */
export function createPuddleTextures() {
  const size = 512;
  const rand = createNoiseHelper(808);

  const alphaCanvas = document.createElement('canvas');
  alphaCanvas.width = size;
  alphaCanvas.height = size;
  const aCtx = alphaCanvas.getContext('2d');

  aCtx.fillStyle = '#000000';
  aCtx.fillRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const imgData = aCtx.getImageData(0, 0, size, size);
  const data = imgData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x - cx) / (size * 0.44);
      const ny = (y - cy) / (size * 0.44);
      const angle = Math.atan2(ny, nx);
      const baseDist = Math.hypot(nx, ny);

      const harmonic =
        0.12 * Math.sin(angle * 2.0 + 0.6) +
        0.08 * Math.cos(angle * 3.0 - 1.1) +
        0.05 * Math.sin(angle * 5.0 + 2.3) +
        (rand() - 0.5) * 0.03;

      const effectiveR = baseDist / (1.0 + harmonic);
      let alpha = 0;
      if (effectiveR < 0.62) {
        alpha = 255;
      } else if (effectiveR < 1.0) {
        const t = (effectiveR - 0.62) / 0.38;
        const smooth = 1.0 - t * t * (3.0 - 2.0 * t);
        alpha = Math.floor(smooth * 255);
      }

      const idx = (y * size + x) * 4;
      data[idx] = alpha;
      data[idx + 1] = alpha;
      data[idx + 2] = alpha;
      data[idx + 3] = 255;
    }
  }
  aCtx.putImageData(imgData, 0, 0);

  const alphaTex = new THREE.CanvasTexture(alphaCanvas);
  alphaTex.anisotropy = 16;

  return { alpha: alphaTex };
}

/**
 * 18. Vintage Showa Red Postbox Texture
 */
export function createPostboxTexture() {
  const size = 512;
  const rand = createNoiseHelper(707);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#cc2e2b';
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const v = (rand() - 0.5) * 18;
    data[i] = Math.min(255, Math.max(0, data[i] + v));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + v));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + v));
  }
  ctx.putImageData(imgData, 0, 0);

  const fontStack = '"Yu Gothic", "Meiryo", "MS Gothic", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#fff6e8';
  ctx.font = `bold 64px ${fontStack}`;
  ctx.fillText('〒', size / 2, size * 0.42);

  ctx.font = `bold 32px ${fontStack}`;
  ctx.fillText('郵 便', size / 2, size * 0.58);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  return tex;
}

/**
 * 8B. Weathered / Dusty Old Concrete Rooftop Texture (Bê tông cũ / bụi)
 */
export function createRooftopConcreteTexture() {
  const size = 1024;
  const rand = createNoiseHelper(2026);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#848078";
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 65; i++) {
    const cx = rand() * size;
    const cy = rand() * size;
    const r = 45 + rand() * 140;
    const isDust = rand() > 0.42;
    const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, r);
    if (isDust) {
      g.addColorStop(0, "rgba(168, 160, 146, 0.24)");
      g.addColorStop(1, "rgba(168, 160, 146, 0.0)");
    } else {
      g.addColorStop(0, "rgba(58, 55, 50, 0.22)");
      g.addColorStop(1, "rgba(58, 55, 50, 0.0)");
    }
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const step = 256;
  for (let p = 0; p < size; p += step) {
    ctx.fillStyle = "rgba(38, 36, 33, 0.55)";
    ctx.fillRect(p, 0, 3, size);
    ctx.fillRect(0, p, size, 3);
    ctx.fillStyle = "rgba(195, 190, 180, 0.22)";
    ctx.fillRect(p + 3, 0, 2, size);
    ctx.fillRect(0, p + 3, size, 2);
  }

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (rand() - 0.5) * 26;
    data[i] = Math.min(255, Math.max(0, data[i] + grain));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain));
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3.5, 3.5);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  return texture;
}

export function initTextures(scene) {
  const asphalt = createAsphaltTextures();
  const sidewalk = createSidewalkTextures();
  const tactile = createHarmonizedPlatformTexture();
  const cutaway = createCutawayStrataTexture();
  const manhole = createManholeTexture();
  const drainGrate = createDrainGrateTexture();
  const retainingWall = createRetainingWallTexture();
  const curb = createCurbTexture();
  const rooftopConcrete = createRooftopConcreteTexture();

  const ceramicTile = createCeramicTileTexture();
  const weatheredPlaster = createWeatheredPlasterTexture();
  const woodSlat = createWoodSlatTexture();
  const kawaraTile = createKawaraTileTexture();
  const awning = createAwningTexture();
  const puddle = createPuddleTextures();
  const postbox = createPostboxTexture();

  const signMainShop = createJapaneseSignTexture({
    width: 768,
    height: 192,
    text: '喫茶・軽食 ひだまり',
    subtext: 'HIDAMARI COUNTER BAR & CAFÉ',
    bg: '#1c2820',
    fg: '#fff5db',
    accent: '#d8ab42'
  });

  const signCounterMenu = createJapaneseSignTexture({
    width: 768,
    height: 160,
    text: 'お品書き：特製ラーメン・珈琲・クリームソーダ',
    subtext: 'RAMEN  650円  /  COFFEE  400円  /  MELON SODA  450円',
    bg: '#382214',
    fg: '#fff6e0',
    accent: '#d4a259'
  });

  const norenPanel1 = createNorenPatternTexture('茶');
  const norenPanel2 = createNorenPatternTexture('処');
  const norenPanel3 = createNorenPatternTexture('陽');

  const signBlade = createJapaneseSignTexture({
    width: 160,
    height: 512,
    text: 'ひだまり',
    subtext: 'BAR',
    bg: '#8a2318',
    fg: '#fff8ea',
    accent: '#ffcc00',
    vertical: true
  });

  const signRooftop = createJapaneseSignTexture({
    width: 768,
    height: 256,
    text: '佐藤ビル',
    subtext: 'SATO BLDG.  富士商事',
    bg: '#25292e',
    fg: '#f0f2f5',
    accent: '#ff5533'
  });

  const signMenu = createJapaneseSignTexture({
    width: 256,
    height: 384,
    text: '本日のお薦め',
    subtext: '自家製ラーメン・珈琲',
    bg: '#1e2022',
    fg: '#eeddbb',
    accent: '#88aacc',
    vertical: true
  });

  return {
    asphalt,
    sidewalk,
    tactile,
    cutaway,
    manhole,
    drainGrate,
    retainingWall,
    curb,
    rooftopConcrete,
    ceramicTile,
    weatheredPlaster,
    woodSlat,
    kawaraTile,
    awning,
    puddle,postbox,signs: {
      mainShop: signMainShop,
      counterMenu: signCounterMenu,
      norenPanel1,
      norenPanel2,
      norenPanel3,
      blade: signBlade,
      rooftop: signRooftop,
      menu: signMenu
    }
  };
}
