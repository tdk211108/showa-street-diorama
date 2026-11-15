# 3D Street Diorama Project Rules & Guidelines

## Architecture & Code Organization
- Keep code strictly modular inside `./src/`:
  - `main.js`: Core setup, render loop, lighting, camera controls, debug hooks, and module orchestration.
  - `textures.js`: Procedural offscreen HTML5 `<canvas>` texture generation (zero external images/assets).
  - `terrain.js`: Sidewalk, road, curbs, street markings, and ground surfaces.
  - `building.js`: Architectural facade, recessed windows, doors, roof geometry, and decorative trim.
  - `props.js`: Streetlight, trash cans, benches, signs, hydrants, foliage, and ambient props.
  - `postprocessing.js`: Visual effects, tone mapping, and grading.
- Development runs via `npm run dev` (Vite).
- Bundle into `./dist/index.html` via `npm run build` using `vite-plugin-singlefile` only when requested or at final delivery.
- All dependencies and outputs must remain strictly isolated inside `./`.

## Anti-Blockout Standard
- **No Untextured Primitives:** Never leave bare, untextured primitive boxes or cylinders for major structures.
- **Geometric Depth:** Ensure realistic architectural depth (recessed windows, beveled curbs, roof overhangs, sills, frames, lintels).
- **Instanced Micro-Geometry:** Use `THREE.InstancedMesh` for repetitive micro-geometry (e.g., roof tiles, brick courses, foliage leaves, fence pickets, railing bars) to maximize performance.
- **100% Procedural Textures:** Generate all textures procedurally via offscreen HTML5 `<canvas>` elements (brick patterns, asphalt grain, concrete grunge, wood grain, posters). Never reference external image URLs or local image files.

## Mandatory Visual Loop
After implementing or modifying any 3D module:
1. Start / check the local Vite dev server.
2. Connect and inspect via `chrome-devtools` MCP.
3. Verify zero (`0`) console errors or WebGL warnings.
4. Cycle through debug viewpoints using `window.__DEBUG__.setView()`:
   - `'iso'` (Isometric view)
   - `'front'` (Front elevation)
   - `'side'` (Side elevation)
   - `'top'` (Plan / top-down view)
   - `'closeup'` (Detail / pedestrian inspection)
5. Capture screenshots and inspect for floating geometry, z-fighting, clipping, or scale discrepancies.
6. Self-correct any visual or spatial flaws before reporting completion.
