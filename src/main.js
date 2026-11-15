import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { initTextures } from './textures.js';
import { initTerrain } from './terrain.js';
import { initBuilding } from './building.js';
import { initProps } from './props.js';
import { initPostprocessing } from './postprocessing.js';

// ============================================================================
// 🎵 KHU VỰC CẤU HÌNH NHẠC NỀN & AMBIENT MP3 (PHÁT NHIỀU FILE CÙNG LÚC)
// - Thêm đường dẫn các file .mp3 vào mảng `tracks` bên dưới.
// - Điều chỉnh âm lượng từng file qua `volume` (từ 0.0 đến 1.0) và âm lượng
//   tổng qua `masterVolume`.
// - Tất cả các file trong danh sách sẽ tự động phát song song ngay sau khi
//   Loading Screen hoàn tất!
// ============================================================================
const AUDIO_MP3_CONFIG = {
  masterVolume: 1.0,              // Âm lượng tổng (0.0 -> 1.0)
  enableProceduralAmbience: true, // Bật âm thanh môi trường giả lập (gió + chuông gió Furin)
  tracks: [
    {
      name: 'Main BGM',
      url: './assets/music.mp3',             // <-- Đường dẫn file .mp3
      volume: 0.4,                        // <-- Âm lượng riêng của file này (0.0 -> 1.0)
      loop: true                           // <-- Lặp lại vô tận
    }
  ]
};
window.AUDIO_MP3_CONFIG = AUDIO_MP3_CONFIG;

// ============================================================================
// 🏮 DYNAMIC SHOWA-THEME LOADING SCREEN (CHỜ LOAD XONG 100% + COMPILE SHADER)
// ============================================================================
function createShowaLoadingScreen() {
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    @keyframes showaLanternSwing {
      0%, 100% { transform: rotate(-5deg) translateY(0px); }
      50% { transform: rotate(5deg) translateY(-3px); }
    }
    @keyframes showaPetalFall {
      0% { transform: translate3d(0, -20px, 0) rotate(0deg); opacity: 0; }
      15% { opacity: 0.85; }
      85% { opacity: 0.85; }
      100% { transform: translate3d(-90px, 105vh, 0) rotate(320deg); opacity: 0; }
    }
    @keyframes showaNeonPulse {
      0%, 100% { text-shadow: 0 0 12px rgba(255, 180, 90, 0.75), 0 0 28px rgba(255, 110, 50, 0.45); }
      50% { text-shadow: 0 0 18px rgba(255, 210, 125, 0.95), 0 0 38px rgba(255, 130, 65, 0.7); }
    }
    #showa-loading-screen {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at 50% 38%, #261f33 0%, #141829 58%, #090c15 100%);
      color: #fff6e8;
      font-family: "Segoe UI", "Yu Gothic", "Hiragino Kaku Gothic ProN", system-ui, sans-serif;
      user-select: none;
      opacity: 1;
      transform: scale(1);
      filter: blur(0px);
      transition: opacity 0.85s cubic-bezier(0.22, 1, 0.36, 1),
                  transform 0.85s cubic-bezier(0.22, 1, 0.36, 1),
                  filter 0.85s ease;
      overflow: hidden;
    }
    #showa-loading-screen.is-hidden {
      opacity: 0;
      transform: scale(1.04);
      filter: blur(8px);
      pointer-events: none;
    }
    .showa-petal {
      position: absolute;
      top: -20px;
      width: 11px;
      height: 8px;
      background: linear-gradient(135deg, #ffd1dc, #ff9eb5);
      border-radius: 80% 15% 80% 15%;
      box-shadow: 0 0 6px rgba(255, 183, 197, 0.45);
      pointer-events: none;
      animation: showaPetalFall linear infinite;
    }
    .showa-card {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 34px 42px;
      border-radius: 20px;
      background: rgba(18, 22, 36, 0.76);
      border: 1px solid rgba(255, 200, 130, 0.25);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.65), inset 0 0 24px rgba(255, 170, 80, 0.08);
      backdrop-filter: blur(14px);
      min-width: 360px;
      max-width: 90vw;
    }
    .showa-lantern-wrap {
      transform-origin: top center;
      animation: showaLanternSwing 3.2s ease-in-out infinite;
      margin-bottom: 14px;
      filter: drop-shadow(0 0 18px rgba(255, 120, 50, 0.65));
    }
    .showa-title-jp {
      font-size: 13px;
      letter-spacing: 0.22em;
      color: #ffbe76;
      margin-bottom: 4px;
      font-weight: 600;
    }
    .showa-title-main {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: #fff3d6;
      animation: showaNeonPulse 2.8s ease-in-out infinite;
      margin-bottom: 18px;
    }
    .showa-progress-track {
      width: 100%;
      height: 8px;
      background: rgba(255, 255, 255, 0.10);
      border-radius: 999px;
      overflow: hidden;
      border: 1px solid rgba(255, 200, 140, 0.2);
      margin-bottom: 10px;
    }
    .showa-progress-fill {
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, #ff7b38, #f6ad55, #fde047);
      box-shadow: 0 0 12px rgba(246, 173, 85, 0.85);
      border-radius: 999px;
      transition: width 0.22s ease-out;
    }
    .showa-status-row {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #cbd5e1;
      gap: 12px;
    }
    .showa-percent {
      font-family: monospace;
      font-size: 13.5px;
      font-weight: 700;
      color: #fde047;
    }
  `;
  document.head.appendChild(styleEl);

  const overlay = document.createElement('div');
  overlay.id = 'showa-loading-screen';

  // Floating Sakura Petals on Loading Screen
  for (let i = 0; i < 18; i++) {
    const petal = document.createElement('div');
    petal.className = 'showa-petal';
    petal.style.left = `${(i * 6.1 + 5) % 100}%`;
    petal.style.animationDuration = `${5.5 + (i % 5) * 1.3}s`;
    petal.style.animationDelay = `${-(i * 0.7)}s`;
    overlay.appendChild(petal);
  }

  const card = document.createElement('div');
  card.className = 'showa-card';
  card.innerHTML = `
    <div class="showa-lantern-wrap">
      <svg width="54" height="68" viewBox="0 0 54 68" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="27" y1="0" x2="27" y2="10" stroke="#f6ad55" stroke-width="2.5"/>
        <rect x="16" y="9" width="22" height="5" rx="2" fill="#2d211c" stroke="#f6ad55" stroke-width="1.2"/>
        <ellipse cx="27" cy="34" rx="20" ry="22" fill="url(#lanternGrad)" stroke="#ffbe76" stroke-width="1.5"/>
        <path d="M9 26 Q27 22 45 26" stroke="#7c2d12" stroke-width="1.1" fill="none" opacity="0.65"/>
        <path d="M7 34 Q27 30 47 34" stroke="#7c2d12" stroke-width="1.1" fill="none" opacity="0.65"/>
        <path d="M9 42 Q27 38 45 42" stroke="#7c2d12" stroke-width="1.1" fill="none" opacity="0.65"/>
        <rect x="16" y="54" width="22" height="5" rx="2" fill="#2d211c" stroke="#f6ad55" stroke-width="1.2"/>
        <line x1="24" y1="59" x2="23" y2="67" stroke="#f6ad55" stroke-width="1.8"/>
        <line x1="27" y1="59" x2="27" y2="68" stroke="#f6ad55" stroke-width="1.8"/>
        <line x1="30" y1="59" x2="31" y2="67" stroke="#f6ad55" stroke-width="1.8"/>
        <defs>
          <radialGradient id="lanternGrad" cx="0.5" cy="0.48" r="0.55">
            <stop offset="0%" stop-color="#fff3c4"/>
            <stop offset="45%" stop-color="#ff7832"/>
            <stop offset="100%" stop-color="#b91c1c"/>
          </radialGradient>
        </defs>
      </svg>
    </div>
    <div class="showa-title-jp">喫茶・軽食 ひだまり</div>
    <div class="showa-title-main">Showa Street Corner</div>
    <div class="showa-progress-track">
      <div id="showa-loading-bar" class="showa-progress-fill"></div>
    </div>
    <div class="showa-status-row">
      <span id="showa-loading-status">Đang khởi tạo không gian 3D...</span>
      <span id="showa-loading-pct" class="showa-percent">0%</span>
    </div>
  `;
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  const barEl = card.querySelector('#showa-loading-bar');
  const statusEl = card.querySelector('#showa-loading-status');
  const pctEl = card.querySelector('#showa-loading-pct');

  return {
    overlay,
    updateProgress({ loaded = 0, total = 39, filename = '', stage = 'loading' }) {
      const safeTotal = Math.max(1, total);
      // Reserve 0%..92% for downloading & parsing the 39 GLB files, and 92%..100% for WebGL Shader compilation
      const ratio = stage === 'ready'
        ? 0.95
        : Math.min(0.92, (loaded / safeTotal) * 0.92);
      const pct = Math.round(ratio * 100);
      if (barEl) barEl.style.width = `${pct}%`;
      if (pctEl) pctEl.textContent = `${pct}%`;
      if (statusEl) {
        if (stage === 'ready') {
          statusEl.textContent = 'Đang biên dịch Shader & Ánh sáng...';
        } else {
          statusEl.textContent = `Đang tải mô hình 3D (${loaded}/${safeTotal})...`;
        }
      }
    },
    finishAndHide() {
      if (barEl) barEl.style.width = '100%';
      if (pctEl) pctEl.textContent = '100%';
      if (statusEl) statusEl.textContent = 'Hoàn tất!';
      setTimeout(() => {
        overlay.classList.add('is-hidden');
        setTimeout(() => {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 900);
      }, 180);
    }
  };
}

const loadingScreen = createShowaLoadingScreen();

// --- Renderer Setup ---
const container = document.getElementById('app') || document.body;

const isMobileDevice = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const getOptimalPixelRatio = () => isMobileDevice ? 1.0 : Math.min(window.devicePixelRatio, 2);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(getOptimalPixelRatio());
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.16;
container.appendChild(renderer.domElement);

// --- Full 24-Hour Dynamic Parallax Sky Dome, Distant Town Silhouettes, Clouds & Starfield ---
const skyCanvas = document.createElement('canvas');
skyCanvas.width = 1024;
skyCanvas.height = 512;
const skyCtx = skyCanvas.getContext('2d');
const skyTexture = new THREE.CanvasTexture(skyCanvas);
skyTexture.mapping = THREE.EquirectangularReflectionMapping;
skyTexture.colorSpace = THREE.SRGBColorSpace;

const starList = [];
let starSeed = 9001;
for (let i = 0; i < 240; i++) {
  starSeed = (starSeed * 16807) % 2147483647;
  const sx = (starSeed % 1024);
  starSeed = (starSeed * 16807) % 2147483647;
  const sy = (starSeed % 380);
  starSeed = (starSeed * 16807) % 2147483647;
  const sr = 0.7 + ((starSeed % 100) / 100) * 1.5;
  starList.push({ sx, sy, sr });
}

const townSilhouettes = [];
for (let x = 0; x < 1024; x += 18) {
  starSeed = (starSeed * 16807) % 2147483647;
  const w = 16 + (starSeed % 14);
  const h = 10 + (starSeed % 28);
  const hasWindow = (starSeed % 3) !== 0;
  townSilhouettes.push({ x, w, h, hasWindow });
}

function lerpColorHex(hexA, hexB, t) {
  const cA = new THREE.Color(hexA);
  const cB = new THREE.Color(hexB);
  return '#' + cA.lerp(cB, THREE.MathUtils.clamp(t, 0, 1)).getHexString();
}

function getDayPhaseFactors(hours) {
  const h = ((hours % 24) + 24) % 24;
  let nightFactor = 0;
  if (h < 4.75 || h >= 20.0) {
    nightFactor = 1.0;
  } else if (h >= 4.75 && h < 7.5) {
    nightFactor = 1.0 - (h - 4.75) / 2.75;
  } else if (h >= 16.8 && h < 20.0) {
    nightFactor = (h - 16.8) / 3.2;
  }

  let twilightFactor = 0;
  if (h >= 4.8 && h <= 7.8) {
    twilightFactor = 1.0 - Math.abs(h - 6.2) / 1.5;
  } else if (h >= 16.0 && h <= 19.5) {
    twilightFactor = 1.0 - Math.abs(h - 17.75) / 1.75;
  }
  twilightFactor = THREE.MathUtils.clamp(twilightFactor, 0, 1);

  return { h, nightFactor, twilightFactor };
}

function updateSkyCanvas(hours) {
  const { h, nightFactor, twilightFactor } = getDayPhaseFactors(hours);

  let zenithCol = lerpColorHex(0x2578c8, 0x182e63, twilightFactor);
  let midSkyCol = lerpColorHex(0x7ac5f4, 0x8c5c8a, twilightFactor);
  let lowSkyCol = lerpColorHex(0xffe9c2, 0xf77e45, twilightFactor);
  let horizonCol = lerpColorHex(0xffd89b, 0xff5e4d, twilightFactor);
  let groundCol = lerpColorHex(0xc4a482, 0x3b2d4a, twilightFactor);

  zenithCol = lerpColorHex(zenithCol, 0x010308, nightFactor);
  midSkyCol = lerpColorHex(midSkyCol, 0x040814, nightFactor);
  lowSkyCol = lerpColorHex(lowSkyCol, 0x081024, nightFactor);
  horizonCol = lerpColorHex(horizonCol, 0x0d1730, nightFactor);
  groundCol = lerpColorHex(groundCol, 0x03050a, nightFactor);

  if (document && document.body) {
    document.body.style.backgroundColor = midSkyCol;
  }

  const grad = skyCtx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0.00, zenithCol);
  grad.addColorStop(0.38, midSkyCol);
  grad.addColorStop(0.62, lowSkyCol);
  grad.addColorStop(0.76, horizonCol);
  grad.addColorStop(0.88, lerpColorHex(lowSkyCol, groundCol, 0.45));
  grad.addColorStop(1.00, lerpColorHex(midSkyCol, 0x020308, nightFactor));
  skyCtx.fillStyle = grad;
  skyCtx.fillRect(0, 0, 1024, 512);

  if (nightFactor > 0.12) {
    const starAlpha = THREE.MathUtils.clamp((nightFactor - 0.12) / 0.88, 0, 0.95);
    skyCtx.fillStyle = `rgba(255, 250, 238, ${starAlpha.toFixed(2)})`;
    for (let i = 0; i < starList.length; i++) {
      const st = starList[i];
      skyCtx.beginPath();
      skyCtx.arc(st.sx, st.sy, st.sr, 0, Math.PI * 2);
      skyCtx.fill();
    }
  }

  const cloudColor = lerpColorHex(
    lerpColorHex(0xfffcf2, 0xff9e68, twilightFactor),
    0x121c36,
    nightFactor
  );
  const cloudAlpha = THREE.MathUtils.lerp(0.62, 0.22, nightFactor);
  skyCtx.fillStyle = cloudColor;
  skyCtx.globalAlpha = cloudAlpha;
  [90, 240, 410, 580, 740, 910].forEach((cx, idx) => {
    const cy = 225 + (idx % 3) * 32;
    skyCtx.beginPath();
    skyCtx.ellipse(cx, cy, 82, 18, 0, 0, Math.PI * 2);
    skyCtx.fill();
    skyCtx.beginPath();
    skyCtx.ellipse(cx + 38, cy - 10, 56, 15, 0, 0, Math.PI * 2);
    skyCtx.fill();
  });
  skyCtx.globalAlpha = 1.0;

  const sunX = 200 + ((h / 24) * 620);
  const sunY = nightFactor < 0.8 ? 275 : 210;
  if (nightFactor < 0.85) {
    const sunAlpha = (1.0 - nightFactor) * 0.92;
    const sunGlow = skyCtx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 290);
    sunGlow.addColorStop(0.0, `rgba(255, 248, 220, ${sunAlpha.toFixed(2)})`);
    sunGlow.addColorStop(0.38, `rgba(255, 205, 130, ${(sunAlpha * 0.58).toFixed(2)})`);
    sunGlow.addColorStop(1.0, 'rgba(255, 175, 105, 0.0)');
    skyCtx.fillStyle = sunGlow;
    skyCtx.fillRect(0, 0, 1024, 512);
  } else {
    const moonGlow = skyCtx.createRadialGradient(780, 215, 5, 780, 215, 110);
    moonGlow.addColorStop(0.0, 'rgba(220, 235, 255, 0.85)');
    moonGlow.addColorStop(0.28, 'rgba(130, 165, 230, 0.25)');
    moonGlow.addColorStop(1.0, 'rgba(20, 35, 70, 0.0)');
    skyCtx.fillStyle = moonGlow;
    skyCtx.fillRect(0, 0, 1024, 512);
  }

  const ridgeCol = lerpColorHex(
    lerpColorHex(0x8fa6c2, 0x4a3556, twilightFactor),
    0x050914,
    nightFactor
  );
  skyCtx.fillStyle = ridgeCol;
  skyCtx.beginPath();
  skyCtx.moveTo(0, 392);
  for (let x = 0; x <= 1024; x += 32) {
    const mh = 22 + Math.sin(x * 0.012) * 14 + Math.cos(x * 0.027) * 9;
    skyCtx.lineTo(x, 386 - mh);
  }
  skyCtx.lineTo(1024, 392);
  skyCtx.closePath();
  skyCtx.fill();

  const townCol = lerpColorHex(
    lerpColorHex(0x6e7f99, 0x2d2038, twilightFactor),
    0x03060e,
    nightFactor
  );
  skyCtx.fillStyle = townCol;
  townSilhouettes.forEach((b) => {
    skyCtx.fillRect(b.x, 386 - b.h, b.w, b.h + 10);
    if (b.hasWindow && (nightFactor > 0.25 || twilightFactor > 0.35)) {
      const winAlpha = Math.max(nightFactor, twilightFactor * 0.7) * 0.85;
      skyCtx.fillStyle = `rgba(255, 195, 105, ${winAlpha.toFixed(2)})`;
      skyCtx.fillRect(b.x + 4, 386 - b.h + 5, 3, 4);
      skyCtx.fillRect(b.x + 10, 386 - b.h + 11, 3, 4);
      skyCtx.fillStyle = townCol;
    }
  });

  skyTexture.needsUpdate = true;
}

updateSkyCanvas(11.5);

// --- Scene & Camera ---
const scene = new THREE.Scene();
scene.background = skyTexture;
scene.fog = new THREE.FogExp2(0xffe8c8, 0.0045);

const skyDomeGeo = new THREE.SphereGeometry(92, 48, 32);
const skyDomeMat = new THREE.MeshBasicMaterial({
  map: skyTexture,
  side: THREE.BackSide,
  depthWrite: false,
  fog: false
});
const skyDomeMesh = new THREE.Mesh(skyDomeGeo, skyDomeMat);
skyDomeMesh.name = 'parallax_horizon_sky_dome';
skyDomeMesh.position.y = 18.0;
scene.add(skyDomeMesh);

const camera = new THREE.PerspectiveCamera(
  32,
  window.innerWidth / window.innerHeight,
  0.1,
  160
);
camera.position.set(19, 15, 19);

// --- Orbit Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 0.6, 0);
controls.maxPolarAngle = Math.PI / 2 + 0.15;
controls.minDistance = 2.0;
controls.maxDistance = 60.0;
controls.update();
window.__camera = camera;
window.__controls = controls;

// --- Cozy Warm Daytime & Deep Night Studio Lighting Setup ---
const sunLight = new THREE.DirectionalLight(0xffebc2, 3.25);
sunLight.position.set(16, 24, 15);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 1.0;
sunLight.shadow.camera.far = 60.0;
sunLight.shadow.camera.left = -16.0;
sunLight.shadow.camera.right = 16.0;
sunLight.shadow.camera.top = 16.0;
sunLight.shadow.camera.bottom = -16.0;
sunLight.shadow.bias = -0.0004;
sunLight.shadow.normalBias = 0.02;
scene.add(sunLight);

const hemiLight = new THREE.HemisphereLight(0xffe8c2, 0x9c7e62, 1.32);
hemiLight.position.set(0, 25, 0);
scene.add(hemiLight);

const fillLight = new THREE.DirectionalLight(0xffd6a5, 0.82);
fillLight.position.set(-14, 12, -12);
scene.add(fillLight);

// --- Unified Miniature Diorama World Group ---
const dioramaWorld = new THREE.Group();
dioramaWorld.name = 'unified_miniature_diorama_world';
const MINIATURE_SCALE = 0.84;
dioramaWorld.scale.setScalar(MINIATURE_SCALE);
dioramaWorld.position.set(-0.35, 0.0, -0.45);
scene.add(dioramaWorld);

// --- Cozy Warm Nighttime Area Lights ---
const warmFrontPoolLight = new THREE.PointLight(0xffb866, 0.0, 19.0, 1.25);
warmFrontPoolLight.position.set(-2.5, 4.2, 4.2);
dioramaWorld.add(warmFrontPoolLight);

const warmCornerOdenPoolLight = new THREE.PointLight(0xffa94d, 0.0, 17.0, 1.25);
warmCornerOdenPoolLight.position.set(3.2, 4.0, 3.8);
dioramaWorld.add(warmCornerOdenPoolLight);

const warmSideAlleyPoolLight = new THREE.PointLight(0xffc278, 0.0, 16.0, 1.30);
warmSideAlleyPoolLight.position.set(3.4, 4.2, -2.2);
dioramaWorld.add(warmSideAlleyPoolLight);

// --- Modular Subsystems Initialization ---
const textures = initTextures(dioramaWorld);
const terrainData = initTerrain(dioramaWorld, textures);
const buildingData = initBuilding(dioramaWorld, textures);
const propsData = initProps(dioramaWorld, textures, terrainData, buildingData, (progressInfo) => {
  loadingScreen.updateProgress(progressInfo);
});
const postprocessing = initPostprocessing(renderer, scene, camera);

// --- 24-Hour Time-of-Day Controller ---
let currentTimeHours = 11.5;

function format24Hours(h) {
  const norm = ((h % 24) + 24) % 24;
  const hrs = Math.floor(norm);
  const mins = Math.floor((norm - hrs) * 60);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function setTimeOfDay(hours) {
  currentTimeHours = ((Number(hours) % 24) + 24) % 24;
  const { h, nightFactor, twilightFactor } = getDayPhaseFactors(currentTimeHours);
  updateSkyCanvas(h);

  skyDomeMesh.rotation.y = (h / 24.0) * Math.PI * 0.35;

  renderer.toneMappingExposure = THREE.MathUtils.lerp(
    THREE.MathUtils.lerp(1.18, 1.08, twilightFactor),
    0.98,
    nightFactor
  );

  if (nightFactor < 0.90) {
    const dayNorm = THREE.MathUtils.clamp((h - 5.5) / 13.0, 0, 1);
    const sunAngle = dayNorm * Math.PI;
    const sunHeight = Math.max(4.5, Math.sin(sunAngle) * 23.0);
    const sunX = Math.cos((dayNorm - 0.35) * Math.PI * 0.9) * 18.0;
    const sunZ = 15.0 + Math.sin((dayNorm - 0.5) * Math.PI * 0.6) * 8.0;
    sunLight.position.set(sunX, sunHeight, sunZ);
  } else {
    sunLight.position.set(14.0, 20.0, 14.0);
  }

  const cozyDaySunCol = new THREE.Color(0xffe8b8);
  const sunsetSunCol = new THREE.Color(0xff7b38);
  const deepNightMoonCol = new THREE.Color(0x526ea8);

  sunLight.color.copy(cozyDaySunCol).lerp(sunsetSunCol, twilightFactor).lerp(deepNightMoonCol, nightFactor);
  sunLight.intensity = THREE.MathUtils.lerp(
    THREE.MathUtils.lerp(3.30, 2.25, twilightFactor),
    0.32,
    nightFactor
  );

  const cozyDaySkyHemi = new THREE.Color(0xffebcc);
  const sunsetSkyHemi = new THREE.Color(0x9e6b8e);
  const deepNightSkyHemi = new THREE.Color(0x283862);
  hemiLight.color.copy(cozyDaySkyHemi).lerp(sunsetSkyHemi, twilightFactor).lerp(deepNightSkyHemi, nightFactor);

  const cozyDayGroundHemi = new THREE.Color(0xa68262);
  const nightGroundHemi = new THREE.Color(0x3a2414);
  hemiLight.groundColor.copy(cozyDayGroundHemi).lerp(nightGroundHemi, nightFactor);

  hemiLight.intensity = THREE.MathUtils.lerp(
    THREE.MathUtils.lerp(1.32, 0.92, twilightFactor),
    0.46,
    nightFactor
  );

  const dayFillCol = new THREE.Color(0xffd2a0);
  const nightFillCol = new THREE.Color(0xffb56b);
  fillLight.color.copy(dayFillCol).lerp(nightFillCol, nightFactor);
  fillLight.intensity = THREE.MathUtils.lerp(
    THREE.MathUtils.lerp(0.82, 0.56, twilightFactor),
    0.34,
    nightFactor
  );

  const nightWarmPoolFactor = Math.max(twilightFactor * 0.72, nightFactor);
  warmFrontPoolLight.intensity = 2.85 * nightWarmPoolFactor;
  warmCornerOdenPoolLight.intensity = 2.65 * nightWarmPoolFactor;
  warmSideAlleyPoolLight.intensity = 1.95 * nightWarmPoolFactor;

  const cozyDayFog = new THREE.Color(0xffebd2);
  const sunsetFog = new THREE.Color(0x7a5475);
  const deepNightFog = new THREE.Color(0x060b18);
  scene.fog.color.copy(cozyDayFog).lerp(sunsetFog, twilightFactor).lerp(deepNightFog, nightFactor);

  const warmGlowMult = 1.0 + Math.max(twilightFactor * 1.05, nightFactor * 2.15);
  if (buildingData && Array.isArray(buildingData.dynamicLights)) {
    buildingData.dynamicLights.forEach((item) => {
      item.light.intensity = item.baseIntensity * THREE.MathUtils.lerp(1.0, (item.nightBoost || 1.6) * 1.75, Math.max(twilightFactor, nightFactor));
    });
  }
  if (propsData && Array.isArray(propsData.propLights)) {
    propsData.propLights.forEach((item) => {
      item.light.intensity = item.baseIntensity * THREE.MathUtils.lerp(1.0, (item.nightBoost || 1.8) * 1.75, Math.max(twilightFactor, nightFactor));
    });
  }
  if (buildingData && Array.isArray(buildingData.emissiveMaterials)) {
    buildingData.emissiveMaterials.forEach((mat) => {
      if (mat.userData.baseEmissive === undefined) {
        mat.userData.baseEmissive = mat.emissiveIntensity || 0.35;
      }
      mat.emissiveIntensity = mat.userData.baseEmissive * warmGlowMult;
    });
  }
}

setTimeOfDay(11.5);

// ============================================================================
// 🔉 MULTI-TRACK MP3 & AMBIENT AUDIO ENGINE (DEFAULT ON: 🔉)
// ============================================================================
const audioController = {
  ctx: null,
  enabled: true, // Mặc định BẬT (🔉)
  startedAfterLoad: false,
  userInteracted: false,
  unlockBound: false,
  gainNode: null,
  birdTimer: null,
  mp3Elements: [],

  initMp3Tracks() {
    if (this.mp3Elements.length === 0) {
      const masterVol = THREE.MathUtils.clamp(AUDIO_MP3_CONFIG.masterVolume ?? 1.0, 0, 1);
      (AUDIO_MP3_CONFIG.tracks || []).forEach((trackCfg) => {
        if (!trackCfg || !trackCfg.url) return;
        const audio = new Audio(trackCfg.url);
        audio.loop = trackCfg.loop !== false;
        audio.preload = 'auto';
        const baseVol = THREE.MathUtils.clamp(trackCfg.volume ?? 0.5, 0, 1);
        audio.volume = THREE.MathUtils.clamp(baseVol * masterVol, 0, 1);
        audio.muted = !this.enabled;
        this.mp3Elements.push({ audio, config: trackCfg });
      });
    }

    if (!this.unlockBound) {
      this.unlockBound = true;
      const unlockHandler = () => {
        this.userInteracted = true;
        if (this.startedAfterLoad) {
          this.tryPlayAll();
        }
        window.removeEventListener('pointerdown', unlockHandler);
        window.removeEventListener('keydown', unlockHandler);
      };
      window.addEventListener('pointerdown', unlockHandler, { passive: true });
      window.addEventListener('keydown', unlockHandler, { passive: true });
    }
  },

  startAfterLoading() {
    this.startedAfterLoad = true;
    this.initMp3Tracks();
    this.tryPlayAll();
  },

  tryPlayAll() {
    if (!this.startedAfterLoad) return;

    // 1. Phát đồng thời tất cả các file MP3 trong AUDIO_MP3_CONFIG.tracks
    const masterVol = THREE.MathUtils.clamp(AUDIO_MP3_CONFIG.masterVolume ?? 1.0, 0, 1);
    this.mp3Elements.forEach(({ audio, config }) => {
      const baseVol = THREE.MathUtils.clamp(config.volume ?? 0.5, 0, 1);
      audio.volume = THREE.MathUtils.clamp(baseVol * masterVol, 0, 1);
      audio.muted = !this.enabled;
      if (this.enabled && audio.paused) {
        audio.play().then(() => {
          console.log(`[Audio Engine] Đang phát: ${config.name} (${config.url})`);
        }).catch((err) => {
          console.info(`[Audio Engine] Trình duyệt đang chờ tương tác người dùng: ${err.name}`);
        });
      }
    });

    // 2. Phát âm thanh môi trường WebAudio (nếu bật)
    if (AUDIO_MP3_CONFIG.enableProceduralAmbience) {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
          this.setupAmbience();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended' && this.enabled) {
        this.ctx.resume().catch(() => {});
      }
      if (this.gainNode && this.ctx) {
        this.gainNode.gain.setTargetAtTime(this.enabled ? 0.4 : 0.0, this.ctx.currentTime, 0.12);
      }
    }
  },

  toggle() {
    this.enabled = !this.enabled;
    this.mp3Elements.forEach(({ audio }) => {
      audio.muted = !this.enabled;
      if (this.enabled && this.startedAfterLoad && audio.paused) {
        audio.play().catch(() => {});
      }
    });

    if (this.ctx) {
      if (this.ctx.state === 'suspended' && this.enabled) {
        this.ctx.resume().catch(() => {});
      }
      if (this.gainNode) {
        this.gainNode.gain.setTargetAtTime(this.enabled ? 0.16 : 0.0, this.ctx.currentTime, 0.12);
      }
    } else if (this.enabled && this.startedAfterLoad) {
      this.tryPlayAll();
    }

    // Đồng bộ Ambient VFX (hiệu ứng cánh hoa/lá rơi) mặc định BẬT
    if (propsData && typeof propsData.setWeatherMode === 'function') {
      propsData.setWeatherMode(this.enabled ? 'sakura' : 'clear');
    }

    return this.enabled;
  },

  setTrackVolume(nameOrIndex, newVolume) {
    const v = THREE.MathUtils.clamp(newVolume, 0, 1);
    const masterVol = THREE.MathUtils.clamp(AUDIO_MP3_CONFIG.masterVolume ?? 1.0, 0, 1);
    this.mp3Elements.forEach((item, idx) => {
      if (idx === nameOrIndex || item.config.name === nameOrIndex || item.config.url === nameOrIndex) {
        item.config.volume = v;
        item.audio.volume = THREE.MathUtils.clamp(v * masterVol, 0, 1);
      }
    });
  },

  setMasterVolume(newMasterVol) {
    AUDIO_MP3_CONFIG.masterVolume = THREE.MathUtils.clamp(newMasterVol, 0, 1);
    this.mp3Elements.forEach((item) => {
      const baseVol = THREE.MathUtils.clamp(item.config.volume ?? 0.5, 0, 1);
      item.audio.volume = THREE.MathUtils.clamp(baseVol * AUDIO_MP3_CONFIG.masterVolume, 0, 1);
    });
  },

  addTrack({ name = 'Custom Track', url, volume = 0.5, loop = true }) {
    if (!url) return null;
    const cfg = { name, url, volume, loop };
    AUDIO_MP3_CONFIG.tracks.push(cfg);
    const audio = new Audio(url);
    audio.loop = loop !== false;
    audio.volume = THREE.MathUtils.clamp(volume * (AUDIO_MP3_CONFIG.masterVolume ?? 1.0), 0, 1);
    audio.muted = !this.enabled;
    this.mp3Elements.push({ audio, config: cfg });
    if (this.startedAfterLoad && this.enabled) {
      audio.play().catch(() => {});
    }
    return audio;
  },

  setupAmbience() {
    const ctx = this.ctx;
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = this.enabled ? 0.45   : 0.0;
    this.gainNode.connect(ctx.destination);

    const bufferSize = ctx.sampleRate * 3;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99 * b0 + white * 0.05;
      b1 = 0.96 * b1 + white * 0.08;
      b2 = 0.85 * b1 + white * 0.12;
      output[i] = (b0 + b1 + b2) * 0.12;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 520;
    filter.Q.value = 1.4;

    whiteNoise.connect(filter);
    filter.connect(this.gainNode);
    whiteNoise.start(0);

    this.birdTimer = setInterval(() => {
      if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
      if (Math.random() < 0.65) {
        this.playBirdChirp();
      } else {
        this.playFurinBell();
      }
    }, 2800);
  },

  playBirdChirp() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    const baseFreq = 2200 + Math.random() * 600;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.32, now + 0.09);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.95, now + 0.18);

    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.15, now + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.20);

    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  },

  playFurinBell() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1760 + Math.random() * 220, now);

    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.12, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0008, now + 0.85);

    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.90);
  }
};
window.__AUDIO_CONTROLLER__ = audioController;
audioController.initMp3Tracks();

// Ensure Ambient VFX (Sakura petals) & Traffic Light auto cycle are enabled by default
if (propsData && typeof propsData.setWeatherMode === 'function') {
  propsData.setWeatherMode('sakura');
}
if (propsData && propsData.trafficLightController) {
  propsData.trafficLightController.autoMode = true;
  propsData.trafficLightController.setPhase(0);
}

// ============================================================================
// 🎛️ MINIMAL CUSTOMIZABLE UI (CHỈ GIỮ LẠI THANH KÉO GIỜ TRONG NGÀY & NÚT 🔉/🔇)
// ============================================================================
let uiTimeSliderEl = null;
let uiTimeLabelEl = null;

function createOnScreenUI() {
  const uiPanel = document.createElement('div');
  uiPanel.id = 'diorama-ui-panel';
  uiPanel.style.cssText = `
    position: fixed;
    top: 14px;
    right: 14px;
    z-index: 100;
    background: rgba(20, 26, 38, 0.84);
    backdrop-filter: blur(12px);
    color: #f7f4eb;
    padding: 10px 14px;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    font-family: "Segoe UI", "Yu Gothic", system-ui, sans-serif;
    font-size: 12px;
    width: 268px;
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
    user-select: none;
    display: flex;
    align-items: center;
    gap: 10px;
  `;

  uiPanel.innerHTML = `
    <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10.5px; color: #cbd5e1;">
        <span>🌙 00:00</span>
        <span id="ui-time-label" style="font-family: monospace; font-weight: 700; font-size: 12px; color: #fde047;">11:30</span>
        <span>🌙 23:59</span>
      </div>
      <input id="ui-time-slider" type="range" min="0" max="23.95" step="0.05" value="11.5" style="width: 100%; cursor: pointer; accent-color: #f6ad55;" />
    </div>
    <button id="ui-audio-toggle" title="Bật / Tắt Ambient (🔉 / 🔇)" style="width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; background: rgba(47, 133, 90, 0.85); color: #fff; border: 1px solid rgba(255,255,255,0.22); border-radius: 10px; font-size: 18px; cursor: pointer; flex-shrink: 0; transition: background 0.2s ease;">🔉</button>
  `;

  document.body.appendChild(uiPanel);

  uiTimeSliderEl = document.getElementById('ui-time-slider');
  uiTimeLabelEl = document.getElementById('ui-time-label');
  const audioToggleBtn = document.getElementById('ui-audio-toggle');

  uiTimeSliderEl.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    setTimeOfDay(val);
    if (uiTimeLabelEl) uiTimeLabelEl.textContent = format24Hours(val);
  });

  audioToggleBtn.addEventListener('click', () => {
    const on = audioController.toggle();
    audioToggleBtn.textContent = on ? '🔉' : '🔇';
    audioToggleBtn.style.background = on ? 'rgba(47, 133, 90, 0.85)' : 'rgba(255, 255, 255, 0.12)';
  });
}

createOnScreenUI();

// ============================================================================
// 🎮 CAMERA CONTROLS INSTRUCTION HUD (BOTTOM-RIGHT, MINIMIZABLE)
// ============================================================================
function createControlsHUD() {
  const hud = document.createElement('div');
  hud.id = 'diorama-controls-hud';
  hud.style.cssText = `
    position: fixed;
    bottom: 14px;
    right: 14px;
    z-index: 100;
    background: rgba(18, 24, 38, 0.78);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    color: #e2e8f0;
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 12px;
    padding: 8px 12px;
    font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
    font-size: 11.5px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    user-select: none;
    transition: all 0.22s ease-out;
    max-width: 210px;
  `;

  hud.addEventListener('pointerdown', (e) => e.stopPropagation());
  hud.addEventListener('wheel', (e) => e.stopPropagation());

  hud.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.12);">
      <span style="font-weight: 700; font-size: 11px; letter-spacing: 0.05em; color: #f6ad55; display: flex; align-items: center; gap: 5px;">
        <span>🎮</span> CONTROLS
      </span>
      <button id="ui-controls-min-btn" title="Minimize / Expand" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; border-radius: 6px; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; line-height: 1; transition: background 0.15s ease;">─</button>
    </div>
    <div id="ui-controls-content" style="display: flex; flex-direction: column; gap: 5px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="width: 20px; text-align: center; font-size: 12px; color: #38bdf8;">🖱️L</span>
        <span><b>Left Drag:</b> Rotate</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="width: 20px; text-align: center; font-size: 12px; color: #4ade80;">🖱️R</span>
        <span><b>Right Drag:</b> Move</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="width: 20px; text-align: center; font-size: 12px; color: #fde047;">⚙️</span>
        <span><b>Scroll:</b> Zoom In / Out</span>
      </div>
    </div>
  `;

  document.body.appendChild(hud);

  let isMinimized = false;
  const minBtn = hud.querySelector('#ui-controls-min-btn');
  const content = hud.querySelector('#ui-controls-content');

  minBtn.addEventListener('click', () => {
    isMinimized = !isMinimized;
    if (isMinimized) {
      content.style.display = 'none';
      minBtn.textContent = '➕';
      minBtn.title = 'Expand Controls';
      hud.style.padding = '6px 10px';
    } else {
      content.style.display = 'flex';
      minBtn.textContent = '─';
      minBtn.title = 'Minimize Controls';
      hud.style.padding = '8px 12px';
    }
  });
}

createControlsHUD();

// ============================================================================
// 📱 MOBILE ORIENTATION PROMPT & AUTO-LANDSCAPE HANDLER
// ============================================================================
function createMobileLandscapePrompt() {
  const isMobile = isMobileDevice || (window.innerWidth < 768 && 'ontouchstart' in window);
  if (!isMobile) return;

  const styleEl = document.createElement('style');
  styleEl.textContent = `
    @keyframes phoneRotateAnim {
      0%, 10% { transform: rotate(0deg); }
      40%, 60% { transform: rotate(-90deg); }
      90%, 100% { transform: rotate(0deg); }
    }
  `;
  document.head.appendChild(styleEl);

  const overlay = document.createElement('div');
  overlay.id = 'mobile-landscape-overlay';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 9998;
    background: rgba(10, 14, 24, 0.90);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
    text-align: center;
    padding: 24px;
    user-select: none;
  `;

  overlay.innerHTML = `
    <div style="font-size: 52px; margin-bottom: 16px; display: inline-block; animation: phoneRotateAnim 2.4s ease-in-out infinite;">📱</div>
    <div style="font-size: 16px; font-weight: 700; color: #f6ad55; margin-bottom: 6px;">Vui lòng xoay ngang điện thoại</div>
    <div style="font-size: 12.5px; color: #cbd5e1; max-width: 270px; line-height: 1.5; margin-bottom: 18px;">
      Please rotate your device to <b>Landscape</b> for the best 3D diorama viewing experience.
    </div>
    <button id="btn-dismiss-landscape" style="background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.25); color: #94a3b8; font-size: 11.5px; padding: 6px 16px; border-radius: 999px; cursor: pointer; transition: background 0.2s ease;">Tiếp tục xem dọc / Dismiss</button>
  `;

  document.body.appendChild(overlay);

  let dismissed = false;
  overlay.querySelector('#btn-dismiss-landscape').addEventListener('click', () => {
    dismissed = true;
    overlay.style.display = 'none';
  });

  function checkOrientation() {
    const isPortrait = window.innerHeight > window.innerWidth;
    if (isPortrait && !dismissed) {
      overlay.style.display = 'flex';
    } else {
      overlay.style.display = 'none';
    }
  }

  window.addEventListener('resize', checkOrientation);
  window.addEventListener('orientationchange', checkOrientation);
  checkOrientation();

  // Thử tự động lock landscape nếu thiết bị hỗ trợ khi chạm
  window.addEventListener('pointerdown', () => {
    if (screen.orientation && typeof screen.orientation.lock === 'function') {
      screen.orientation.lock('landscape').catch(() => {});
    }
  }, { once: true });
}

createMobileLandscapePrompt();

// ============================================================================
// 🚀 PHÁT HIỆN LOAD XONG 100% (GLB PROMISE + SHADER COMPILE + FIRST FRAME)
// ============================================================================
if (propsData && propsData.allAssetsLoadedPromise) {
  propsData.allAssetsLoadedPromise.then(() => {
    // Chờ 2 nhịp requestAnimationFrame sau khi toàn bộ 39 GLB đã gắn vào Scene Graph
    // để WebGL render hoàn chỉnh khung hình có đủ mọi model & shader phía sau Loading Screen
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        loadingScreen.finishAndHide();
        audioController.startAfterLoading();
      });
    });
  });
} else {
  loadingScreen.finishAndHide();
  audioController.startAfterLoading();
}

// --- Visual Debug API Hooks ---
const VIEW_PRESETS = {
  iso: {
    position: new THREE.Vector3(18, 14, 18),
    target: new THREE.Vector3(0, 0.6, 0)
  },
  front: {
    position: new THREE.Vector3(-0.5, 4.5, 20),
    target: new THREE.Vector3(-0.5, 1.2, 0)
  },
  side: {
    position: new THREE.Vector3(20, 6, 0),
    target: new THREE.Vector3(0, 1.0, 0)
  },
  rear_iso: {
    position: new THREE.Vector3(-19, 14, -19),
    target: new THREE.Vector3(-2.0, 2.5, -2.0)
  },
  west_side: {
    position: new THREE.Vector3(-21, 5.5, 0),
    target: new THREE.Vector3(-2.0, 2.2, 0)
  },
  top: {
    position: new THREE.Vector3(0, 38, 0.001),
    target: new THREE.Vector3(0, 0, 0)
  },
  closeup: {
    position: new THREE.Vector3(4.2, 2.4, 8.2),
    target: new THREE.Vector3(3.2, 1.8, 3.6)
  },
  building_closeup: {
    position: new THREE.Vector3(-2.2, 2.5, 6.8),
    target: new THREE.Vector3(-3.8, 1.6, 1.4)
  },
  slope: {
    position: new THREE.Vector3(6.2, 1.8, 8.5),
    target: new THREE.Vector3(6.2, 1.8, -4.0)
  }
};

window.__DEBUG__ = {
  dioramaWorld,
  terrainData,
  buildingData,
  propsData,
  audioController,
  setTimeOfDay(val) {
    setTimeOfDay(val);
    if (uiTimeSliderEl) uiTimeSliderEl.value = String(currentTimeHours);
    if (uiTimeLabelEl) uiTimeLabelEl.textContent = format24Hours(currentTimeHours);
  },

  setView(preset) {
    const config = VIEW_PRESETS[preset];
    if (!config) return;
    camera.position.copy(config.position);
    controls.target.copy(config.target);
    camera.lookAt(config.target);
    controls.update();
    if (postprocessing && typeof postprocessing.render === 'function') {
      postprocessing.render();
    } else {
      renderer.render(scene, camera);
    }
  },

  setCustomCamera(px, py, pz, tx, ty, tz) {
    camera.position.set(px, py, pz);
    controls.target.set(tx, ty, tz);
    camera.lookAt(tx, ty, tz);
    controls.update();
    if (postprocessing && typeof postprocessing.render === 'function') {
      postprocessing.render();
    } else {
      renderer.render(scene, camera);
    }
  },

  getSceneStats() {
    let meshCount = 0;
    let triangleCount = 0;
    const bbox = new THREE.Box3();

    scene.traverse((obj) => {
      if (obj.isMesh && obj.visible) {
        meshCount++;
        if (obj.geometry) {
          if (obj.geometry.index) {
            triangleCount += obj.geometry.index.count / 3;
          } else if (obj.geometry.attributes.position) {
            triangleCount += obj.geometry.attributes.position.count / 3;
          }
        }
        bbox.expandByObject(obj);
      }
    });

    return {
      meshCount,
      triangleCount: Math.round(triangleCount)
    };
  }
};

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(getOptimalPixelRatio());
});

// --- Main Render & Animation Loop ---
let lastTime = performance.now();
let elapsed = 0;

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  elapsed += dt;

  skyDomeMesh.position.copy(camera.position);

  if (propsData && typeof propsData.updateProps === 'function') {
    propsData.updateProps(elapsed, dt);
  }

  controls.update();
  if (postprocessing && typeof postprocessing.render === 'function') {
    postprocessing.render();
  } else {
    renderer.render(scene, camera);
  }
}

animate();
